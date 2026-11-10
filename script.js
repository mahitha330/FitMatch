(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const STORAGE_KEY = "fitmatch-session";
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_IMAGE_EDGE = 1400;
  const inspirationPhotos = [
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80"
  ];
  let uploadedImage = "";
  let selectedAesthetic = "";
  let currentFileName = "";

  const demoStyles = {
    Casual: {
      bottoms: ["straight-leg denim jeans", "relaxed beige trousers", "clean denim shorts"],
      tops: ["a soft white cotton tee", "a relaxed linen button-up", "a fine-knit neutral sweater"],
      layers: ["a light beige cardigan", "a cropped denim jacket", "a soft neutral overshirt"],
      shoes: ["white low-top sneakers", "tan loafers", "simple leather sandals"],
      accessories: ["a canvas tote", "a slim watch", "small hoop earrings"]
    },
    Tomboy: {
      bottoms: ["relaxed cargo trousers", "wide-leg dark denim", "utility joggers"],
      tops: ["an oversized graphic tee", "a relaxed striped shirt", "a boxy cotton sweatshirt"],
      layers: ["a roomy utility overshirt", "a relaxed bomber jacket", "an oversized zip hoodie"],
      shoes: ["chunky white sneakers", "black skate shoes", "classic high-top sneakers"],
      accessories: ["a canvas crossbody bag", "a silver chain", "a simple baseball cap"]
    },
    Girly: {
      bottoms: ["a soft pleated midi skirt", "tailored cream trousers", "a floaty pastel skirt"],
      tops: ["a fitted ivory blouse", "a soft pastel knit top", "a delicate puff-sleeve blouse"],
      layers: ["a cropped pastel cardigan", "a soft cream bolero", "a light knit cardigan"],
      shoes: ["ballet flats", "Mary Jane shoes", "delicate low-heel sandals"],
      accessories: ["a dainty pendant necklace", "a small shoulder bag", "pearl stud earrings"]
    },
    Streetwear: {
      bottoms: ["baggy utility cargos", "wide-leg dark denim", "relaxed parachute pants"],
      tops: ["an oversized graphic tee", "a boxy logo-free sweatshirt", "a relaxed mesh-layer tee"],
      layers: ["a cropped bomber jacket", "a roomy track jacket", "an oversized utility vest"],
      shoes: ["statement high-top sneakers", "chunky running sneakers", "retro basketball sneakers"],
      accessories: ["a compact crossbody bag", "a silver curb chain", "a sporty cap"]
    },
    "Old Money": {
      bottoms: ["tailored beige trousers", "pressed navy trousers", "cream pleated pants"],
      tops: ["a crisp white button-up", "a fine-knit polo", "a soft ivory blouse"],
      layers: ["a structured neutral blazer", "a classic cable-knit cardigan", "a tailored wool coat"],
      shoes: ["brown leather loafers", "classic ballet flats", "polished leather sneakers"],
      accessories: ["a slim leather belt", "a delicate gold watch", "a structured leather bag"]
    },
    Coquette: {
      bottoms: ["a pleated mini skirt", "a soft satin midi skirt", "lace-trim wide-leg trousers"],
      tops: ["a lace-trim ivory blouse", "a soft ribbon-tie top", "a delicate fitted cardigan"],
      layers: ["a cropped ribbon-knit cardigan", "a soft lace-trim shrug", "a light pastel cardigan"],
      shoes: ["Mary Jane flats", "ribbon-tie ballet flats", "delicate low-heel shoes"],
      accessories: ["a ribbon hair bow", "a small heart pendant", "a pearl-trim shoulder bag"]
    },
    Minimalist: {
      bottoms: ["tailored straight-leg trousers", "black straight-leg denim", "wide-leg linen pants"],
      tops: ["a clean ivory crewneck tee", "a fine-knit neutral top", "a crisp minimal blouse"],
      layers: ["a clean-lined neutral blazer", "a fine-knit cardigan", "a simple long coat"],
      shoes: ["minimal leather sneakers", "sleek loafers", "simple leather flats"],
      accessories: ["a slim leather watch", "a minimal shoulder bag", "small silver hoops"]
    },
    Y2K: {
      bottoms: ["low-rise wide-leg denim", "a cargo mini skirt", "flared dark jeans"],
      tops: ["a fitted baby tee", "a playful mesh-layer top", "a cropped ribbed tank"],
      layers: ["a cropped zip hoodie", "a fitted denim jacket", "a glossy lightweight jacket"],
      shoes: ["platform sneakers", "chunky Mary Janes", "retro platform sandals"],
      accessories: ["a mini shoulder bag", "a playful hair clip", "a layered silver necklace"]
    }
  };

  function analyzeImageColours(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onerror = () => reject(new Error("That image could not be analyzed. Please upload it again."));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 80;
        canvas.height = 80;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          reject(new Error("Your browser couldn't analyze this image. Please try another browser."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const bins = new Map();
        let imageSignature = 2166136261;
        for (let index = 0; index < pixels.length; index += 4) {
          if (pixels[index + 3] < 128) continue;
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          imageSignature = Math.imul(imageSignature ^ red, 16777619);
          imageSignature = Math.imul(imageSignature ^ green, 16777619);
          imageSignature = Math.imul(imageSignature ^ blue, 16777619);
          const key = `${red >> 5},${green >> 5},${blue >> 5}`;
          const bin = bins.get(key) || { count: 0, red: 0, green: 0, blue: 0 };
          bin.count += 1;
          bin.red += red;
          bin.green += green;
          bin.blue += blue;
          bins.set(key, bin);
        }
        const colours = [];
        [...bins.values()]
          .sort((left, right) => right.count - left.count)
          .some((bin) => {
            const colour = describeColour(bin.red / bin.count, bin.green / bin.count, bin.blue / bin.count);
            if (!colours.some((existing) => existing.name === colour.name)) colours.push(colour);
            return colours.length === 2;
          });
        if (!colours.length) {
          reject(new Error("No visible colours could be sampled from that image."));
          return;
        }
        resolve({
          dominant: colours[0],
          secondary: colours[1] && colours[1].name !== colours[0].name ? colours[1] : null,
          imageSignature: imageSignature >>> 0
        });
      };
      image.src = dataUrl;
    });
  }

  function describeColour(red, green, blue) {
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const delta = maximum - minimum;
    const brightness = (red + green + blue) / 3;
    const saturation = maximum === 0 ? 0 : delta / maximum;
    let hue = 0;
    if (delta) {
      if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
      else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
      else hue = 60 * ((red - green) / delta + 4);
      if (hue < 0) hue += 360;
    }

    let name;
    if (saturation < 0.16) {
      name = brightness < 45 ? "black" : brightness < 100 ? "charcoal" : brightness < 185 ? "grey" : "white";
    } else if (hue < 15 || hue >= 345) name = "red";
    else if (hue < 42) name = "orange";
    else if (hue < 68) name = "yellow";
    else if (hue < 165) name = "green";
    else if (hue < 200) name = "teal";
    else if (hue < 255) name = "blue";
    else if (hue < 290) name = "purple";
    else name = "pink";

    const colorCategory = saturation < 0.16
      ? "neutral"
      : ["red", "orange", "yellow"].includes(name) ? "warm"
        : ["green", "teal", "blue", "purple"].includes(name) ? "cool"
          : "soft warm";
    const characteristics = `${brightness < 90 ? "dark" : brightness > 185 ? "light" : "mid-tone"}, ${saturation < 0.2 ? "muted" : saturation > 0.65 ? "vivid" : "balanced"} ${colorCategory} tone`;
    return { name, colorCategory, characteristics };
  }

  function complementaryColours(colourName) {
    const palettes = {
      black: ["ivory", "muted rose", "stone grey"],
      charcoal: ["soft white", "warm camel", "muted rose"],
      grey: ["deep navy", "ivory", "muted burgundy"],
      white: ["deep navy", "warm camel", "soft rose"],
      red: ["ivory", "deep navy", "soft blush"],
      orange: ["deep navy", "cream", "chocolate"],
      yellow: ["charcoal", "cream", "deep blue"],
      green: ["ivory", "warm beige", "soft rose"],
      teal: ["cream", "warm tan", "soft coral"],
      blue: ["warm ivory", "camel", "muted rust"],
      purple: ["ivory", "soft yellow", "charcoal"],
      pink: ["cream", "chocolate", "muted olive"]
    };
    return palettes[colourName] || ["warm ivory", "soft beige", "charcoal"];
  }

  function createLocalAnalysis(colours, aesthetic) {
    const style = demoStyles[aesthetic] || demoStyles.Casual;
    const dominant = colours.dominant;
    const secondary = colours.secondary;
    const complements = complementaryColours(dominant.name);
    let aestheticSignature = 0;
    for (const character of aesthetic) {
      aestheticSignature = Math.imul(aestheticSignature ^ character.charCodeAt(0), 16777619);
    }
    const seed = ((colours.imageSignature || 0) ^ aestheticSignature) >>> 0;
    const choose = (options, salt, lookIndex) => {
      const mixed = (seed ^ salt ^ Math.imul(lookIndex + 1, 0x9e3779b1)) >>> 0;
      return options[mixed % options.length];
    };
    const outfitCombinations = style.tops.map((_, index) => {
      const top = choose(style.tops, 0x45d9f3b, index);
      const bottom = choose(style.bottoms, 0x119de1f3, index);
      const layer = choose(style.layers, 0x3449f5, index);
      const shoe = choose(style.shoes, 0x27d4eb2d, index);
      const accessory = choose(style.accessories, 0x165667b1, index);
      const topColour = choose(complements, 0x2c1b3c6d, index);
      const bottomColour = secondary && (seed + index) % 3 === 1
        ? secondary.name
        : choose(complements, 0x297a2d39, index);
      const layerColour = secondary && index === seed % 3
        ? secondary.name
        : choose(complements, 0x3c6ef372, index);
      const palette = [dominant.name, secondary ? secondary.name : "no strong secondary colour", topColour, bottomColour, layerColour]
        .filter((colour, position, all) => all.indexOf(colour) === position);
      const echoesSecondary = secondary && [topColour, bottomColour, layerColour].includes(secondary.name);
      return {
        matching_clothing: [
          `${topColour} ${top.replace(/^(a|an) /, "")}`,
          `${bottomColour} ${bottom.replace(/^(a|an) /, "")}`,
          `${layerColour} ${layer.replace(/^(a|an) /, "")}`
        ],
        footwear: [shoe],
        accessories: [accessory],
        colour_combinations: [palette.join(", ")],
        why_this_matches: `The ${topColour}, ${bottomColour} and ${layerColour} pieces complement the sampled ${dominant.name} tone${echoesSecondary ? ` and echo the ${secondary.name} in your photo` : ""}. The ${aesthetic} styling keeps the outfit balanced without repeating your photo's exact palette.`
      };
    });
    return {
      item: {
        category: "Not identified",
        clothing_type: "Garment type is not detected by local colour analysis.",
        main_colour: dominant.name,
        color_category: dominant.colorCategory,
        secondary_colours: [secondary ? secondary.name : "No strong secondary colour detected"],
        pattern: "Not analyzed",
        color_characteristics: dominant.characteristics,
        appearance: `${dominant.characteristics}${secondary ? `; secondary colour ${secondary.name} is ${secondary.characteristics}` : ""}. Local analysis does not recognize garment type or pattern.`
      },
      outfit_combinations: outfitCombinations
    };
  }

  function setupNavigation() {
    const toggle = $(".nav-toggle");
    const nav = $("#site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });
  }

  function setupUploader() {
    const input = $("#image-input");
    const dropZone = $("#drop-zone");
    if (!input || !dropZone) return;
    const preview = $("#image-preview");
    const previewImage = $("#preview-image");
    const uploadMessage = $("#upload-message");
    const showError = (message) => {
      uploadMessage.textContent = message;
      uploadMessage.classList.add("is-error");
    };
    const setPreview = (data, name, size) => {
      uploadedImage = data;
      currentFileName = name;
      previewImage.src = data;
      $("#file-name").textContent = name;
      $("#file-size").textContent = `${(size / (1024 * 1024)).toFixed(2)} MB · ready to style`;
      preview.classList.remove("hidden");
      dropZone.classList.add("hidden");
      uploadMessage.textContent = "";
      uploadMessage.classList.remove("is-error");
    };
    const resizeForSession = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("We couldn't read that image. Please try another file."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("That image could not be opened. Please try another file."));
        image.onload = () => {
          const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Your browser couldn't prepare this image. Please try another file."));
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    const acceptFile = async (file) => {
      if (!file) return;
      const acceptedType = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
      const acceptedExtension = /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!acceptedType && !acceptedExtension) {
        showError("Please choose a JPG, JPEG, PNG or WEBP image.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showError("That image is over 10 MB. Please choose a smaller file.");
        return;
      }
      try {
        setPreview(await resizeForSession(file), file.name, file.size);
      } catch (error) {
        showError(error.message);
      } finally {
        input.value = "";
      }
    };
    input.addEventListener("change", (event) => acceptFile(event.target.files[0]));
    ["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("drag-over");
    }));
    ["dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("drag-over");
    }));
    dropZone.addEventListener("drop", (event) => acceptFile(event.dataTransfer.files[0]));
    dropZone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        input.click();
      }
    });
    $("#replace-image").addEventListener("click", () => input.click());
    $("#remove-image").addEventListener("click", () => {
      uploadedImage = "";
      currentFileName = "";
      input.value = "";
      preview.classList.add("hidden");
      dropZone.classList.remove("hidden");
      uploadMessage.textContent = "";
      uploadMessage.classList.remove("is-error");
    });
  }

  function setupAestheticSelection() {
    const options = $$(".aesthetic-option");
    if (!options.length) return;
    const urlAesthetic = new URLSearchParams(window.location.search).get("aesthetic");
    const setAesthetic = (aesthetic) => {
      selectedAesthetic = aesthetic;
      options.forEach((option) => {
        const active = option.dataset.aesthetic === aesthetic;
        option.classList.toggle("selected", active);
        option.setAttribute("aria-pressed", String(active));
      });
      $("#aesthetic-message").textContent = "";
      $("#aesthetic-message").classList.remove("is-error");
    };
    options.forEach((option) => {
      option.setAttribute("aria-pressed", "false");
      option.addEventListener("click", () => setAesthetic(option.dataset.aesthetic));
    });
    if (options.some((option) => option.dataset.aesthetic === urlAesthetic)) setAesthetic(urlAesthetic);
  }

  function isValidAnalysis(analysis) {
    if (!analysis || !analysis.item || !Array.isArray(analysis.outfit_combinations) || analysis.outfit_combinations.length !== 3) return false;
    const item = analysis.item;
    if (!item.category || !item.clothing_type || !item.main_colour || !item.pattern || !item.appearance || !Array.isArray(item.secondary_colours)) return false;
    return analysis.outfit_combinations.every((outfit) =>
      ["matching_clothing", "footwear", "accessories", "colour_combinations"].every((key) => Array.isArray(outfit[key]) && outfit[key].length > 0) &&
      typeof outfit.why_this_matches === "string" && outfit.why_this_matches.length > 0
    );
  }

  function setText(selector, text, root = document) {
    $(selector, root).textContent = text;
  }

  function renderRecommendationList(containerId, combinations, field) {
    const container = $(`#${containerId}`);
    const values = combinations.flatMap((outfit, index) =>
      outfit[field].map((suggestion) => ({ index, suggestion }))
    );
    values.forEach(({ index, suggestion }) => {
      const chip = document.createElement("span");
      chip.className = "recommendation-chip";
      chip.textContent = suggestion;
      chip.setAttribute("aria-label", `Look ${index + 1}: ${suggestion}`);
      container.append(chip);
    });
  }

  function setupResults() {
    const resultImage = $("#result-upload-image");
    if (!resultImage) return;
    let data;
    try {
      data = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    } catch (error) {
      data = null;
    }
    if (!data || !data.image || !data.aesthetic || !isValidAnalysis(data.analysis)) {
      window.location.replace("upload.html");
      return;
    }

    const { item, outfit_combinations: combinations } = data.analysis;
    $("#demo-mode-notice").classList.remove("hidden");
    resultImage.src = data.image;
    resultImage.alt = `Uploaded clothing item: ${data.fileName || "clothing photo"}`;
    setText("#result-category", "Garment type not identified");
    setText("#result-type", item.clothing_type);
    setText("#result-colour", item.main_colour);
    setText("#result-pattern", item.color_category);
    setText("#result-appearance", item.appearance);
    setText("#result-aesthetic", data.aesthetic);
    const secondaryColours = $("#result-secondary-colours");
    item.secondary_colours.forEach((colour) => {
      const tag = document.createElement("span");
      tag.className = "detail-tag";
      tag.textContent = colour;
      secondaryColours.append(tag);
    });

    const gallery = $("#outfit-gallery");
    const whyList = $("#why-list");
    combinations.forEach((outfit, index) => {
      const card = document.createElement("article");
      card.className = "outfit-card";
      const image = document.createElement("img");
      image.src = inspirationPhotos[index];
      image.alt = `Editorial fashion inspiration for outfit ${index + 1}; styling suggestions are listed below`;
      image.loading = "lazy";
      const copy = document.createElement("div");
      copy.className = "outfit-card-copy";
      const label = document.createElement("p");
      label.className = "eyebrow";
      label.textContent = `LOOK 0${index + 1} / ${data.aesthetic.toUpperCase()}`;
      const title = document.createElement("h3");
      title.textContent = outfit.matching_clothing.join(" + ");
      const why = document.createElement("p");
      why.className = "outfit-why";
      why.textContent = outfit.why_this_matches;
      copy.append(label, title, why);
      card.append(image, copy);
      gallery.append(card);

      const explanation = document.createElement("article");
      explanation.className = "why-item";
      const lookNumber = document.createElement("span");
      lookNumber.className = "why-number";
      lookNumber.textContent = `0${index + 1}`;
      const reason = document.createElement("p");
      reason.textContent = outfit.why_this_matches;
      explanation.append(lookNumber, reason);
      whyList.append(explanation);
    });

    renderRecommendationList("clothing-recommendations", combinations, "matching_clothing");
    renderRecommendationList("footwear-recommendations", combinations, "footwear");
    renderRecommendationList("accessory-recommendations", combinations, "accessories");
    combinations.forEach((outfit, index) => {
      outfit.colour_combinations.forEach((colour) => {
        const chip = document.createElement("span");
        chip.className = "color-chip";
        const lookIndex = document.createElement("span");
        lookIndex.className = "look-index";
        lookIndex.textContent = `0${index + 1}`;
        chip.append(lookIndex, document.createTextNode(colour));
        $("#color-chips").append(chip);
      });
    });
  }

  function setupForm() {
    const form = $("#styling-form");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const uploadMessage = $("#upload-message");
      const aestheticMessage = $("#aesthetic-message");
      if (!uploadedImage) {
        uploadMessage.textContent = "Add a clothing photo first to get colour-based styling ideas.";
        uploadMessage.classList.add("is-error");
        return;
      }
      if (!selectedAesthetic) {
        aestheticMessage.textContent = "Choose the aesthetic you’re feeling to continue.";
        aestheticMessage.classList.add("is-error");
        return;
      }
      const button = $("#generate-button");
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      const spinner = document.createElement("span");
      spinner.className = "loading-spinner";
      spinner.setAttribute("aria-hidden", "true");
      button.replaceChildren(spinner, document.createTextNode("Finding your colours…"));
      uploadMessage.textContent = "Sampling the dominant and secondary colours in your image.";
      uploadMessage.classList.remove("is-error");
      try {
        const colours = await analyzeImageColours(uploadedImage);
        const analysis = createLocalAnalysis(colours, selectedAesthetic);
        if (!isValidAnalysis(analysis)) throw new Error("FitMatch returned incomplete results. Please try another photo.");
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          image: uploadedImage,
          fileName: currentFileName,
          aesthetic: selectedAesthetic,
          analysis
        }));
        window.location.href = "results.html";
      } catch (error) {
        uploadMessage.textContent = error.message || "The image could not be analyzed. Please try another photo.";
        uploadMessage.classList.add("is-error");
        button.disabled = false;
        button.removeAttribute("aria-busy");
        button.textContent = "Generate my outfit ↗";
      }
    });
  }

  setupNavigation();
  setupUploader();
  setupAestheticSelection();
  setupForm();
  setupResults();
})();
