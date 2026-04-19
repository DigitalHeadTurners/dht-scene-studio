import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { GoogleGenAI, Modality } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

const allowedOrigins = [
  "https://dht-scene-studio.onrender.com"
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many image requests. Please wait a few minutes and try again."
  }
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
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
    compositionControl.trim()
  ].join("\n\n");
}

app.post(
  "/generate-image",
  generateLimiter,
  upload.single("referenceImage"),
  async (req, res) => {
    try {
      const origin = req.headers.origin;

      if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: "Not allowed." });
      }

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
          data: req.file.buffer.toString("base64")
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [
          imagePart,
          { text: optimizedPrompt }
        ],
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
          temperature: 0.4,
          topP: 0.9,
          topK: 32,
          maxOutputTokens: 8192
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];

      const imagePartFromResponse = parts.find(
        (part) => part.inlineData && part.inlineData.data
      );

      if (!imagePartFromResponse) {
        const textPart = parts.find((part) => typeof part.text === "string");
        return res.status(500).json({
          error: textPart?.text || "No image was returned by Gemini."
        });
      }

      return res.json({
        imageBase64: imagePartFromResponse.inlineData.data,
        mimeType: imagePartFromResponse.inlineData.mimeType || "image/png"
      });
    } catch (error) {
      console.error("Image generation error:", error);
      return res.status(500).json({
        error: error.message || "Image generation failed."
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