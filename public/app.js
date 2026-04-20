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

  // IDENTITY LOCK + PROP BLOCK
  promptParts.push(
    "Facial identity lock: Maintain exact facial structure, skin tone, and proportions. Reference image is for identity only. Do not transfer any objects, props, accessories, clothing, hand-held items, or background elements from the reference image."
  );

  // CORE SCENE + STYLING DIRECTION
  promptParts.push(
    `Scene: ${scene}. Mood: ${category}. Pose: ${pose}. Luxury editorial styling with intentional, high-fashion direction. Tailored, sculpted, or structured silhouette. No basic or generic outfits. Must feel magazine-level and styled.`
  );

  const stylingMap = {
    "Sleek and polished":
      "Styling: structured silhouette, controlled luxury finish, sleek hair or controlled waves, soft glam contour, minimal high-end accessories, elevated heels.",

    "Soft glam":
      "Styling: feminine fitted silhouette, refined textures, soft waves or blowout, glowing skin, soft eyes, neutral lips, elegant heels, delicate jewelry.",

    "Bold glam":
      "Styling: strong silhouette, fashion-forward drama, full glam makeup, statement jewelry, high-impact heels.",

    "Sporty luxe":
      "Styling: luxury athleisure or fitted activewear, premium materials, clean high-end sneakers, minimal luxury accessories.",

    "Feminine luxury":
      "Styling: fitted feminine silhouette, elegant structure, refined jewelry, luxury handbag, polished hair, soft glam glow.",

    "High-fashion editorial":
      "Styling: editorial designer styling. Tailored, sculpted, or sharply structured silhouette. No basic outfits. Must feel magazine-level.",

    "Effortless rich-girl":
      "Styling: minimal but expensive, relaxed but curated, quiet luxury accessories, polished hair, understated glam.",

    "Classy and refined":
      "Styling: timeless tailoring, elegant restraint, neutral glam, classic luxury accessories."
  };

  if (stylingMap[styling]) {
    promptParts.push(stylingMap[styling]);
  }

  // COLOR
  if (colorDirection !== "No Preference") {
    promptParts.push(
      `Color direction: ${colorDirection}. Use refined tonal balance with luxury coordination.`
    );
  }

  // EXPRESSION CONTROL
  promptParts.push(
    "Expression must match the selected pose exactly. Do not default to neutral if laughter or emotion is specified."
  );

  const poseExpressionMap = {
    "Mirror selfie":
      "Expression: confident, composed, direct gaze.",

    "Seated confident pose":
      "Expression: controlled, confident, neutral or soft smile.",

    "Walking toward camera":
      "Expression: natural, relaxed, soft engagement.",

    "Over-the-shoulder look":
      "Expression: poised, softly confident, elegant restraint.",

    "Stepping out of car":
      "Expression: calm, polished, composed confidence.",

    "Standing with hand on hip":
      "Expression: controlled, confident, neutral or soft smile.",

    "Candid laugh":
      "Expression: strong visible laughter. Subject must be smiling clearly with teeth visible. Eyes must show joy and engagement. This is a candid laugh moment. Do not produce a neutral or closed-mouth expression under any circumstance.",

    "Looking away":
      "Expression: natural, relaxed, subtle emotion, not blank or severe.",

    "Leaning pose":
      "Expression: effortless, relaxed confidence, subtle softness in the face.",

    "Phone interaction":
      "Expression: candid, engaged, relaxed, softly focused.",

    "Adjusting outfit or hair":
      "Expression: softly composed, naturally engaged, polished and feminine.",

    "Crossed-leg stance":
      "Expression: poised, elegant, controlled confidence."
  };

  if (poseExpressionMap[pose]) {
    promptParts.push(poseExpressionMap[pose]);
  }

  // BODY + HANDS + FOOTWEAR
  promptParts.push(
    "Body realism: correct anatomy, natural proportions, balanced weight distribution, no stiffness, no broken limbs, no unnatural bending."
  );

  promptParts.push(
    "Hands: natural positioning, relaxed fingers, no distortion, no extra fingers, no stiff hands."
  );

  promptParts.push(
    "Footwear must match styling and feel high-end. No cheap sandals, no generic flats unless intentional. Heels or elevated footwear preferred when visible."
  );

  // COMPOSITION
  if (size === "9:16") {
    promptParts.push(
      "Composition: vertical 9:16, full-body or strong mid-body framing. Preserve silhouette and outfit visibility."
    );
  } else {
    promptParts.push(
      "Composition: 3:4 or 4:5 editorial framing. Strong subject presence, full styling visibility."
    );
  }

  // ENVIRONMENT + RENDERING
  promptParts.push(
    "Environment: clean, intentional, minimal distractions. No clutter. Background should support the subject, not compete."
  );

  promptParts.push(
    "Do not introduce random props, extra people, text, logos, or unrelated objects."
  );

  promptParts.push(
    "Rendering: high-end editorial photography. Soft directional lighting, realistic shadows, sharp focus, no blur, no artifacts, no distortion."
  );

  const strengthMap = {
    "Subtle variation": "Transformation: subtle variation only.",
    "Moderate transformation": "Transformation: moderate transformation.",
    "Full creative transformation": "Transformation: high transformation while preserving identity."
  };

  if (strengthMap[strength]) {
    promptParts.push(strengthMap[strength]);
  }

  promptParts.push(
    "Output: ultra-clean, high detail, luxury editorial image. Realistic skin texture, correct anatomy, balanced lighting, no AI artifacts."
  );

  return promptParts.join("\n\n");
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