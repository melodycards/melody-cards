(async function () {
  const fallback = window.MELODY_DEFAULT_SITE || window.MELODY_DEMO_CONTENT;
  const data = await window.MelodySupabase.fetchContent().catch(() => fallback);
  const content = mergeContent(fallback.settings.content, data.settings?.content || {});

  function mergeContent(base, remote) {
    return {
      ...base,
      ...remote,
      seo: { ...base.seo, ...(remote.seo || {}) },
      brand: { ...base.brand, ...(remote.brand || {}) },
      theme: {
        ...base.theme,
        ...(remote.theme || {}),
        colors: { ...base.theme.colors, ...(remote.theme?.colors || {}) },
        typography: { ...base.theme.typography, ...(remote.theme?.typography || {}) },
        layout: { ...base.theme.layout, ...(remote.theme?.layout || {}) },
        motion: { ...base.theme.motion, ...(remote.theme?.motion || {}) }
      },
      contact: { ...base.contact, ...(remote.contact || {}) },
      footer: { ...base.footer, ...(remote.footer || {}) },
      legalPages: { ...base.legalPages, ...(remote.legalPages || {}) },
      orderForm: { ...base.orderForm, ...(remote.orderForm || {}) },
      translations: { ...base.translations, ...(remote.translations || {}) },
      languages: remote.languages || base.languages || []
    };
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const escape = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  const sorted = (items = []) => [...items].filter((item) => item && item.active !== false && item.status !== "inactive").sort((a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0));
  const availableLanguages = sorted(content.languages || [{ code: "de", label: "DE", active: true }, { code: "tr", label: "TR", active: true }]);
  const urlLanguage = new URLSearchParams(location.search).get("lang");
  const storedLanguage = localStorage.getItem("melodyLanguage");
  const currentLanguage = availableLanguages.some((language) => language.code === urlLanguage)
    ? urlLanguage
    : availableLanguages.some((language) => language.code === storedLanguage)
      ? storedLanguage
      : content.defaultLanguage || "de";
  const translation = content.translations?.[currentLanguage] || {};
  document.documentElement.lang = currentLanguage;

  function cssVar(name, value, suffix = "") {
    if (value !== undefined && value !== null && value !== "") document.documentElement.style.setProperty(name, `${value}${suffix}`);
  }

  function applyTheme() {
    const { colors, typography, layout, motion } = content.theme;
    Object.entries(colors || {}).forEach(([key, value]) => cssVar(`--${key}`, value));
    cssVar("--max-width", layout.maxWidth, "px");
    cssVar("--section-padding", layout.sectionPadding, "px");
    cssVar("--radius", layout.radius, "px");
    cssVar("--button-radius", layout.buttonRadius, "px");
    cssVar("--card-shadow", layout.cardShadow, "px");
    cssVar("--hero-size", typography.heroSize, "px");
    cssVar("--heading-size", typography.headingSize, "px");
    cssVar("--body-size", typography.bodySize, "px");
    cssVar("--weight-heading", typography.weightHeading);
    cssVar("--weight-body", typography.weightBody);
    document.documentElement.style.setProperty("--motion-duration", `${motion.enabled === false ? 0 : motion.duration || 650}ms`);
    const fonts = [typography.headingFont, typography.bodyFont].filter(Boolean);
    if (fonts.length) {
      const href = `https://fonts.googleapis.com/css2?${[...new Set(fonts)].map((font) => `family=${encodeURIComponent(font)}:wght@300;400;500;600;700;800`).join("&")}&display=swap`;
      let link = document.querySelector("[data-google-fonts]");
      if (!link) {
        link = document.createElement("link");
        link.rel = "stylesheet";
        link.dataset.googleFonts = "true";
        document.head.appendChild(link);
      }
      link.href = href;
      document.documentElement.style.setProperty("--heading-font", `"${typography.headingFont}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`);
      document.documentElement.style.setProperty("--body-font", `"${typography.bodyFont}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`);
    }
  }

  function applySeo() {
    const seo = { ...(content.seo || {}), ...(translation.seo || {}) };
    document.title = seo.title || content.brand.name || "Melody Cards";
    $('[data-seo-description]')?.setAttribute("content", seo.description || "");
    $('[data-og-title]')?.setAttribute("content", seo.ogTitle || document.title);
    $('[data-og-description]')?.setAttribute("content", seo.ogDescription || seo.description || "");
    if (seo.ogImage) $('[data-og-image]')?.setAttribute("content", seo.ogImage);
    const favicon = seo.favicon || content.brand.favicon || "";
    if (favicon) $('[data-favicon]')?.setAttribute("href", favicon);
  }

  function renderBrand() {
    const brand = { ...content.brand, ...(translation.brand || {}) };
    const logo = brand.logoImage
      ? `<img src="${escape(brand.logoImage)}" alt="${escape(brand.name)}" />`
      : `<span>${escape(content.brand.logoText || "MC")}</span>`;
    $("[data-brand]").innerHTML = `${logo}<strong>${escape(brand.name || "Melody Cards")}</strong>`;
    $("[data-loader] span").textContent = brand.name || "Melody Cards";
  }

  function renderNavigation() {
    const nav = $("[data-nav]");
    nav.innerHTML = sorted(translation.navigation || content.navigation).map((item) => `<a class="${item.style === "primary" ? "nav-primary" : ""}" href="${escape(item.href)}">${escape(item.label)}</a>`).join("");
  }

  function renderLanguageSwitcher() {
    const switcher = $("[data-language-switcher]");
    if (!switcher) return;
    switcher.innerHTML = availableLanguages.map((language) => `<button class="lang-btn ${language.code === currentLanguage ? "is-active" : ""}" type="button" data-language="${escape(language.code)}">${escape(language.label || language.code.toUpperCase())}</button>`).join("");
    switcher.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextLanguage = button.dataset.language;
        localStorage.setItem("melodyLanguage", nextLanguage);
        const url = new URL(location.href);
        url.searchParams.set("lang", nextLanguage);
        location.href = url.toString();
      });
    });
  }

  const imageStyle = (url) => url ? `style="--image:url('${escape(url)}')"` : "";

  function localizedSection(section) {
    const local = translation.sections?.[section.id] || {};
    return {
      ...section,
      ...local,
      primaryButton: { ...(section.primaryButton || {}), ...(local.primaryButton || {}) },
      secondaryButton: { ...(section.secondaryButton || {}), ...(local.secondaryButton || {}) },
      items: Array.isArray(local.items)
        ? local.items.map((item, index) => ({ ...(section.items?.[index] || {}), ...item }))
        : section.items
    };
  }

  function localizedItem(bucket, item) {
    return { ...item, ...(translation[bucket]?.[item.id] || {}) };
  }

  function orderCopy() {
    return { ...(content.orderForm || {}), ...(translation.orderForm || {}) };
  }

  function hero(section) {
    return `<section class="hero section-reveal" id="${escape(section.id)}" ${imageStyle(section.image)}>
      <div class="hero-overlay"></div>
      <div class="hero-inner">
        <p class="eyebrow">${escape(section.eyebrow)}</p>
        <h1>${escape(section.title)}</h1>
        <p>${escape(section.subtitle || section.text)}</p>
        <div class="hero-actions">
          ${section.primaryButton?.label ? `<a class="btn btn-primary" href="${escape(section.primaryButton.href || "#order")}">${escape(section.primaryButton.label)}</a>` : ""}
          ${section.secondaryButton?.label ? `<a class="btn btn-secondary" href="${escape(section.secondaryButton.href || "#process")}">${escape(section.secondaryButton.label)}</a>` : ""}
        </div>
      </div>
    </section>`;
  }

  function editorial(section) {
    return `<section class="section editorial section-reveal" id="${escape(section.id)}">
      <div class="section-copy"><p class="eyebrow">${escape(section.eyebrow)}</p><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></div>
      <div class="editorial-image" ${imageStyle(section.image)}></div>
    </section>`;
  }

  function steps(section) {
    return `<section class="section section-reveal" id="${escape(section.id)}">
      ${sectionHead(section)}
      <div class="step-grid">${(section.items || []).map((item, index) => `<article class="lux-card"><span>${String(index + 1).padStart(2, "0")}</span><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></article>`).join("")}</div>
    </section>`;
  }

  function products(section) {
    const copy = orderCopy();
    return `<section class="section section-reveal" id="${escape(section.id)}">
      ${sectionHead(section)}
      <div class="product-grid">${sorted(content.products).map((product) => productCard(localizedItem("products", product))).join("") || emptyState(copy.emptyProducts || "Noch keine Produkte veröffentlicht.")}</div>
    </section>`;
  }

  function productCard(product) {
    const image = product.images?.[0] || product.image_url || "";
    const copy = orderCopy();
    return `<article class="product-card lux-card">
      <div class="product-image" ${imageStyle(image)}></div>
      <div><p class="eyebrow">${escape(product.category || "Geburtstag")}</p><h3>${escape(product.title)}</h3><p>${escape(product.description)}</p></div>
      <div class="product-meta">
        ${product.price ? `<strong>${escape(product.price)}</strong>` : ""}
        ${product.discount ? `<span>${escape(product.discount)}</span>` : ""}
      </div>
      <a class="btn btn-primary" href="#order" data-order-product="${escape(product.title)}">${escape(copy.requestButton || "Anfragen")}</a>
    </article>`;
  }

  function gallery(section) {
    const copy = orderCopy();
    return `<section class="section section-reveal" id="${escape(section.id)}">
      ${sectionHead(section)}
      <div class="gallery-grid">${sorted(content.gallery).map((entry) => {
        const item = localizedItem("gallery", entry);
        return `<button class="gallery-item" type="button" data-lightbox-open data-title="${escape(item.title)}" data-text="${escape(item.alt || item.description || "")}" data-image="${escape(item.url || item.image_url || "")}"><img src="${escape(item.url || item.image_url || "")}" alt="${escape(item.alt || item.title || "")}" /><span>${escape(item.title || "")}</span></button>`;
      }).join("") || emptyState(copy.emptyGallery || "Noch keine Galerie veröffentlicht.")}</div>
    </section>`;
  }

  function reviews(section) {
    const items = sorted(content.reviews).map((item) => localizedItem("reviews", item));
    if (!items.length) return "";
    return `<section class="section section-reveal" id="${escape(section.id)}">${sectionHead(section)}<div class="review-grid">${items.map((review) => `<article class="lux-card review"><div class="stars">${"★".repeat(Number(review.rating || 5))}</div><p>${escape(review.text)}</p><strong>${escape(review.name)}</strong></article>`).join("")}</div></section>`;
  }

  function faq(section) {
    return `<section class="section section-reveal" id="${escape(section.id)}">${sectionHead(section)}<div class="faq-list">${sorted(content.faqs).map((entry, index) => {
      const item = localizedItem("faqs", entry);
      return `<details ${index === 0 ? "open" : ""}><summary>${escape(item.question)}</summary><p>${escape(item.answer)}</p></details>`;
    }).join("")}</div></section>`;
  }

  function about(section) {
    return `<section class="section editorial section-reveal" id="${escape(section.id)}"><div class="section-copy"><p class="eyebrow">${escape(section.eyebrow)}</p><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></div><div class="editorial-image portrait" ${imageStyle(section.image)}></div></section>`;
  }

  function order(section) {
    const copy = orderCopy();
    const productOptions = sorted(content.products).map((product) => localizedItem("products", product)).map((product) => `<option>${escape(product.title)}</option>`).join("");
    const optionList = (options = []) => options.map((option) => `<option value="${escape(option)}">${escape(option)}</option>`).join("");
    return `<section class="section order-section section-reveal" id="${escape(section.id)}">
      ${sectionHead(section)}
      <form class="order-form lux-card" id="premium-order-form">
        <label>${escape(copy.productLabel)}<select name="product">${productOptions || `<option>${escape(copy.productFallback || "Geburtstagskarte")}</option>`}</select></label>
        <label>${escape(copy.recipientLabel)}<input name="recipient" required placeholder="${escape(copy.recipientPlaceholder || "")}" /></label>
        <label>${escape(copy.nameLabel)}<input name="name" required /></label>
        <label>${escape(copy.emailLabel)}<input name="email" type="email" required /></label>
        <label>${escape(copy.phoneLabel)}<input name="phone" type="tel" /></label>
        <label>${escape(copy.songLanguageLabel)}<select name="song_language" required><option value="">${escape(copy.selectPlaceholder || "Bitte auswählen")}</option>${optionList(copy.songLanguageOptions)}</select></label>
        <label>${escape(copy.voiceLabel)}<select name="voice" required><option value="">${escape(copy.selectPlaceholder || "Bitte auswählen")}</option>${optionList(copy.voiceOptions)}</select></label>
        <label>${escape(copy.musicStyleLabel)}<select name="music_style" required><option value="">${escape(copy.selectPlaceholder || "Bitte auswählen")}</option>${optionList(copy.musicStyleOptions)}</select></label>
        <label class="span-all">${escape(copy.messageLabel)}<textarea name="message" rows="5" placeholder="${escape(copy.messagePlaceholder || "")}"></textarea></label>
        <button class="btn btn-primary" type="submit">${escape(copy.submitLabel)}</button>
        <p class="form-status" id="premium-order-status" role="status" aria-live="polite"></p>
      </form>
    </section>`;
  }

  function contact(section) {
    const contact = { ...(content.contact || {}), ...(translation.contact || {}) };
    return `<section class="section contact-section section-reveal" id="${escape(section.id)}">${sectionHead(section)}<div class="contact-panel lux-card">
      ${contact.email ? `<a href="mailto:${escape(contact.email)}">${escape(contact.email)}</a>` : ""}
      ${contact.phone ? `<a href="tel:${escape(contact.phone)}">${escape(contact.phone)}</a>` : ""}
      ${contact.address ? `<p>${escape(contact.address)}</p>` : ""}
    </div></section>`;
  }

  function sectionHead(section) {
    return `<div class="section-head"><p class="eyebrow">${escape(section.eyebrow || "")}</p><h2>${escape(section.title || "")}</h2>${section.text ? `<p>${escape(section.text)}</p>` : ""}</div>`;
  }

  function emptyState(text) {
    return `<div class="empty-state">${escape(text)}</div>`;
  }

  const renderers = { hero, editorial, steps, products, gallery, reviews, faq, about, order, contact };

  function renderSections() {
    $("[data-site-root]").innerHTML = sorted(content.sections).map((section) => localizedSection(section)).map((section) => renderers[section.type]?.(section) || "").join("");
  }

  function renderFooter() {
    const brand = { ...content.brand, ...(translation.brand || {}) };
    const footer = { ...content.footer, ...(translation.footer || {}) };
    const socials = [
      ["Instagram", content.contact.instagram],
      ["TikTok", content.contact.tiktok],
      ["YouTube", content.contact.youtube]
    ].filter(([, href]) => href);
    $("[data-footer]").innerHTML = `<div><strong>${escape(brand.name)}</strong><p>${escape(brand.footerText || "")}</p></div><nav>${(footer.links || []).map((link) => `<a href="${escape(link.href)}">${escape(link.label)}</a>`).join("")}</nav><nav>${socials.map(([label, href]) => `<a href="${escape(href)}" target="_blank" rel="noreferrer">${escape(label)}</a>`).join("")}</nav>`;
  }

  function bindInteractions() {
    const nav = $("[data-nav]");
    $("[data-nav-toggle]")?.addEventListener("click", (event) => {
      const open = nav.classList.toggle("is-open");
      event.currentTarget.setAttribute("aria-expanded", String(open));
    });
    nav?.addEventListener("click", () => nav.classList.remove("is-open"));
    $("[data-back-top]")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-lightbox-open]");
      if (opener) openLightbox(opener);
      if (event.target.matches("[data-lightbox-close]")) closeLightbox();
      const product = event.target.closest("[data-order-product]")?.dataset.orderProduct;
      if (product) setTimeout(() => {
        const select = $("#premium-order-form select[name='product']");
        if (select) select.value = product;
      }, 20);
    });
    $("#premium-order-form")?.addEventListener("submit", submitOrder);
    reveal();
  }

  function openLightbox(opener) {
    const box = $("[data-lightbox]");
    $("[data-lightbox-image]").src = opener.dataset.image || "";
    $("[data-lightbox-title]").textContent = opener.dataset.title || "";
    $("[data-lightbox-text]").textContent = opener.dataset.text || "";
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    const box = $("[data-lightbox]");
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
  }

  async function submitOrder(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = $("#premium-order-status");
    const submit = form.querySelector("button[type='submit']");
    const values = Object.fromEntries(new FormData(form));
    const copy = orderCopy();
    status.textContent = copy.sending || "Anfrage wird gesendet...";
    submit.disabled = true;
    try {
      await window.MelodySupabase.createPremiumOrder({
        name: values.name,
        email: values.email,
        phone: values.phone || "",
        address: "",
        card_text: `${copy.cardTextProduct || "Geburtstagskarte"}: ${values.product}\n${copy.cardTextRecipient || "Beschenkte Person"}: ${values.recipient}`,
        music_wish: JSON.stringify({
          song_language: values.song_language,
          voice: values.voice,
          music_style: values.music_style,
          labels: {
            song_language: copy.musicWishLanguage || "Sprache des Liedes",
            voice: copy.musicWishVoice || "Stimme",
            music_style: copy.musicWishStyle || "Musikrichtung"
          }
        }),
        message: values.message || "",
        status: "new"
      });
      form.reset();
      status.textContent = copy.success || "Danke. Deine Anfrage wurde gesendet.";
    } catch (error) {
      console.error("Order submit failed:", error);
      status.textContent = error.message || copy.error || "Die Anfrage konnte nicht gespeichert werden.";
    } finally {
      submit.disabled = false;
    }
  }

  function reveal() {
    document.querySelectorAll(".section-reveal").forEach((node) => node.classList.add("is-visible"));
    if (content.theme.motion?.enabled === false) return;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    }), { threshold: 0.12 });
    document.querySelectorAll(".section-reveal, .lux-card").forEach((node) => observer.observe(node));
    window.addEventListener("scroll", () => {
      $("[data-header]")?.classList.toggle("is-scrolled", window.scrollY > 40);
      $("[data-back-top]")?.classList.toggle("is-visible", window.scrollY > 700);
    });
  }

  applyTheme();
  applySeo();
  renderBrand();
  renderNavigation();
  renderLanguageSwitcher();
  renderSections();
  renderFooter();
  bindInteractions();
  setTimeout(() => $("[data-loader]")?.classList.add("is-hidden"), 250);
})();
