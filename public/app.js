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

  // IDENTITY + HARD REFERENCE CONTROL
  promptParts.push(
    "Facial identity reference required. Maintain exact likeness. Do not alter facial structure, features, or skin tone."
  );

  promptParts.push(
    "Reference image is for facial identity only. Do not replicate or carry over any objects, props, or items from the reference image. Ignore all handheld items unless explicitly required by the scene."
  );

  // CORE SETUP
  promptParts.push(
    `${category}. ${scene}. ${pose} with natural, confident body positioning.`
  );

  // STYLING
  const stylingMap = {
    "Sleek and polished":
      "Sleek and polished styling: structured silhouette, controlled luxury finish, sleek hair or controlled waves, soft glam contour, minimal but high-end accessories, elevated footwear.",

    "Soft glam":
      "Soft glam styling: feminine fitted silhouette, refined textures, soft waves or blowout, glowing skin, soft eyes, neutral lips, elegant heels, delicate jewelry, structured luxury bag.",

    "Bold glam":
      "Bold glam styling: strong silhouette, fashion-forward drama, full glam makeup, statement jewelry, high-impact luxury heels, commanding presence.",

    "Sporty luxe":
      "Sporty luxe styling: fitted luxury activewear or polished athleisure, premium materials, clean high-end sneakers, minimal luxury accessories, sleek hair, fresh clean glam.",

    "Feminine luxury":
      "Feminine luxury styling: fitted feminine silhouette, elegant structure, refined jewelry, luxury handbag, polished feminine hair, soft glam glow, elevated heels.",

    "High-fashion editorial":
      "High-fashion editorial styling: fashion-forward silhouette, strong designer attitude, editorial hair and makeup, statement accessories, model-directed posture, editorial footwear. Silhouette must be tailored, sculpted, or sharply structured. Avoid basic wide-leg or shapeless trousers unless distinctly fashion-forward. Styling must feel intentionally styled, not safe or commercial. Avoid basic outfit combinations. Outfit should read as styled fashion, not everyday wear. Prioritize designer-level construction, unique cuts, or statement tailoring.",

    "Effortless rich-girl":
      "Effortless rich-girl styling: minimal but elevated pieces, relaxed yet intentional structure, quiet luxury accessories, polished hair, clean understated glam. Avoid casual basics such as denim shorts or simple tanks. Outfit must feel curated, refined, and visibly expensive.",

    "Classy and refined":
      "Classy and refined styling: timeless tailored pieces, elegant restraint, polished neutral glam, sophisticated hair, classic luxury accessories, timeless heels."
  };

  promptParts.push(stylingMap[styling]);

  // COLOR
  const colorMap = {
    "No Preference": "",
    "Black": "Color: black-led palette with elegant tonal depth and luxury supporting accents.",
    "White": "Color: white-led palette with crisp luxury contrast and polished neutrals.",
    "Ivory / Cream": "Color: ivory or cream-led palette with soft luxury warmth and refined tonal harmony.",
    "Silver / Metallic": "Color: silver or metallic-influenced palette used in a refined luxury-forward way.",
    "Gray / Charcoal": "Color: gray or charcoal-led palette with polished tonal layering.",
    "Beige / Nude": "Color: beige or nude-led palette with soft upscale tonal harmony.",
    "Brown / Chocolate": "Color: brown or chocolate-led palette with rich luxury depth.",
    "Indigo": "Color: indigo-led palette with rich contrast and polished supporting tones.",
    "Navy": "Color: navy-led palette with controlled timeless polish.",
    "Blue": "Color: blue-led palette with elegant coordination and luxury finish.",
    "Purple": "Color: purple-led palette using rich, high-end tones.",
    "Pink": "Color: pink-led palette with polished feminine luxury, not childish or overly sweet.",
    "Red": "Color: red-led palette with elegant supporting neutrals. Bold, refined, intentional.",
    "Burgundy / Wine": "Color: burgundy or wine-led palette with rich luxury depth.",
    "Green / Emerald": "Color: green or emerald-led palette with elevated richness and polished execution.",
    "Yellow / Gold": "Color: yellow or gold-influenced palette in a refined luxury way.",
    "Orange / Rust": "Color: orange or rust-led palette with warm luxury depth and elegant coordination."
  };

  if (colorMap[colorDirection]) {
    promptParts.push(colorMap[colorDirection]);
  }

  // CATEGORY MOOD
  const categoryMap = {
    "Birthday Glam":
      "Mood: celebratory, glamorous, camera-ready, attention-commanding, elevated beauty.",

    "Fitness Glam":
      "Mood: sculpted, polished, elevated athletic, clean and expensive, never sloppy.",

    "Sunday’s Best":
      "Mood: graceful, respectful, refined, elegant, church-appropriate, composed.",

    "Bossed Up Errands":
      "Mood: luxury daytime power styling, visible fashion authority, elevated and expensive, not basic officewear.",

    "Vacation Glam":
      "Mood: luxurious, resort-ready, polished, affluent leisure, upscale destination energy.",

    "Date Night":
      "Mood: polished, feminine, magnetic, softly alluring, luxury evening energy.",

    "CEO Soft Luxury":
      "Mood: calm authority, quiet wealth, polished executive femininity.",

    "Brunch Baddie":
      "Mood: stylish, feminine, visible, socially polished, elevated daytime luxury.",

    "Content Creator Day":
      "Mood: polished, modern, camera-friendly, aspirational, visible, premium but not severe.",

    "Luxury Lifestyle":
      "Mood: aspirational, polished, visibly expensive, effortless wealth.",

    "Editorial Studio":
      "Mood: real fashion editorial, strong visual direction, magazine-level execution.",

    "Rich Girl Casual":
      "Mood: relaxed but expensive, understated, polished, effortless visible wealth."
  };

  promptParts.push(categoryMap[category]);

  // EXPRESSION
  let expression = "Expression: confident, polished, relaxed face, engaged eyes, no exaggerated smiling.";

  if (styling === "Soft glam") {
    expression = "Expression: soft, flattering, relaxed, slight smile or composed warmth.";
  }

  if (styling === "Bold glam") {
    expression = "Expression: direct, controlled, strong presence, minimal smile.";
  }

  if (styling === "Sporty luxe") {
    expression = "Expression: focused, natural, subtly confident, not overly smiley.";
  }

  if (styling === "Feminine luxury") {
    expression = "Expression: calm, elegant, softly composed, minimal smile.";
  }

  if (styling === "High-fashion editorial") {
    expression = "Expression: poised, model-directed, calm and confident with subtle softness in the eyes. Controlled, not stiff or severe.";
  }

  if (styling === "Effortless rich-girl") {
    expression = "Expression: relaxed, effortless, soft confidence, subtle neutrality or soft smirk.";
  }

  if (styling === "Classy and refined") {
    expression = "Expression: composed, calm, elegant restraint, minimal smile.";
  }

  if (category === "Birthday Glam") {
    expression = "Expression: confident, glamorous, camera-aware, soft smile or composed warmth. Not overly serious, harsh, angry, or confrontational.";
  }

  if (category === "Date Night") {
    expression = "Expression: soft, confident, subtly alluring, relaxed face, natural lips, engaged eyes.";
  }

  if (category === "Vacation Glam" && styling === "High-fashion editorial") {
    expression = "Expression: poised, confident, softly alluring, relaxed face, engaged eyes, not angry or harsh.";
  }

  if (category === "Sunday’s Best") {
    expression = "Expression: graceful, warm, restrained, composed, not playful or exaggerated.";
  }

  if (category === "Bossed Up Errands") {
    expression = "Expression: composed authority, polished confidence, self-assured, not overly smiley.";
  }

  if (category === "Content Creator Day") {
    expression = "Expression: polished, camera-friendly, soft confidence, visible presence, slight smile welcome, not severe.";
  }

  promptParts.push(expression);

  // FOOTWEAR
  let footwearRule = "Footwear: elevated, intentional, and aligned with styling. Avoid flat casual sandals or overly basic footwear. Prefer refined heels, elevated sandals, or polished designer options.";

  if (category === "Date Night" || category === "Vacation Glam" || category === "Brunch Baddie") {
    footwearRule = "Footwear: when visible, prefer elegant strappy heels, statement heels, or distinctly high-end evening footwear over safe generic pumps.";
  }

  if (category === "Bossed Up Errands" || category === "CEO Soft Luxury" || styling === "Classy and refined") {
    footwearRule = "Footwear: when visible, polished designer day heels, pointed pumps, or sharp classic luxury heels. Fashion-forward, not basic.";
  }

  if (styling === "Sporty luxe") {
    footwearRule = "Footwear: clean premium sneakers or elevated athletic footwear, correctly scaled and polished.";
  }

  if (styling === "High-fashion editorial") {
    footwearRule = "Footwear: distinctly editorial and fashion-forward. Prefer sharp pointed pumps, strappy heels, or sculptural heels. Avoid ankle boots or safe generic styles unless explicitly required by the fashion direction.";
  }

  promptParts.push(footwearRule);

  // COMPOSITION
  const composition =
    size === "9:16"
      ? "Composition: vertical mobile-friendly framing, strong full-body presence where possible, preserve silhouette, styling, and footwear visibility."
      : "Composition: 3/4 or full-body feed framing, strong subject presence, preserve silhouette, styling, and footwear visibility.";

  promptParts.push(composition);

  // POSE DETAILS
  if (pose === "Walking toward camera") {
    promptParts.push(
      "Motion: mid-stride, deliberate, elevated, model-like movement. Not casual."
    );
  }

  if (pose === "Stepping out of car") {
    promptParts.push(
      "Pose detail: mid-transition with controlled elegance and visible authority."
    );
  }

  if (pose === "Over-the-shoulder look") {
    promptParts.push(
      "Pose detail: elegant neck line, strong posture, intentional turn, polished body line."
    );
  }

  if (pose === "Phone interaction") {
    promptParts.push(
      "Pose detail: candid but elevated, composed, visually commanding, not distracted."
    );
  }

  if (pose === "Seated confident pose") {
    promptParts.push(
      "Pose detail: poised seated posture, elegant leg positioning, intentional arm placement, no dangling limbs."
    );
  }

  if (pose === "Mirror selfie") {
    promptParts.push(
      "Pose detail: believable mirror-selfie realism, controlled arm placement, natural hand placement, polished body angle."
    );
  }

  if (pose === "Leaning pose") {
    promptParts.push(
      "Pose detail: relaxed but controlled leaning posture, intentional weight distribution, polished body line."
    );
  }

  if (pose === "Standing with hand on hip") {
    promptParts.push(
      "Pose detail: grounded standing pose with clean hip placement, strong posture, intentional arm line, and balanced weight distribution."
    );
  }

  if (pose === "Adjusting outfit or hair") {
    promptParts.push(
      "Pose detail: adjusting hair or outfit with controlled, intentional movement. Posture upright, composed, and visually directed. Avoid casual or distracted body language."
    );
  }

  if (styling === "High-fashion editorial" && pose !== "Walking toward camera") {
    promptParts.push(
      "Body direction: strong, editorial, intentional, model-directed, never passive."
    );
  }

  // GLOBAL REALISM RULES
  promptParts.push(
    "Hands and arms: naturally engaged, fingers relaxed, no limp or lifeless hands, no dangling arms."
  );

  promptParts.push(
    "Styling guardrail: avoid overly basic or mid-tier casual outfits. Clothing must feel elevated, intentional, and luxury-forward even in relaxed looks."
  );

  promptParts.push(
    "Outfit structure: include at least one defining elevated element such as tailored structure, premium fabric, or refined layering that signals luxury."
  );

  promptParts.push(
    "Feet and footwear: realistic foot size proportional to body, no oversized feet, heels fit naturally and align with foot shape."
  );

  // PROPS CONTROL
  promptParts.push(
    "Props: no random objects. Only include items explicitly relevant to the scene or pose."
  );

  // ENVIRONMENT / SET DESIGN
  promptParts.push(
    "Set design: minimal but intentional, with subtle texture or architectural elements to enhance editorial depth."
  );

  // RENDERING
  promptParts.push(
    "Rendering: soft directional lighting, luminous skin, realistic shadows, clean composition, correct anatomy, no distortion or artifacts, premium editorial quality."
  );

  // TRANSFORMATION
  const strengthMap = {
    "Subtle variation": "Transformation: subtle variation.",
    "Moderate transformation": "Transformation: moderate transformation.",
    "Full creative transformation": "Transformation: full creative transformation."
  };

  promptParts.push(
    `${strengthMap[strength]} Maintain identity while enhancing styling, lighting, expression, and environment.`
  );

  // OUTPUT
  promptParts.push(
    `Output: professional photography, sharp focus, natural perspective, high detail, luxury editorial finish, ${size} composition.`
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