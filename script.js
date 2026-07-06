(async function () {
  const fallback = window.MELODY_DEFAULT_SITE || window.MELODY_DEMO_CONTENT;
  const data = await window.MelodySupabase.fetchContent().catch(() => fallback);
  const previewContent = new URLSearchParams(location.search).has("admin-preview") ? readPreviewContent() : null;
  const content = sanitizePublicContent(mergeContent(fallback.settings.content, previewContent || data.settings?.content || {}));

  function readPreviewContent() {
    try {
      return JSON.parse(localStorage.getItem("melodyPreviewContent") || "null");
    } catch {
      return null;
    }
  }

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
      translations: mergeTranslations(base.translations || {}, remote.translations || {}),
      languages: remote.languages || base.languages || []
    };
  }

  function mergeTranslations(base = {}, remote = {}) {
    const result = { ...base, ...remote };
    Object.keys(result).forEach((language) => {
      const baseLanguage = base[language] || {};
      const remoteLanguage = remote[language] || {};
      result[language] = {
        ...baseLanguage,
        ...remoteLanguage,
        seo: { ...(baseLanguage.seo || {}), ...(remoteLanguage.seo || {}) },
        brand: { ...(baseLanguage.brand || {}), ...(remoteLanguage.brand || {}) },
        sections: { ...(baseLanguage.sections || {}), ...(remoteLanguage.sections || {}) },
        products: { ...(baseLanguage.products || {}), ...(remoteLanguage.products || {}) },
        categories: { ...(baseLanguage.categories || {}), ...(remoteLanguage.categories || {}) },
        gallery: { ...(baseLanguage.gallery || {}), ...(remoteLanguage.gallery || {}) },
        reviews: { ...(baseLanguage.reviews || {}), ...(remoteLanguage.reviews || {}) },
        faqs: { ...(baseLanguage.faqs || {}), ...(remoteLanguage.faqs || {}) },
        contact: { ...(baseLanguage.contact || {}), ...(remoteLanguage.contact || {}) },
        legalPages: { ...(baseLanguage.legalPages || {}), ...(remoteLanguage.legalPages || {}) },
        orderForm: { ...(baseLanguage.orderForm || {}), ...(remoteLanguage.orderForm || {}) },
        footer: {
          ...(baseLanguage.footer || {}),
          ...(remoteLanguage.footer || {}),
          links: remoteLanguage.footer?.links || baseLanguage.footer?.links || []
        },
        navigation: remoteLanguage.navigation || baseLanguage.navigation || []
      };
    });
    return result;
  }

  function sanitizePublicContent(content) {
    const replacements = {
      products: "Entdecke hochwertige Geburtstagskarten mit persönlichem QR-Code und einem Lied, das nur für diesen besonderen Menschen gestaltet wird.",
      gallery: "Inspirationen für besondere Geburtstagsmomente.",
      reviews: "Persönliche Geschenke leben von echten Momenten. Hier teilen Kundinnen und Kunden ihre Erfahrungen mit Melody Cards.",
      faq: "Hier findest du Antworten zu Bestellung, Ablauf, Lieferung und persönlichem Lied.",
      about: "Melody Cards verbindet hochwertige Karten mit persönlicher Musik und macht aus einem Geschenk eine bleibende Erinnerung."
    };
    const trReplacements = {
      products: "Kişisel QR kodu ve yalnızca o özel kişi için hazırlanan şarkıyla tasarlanan yüksek kaliteli doğum günü kartlarını keşfet.",
      gallery: "Özel doğum günü anları için ilhamlar.",
      reviews: "Kişisel hediyeler gerçek anlardan beslenir. Melody Cards deneyimlerini burada okuyabilirsin.",
      faq: "Sipariş, süreç, teslimat ve kişisel şarkı hakkında yanıtları burada bulabilirsin.",
      about: "Melody Cards, yüksek kaliteli kartları kişisel müzikle birleştirir ve hediyeyi kalıcı bir anıya dönüştürür."
    };
    const isInternal = (value = "") => /admin|cms|demo|platzhalter|beispielinhalt|bearbeit|verwalten|später ändern|sonra düzen|yönetebilirsin|değiştirilebilir/i.test(String(value));
    content.sections = (content.sections || []).map((section) => isInternal(section.text) && replacements[section.id] ? { ...section, text: replacements[section.id] } : section);
    if (content.translations?.tr?.sections) {
      Object.entries(content.translations.tr.sections).forEach(([id, section]) => {
        if (isInternal(section?.text) && trReplacements[id]) section.text = trReplacements[id];
      });
    }
    return content;
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
    $("[data-header]")?.setAttribute("data-edit-kind", "navigation");
    $("[data-header]")?.setAttribute("data-edit-id", "navigation");
    $("[data-nav-toggle]")?.setAttribute("data-edit-kind", "navigation");
    $("[data-nav-toggle]")?.setAttribute("data-edit-id", "navigation");
    const logo = brand.logoImage
      ? `<img src="${escape(brand.logoImage)}" alt="${escape(brand.name)}" />`
      : `<span>${escape(content.brand.logoText || "MC")}</span>`;
    const brandNode = $("[data-brand]");
    brandNode.setAttribute("data-edit-kind", "brand");
    brandNode.setAttribute("data-edit-id", "brand");
    brandNode.innerHTML = `${logo}<strong>${escape(brand.name || "Melody Cards")}</strong>`;
    $("[data-loader] span").textContent = brand.name || "Melody Cards";
  }

  function renderNavigation() {
    const nav = $("[data-nav]");
    nav.setAttribute("data-edit-kind", "navigation");
    nav.setAttribute("data-edit-id", "navigation");
    nav.innerHTML = sorted(translation.navigation || content.navigation).map((item, index) => `<a class="${item.style === "primary" ? "nav-primary" : ""}" href="${escape(item.href)}" data-edit-kind="nav-item" data-edit-id="${index}">${escape(item.label)}</a>`).join("");
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

  function imageStyle(url, section = {}) {
    const values = [];
    if (url) values.push(`--image:url('${escape(url)}')`);
    if (section.style?.textColor) values.push(`--hero-text-color:${escape(section.style.textColor)}`);
    if (section.style?.titleSize) values.push(`--hero-title-size:${Number(section.style.titleSize)}px`);
    if (section.style?.mobileTitleSize) values.push(`--hero-mobile-title-size:${Number(section.style.mobileTitleSize)}px`);
    if (section.style?.overlayOpacity !== "" && section.style?.overlayOpacity !== undefined) values.push(`--hero-overlay-opacity:${Number(section.style.overlayOpacity)}`);
    if (section.style?.paddingTop) values.push(`--hero-padding-top:${Number(section.style.paddingTop)}px`);
    if (section.style?.paddingBottom) values.push(`--hero-padding-bottom:${Number(section.style.paddingBottom)}px`);
    return values.length ? `style="${values.join(";")}"` : "";
  }

  function mediaUrl(item = {}) {
    return item.url || item.media || item.video || item.image_url || item.image || item.images?.[0] || "";
  }

  function isVideo(url = "", type = "") {
    return String(type).startsWith("video") || /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(url));
  }

  function mediaFrame(item = {}, className = "media-frame", alt = "") {
    const url = mediaUrl(item);
    const type = item.mediaType || item.type || "";
    if (!url) return `<div class="${escape(className)}"></div>`;
    if (isVideo(url, type)) {
      return `<div class="${escape(className)} has-video"><video src="${escape(url)}" muted loop playsinline preload="metadata" poster="${escape(item.poster || item.image || "")}"></video></div>`;
    }
    return `<div class="${escape(className)}" ${imageStyle(url)} role="img" aria-label="${escape(alt || item.alt || item.title || "")}"></div>`;
  }

  function mediaThumb(item = {}, alt = "") {
    const url = mediaUrl(item);
    const type = item.mediaType || item.type || "";
    if (!url) return "";
    if (isVideo(url, type)) {
      return `<video src="${escape(url)}" muted loop playsinline preload="metadata" poster="${escape(item.poster || item.image || "")}"></video>`;
    }
    return `<img src="${escape(url)}" alt="${escape(alt || item.alt || item.title || "")}" loading="lazy" />`;
  }

  function itemStyle(item = {}) {
    const style = item.style || {};
    const values = [];
    if (style.color) values.push(`--item-color:${escape(style.color)}`);
    if (style.numberColor) values.push(`--item-number-color:${escape(style.numberColor)}`);
    if (style.fontSize) values.push(`--item-font-size:${Number(style.fontSize)}px`);
    if (style.fontWeight) values.push(`--item-font-weight:${Number(style.fontWeight)}`);
    if (style.paddingTop) values.push(`--item-padding-top:${Number(style.paddingTop)}px`);
    if (style.paddingBottom) values.push(`--item-padding-bottom:${Number(style.paddingBottom)}px`);
    return values.length ? `style="${values.join(";")}"` : "";
  }

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

  function localizedCategory(category) {
    return { ...category, ...(translation.categories?.[category.id] || {}) };
  }

  function orderCopy() {
    return { ...(content.orderForm || {}), ...(translation.orderForm || {}) };
  }

  function hero(section) {
    return `<section class="hero section-reveal align-${escape(section.align || "left")}" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}" ${imageStyle(section.image, section)}>
      ${section.video ? `<video class="hero-video" src="${escape(section.video)}" autoplay muted loop playsinline preload="metadata" poster="${escape(section.image || "")}"></video>` : ""}
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
    return `<section class="section editorial section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">
      <div class="section-copy"><p class="eyebrow">${escape(section.eyebrow)}</p><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></div>
      ${mediaFrame(section, "editorial-image", section.title)}
    </section>`;
  }

  function steps(section) {
    return `<section class="section section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">
      ${sectionHead(section)}
      <div class="step-grid">${(section.items || []).map((item, index) => ({ item, index })).filter(({ item }) => item.active !== false).map(({ item, index }) => `<article class="lux-card align-${escape(item.align || "left")}" data-edit-kind="step-item" data-edit-id="${escape(`${section.id}:${index}`)}" ${itemStyle(item)}>${item.media ? mediaFrame(item, "step-media", item.title) : ""}<span>${escape(item.number || String(index + 1).padStart(2, "0"))}</span><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></article>`).join("")}</div>
    </section>`;
  }

  function products(section) {
    const copy = orderCopy();
    const categories = sorted(content.categories || []).map(localizedCategory);
    return `<section class="section section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">
      ${sectionHead(section)}
      <div class="category-grid">${categories.map(categoryCard).join("")}</div>
      <div class="product-grid">${sorted(content.products).map((product) => productCard(localizedItem("products", product))).join("") || emptyState(copy.emptyProducts || "Noch keine Produkte veröffentlicht.")}</div>
    </section>`;
  }

  function categoryCard(category) {
    return `<article class="category-card lux-card" data-edit-kind="category" data-edit-id="${escape(category.id)}">
      ${mediaFrame(category, "category-image", category.title)}
      <div><h3>${escape(category.title)}</h3><p>${escape(category.description || "")}</p></div>
      <a class="btn btn-secondary" href="#order" data-order-category="${escape(category.id)}">${escape(orderCopy().requestButton || "Anfragen")}</a>
    </article>`;
  }

  function productCard(product) {
    const image = product.images?.[0] || product.image_url || "";
    const copy = orderCopy();
    return `<article class="product-card lux-card" data-edit-kind="product" data-edit-id="${escape(product.id)}">
      ${mediaFrame({ ...product, image }, "product-image", product.title)}
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
    return `<section class="section section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">
      ${sectionHead(section)}
      <div class="gallery-grid">${sorted(content.gallery).map((entry) => {
        const item = localizedItem("gallery", entry);
        const url = mediaUrl(item);
        const type = item.mediaType || item.type || "";
        return `<button class="gallery-item" type="button" data-edit-kind="gallery" data-edit-id="${escape(item.id)}" data-lightbox-open data-title="${escape(item.title)}" data-text="${escape(item.alt || item.description || "")}" data-image="${escape(url)}" data-media-type="${escape(isVideo(url, type) ? "video" : "image")}">${mediaThumb(item, item.title)}<span>${escape(item.title || "")}</span></button>`;
      }).join("") || emptyState(copy.emptyGallery || "Noch keine Galerie veröffentlicht.")}</div>
    </section>`;
  }

  function mediaSection(section) {
    return `<section class="section section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">
      ${sectionHead(section)}
      <div class="gallery-grid">${(section.items || []).filter((item) => item.active !== false).map((item, index) => `<button class="gallery-item" type="button" data-edit-kind="media-item" data-edit-id="${escape(`${section.id}:${index}`)}" data-lightbox-open data-title="${escape(item.title || section.title || "")}" data-text="${escape(item.alt || item.description || "")}" data-image="${escape(mediaUrl(item))}" data-media-type="${escape(isVideo(mediaUrl(item), item.mediaType || item.type) ? "video" : "image")}">${mediaThumb(item, item.title)}<span>${escape(item.title || "")}</span></button>`).join("")}</div>
    </section>`;
  }

  function reviews(section) {
    const items = sorted(content.reviews).map((item) => localizedItem("reviews", item));
    if (!items.length) return "";
    return `<section class="section section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">${sectionHead(section)}<div class="review-grid">${items.map((review) => `<article class="lux-card review" data-edit-kind="review" data-edit-id="${escape(review.id)}"><div class="stars">${"★".repeat(Number(review.rating || 5))}</div><p>${escape(review.text)}</p><strong>${escape(review.name)}</strong></article>`).join("")}</div></section>`;
  }

  function faq(section) {
    return `<section class="section section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">${sectionHead(section)}<div class="faq-list">${sorted(content.faqs).map((entry, index) => {
      const item = localizedItem("faqs", entry);
      return `<details data-edit-kind="faq" data-edit-id="${escape(item.id)}" ${index === 0 ? "open" : ""}><summary>${escape(item.question)}</summary><p>${escape(item.answer)}</p></details>`;
    }).join("")}</div></section>`;
  }

  function about(section) {
    return `<section class="section editorial section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}"><div class="section-copy"><p class="eyebrow">${escape(section.eyebrow)}</p><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></div>${mediaFrame(section, "editorial-image portrait", section.title)}</section>`;
  }

  function order(section) {
    const copy = orderCopy();
    const optionList = (options = []) => options.map((option) => `<option value="${escape(option)}">${escape(option)}</option>`).join("");
    const categories = sorted(content.categories || []).map(localizedCategory);
    const categoryOptions = categories.map((category) => `<option value="${escape(category.id)}" data-description="${escape(category.description || "")}">${escape(category.title)}</option>`).join("");
    const firstCategory = categories[0] || {};
    return `<section class="section order-section section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">
      ${sectionHead(section)}
      <form class="order-form lux-card" id="premium-order-form">
        <label class="span-all">${escape(copy.categoryLabel || "Kartentyp")}<select name="card_category" required>${categoryOptions}</select><small class="order-category-help" data-category-help>${escape(firstCategory.description || copy.categoryHelp || "")}</small></label>
        <label>${escape(copy.recipientLabel)}<input name="recipient" required placeholder="${escape(copy.recipientPlaceholder || "")}" /></label>
        <label>${escape(copy.occasionLabel || "Anlass")}<input name="occasion" required placeholder="${escape(copy.occasionPlaceholder || "")}" /></label>
        <label>${escape(copy.nameLabel)}<input name="name" required /></label>
        <label>${escape(copy.emailLabel)}<input name="email" type="email" required /></label>
        <label>${escape(copy.phoneLabel)}<input name="phone" type="tel" /></label>
        <label>${escape(copy.songLanguageLabel)}<select name="song_language" required><option value="">${escape(copy.selectPlaceholder || "Bitte auswählen")}</option>${optionList(copy.songLanguageOptions)}</select></label>
        <label>${escape(copy.voiceLabel)}<select name="voice" required><option value="">${escape(copy.selectPlaceholder || "Bitte auswählen")}</option>${optionList(copy.voiceOptions)}</select></label>
        <label>${escape(copy.musicStyleLabel)}<select name="music_style" required><option value="">${escape(copy.selectPlaceholder || "Bitte auswählen")}</option>${optionList(copy.musicStyleOptions)}</select></label>
        <label class="span-all">${escape(copy.storyLabel || copy.messageLabel)}<textarea name="message" rows="5" required placeholder="${escape(copy.storyPlaceholder || copy.messagePlaceholder || "")}"></textarea></label>
        <button class="btn btn-primary" type="submit">${escape(copy.submitLabel)}</button>
        <p class="form-status" id="premium-order-status" role="status" aria-live="polite"></p>
      </form>
    </section>`;
  }

  function contact(section) {
    const contact = { ...(content.contact || {}), ...(translation.contact || {}) };
    return `<section class="section contact-section section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">${sectionHead(section)}<div class="contact-panel lux-card">
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

  const renderers = { hero, editorial, steps, products, gallery, media: mediaSection, reviews, faq, about, order, contact };

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
    $("[data-footer]").setAttribute("data-edit-kind", "footer");
    $("[data-footer]").setAttribute("data-edit-id", "footer");
    $("[data-footer]").innerHTML = `<div><strong>${escape(brand.name)}</strong><p>${escape(brand.footerText || "")}</p></div><nav>${(footer.links || []).map((link, index) => `<a href="${escape(link.href)}" data-edit-kind="footer-link" data-edit-id="${index}">${escape(link.label)}</a>`).join("")}</nav><nav>${socials.map(([label, href]) => `<a href="${escape(href)}" target="_blank" rel="noreferrer">${escape(label)}</a>`).join("")}</nav>`;
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
        const input = $("#premium-order-form input[name='occasion']");
        if (input) input.value = product;
      }, 20);
      const category = event.target.closest("[data-order-category]")?.dataset.orderCategory;
      if (category) setTimeout(() => {
        const select = $("#premium-order-form select[name='card_category']");
        if (select) {
          select.value = category;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, 20);
    });
    $("#premium-order-form select[name='card_category']")?.addEventListener("change", updateOrderCategoryHelp);
    $("#premium-order-form")?.addEventListener("submit", submitOrder);
    reveal();
  }

  function updateOrderCategoryHelp(event) {
    const help = $("[data-category-help]");
    const selected = event.currentTarget.selectedOptions?.[0];
    if (help) help.textContent = selected?.dataset.description || "";
  }

  function openLightbox(opener) {
    const box = $("[data-lightbox]");
    const image = $("[data-lightbox-image]");
    let video = $("[data-lightbox-video]");
    if (!video) {
      video = document.createElement("video");
      video.dataset.lightboxVideo = "true";
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      image.after(video);
    }
    const isLightboxVideo = opener.dataset.mediaType === "video";
    image.hidden = isLightboxVideo;
    video.hidden = !isLightboxVideo;
    image.src = isLightboxVideo ? "" : opener.dataset.image || "";
    video.src = isLightboxVideo ? opener.dataset.image || "" : "";
    $("[data-lightbox-title]").textContent = opener.dataset.title || "";
    $("[data-lightbox-text]").textContent = opener.dataset.text || "";
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    const box = $("[data-lightbox]");
    const video = $("[data-lightbox-video]");
    if (video) {
      video.pause();
      video.removeAttribute("src");
    }
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
        card_text: `${copy.cardTextCategory || "Kartentyp"}: ${values.card_category}\n${copy.cardTextRecipient || "Beschenkte Person"}: ${values.recipient}\n${copy.cardTextOccasion || "Anlass"}: ${values.occasion}`,
        music_wish: JSON.stringify({
          card_category: values.card_category,
          occasion: values.occasion,
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
