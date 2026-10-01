(() => {
  const viewBoxWidth = 38100;
  const pages = {
    home: {
      title: "خانه",
      alt: "صفحهٔ خانهٔ کافه سینما",
      file: "assets/original/home_original_screen.svg",
      neon: "assets/neon/home_screen_neon.svg",
      height: 67600,
      contentHeight: 59600
    },
    menu: {
      title: "منو",
      alt: "منوی اصلی کافه سینما",
      file: "assets/original/menu_original_screen_main_menu.svg",
      neon: "assets/neon/menu_screen_main_menu_neon.svg",
      height: 67600,
      contentHeight: 59600
    },
    food: {
      title: "منوی غذا",
      alt: "منوی غذاهای کافه سینما",
      file: "assets/original/menu_original_food_menu.svg",
      neon: "assets/neon/menu_food_menu_neon.svg",
      height: 168995,
      contentHeight: 160950
    },
    drinks: {
      title: "منوی نوشیدنی‌ها",
      alt: "منوی نوشیدنی‌های کافه سینما",
      file: "assets/original/menu_drink_menu.svg",
      neon: "assets/neon/menu_drink_menu_neon.svg",
      height: 188756,
      contentHeight: 180711
    },
    instagram: {
      title: "اینستاگرام",
      alt: "صفحهٔ اینستاگرام کافه سینما",
      file: "assets/original/instagram_original_screen.svg",
      neon: "assets/neon/instagram_screen_neon.svg",
      height: 67600,
      contentHeight: 59600
    },
    about: {
      title: "دربارهٔ ما",
      alt: "دربارهٔ کافه سینما، آدرس و ساعت کاری",
      file: "assets/original/about_us_original_screen.svg",
      neon: "assets/neon/about_us_screen_neon.svg",
      height: 98800,
      contentHeight: 90750
    }
  };

  const artWindow = document.querySelector("#artWindow");
  const screenScroll = document.querySelector("#screenScroll");
  const screenStatus = document.querySelector("#screenStatus");
  const appShell = document.querySelector("#appShell");
  const toolbar = document.querySelector(".toolbar");
  const sourceCache = new Map();
  let currentPage = null;
  let currentLayer = null;
  let currentCanvas = null;
  let currentSvg = null;
  let revision = 0;
  let resizeTimer;

  async function readSvg(path) {
    if (!sourceCache.has(path)) {
      const source = window.__CAFE_ASSETS__?.[path] || path;
      sourceCache.set(path, fetch(source).then(response => {
        if (!response.ok) throw new Error(`Unable to load ${path}`);
        return response.text();
      }));
    }
    return sourceCache.get(path);
  }

  function parseSvg(markup) {
    const clean = markup
      .replace(/^\s*<\?xml[^?]*\?>/i, "")
      .replace(/<!DOCTYPE[\s\S]*?>/i, "");
    const documentNode = new DOMParser().parseFromString(clean, "image/svg+xml");
    if (documentNode.querySelector("parsererror")) throw new Error("Invalid SVG");
    return documentNode.documentElement;
  }

  async function removeFlatPaperLayers(svg) {
    const sample = document.createElement("canvas");
    sample.width = 8;
    sample.height = 8;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const paperSizes = new Set(["941x1672", "675x1200"]);
    const flatSources = new Set();

    for (const layer of svg.querySelectorAll("image")) {
      const source = layer.getAttribute("href")
        || layer.getAttributeNS("http://www.w3.org/1999/xlink", "href");
      if (!source?.startsWith("data:image/png;base64,")) continue;

      if (flatSources.has(source)) {
        layer.remove();
        continue;
      }

      try {
        const header = Uint8Array.from(atob(source.slice(22, 54)), char => char.charCodeAt(0));
        const dimensions = new DataView(header.buffer);
        const width = dimensions.getUint32(16);
        const height = dimensions.getUint32(20);
        if (!paperSizes.has(`${width}x${height}`)) continue;
      } catch {
        continue;
      }

      const image = new Image();
      image.src = source;
      try {
        await image.decode();
        context.clearRect(0, 0, sample.width, sample.height);
        context.drawImage(image, 0, 0, sample.width, sample.height);
        const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
        let isFlatPaper = true;
        for (let i = 0; i < pixels.length; i += 4) {
          const difference = Math.max(
            Math.abs(pixels[i] - 40),
            Math.abs(pixels[i + 1] - 40),
            Math.abs(pixels[i + 2] - 41)
          );
          if (difference > 1 || pixels[i + 3] < 250) {
            isFlatPaper = false;
            break;
          }
        }
        if (isFlatPaper) {
          flatSources.add(source);
          layer.remove();
        }
      } catch {
        // Keep any artwork layer that cannot be safely inspected.
      }
    }

    const logo = svg.querySelector('[id="لوگوی_x0020_اصلی_x0020_1.png"]');
    const logoSource = logo?.getAttribute("href")
      || logo?.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    if (logo && logoSource?.startsWith("data:image/png;base64,")) {
      try {
        const image = new Image();
        image.src = logoSource;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          if (Math.max(
            Math.abs(pixels.data[i] - 40),
            Math.abs(pixels.data[i + 1] - 40),
            Math.abs(pixels.data[i + 2] - 41)
          ) <= 1) pixels.data[i + 3] = 0;
        }
        context.putImageData(pixels, 0, 0);
        logo.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", canvas.toDataURL("image/png"));
      } catch {
        // Leave the original logo untouched if its matte cannot be removed safely.
      }
    }
  }

  function setActiveNavigation(pageKey) {
    const section = pageKey === "food" || pageKey === "drinks" ? "menu" : pageKey;
    document.querySelectorAll(".nav-button").forEach(button => {
      if (button.dataset.route === section) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function addHotspot(layer, { label, left, top, width, height, route, href }) {
    const control = document.createElement(href ? "a" : "button");
    control.className = "hotspot";
    control.style.left = `${left}%`;
    control.style.top = `${top}%`;
    control.style.width = `${width}%`;
    control.style.height = `${height}%`;
    control.setAttribute("aria-label", label);

    if (href) {
      control.href = href;
      control.target = "_blank";
      control.rel = "noopener noreferrer";
    } else {
      control.type = "button";
      control.addEventListener("click", () => navigate(route));
    }

    layer.append(control);
  }

  function addPageControls(layer, key) {
    const hotspots = document.createElement("div");
    hotspots.className = "hotspot-layer";
    hotspots.style.height = "100%";

    if (key === "menu") {
      addHotspot(hotspots, {
        label: "نمایش منوی غذا",
        route: "food",
        left: 18,
        top: 25.7,
        width: 73,
        height: 9.2
      });
      addHotspot(hotspots, {
        label: "نمایش منوی نوشیدنی‌ها",
        route: "drinks",
        left: 7.5,
        top: 39.1,
        width: 84.5,
        height: 9.2
      });
    }

    if (key === "instagram") {
      addHotspot(hotspots, {
        label: "ورود مستقیم به پیج اینستاگرام کافه سینما",
        href: "https://www.instagram.com/Cinema.cafee_/",
        left: 7,
        top: 69,
        width: 86,
        height: 9
      });
    }

    layer.append(hotspots);
  }

  function fitArtwork(page, layer, canvas) {
    const cssWidth = artWindow.clientWidth;
    if (!cssWidth) return;

    const visibleHeight = cssWidth * page.contentHeight / viewBoxWidth;
    appShell.style.height = `${Math.min(window.innerHeight, visibleHeight + toolbar.getBoundingClientRect().height)}px`;
    artWindow.style.height = `${visibleHeight}px`;
    layer.style.height = `${cssWidth * page.height / viewBoxWidth}px`;
    canvas.style.height = `${visibleHeight}px`;

    const pixelWidth = Math.max(480, Math.min(960, Math.round(cssWidth * Math.min(2, window.devicePixelRatio || 1))));
    canvas.width = pixelWidth;
    canvas.height = Math.round(pixelWidth * page.contentHeight / viewBoxWidth);
  }

  function removeBottomSeparator(svg) {
    const artBounds = artWindow.getBoundingClientRect();
    const red = "rgb(198, 1, 1)";

    for (const shape of svg.querySelectorAll("path, line, rect, polyline")) {
      const style = getComputedStyle(shape);
      if (style.fill !== red && style.stroke !== red) continue;

      const bounds = shape.getBoundingClientRect();
      if (bounds.width < artBounds.width * .8
        || bounds.height > Math.max(4, artBounds.height * .01)
        || bounds.top < artBounds.bottom - artBounds.height * .05
        || bounds.bottom > artBounds.bottom + 1) continue;

      shape.remove();
    }
  }

  async function paintNeon(page, canvas, token, svg) {
    let objectUrl;
    try {
      const neonSvg = parseSvg(await readSvg(page.neon));
      neonSvg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${page.contentHeight}`);
      neonSvg.setAttribute("width", `${canvas.width}`);
      neonSvg.setAttribute("height", `${canvas.height}`);
      objectUrl = URL.createObjectURL(new Blob([
        new XMLSerializer().serializeToString(neonSvg)
      ], { type: "image/svg+xml" }));

      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      if (token !== revision || !canvas.isConnected) return;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = pixels.data;
      const width = canvas.width;
      const height = canvas.height;

      for (let y = 0; y < height; y++) {
        const insideInstagramLogo = page.title === "اینستاگرام" && y / height > .16 && y / height < .54;
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const red = data[i] > 72 && data[i] > data[i + 1] * 1.45 && data[i] > data[i + 2] * 1.45;
          const yellow = data[i] > 130 && data[i + 1] > 100 && data[i + 2] < 105
            && data[i] > data[i + 2] * 1.45 && data[i + 1] > data[i + 2] * 1.2;
          const inLogoArea = insideInstagramLogo && x / width > .20 && x / width < .80;

          if (inLogoArea || (!red && !yellow)) {
            data[i + 3] = 0;
          } else if (red) {
            data[i] = 255;
            data[i + 1] = 25;
            data[i + 2] = 16;
          } else {
            data[i] = 255;
            data[i + 1] = 239;
            data[i + 2] = 24;
          }
        }
      }

      for (let y = Math.floor(height * .985); y < height; y++) {
        let redCount = 0;
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          if (data[i + 3] && data[i] > data[i + 1] * 1.45 && data[i] > data[i + 2] * 1.45) redCount++;
        }
        if (redCount < width * .65) continue;
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          if (data[i] > data[i + 1] * 1.45 && data[i] > data[i + 2] * 1.45) data[i + 3] = 0;
        }
      }

      context.putImageData(pixels, 0, 0);

      if (svg && page.file !== pages.about.file) {
        const artBounds = artWindow.getBoundingClientRect();
        const scaleX = canvas.width / artBounds.width;
        const scaleY = canvas.height / artBounds.height;
        const padding = Math.ceil(Math.max(scaleX, scaleY));

        for (const image of svg.querySelectorAll("image")) {
          const bounds = image.getBoundingClientRect();
          if (!bounds.width || !bounds.height) continue;

          const left = Math.max(0, Math.floor((bounds.left - artBounds.left) * scaleX) - padding);
          const top = Math.max(0, Math.floor((bounds.top - artBounds.top) * scaleY) - padding);
          const right = Math.min(canvas.width, Math.ceil((bounds.right - artBounds.left) * scaleX) + padding);
          const bottom = Math.min(canvas.height, Math.ceil((bounds.bottom - artBounds.top) * scaleY) + padding);
          if (right > left && bottom > top) context.clearRect(left, top, right - left, bottom - top);
        }
      }
    } catch {
      if (token === revision) canvas.hidden = true;
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }

  async function renderPage(key) {
    const page = pages[key] || pages.home;
    const token = ++revision;
    currentPage = page;
    screenScroll.scrollTop = 0;
    setActiveNavigation(key);
    document.title = `${page.title} | کافه سینما`;
    screenStatus.textContent = `صفحهٔ ${page.title} باز شد`;
    artWindow.setAttribute("aria-busy", "true");
    artWindow.replaceChildren();

    try {
      const originalSvg = parseSvg(await readSvg(page.file));
      if (token !== revision) return;
      await removeFlatPaperLayers(originalSvg);
      if (token !== revision) return;

      originalSvg.classList.add("screen-svg");
      originalSvg.setAttribute("width", "100%");
      originalSvg.setAttribute("height", "100%");
      originalSvg.setAttribute("preserveAspectRatio", "xMidYMin meet");
      originalSvg.setAttribute("role", "img");
      originalSvg.setAttribute("aria-label", page.alt);

      if (key === "instagram") {
        const logo = originalSvg.querySelector('[id="لوگوی_x0020_اصلی_x0020_1.png"]');
        if (logo) logo.classList.add("instagram-lamp");
      }

      const layer = document.createElement("div");
      layer.className = "art-full";
      const screenSvg = document.importNode(originalSvg, true);
      layer.append(screenSvg);
      addPageControls(layer, key);

      const canvas = document.createElement("canvas");
      canvas.className = key === "about" ? "neon-mask" : "neon-mask crisp-images";
      canvas.setAttribute("aria-hidden", "true");
      artWindow.replaceChildren(layer, canvas);
      currentLayer = layer;
      currentCanvas = canvas;
      fitArtwork(page, layer, canvas);
      removeBottomSeparator(screenSvg);
      currentSvg = screenSvg;
      artWindow.setAttribute("aria-busy", "false");
      void paintNeon(page, canvas, token, screenSvg);
    } catch {
      if (token !== revision) return;
      artWindow.style.height = "auto";
      const message = document.createElement("p");
      message.className = "load-error";
      message.textContent = "بارگذاری طرح انجام نشد. پوشهٔ assets را کنار فایل index.html نگه دارید.";
      artWindow.replaceChildren(message);
      artWindow.setAttribute("aria-busy", "false");
    }
  }

  function navigate(key) {
    if (!pages[key]) return;
    if (location.hash === `#${key}`) {
      void renderPage(key);
    } else {
      location.hash = key;
    }
  }

  document.querySelectorAll(".nav-button").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.route));
  });

  window.addEventListener("hashchange", () => {
    const key = location.hash.slice(1);
    void renderPage(pages[key] ? key : "home");
  });

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!currentPage || !currentLayer || !currentCanvas) return;
      fitArtwork(currentPage, currentLayer, currentCanvas);
      void paintNeon(currentPage, currentCanvas, revision, currentSvg);
    }, 120);
  });

  const initialKey = location.hash.slice(1);
  if (!pages[initialKey]) history.replaceState(null, "", "#home");
  void renderPage(pages[initialKey] ? initialKey : "home");
})();
