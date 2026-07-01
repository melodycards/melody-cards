(function bindPremiumOrderForm() {
  const form = document.getElementById("premium-order-form");
  if (!form || form.dataset.submitBound === "true") return;
  form.dataset.submitBound = "true";
  const requestTimeoutMs = 15000;

  function withTimeout(promise, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error(`${label} dauert zu lange. Bitte pruefe Supabase-Verbindung, Tabelle premium_orders und RLS-Policies.`)), requestTimeoutMs);
      })
    ]);
  }

  form.querySelector('button[type="submit"]')?.addEventListener("click", () => {
    const status = document.getElementById("premium-order-status") || form.querySelector("[data-form-status]");
    if (form.checkValidity() && status) status.textContent = "Sende Anfrage…";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const status = document.getElementById("premium-order-status") || form.querySelector("[data-form-status]");
    const formData = new FormData(form);

    if (status) status.textContent = "Sende Anfrage…";
    if (submitButton) submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");

    try {
      if (!window.MelodySupabase?.isConfigured()) {
        throw new Error("Supabase ist nicht verbunden. Bitte config.js mit URL und Anon Key pruefen.");
      }

      const [fileUrl, imageUrl, videoUrl, audioUrl] = await withTimeout(Promise.all([
        window.MelodySupabase.uploadOrderFile(form.elements.files?.files?.[0], "files"),
        window.MelodySupabase.uploadOrderFile(form.elements.image?.files?.[0], "images"),
        window.MelodySupabase.uploadOrderFile(form.elements.video?.files?.[0], "videos"),
        window.MelodySupabase.uploadOrderFile(form.elements.audio?.files?.[0], "audio")
      ]), "Dateiupload");

      await withTimeout(window.MelodySupabase.createPremiumOrder({
        name: formData.get("name")?.trim() || "",
        email: formData.get("email")?.trim() || "",
        phone: formData.get("phone")?.trim() || "",
        address: formData.get("address")?.trim() || "",
        card_text: formData.get("cardText")?.trim() || "",
        music_wish: formData.get("musicWish")?.trim() || "",
        message: formData.get("message")?.trim() || "",
        file_url: fileUrl,
        image_url: imageUrl,
        video_url: videoUrl,
        audio_url: audioUrl,
        status: "new"
      }), "Speichern der Premium-Anfrage");

      if (status) status.textContent = "Danke. Deine Premium-Anfrage wurde erfolgreich gesendet.";
      form.reset();
    } catch (error) {
      console.error("Premium order submit failed:", error);
      if (status) {
        status.textContent = error.message || "Die Premium-Anfrage konnte nicht gespeichert werden. Bitte pruefe Supabase.";
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });
})();

