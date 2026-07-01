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
  const data = await window.MelodySupabase.fetchContent();
  const settings = data.settings?.content || {};
  const design = data.settings?.design || {};
  const imageAssets = ["assets/images/melody-cards-premium-hero.png", "assets/images/premium-card-detail.png", "assets/images/gift-moment.png", "assets/images/gift-box-packaging.png", "assets/images/phone-music-player.png"];

  function applyDesign() {
    const root = document.documentElement;
    if (design.gold) root.style.setProperty("--gold", design.gold);
    if (design.gold2) root.style.setProperty("--gold-2", design.gold2);
    if (design.background) root.style.setProperty("--black", design.background);
    if (design.text) root.style.setProperty("--text", design.text);
    if (design.muted) root.style.setProperty("--muted", design.muted);
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el && value) el.textContent = value;
  }

  function imageUrl(item, index = 0) {
    return item?.image_url || item?.image || imageAssets[index % imageAssets.length];
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
    setText(".hero .eyebrow", settings.heroEyebrow);
    setText(".hero h1 span:first-child", settings.heroTitleLine1);
    setText(".hero h1 span:last-child", settings.heroTitleLine2);
    setText(".hero-content p:not(.eyebrow)", settings.heroText);
    const heroImage = document.querySelector(".hero-media img");
    if (heroImage && settings.heroImage) heroImage.src = settings.heroImage;
    const primary = document.querySelector(".hero-actions .btn-primary");
    const secondary = document.querySelector(".hero-actions .btn-glass");
    if (primary) {
      primary.textContent = settings.primaryButtonText || primary.textContent;
      primary.href = settings.primaryButtonHref || "#order";
    }
    if (secondary) {
      secondary.textContent = settings.secondaryButtonText || secondary.textContent;
      secondary.href = settings.secondaryButtonHref || "#demo";
    }
    setText(".footer-brand strong", settings.brandName);
    setText(".footer-brand p", settings.footerText);
    setText(".contact-card h2", settings.contactTitle);
    setText(".contact-card p:not(.eyebrow)", settings.contactText);
    const contactMail = document.querySelector(".contact-card a");
    if (contactMail && settings.contactEmail) {
      contactMail.href = `mailto:${settings.contactEmail}`;
      contactMail.textContent = settings.contactEmail;
    }
    const whatsApp = document.querySelector(".whatsapp-chat");
    if (whatsApp && settings.whatsappNumber) {
      const msg = encodeURIComponent(settings.whatsappMessage || "Hallo Melody Cards, ich möchte bestellen.");
      whatsApp.href = `https://wa.me/${settings.whatsappNumber}?text=${msg}`;
    }
    const socials = document.querySelectorAll(".socials a");
    if (socials[0] && settings.socialInstagram) socials[0].href = settings.socialInstagram;
    if (socials[1] && settings.socialTikTok) socials[1].href = settings.socialTikTok;
    if (socials[2] && settings.socialYouTube) socials[2].href = settings.socialYouTube;
  }

  function productCard(item, index) {
    const tags = Array.isArray(item.tags) ? item.tags : ["QR-Code", "Custom Song", "Premium Print"];
    const img = imageUrl(item, index);
    return `
      <article class="product-card reveal">
        <div class="card-art has-photo" style="--photo:url('${img}')">
          <div class="visual-card"><span class="visual-qr"></span></div><div class="visual-phone"></div>
        </div>
        <div class="card-body">
          <h3>${item.title}</h3><p>${item.description || ""}</p><strong class="price">${item.price || ""}</strong>
          <div class="tag-row">${tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
          <a class="btn btn-primary" href="#order">Jetzt bestellen</a>
        </div>
      </article>`;
  }

  function renderProducts() {
    const productGrid = document.querySelector("[data-products]");
    productGrid.innerHTML = data.products.map(productCard).join("");
  }

  function renderDemoCards() {
    const demoCards = document.querySelector("[data-demo-cards]");
    demoCards.innerHTML = data.products.slice(0, 4).map((item, index) => `
      <button class="demo-card-btn ${index === 0 ? "is-active" : ""}" type="button" data-demo-card="${item.title}">
        <span>${item.title}</span><span>QR testen</span>
      </button>`).join("");
  }

  function renderGallery() {
    const gallery = document.querySelector("[data-gallery]");
    gallery.innerHTML = data.gallery.map((item, index) => {
      const img = imageUrl(item, index);
      return `
        <button class="gallery-item reveal" type="button" data-gallery-title="${item.title}" data-gallery-text="${item.description || ""}" data-gallery-image="${img}" style="--photo:url('${img}')">
          <div class="gallery-art has-photo"></div><h3>${item.title}</h3><p>${item.category || item.description || "Melody Cards Beispiel"}</p>
        </button>`;
    }).join("");
  }

  function renderAudio() {
    const audioGrid = document.querySelector("[data-audio]");
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
      color: ["Noir Gold", "Ivory Gold", "Champagne", "Midnight", "Pearl"],
      design: ["Royal Noir", "Minimal Gold", "Velvet Script", "Modern Frame"],
      font: ["Elegant Serif", "Modern Sans", "Handwritten", "Classic"],
      language: ["Deutsch", "Englisch", "Französisch", "Spanisch"],
      music: ["Pop Ballade", "Piano", "Acoustic", "Cinematic", "Soul"],
      voice: ["Weiblich", "Männlich", "Duett"],
      qr: ["Gold", "Schwarz", "Champagner", "Weiß"],
      packaging: ["Geschenkbox", "Seidenpapier", "Premium Umschlag"],
      box: ["Noir Box", "Ivory Box", "Corporate Box"]
    };
    const labels = { occasion: "Anlass", color: "Kartenfarbe", design: "Design", font: "Schriftart", language: "Sprache", music: "Musikstil", voice: "Sänger", qr: "QR-Code Farbe", packaging: "Verpackung", box: "Geschenkbox" };
    const configForm = document.querySelector("[data-config-form]");
    configForm.innerHTML = Object.entries(configFields).map(([key, values]) => `<label>${labels[key]}<select name="${key}">${values.map((v) => `<option>${v}</option>`).join("")}</select></label>`).join("");
  }

  function renderReviews() {
    const reviews = document.querySelector("[data-reviews]");
    reviews.innerHTML = data.reviews.map((item) => {
      const initials = (item.name || "MC").split(" ").map((p) => p[0]).join("").slice(0, 2);
      return `
        <article class="review-card reveal">
          <div class="review-head"><div class="review-avatar">${initials}</div><div><strong>${item.name}</strong><div class="verified">${item.verified ? "✓ Verifiziert" : "Kunde"}</div></div></div>
          <div class="stars">${"★".repeat(Number(item.rating || 5))}</div><p>"${item.text || ""}"</p>
        </article>`;
    }).join("");
  }

  function renderFaq() {
    const faqList = document.querySelector("[data-faq]");
    faqList.innerHTML = data.faqs.map((item, index) => `<details ${index === 0 ? "open" : ""} class="reveal"><summary>${item.question}</summary><p>${item.answer}</p></details>`).join("");
  }

  function renderBlog() {
    const blogGrid = document.querySelector("[data-blog]");
    blogGrid.innerHTML = data.blog.map((item, index) => {
      const img = imageUrl(item, index + 1);
      return `<article class="blog-card reveal"><div class="blog-art has-photo" style="--photo:url('${img}'); background-image: linear-gradient(180deg, rgba(5,5,5,0.02), rgba(5,5,5,0.34)), url('${img}')"></div><div><h3>${item.title}</h3><p>${item.excerpt || ""}</p><a class="btn btn-glass" href="#blog">Lesen</a></div></article>`;
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
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
        document.querySelector("[data-lightbox-art]").style.setProperty("--gallery-bg", `url('${item.dataset.galleryImage}')`);
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
    const tools = document.createElement("div");
    tools.innerHTML = `
      <button class="tool-button" style="right:18px;bottom:144px;width:48px;height:48px" type="button" data-theme-toggle>☾</button>
      <div class="search-panel glass" hidden data-search-panel><input type="search" placeholder="Suche..." data-search /><div data-search-results></div></div>
      <button class="tool-button" style="right:18px;bottom:204px;width:48px;height:48px" type="button" data-search-toggle>⌕</button>
      <button class="tool-button" style="right:18px;bottom:264px;width:48px;height:48px" type="button" data-lang>DE</button>`;
    document.body.appendChild(tools);
    document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => document.body.classList.toggle("light-mode"));
    document.querySelector("[data-search-toggle]")?.addEventListener("click", () => {
      const panel = document.querySelector("[data-search-panel]");
      panel.hidden = !panel.hidden;
    });
    document.querySelector("[data-search]")?.addEventListener("input", (event) => {
      const query = event.target.value.toLowerCase();
      const results = [
        ...data.products.map((p) => p.title),
        ...data.blog.map((p) => p.title),
        ...data.faqs.map((p) => p.question)
      ].filter((item) => item.toLowerCase().includes(query)).slice(0, 8);
      document.querySelector("[data-search-results]").innerHTML = results.map((item) => `<p>${item}</p>`).join("");
    });
    document.querySelector("[data-lang]")?.addEventListener("click", (event) => {
      event.currentTarget.textContent = event.currentTarget.textContent === "DE" ? "EN" : "DE";
    });
  }

  applyDesign();
  applyGlobalContent();
  renderProducts();
  renderDemoCards();
  renderGallery();
  renderAudio();
  renderConfigurator();
  renderReviews();
  renderFaq();
  renderBlog();
  bindInteractions();
  bindScrollAnimations();
  injectTools();
})();
