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
      file: "assets/original/menu_original_drink_menu.svg",
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

  async function paintNeon(page, canvas, token) {
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
        const insideInstagramLogo = page.title === "اینستاگرام" && y / height > .15 && y / height < .46;
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const red = data[i] > 72 && data[i] > data[i + 1] * 1.45 && data[i] > data[i + 2] * 1.45;
          const yellow = data[i] > 130 && data[i + 1] > 100 && data[i + 2] < 105
            && data[i] > data[i + 2] * 1.45 && data[i + 1] > data[i + 2] * 1.2;
          const inLogoArea = insideInstagramLogo && x / width > .19 && x / width < .81;

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

      context.putImageData(pixels, 0, 0);
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
      layer.append(document.importNode(originalSvg, true));
      addPageControls(layer, key);

      const canvas = document.createElement("canvas");
      canvas.className = "neon-mask";
      canvas.setAttribute("aria-hidden", "true");
      artWindow.replaceChildren(layer, canvas);
      currentLayer = layer;
      currentCanvas = canvas;
      fitArtwork(page, layer, canvas);
      artWindow.setAttribute("aria-busy", "false");
      void paintNeon(page, canvas, token);
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
      void paintNeon(currentPage, currentCanvas, revision);
    }, 120);
  });

  const initialKey = location.hash.slice(1);
  if (!pages[initialKey]) history.replaceState(null, "", "#home");
  void renderPage(pages[initialKey] ? initialKey : "home");
})();