(async function () {
  function withContentTimeout(promise, ms, fallback) {
    return Promise.race([
      promise,
      new Promise((resolve) => window.setTimeout(() => resolve(fallback), ms))
    ]);
  }

  const data = await withContentTimeout(
    window.MelodySupabase.fetchContent(),
    5500,
    { ...window.MELODY_DEMO_CONTENT, source: "demo-timeout" }
  );
  const settings = data.settings?.content || {};
  const design = data.settings?.design || {};
  function applyDesign() {
    const root = document.documentElement;
    if (design.background) root.style.setProperty("--black", design.background);
    if (design.text) root.style.setProperty("--text", design.text);
    if (design.muted) root.style.setProperty("--muted", design.muted);
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el && value) el.textContent = value;
  }

  const relaunchContent = {
    heroEyebrow: "Melody Cards",
    heroTitleLine1: "Handgemachte Karten",
    heroTitleLine2: "für persönliche Momente.",
    heroText: "Eine ruhige, hochwertige Karte mit deiner Botschaft, einem Foto und auf Wunsch einem Lied oder QR-Code. Schlicht gestaltet, persönlich erzählt, bewusst verschenkt.",
    primaryButtonText: "Karte gestalten",
    primaryButtonHref: "#order",
    secondaryButtonText: "Beispiele ansehen",
    secondaryButtonHref: "#examples",
    footerText: "Handgemachte Karten mit persönlicher Botschaft, Foto, Lied oder QR-Code.",
    contactTitle: "Offen für Fragen vor der Anfrage.",
    contactText: "Wenn du unsicher bist, ob eine Karte, ein Lied oder ein QR-Code passt, schreibe uns kurz. Wir antworten ohne Verkaufsdruck."
  };

  const retiredContent = {
    heroEyebrow: ["Lux" + "ury " + "sound gifting", "Handmade " + "sound gifting"],
    heroTitleLine1: ["Personalisierte Karten.", "Grußkarten, die singen."],
    heroTitleLine2: ["Ein Lied, das bleibt.", "Persönlich. Warm. Unvergesslich."],
    heroText: [
      "Melody Cards verbindet hochwertige Grußkarten, individuelle Kompositionen und elegante QR-Code-Technologie zu einem Geschenk, das sofort berührt.",
      "Melody Cards verbindet handgemachte Premium-Grußkarten mit deinem Foto, deinen Worten und einem eigens komponierten Lied, das per QR-Code sofort abgespielt wird."
    ],
    primaryButtonText: ["Jetzt bestellen"],
    secondaryButtonText: ["Live " + "Demo testen"],
    secondaryButtonHref: ["#demo"],
    footerText: [
      "Premium-Karten mit QR-Code und eigens komponiertem Lied.",
      "Handgemachte Premium-Grußkarten mit persönlichem Lied, Foto, Text und QR-Code."
    ],
    contactTitle: ["Bereit für dein persönliches Lied?", "Bereit für eine Karte, die wirklich ankommt?"],
    contactText: [
      "Schreibe uns direkt per WhatsApp, E-Mail oder über das Bestellformular. Wir melden uns mit Preis, Timing und Designvorschlag.",
      "Schreibe uns direkt per WhatsApp, E-Mail oder über das Anfrageformular. Wir antworten persönlich und ohne Verkaufsdruck."
    ]
  };

  function content(key) {
    const value = settings[key];
    if (!value || (retiredContent[key] || []).includes(value)) return relaunchContent[key] || value;
    return value;
  }

  function applyGlobalContent() {
    setText(".brand-text", settings.brandName);
    document.querySelectorAll(".brand-mark").forEach((el) => { if (settings.logoText) el.textContent = settings.logoText; });
    if (settings.logoImage) {
      document.querySelectorAll(".brand-mark").forEach((el) => {
        el.innerHTML = `<img class="logo-image" src="${settings.logoImage}" alt="">`;
      });
    }
    setText(".loader span", settings.brandName);
    setText(".hero .eyebrow", content("heroEyebrow"));
    setText(".hero h1 span:first-child", content("heroTitleLine1"));
    setText(".hero h1 span:last-child", content("heroTitleLine2"));
    setText(".hero-content p:not(.eyebrow)", content("heroText"));
    const primary = document.querySelector(".hero-actions .btn-primary");
    const secondary = document.querySelector(".hero-actions .text-link");
    if (primary) {
      primary.textContent = content("primaryButtonText") || primary.textContent;
      primary.href = content("primaryButtonHref") || "#order";
    }
    if (secondary) {
      secondary.textContent = content("secondaryButtonText") || secondary.textContent;
      secondary.href = content("secondaryButtonHref") || "#examples";
    }
    setText(".footer-brand strong", settings.brandName);
    setText(".footer-brand p", content("footerText"));
    setText(".contact-card h2", content("contactTitle"));
    setText(".contact-card p:not(.eyebrow)", content("contactText"));
    const contactMail = document.querySelector(".contact-card a");
    if (contactMail && settings.contactEmail) {
      contactMail.href = `mailto:${settings.contactEmail}`;
      contactMail.textContent = settings.contactEmail;
    }
  }

  function productCard(item, index) {
    const tags = Array.isArray(item.tags) ? item.tags.slice(0, 2) : ["Botschaft", "Foto oder QR-Code"];
    return `
      <article class="product-card reveal">
        <div class="card-art quiet-art">
          <span>${String(index + 1).padStart(2, "0")}</span>
        </div>
        <div class="card-body">
          <h3>${item.title}</h3><p>${item.description || ""}</p>
          <div class="tag-row">${tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
          <a class="text-link" href="#order">Anfrage starten</a>
        </div>
      </article>`;
  }

  function renderProducts() {
    const productGrid = document.querySelector("[data-products]");
    if (!productGrid) return;
    const products = Array.isArray(data.products) ? data.products.slice(0, 6) : [];
    const hasLegacyProductData = products.some((item) => item.price || item.image_url || /Jahrestag|Vatertag|Weihnachten|Neujahr|Firmenjubil/i.test(item.title || ""));
    const visibleProducts = hasLegacyProductData ? window.MELODY_DEMO_CONTENT.products : products;
    productGrid.innerHTML = visibleProducts.slice(0, 6).map(productCard).join("");
  }

  function renderDemoCards() {
    const demoCards = document.querySelector("[data-demo-cards]");
    if (!demoCards) return;
    demoCards.innerHTML = data.products.slice(0, 4).map((item, index) => `
      <button class="demo-card-btn ${index === 0 ? "is-active" : ""}" type="button" data-demo-card="${item.title}">
        <span>${item.title}</span><span>QR testen</span>
      </button>`).join("");
  }

  function renderGallery() {
    const gallery = document.querySelector("[data-gallery]");
    if (!gallery) return;
    const galleryItems = Array.isArray(data.gallery) ? data.gallery.slice(0, 6) : [];
    const hasLegacyGalleryData = galleryItems.some((item) => item.image_url || /Beispiel|Goldfolie|Geschenkbox|Smartphone|Sound|Musik/i.test(`${item.title || ""} ${item.category || ""}`));
    const visibleGallery = hasLegacyGalleryData ? window.MELODY_DEMO_CONTENT.gallery : galleryItems;
    gallery.innerHTML = visibleGallery.slice(0, 6).map((item, index) => {
      return `
        <button class="gallery-item reveal" type="button" data-gallery-title="${item.title}" data-gallery-text="${item.description || ""}">
          <div class="gallery-art quiet-art"><span>${String(index + 1).padStart(2, "0")}</span></div><h3>${item.title}</h3><p>${item.category || item.description || "Melody Cards Beispiel"}</p>
        </button>`;
    }).join("");
  }

  function renderAudio() {
    const audioGrid = document.querySelector("[data-audio]");
    if (!audioGrid) return;
    audioGrid.innerHTML = (data.audio || []).map((item) => `
      <article class="audio-card reveal">
        <div class="audio-top"><div class="audio-cover"></div><div><h3>${item.title}</h3><p>${item.description || ""}</p></div></div>
        <div class="sound-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <button class="btn btn-glass" type="button" data-audio-play>Preview starten</button>
      </article>`).join("");
  }

  function renderConfigurator() {
    const configFields = {
      occasion: ["Geburtstag", "Hochzeit", "Jahrestag", "Muttertag", "Firmenjubiläum"],
      color: ["Weiß", "Hellgrau", "Creme", "Schwarz", "Naturpapier"],
      design: ["Minimal", "Editorial", "Foto", "Klassisch"],
      font: ["Elegant Serif", "Modern Sans", "Handwritten", "Classic"],
      language: ["Deutsch", "Englisch", "Französisch", "Spanisch"],
      music: ["Pop Ballade", "Piano", "Acoustic", "Cinematic", "Soul"],
      voice: ["Weiblich", "Männlich", "Duett"],
      qr: ["Schwarz", "Dunkelgrau", "Beige", "Weiß"],
      packaging: ["Geschenkbox", "Seidenpapier", "Premium Umschlag"],
      box: ["Schlichte Box", "Umschlag", "Ohne Box"]
    };
    const labels = { occasion: "Anlass", color: "Kartenfarbe", design: "Design", font: "Schriftart", language: "Sprache", music: "Musikstil", voice: "Sänger", qr: "QR-Code Farbe", packaging: "Verpackung", box: "Geschenkbox" };
    const configForm = document.querySelector("[data-config-form]");
    if (!configForm) return;
    configForm.innerHTML = Object.entries(configFields).map(([key, values]) => `<label>${labels[key]}<select name="${key}">${values.map((v) => `<option>${v}</option>`).join("")}</select></label>`).join("");
  }

  function renderFaq() {
    const faqList = document.querySelector("[data-faq]");
    if (!faqList) return;
    const faqs = Array.isArray(data.faqs) ? data.faqs.slice(0, 8) : [];
    const hasLegacyFaqData = faqs.some((item) => /Express|48h|Preis|kostet|Download|Stimmen|Musikstil|Sprache/i.test(`${item.question || ""} ${item.answer || ""}`));
    const visibleFaqs = hasLegacyFaqData ? window.MELODY_DEMO_CONTENT.faqs : faqs;
    faqList.innerHTML = visibleFaqs.slice(0, 8).map((item, index) => `<details ${index === 0 ? "open" : ""} class="reveal"><summary>${item.question}</summary><p>${item.answer}</p></details>`).join("");
  }

  function renderBlog() {
    const blogGrid = document.querySelector("[data-blog]");
    if (!blogGrid) return;
    blogGrid.innerHTML = data.blog.map((item, index) => {
      return `<article class="blog-card reveal"><div class="blog-art quiet-art"><span>${String(index + 1).padStart(2, "0")}</span></div><div><h3>${item.title}</h3><p>${item.excerpt || ""}</p><a class="btn btn-glass" href="#blog">Lesen</a></div></article>`;
    }).join("");
  }

  function bindInteractions() {
    const navToggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-nav]");
    navToggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    nav?.addEventListener("click", (event) => {
      if (event.target.matches("a")) nav.classList.remove("is-open");
    });

    document.querySelectorAll("[data-demo-card]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-demo-card]").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        document.querySelector("[data-demo-title]").textContent = `${button.dataset.demoCard} Song`;
        document.querySelector("[data-demo-subtitle]").textContent = "QR-Code gescannt";
      });
    });

    document.querySelector("[data-demo-play]")?.addEventListener("click", () => {
      document.querySelector("[data-sound-wave]")?.classList.toggle("is-playing");
    });
    document.querySelector("[data-play-demo]")?.addEventListener("click", (event) => {
      event.currentTarget.closest(".phone-screen")?.classList.toggle("is-playing");
    });
    document.querySelectorAll("[data-audio-play]").forEach((button) => {
      button.addEventListener("click", () => button.previousElementSibling.classList.toggle("is-playing"));
    });

    const configForm = document.querySelector("[data-config-form]");
    configForm?.addEventListener("change", () => {
      const formData = new FormData(configForm);
      document.querySelector("[data-preview-occasion]").textContent = formData.get("occasion");
      document.querySelector("[data-preview-design]").textContent = formData.get("design");
      document.querySelector("[data-preview-music]").textContent = `${formData.get("music")} · ${formData.get("language")}`;
      document.querySelector("[data-preview-package]").textContent = `${formData.get("packaging")} / ${formData.get("box")}`;
      document.querySelector("[data-preview-voice]").textContent = formData.get("voice");
      document.querySelector("[data-preview-qr]").style.filter = formData.get("qr") === "Gold" ? "sepia(1) saturate(1.4)" : "none";
    });

    const lightbox = document.querySelector("[data-lightbox]");
    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.addEventListener("click", () => {
        if (!lightbox) return;
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
        document.querySelector("[data-lightbox-art]").style.removeProperty("--gallery-bg");
        document.querySelector("[data-lightbox-title]").textContent = item.dataset.galleryTitle;
        document.querySelector("[data-lightbox-text]").textContent = item.dataset.galleryText;
      });
    });
    document.querySelector("[data-lightbox-close]")?.addEventListener("click", () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
    });

    document.querySelector("[data-newsletter]")?.addEventListener("submit", (event) => event.preventDefault());
    document.querySelector("[data-cookie-accept]")?.addEventListener("click", () => document.querySelector("[data-cookie]")?.classList.add("is-hidden"));
    document.querySelector("[data-back-top]")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function bindScrollAnimations() {
    const loader = document.querySelector("[data-loader]");
    setTimeout(() => loader?.classList.add("is-hidden"), 450);
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));
    window.addEventListener("scroll", () => {
      document.querySelector("[data-header]")?.classList.toggle("is-scrolled", window.scrollY > 40);
      document.querySelector("[data-back-top]")?.classList.toggle("is-visible", window.scrollY > 700);
      document.querySelector("[data-parallax]")?.style.setProperty("--parallax", `${window.scrollY * 0.06}px`);
    });
  }

  function injectTools() {
  }

  applyDesign();
  applyGlobalContent();
  renderProducts();
  renderDemoCards();
  renderGallery();
  renderAudio();
  renderConfigurator();
  renderFaq();
  renderBlog();
  bindInteractions();
  bindScrollAnimations();
  injectTools();
})();
