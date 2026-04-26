import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { GoogleGenAI, Modality } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = ["https://dht-scene-studio.onrender.com"];

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(clerkMiddleware());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function getSignedInEmail(req) {
  const auth = getAuth(req);

  if (!auth.userId) {
    return null;
  }

  const response = await fetch(`https://api.clerk.com/v1/users/${auth.userId}`, {
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const user = await response.json();
  const email = user.email_addresses?.find(
    (item) => item.id === user.primary_email_address_id
  )?.email_address;

  return email ? email.toLowerCase() : null;
}

async function requireApprovedBuyer(req, res, next) {
  try {
    const email = await getSignedInEmail(req);

    if (!email) {
      return res.status(401).json({
        error: "Please sign in to use this app.",
      });
    }

    const { data: customer, error } = await supabase
  .from("customers")
  .select("email, active")
  .eq("email", email)
  .eq("active", true)
  .maybeSingle();

if (error) {
  console.error("Supabase access check error:", error);
  return res.status(500).json({
    error: "Access check failed. Please try again.",
  });
}

if (!customer) {
  return res.status(403).json({
    error:
      "This email does not have access. Please use the same email used at checkout.",
  });
}

    req.userEmail = email;
    next();
  } catch (error) {
    console.error("Buyer check error:", error);
    return res.status(500).json({
      error: "Access check failed. Please refresh and try again.",
    });
  }
}

app.get("/config.js", (req, res) => {
  res.type("application/javascript");
  res.send(
    `window.CLERK_PUBLISHABLE_KEY = "${process.env.CLERK_PUBLISHABLE_KEY || ""}";`
  );
});

app.get("/auth-status", requireApprovedBuyer, (req, res) => {
  res.json({
    approved: true,
    email: req.userEmail,
  });
});

app.use(express.static(path.join(__dirname, "public")));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many image requests. Please wait a few minutes and try again.",
  },
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function buildOptimizedPrompt(prompt) {
  const identityLock = `
STRICT FACIAL IDENTITY LOCK:
Use the uploaded reference image for facial identity only.
Maintain the exact same person.
Do not alter facial structure, proportions, skin tone, age presentation, or core features.
Do not beautify, stylize, generalize, or replace the face.
Identity must remain consistent and recognizable.
Do not carry over objects, props, accessories, text, or background elements from the reference image unless explicitly requested in the prompt.
`;

  const qualityBoost = `
QUALITY AND REALISM REQUIREMENTS:
Ultra high-end editorial photography.
Luxury visual finish.
Sharp focus and crisp facial detail.
Realistic skin texture and natural skin behavior.
Natural lighting with soft, believable shadow depth.
Professional composition with realistic lens behavior.
Correct anatomy, correct limb proportions, correct hands, correct feet.
No extra fingers, no extra limbs, no warped features, no distortion.
No low-quality AI artifacts.
Polished styling, premium materials, realistic fabrics, premium overall finish.
Keep the result believable, refined, and visually expensive.
`;

  const compositionControl = `
COMPOSITION AND CONSISTENCY:
Preserve the intended framing and styling visibility.
Keep the subject visually coherent from face to footwear.
Avoid cropped-off key styling elements when full look visibility is important.
Maintain realistic posture, believable pose transitions, and natural body alignment.
`;

  return [
    identityLock.trim(),
    prompt.trim(),
    qualityBoost.trim(),
    compositionControl.trim(),
  ].join("\n\n");
}

app.post(
  "/generate-image",
  requireApprovedBuyer,
  generateLimiter,
  upload.single("referenceImage"),
  async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded." });
      }

      if (!req.body.prompt) {
        return res.status(400).json({ error: "No prompt provided." });
      }

      const optimizedPrompt = buildOptimizedPrompt(req.body.prompt);

      const imagePart = {
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString("base64"),
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [imagePart, { text: optimizedPrompt }],
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
          temperature: 0.4,
          topP: 0.9,
          topK: 32,
          maxOutputTokens: 8192,
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const imagePartFromResponse = parts.find(
        (part) => part.inlineData && part.inlineData.data
      );

      if (!imagePartFromResponse) {
        const textPart = parts.find((part) => typeof part.text === "string");

        return res.status(500).json({
          error: textPart?.text || "No image was returned by Gemini.",
        });
      }

      return res.json({
        imageBase64: imagePartFromResponse.inlineData.data,
        mimeType: imagePartFromResponse.inlineData.mimeType || "image/png",
      });
    } catch (error) {
      console.error("Image generation error:", error);

      return res.status(500).json({
        error: error.message || "Image generation failed.",
      });
    }
  }
);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
