import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "https://dht-scene-studio.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/generate-image", upload.single("referenceImage"), async (req, res) => {
  try {
    const origin = req.headers.origin;

    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: "Not allowed." });
    }

    const prompt = req.body.prompt;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded." });
    }

    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided." });
    }

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
        { text: prompt }
      ],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT]
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];

    const imagePartFromResponse = parts.find(
      (part) => part.inlineData && part.inlineData.data
    );

    if (!imagePartFromResponse) {
      return res.status(500).json({ error: "No image was returned by Gemini." });
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
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});