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

function buildPrompt() {
  const category = document.getElementById("category").value;
  const scene = document.getElementById("scene").value;
  const pose = document.getElementById("pose").value;
  const styling = document.getElementById("styling").value;
  const colorDirection = document.getElementById("colorDirection").value;
  const strength = document.getElementById("strength").value;
  const size = document.getElementById("size").value;

  const promptParts = [];

  promptParts.push(
    "Facial identity reference required. Maintain exact likeness with high fidelity. Do not alter facial structure, features, proportions, or skin tone. Do not beautify into a different person."
  );

  promptParts.push(
    "Reference image is for facial identity only. Do not carry over background, objects, props, or styling unless explicitly defined below."
  );

  promptParts.push(
    `${category}. ${scene}. ${pose} with intentional, natural, confident body positioning.`
  );

  promptParts.push(
    "Styling must feel luxury, intentional, and editorial. Avoid basic outfits, generic fashion, or mid-tier styling. Everything must read as styled, not accidental."
  );

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

  if (colorDirection !== "No Preference") {
    promptParts.push(
      `Color direction: ${colorDirection}. Use refined tonal balance with luxury coordination.`
    );
  }

  promptParts.push(`Mood: ${category}`);

  promptParts.push(
    "Expression: controlled, natural, confident. No exaggerated smiles, no blank stare, no harsh or angry expression unless explicitly required."
  );

  promptParts.push(
    "Body realism: correct anatomy, natural proportions, balanced weight distribution, no stiffness, no broken limbs, no unnatural bending."
  );

  promptParts.push(
    "Hands: natural positioning, relaxed fingers, no distortion, no extra fingers, no stiff hands."
  );

  promptParts.push(
    "Footwear must match styling and feel high-end. No cheap sandals, no generic flats unless intentional. Heels or elevated footwear preferred when visible."
  );

  if (size === "9:16") {
    promptParts.push(
      "Composition: vertical 9:16, full-body or strong mid-body framing. Preserve silhouette and outfit visibility."
    );
  } else {
    promptParts.push(
      "Composition: 3:4 or 4:5 editorial framing. Strong subject presence, full styling visibility."
    );
  }

  promptParts.push(
    "Environment: clean, intentional, minimal distractions. No clutter. Background should support subject, not compete."
  );

  promptParts.push(
    "Do not introduce random props, extra people, text, logos, or unrelated objects."
  );

  promptParts.push(
    "Rendering: high-end editorial photography. Soft directional lighting, realistic shadows, sharp focus, no blur, no artifacts, no distortion."
  );

  const strengthMap = {
    "Subtle variation": "Subtle variation only.",
    "Moderate transformation": "Moderate transformation.",
    "Full creative transformation": "High transformation while preserving identity."
  };

  promptParts.push(strengthMap[strength]);

  promptParts.push(
    "Output: ultra-clean, high detail, luxury editorial image. Realistic skin texture, correct anatomy, balanced lighting, no AI artifacts."
  );

  return promptParts.join("\\n\\n");
}

// GENERATE PROMPT
if (generateBtn) {
  generateBtn.addEventListener("click", () => {
    resultBox.value = buildPrompt();
    statusMessage.textContent = "Prompt generated.";
  });
}

// GENERATE IMAGE
if (generateImageBtn) {
  generateImageBtn.addEventListener("click", async () => {
    const file = uploadInput ? uploadInput.files[0] : null;

    if (!file) {
      if (statusMessage) {
        statusMessage.textContent = "Upload a reference image first.";
      }
      return;
    }

    const prompt = buildPrompt();
    resultBox.value = prompt;

    if (statusMessage) {
      statusMessage.innerHTML = 'Generating image <span id="spinner"></span>';
    }

    generateImageBtn.disabled = true;

    if (downloadBtn) {
      downloadBtn.disabled = true;
    }

    try {
      const formData = new FormData();
      formData.append("referenceImage", file);
      formData.append("prompt", prompt);
      formData.append("sizeChoice", document.getElementById("size").value);

      const response = await fetch("/generate-image", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image generation failed.");
      }

      latestGeneratedImageUrl = `data:${data.mimeType};base64,${data.imageBase64}`;

      if (generatedImage) {
        generatedImage.src = latestGeneratedImageUrl;
        generatedImage.style.display = "block";
      }

      if (generatedEmptyState) {
        generatedEmptyState.style.display = "none";
      }

      if (downloadBtn) {
        downloadBtn.disabled = false;
      }

      if (statusMessage) {
        statusMessage.textContent = "Image generated successfully.";
      }
    } catch (error) {
      if (statusMessage) {
        statusMessage.textContent =
          error.message === "Failed to fetch"
            ? "Server not running. Start server.js."
            : error.message;
      }
    } finally {
      generateImageBtn.disabled = false;
    }
  });
}

// DOWNLOAD
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    if (!latestGeneratedImageUrl) return;

    const link = document.createElement("a");
    link.href = latestGeneratedImageUrl;
    link.download = "dht-image.png";
    link.click();
  });
}