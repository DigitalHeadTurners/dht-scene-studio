const uploadInput = document.getElementById("upload");
const previewImage = document.getElementById("preview");
const emptyState = document.getElementById("emptyState");

const generateBtn = document.getElementById("generateBtn");
const generateImageBtn = document.getElementById("generateImageBtn");
const downloadBtn = document.getElementById("downloadBtn");

const resultBox = document.getElementById("result");
const statusMessage = document.getElementById("statusMessage");

const generatedImage = document.getElementById("generatedImage");
const generatedEmptyState = document.getElementById("generatedEmptyState");

let latestGeneratedImageUrl = "";

// IMAGE PREVIEW
if (uploadInput) {
  uploadInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      if (previewImage) {
        previewImage.src = e.target.result;
        previewImage.style.display = "block";
      }

      if (emptyState) {
        emptyState.style.display = "none";
      }
    };

    reader.readAsDataURL(file);
  });
}

// KEEP EVERYTHING ABOVE (DOM elements + preview logic) EXACTLY THE SAME

function buildPrompt() {
  const category = document.getElementById("category").value;
  const scene = document.getElementById("scene").value;
  const pose = document.getElementById("pose").value;
  const styling = document.getElementById("styling").value;
  const colorDirection = document.getElementById("colorDirection").value;
  const strength = document.getElementById("strength").value;
  const size = document.getElementById("size").value;

  const promptParts = [];

  // STRONGER IDENTITY LOCK
  promptParts.push(
    "Facial identity reference required. Maintain exact likeness with high fidelity. Do not alter facial structure, features, proportions, or skin tone. Do not beautify into a different person."
  );

  promptParts.push(
    "Reference image is for facial identity only. Do not carry over background, objects, props, or styling unless explicitly defined below."
  );

  // CORE SCENE
  promptParts.push(
    `${category}. ${scene}. ${pose} with intentional, natural, confident body positioning.`
  );

  // STRONGER STYLING CONTROL
  promptParts.push(
    "Styling must feel luxury, intentional, and editorial. Avoid basic outfits, generic fashion, or mid-tier styling. Everything must read as styled, not accidental."
  );

  // KEEP YOUR EXISTING STYLING MAP
  const stylingMap = {
    "Sleek and polished":
      "Structured silhouette, controlled luxury finish, sleek hair or controlled waves, soft glam contour, minimal high-end accessories, elevated heels.",
    "Soft glam":
      "Feminine fitted silhouette, refined textures, soft waves or blowout, glowing skin, soft eyes, neutral lips, elegant heels, delicate jewelry.",
    "Bold glam":
      "Strong silhouette, fashion-forward drama, full glam makeup, statement jewelry, high-impact heels.",
    "Sporty luxe":
      "Luxury athleisure or fitted activewear, premium materials, clean high-end sneakers, minimal luxury accessories.",
    "Feminine luxury":
      "Fitted feminine silhouette, elegant structure, refined jewelry, luxury handbag, polished hair, soft glam glow.",
    "High-fashion editorial":
      "Editorial designer styling. Tailored, sculpted, or sharply structured silhouette. No basic outfits. Must feel magazine-level.",
    "Effortless rich-girl":
      "Minimal but expensive, relaxed but curated, quiet luxury accessories, polished hair, understated glam.",
    "Classy and refined":
      "Timeless tailoring, elegant restraint, neutral glam, classic luxury accessories."
  };

  promptParts.push(stylingMap[styling]);

  // COLOR (unchanged but cleaner)
  if (colorDirection !== "No Preference") {
    promptParts.push(
      `Color direction: ${colorDirection}. Use refined tonal balance with luxury coordination.`
    );
  }

  // MOOD
  promptParts.push(`Mood: ${category}`);

  // EXPRESSION (tightened)
  promptParts.push(
    "Expression: controlled, natural, confident. No exaggerated smiles, no blank stare, no harsh or angry expression unless explicitly required."
  );

  // POSE QUALITY BOOST
  promptParts.push(
    "Body realism: correct anatomy, natural proportions, balanced weight distribution, no stiffness, no broken limbs, no unnatural bending."
  );

  // HAND FIX (important)
  promptParts.push(
    "Hands: natural positioning, relaxed fingers, no distortion, no extra fingers, no stiff hands."
  );

  // FOOTWEAR LOCK
  promptParts.push(
    "Footwear must match styling and feel high-end. No cheap sandals, no generic flats unless intentional. Heels or elevated footwear preferred when visible."
  );

  // COMPOSITION (stronger)
  if (size === "9:16") {
    promptParts.push(
      "Composition: vertical 9:16, full-body or strong mid-body framing. Preserve silhouette and outfit visibility."
    );
  } else {
    promptParts.push(
      "Composition: 3:4 or 4:5 editorial framing. Strong subject presence, full styling visibility."
    );
  }

  // ENVIRONMENT CONTROL
  promptParts.push(
    "Environment: clean, intentional, minimal distractions. No clutter. Background should support subject, not compete."
  );

  // REMOVE RANDOM OBJECTS (important fix)
  promptParts.push(
    "Do not introduce random props, extra people, text, logos, or unrelated objects."
  );

  // RENDER QUALITY BOOST
  promptParts.push(
    "Rendering: high-end editorial photography. Soft directional lighting, realistic shadows, sharp focus, no blur, no artifacts, no distortion."
  );

  // TRANSFORMATION
  const strengthMap = {
    "Subtle variation": "Subtle variation only.",
    "Moderate transformation": "Moderate transformation.",
    "Full creative transformation": "High transformation while preserving identity."
  };

  promptParts.push(strengthMap[strength]);

  // FINAL OUTPUT LOCK
  promptParts.push(
    "Output: ultra-clean, high detail, luxury editorial image. Realistic skin texture, correct anatomy, balanced lighting, no AI artifacts."
  );

  return promptParts.join("\n\n");
}