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
      orderForm: mergeOrderForm(base.orderForm || {}, remote.orderForm || {}, "de"),
      translations: mergeTranslations(base.translations || {}, remote.translations || {}),
      languages: remote.languages || base.languages || [],
      categories: mergeCollectionById(base.categories || [], remote.categories || [])
    };
  }

  function mergeCollectionById(baseItems = [], remoteItems = []) {
    const byId = new Map();
    [...baseItems, ...remoteItems].forEach((item) => {
      if (!item?.id) return;
      byId.set(String(item.id), { ...(byId.get(String(item.id)) || {}), ...item });
    });
    return Array.from(byId.values()).sort((a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0));
  }

  function mergeOrderForm(baseOrder = {}, remoteOrder = {}, language = "de") {
    const merged = {
      ...baseOrder,
      ...remoteOrder,
      configurator: mergeConfigurator(baseOrder.configurator || {}, remoteOrder.configurator || {}, language),
      coverTemplates: {
        ...(baseOrder.coverTemplates || {}),
        ...(remoteOrder.coverTemplates || {})
      },
      categoryFields: {
        ...(baseOrder.categoryFields || {}),
        ...(remoteOrder.categoryFields || {})
      }
    };
    if (language === "tr") {
      const defaults = window.MELODY_LANGUAGE_PACK?.tr?.orderForm || {};
      const legacy = window.MELODY_LANGUAGE_PACK?.tr?.legacyOrderOptions || {};
      if ((merged.selectPlaceholder || "").includes("seç") && merged.selectPlaceholder !== defaults.selectPlaceholder) merged.selectPlaceholder = defaults.selectPlaceholder;
      if ((merged.voiceOptions || []).some((option) => (legacy.voiceOptions || []).includes(option))) merged.voiceOptions = defaults.voiceOptions || merged.voiceOptions;
      if ((merged.songLanguageOptions || []).some((option) => (legacy.songLanguageOptions || []).includes(option))) merged.songLanguageOptions = defaults.songLanguageOptions || merged.songLanguageOptions;
      if ((merged.musicStyleOptions || []).some((option) => (legacy.musicStyleOptions || []).includes(option))) merged.musicStyleOptions = defaults.musicStyleOptions || merged.musicStyleOptions;
    }
    const defaults = window.MELODY_LANGUAGE_PACK?.[language]?.orderForm || baseOrder;
    const staleMessageLabels = ["Wünsche zur Karte", "Kartenvorgaben", "Kartenwünsche"];
    if (staleMessageLabels.includes(merged.messageLabel || "")) merged.messageLabel = defaults.messageLabel || "Nachricht";
    return normalizeOrderForm(merged, defaults);
  }

  function normalizeOrderForm(order = {}, defaults = {}) {
    const normalized = { ...order };
    const staleSubmitLabels = ["Anfrage senden", "Talep gönder", "Geburtstagskarte anfragen", "Doğum günü kartı talep et"];
    const staleRequestLabels = ["Anfragen", "Talep et", "Geburtstagskarte anfragen", "Doğum günü kartı talep et"];
    if (!normalized.submitLabel || staleSubmitLabels.includes(normalized.submitLabel) || /Geburtstagskarte|Doğum günü kartı/i.test(normalized.submitLabel)) {
      normalized.submitLabel = defaults.submitLabel || normalized.submitLabel;
    }
    if (!normalized.requestButton || staleRequestLabels.includes(normalized.requestButton) || /Geburtstagskarte|Doğum günü kartı/i.test(normalized.requestButton)) {
      normalized.requestButton = defaults.requestButton || normalized.requestButton;
    }
    normalized.categoryFields = normalizeCategoryFields(normalized.categoryFields || {}, defaults.categoryFields || {});
    return normalized;
  }

  function normalizeCategoryFields(fields = {}, defaults = {}) {
    const result = { ...fields };
    ["birthday", "apology", "valentine", "mothers_day", "fathers_day"].forEach((categoryId) => {
      const source = Array.isArray(result[categoryId]) ? result[categoryId] : defaults[categoryId] || [];
      result[categoryId] = source
        .filter((field) => field?.name !== "occasion")
        .map((field) => {
          if (categoryId !== "apology" || field?.name !== "apology_for") return field;
          return { ...field, ...(defaults.apology || []).find((item) => item.name === "apology_for") };
        });
    });
    return result;
  }

  function mergeConfigurator(baseConfigurator = {}, remoteConfigurator = {}, language = "de") {
    const defaults = window.MELODY_LANGUAGE_PACK?.[language]?.orderForm?.configurator || baseConfigurator;
    const merged = {
      ...baseConfigurator,
      ...remoteConfigurator,
      storyPlaceholders: {
        ...(baseConfigurator.storyPlaceholders || {}),
        ...(remoteConfigurator.storyPlaceholders || {})
      }
    };
    const staleStoryLabels = ["Persönliche Geschichte / Infos", "Kişisel hikaye / bilgiler", "Wünsche zur Karte"];
    if (!merged.storyLabel || staleStoryLabels.includes(merged.storyLabel)) merged.storyLabel = defaults.storyLabel || merged.storyLabel;
    if (!merged.storyHelp) merged.storyHelp = defaults.storyHelp || "";
    if (!merged.storyPlaceholder || merged.storyPlaceholder.includes("Was macht diese Person") || merged.storyPlaceholder.includes("Bu kişiyi özel yapan")) {
      merged.storyPlaceholder = defaults.storyPlaceholder || merged.storyPlaceholder;
    }
    const stalePriceTexts = ["Preis ab 17 € – Endpreis je nach Wunsch und Aufwand.", "Fiyat 17 €'dan başlar – son fiyat istek ve emeğe göre belirlenir."];
    if (!merged.priceBaseText || stalePriceTexts.includes(merged.priceBaseText)) merged.priceBaseText = defaults.priceBaseText || merged.priceBaseText;
    if (!merged.previewHint) merged.previewHint = defaults.previewHint || "";
    merged.storyPlaceholders = {
      ...(defaults.storyPlaceholders || {}),
      ...(merged.storyPlaceholders || {})
    };
    return merged;
  }

  function mergeCategoryTranslations(baseCategories = {}, remoteCategories = {}, language = "de") {
    const merged = { ...baseCategories, ...remoteCategories };
    if (language === "tr") {
      const defaults = window.MELODY_LANGUAGE_PACK?.tr?.categories || {};
      const legacy = window.MELODY_LANGUAGE_PACK?.tr?.legacyCategoryTitles || {};
      Object.entries(defaults).forEach(([id, category]) => {
        const title = merged[id]?.title || "";
        if (!merged[id] || (legacy[id] || []).includes(title)) {
          merged[id] = { ...(merged[id] || {}), ...category };
        }
      });
    }
    return merged;
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
        categories: mergeCategoryTranslations(baseLanguage.categories || {}, remoteLanguage.categories || {}, language),
        gallery: { ...(baseLanguage.gallery || {}), ...(remoteLanguage.gallery || {}) },
        reviews: { ...(baseLanguage.reviews || {}), ...(remoteLanguage.reviews || {}) },
        faqs: { ...(baseLanguage.faqs || {}), ...(remoteLanguage.faqs || {}) },
        contact: { ...(baseLanguage.contact || {}), ...(remoteLanguage.contact || {}) },
        legalPages: { ...(baseLanguage.legalPages || {}), ...(remoteLanguage.legalPages || {}) },
        orderForm: mergeOrderForm(baseLanguage.orderForm || {}, remoteLanguage.orderForm || {}, language),
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
      ? `<img src="${escape(brand.logoImage)}" alt="${escape(brand.name)}" loading="eager" decoding="async" />`
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
    return item.url || item.media || item.video || item.photo || item.image_url || item.image || item.images?.[0] || "";
  }

  function isVideo(url = "", type = "") {
    return String(type).startsWith("video") || /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(String(url));
  }

  function mediaFrame(item = {}, className = "media-frame", alt = "") {
    const url = mediaUrl(item);
    const type = item.mediaType || item.media_type || item.type || "";
    if (!url) return `<div class="${escape(className)}"></div>`;
    if (isVideo(url, type)) {
      return `<div class="${escape(className)} has-video"><video src="${escape(url)}" autoplay muted loop playsinline preload="metadata" poster="${escape(item.poster || item.image || "")}" ${item.controls ? "controls" : ""}></video></div>`;
    }
    return `<div class="${escape(className)}" ${imageStyle(url)} role="img" aria-label="${escape(alt || item.alt || item.title || "")}"></div>`;
  }

  function mediaThumb(item = {}, alt = "") {
    const url = mediaUrl(item);
    const type = item.mediaType || item.media_type || item.type || "";
    if (!url) return "";
    if (isVideo(url, type)) {
      return `<video src="${escape(url)}" muted loop playsinline preload="none" poster="${escape(item.poster || item.image || "")}" ${item.controls ? "controls" : ""}></video>`;
    }
    return `<img src="${escape(url)}" alt="${escape(alt || item.alt || item.title || "")}" loading="lazy" decoding="async" />`;
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
        const type = item.mediaType || item.media_type || item.type || "";
        return `<button class="gallery-item" type="button" data-edit-kind="gallery" data-edit-id="${escape(item.id)}" data-lightbox-open data-title="${escape(item.title)}" data-text="${escape(item.alt || item.description || "")}" data-image="${escape(url)}" data-media-type="${escape(isVideo(url, type) ? "video" : "image")}">${mediaThumb(item, item.title)}<span>${escape(item.title || "")}</span></button>`;
      }).join("") || emptyState(copy.emptyGallery || "Noch keine Galerie veröffentlicht.")}</div>
    </section>`;
  }

  function mediaSection(section) {
    return `<section class="section section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">
      ${sectionHead(section)}
      <div class="gallery-grid">${(section.items || []).filter((item) => item.active !== false).map((item, index) => `<button class="gallery-item" type="button" data-edit-kind="media-item" data-edit-id="${escape(`${section.id}:${index}`)}" data-lightbox-open data-title="${escape(item.title || section.title || "")}" data-text="${escape(item.alt || item.description || "")}" data-image="${escape(mediaUrl(item))}" data-media-type="${escape(isVideo(mediaUrl(item), item.mediaType || item.media_type || item.type) ? "video" : "image")}">${mediaThumb(item, item.title)}<span>${escape(item.title || "")}</span></button>`).join("")}</div>
    </section>`;
  }

  function reviews(section) {
    const items = sorted(content.reviews).map((item) => localizedItem("reviews", item));
    if (!items.length) return "";
    return `<section class="section section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">${sectionHead(section)}<div class="review-grid">${items.map((review) => `<article class="lux-card review" data-edit-kind="review" data-edit-id="${escape(review.id)}">${mediaUrl(review) ? mediaFrame(review, "review-media", review.name) : ""}<div class="stars">${"★".repeat(Number(review.rating || 5))}</div><p>${escape(review.text)}</p><strong>${escape(review.name)}</strong></article>`).join("")}</div></section>`;
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
    const c = copy.configurator || {};
    const pricing = copy.pricing || {};
    const optionList = (options = []) => options.map((option) => {
      const value = typeof option === "object" ? option.value : option;
      const label = typeof option === "object" ? option.label : option;
      return `<option value="${escape(value)}">${escape(label)}</option>`;
    }).join("");
    const categories = sorted(content.categories || []).map(localizedCategory);
    const categoryOptions = categories.map((category) => `<option value="${escape(category.id)}" data-description="${escape(category.description || "")}">${escape(category.title)}</option>`).join("");
    const firstCategory = categories[0] || {};
    return `<section class="section order-section section-reveal" id="${escape(section.id)}" data-edit-kind="section" data-edit-id="${escape(section.id)}">
      ${sectionHead(section)}
      <form class="order-form lux-card" id="premium-order-form">
        <div class="card-type-picker span-all">
          <div class="card-type-head">
            <p class="eyebrow">${escape(copy.categoryLabel || "")}</p>
            <h3>${escape(copy.categoryTitle || copy.categoryHelp || "")}</h3>
            <p data-category-help>${escape(firstCategory.description || copy.categoryHelp || "")}</p>
          </div>
          <label class="visually-hidden">${escape(copy.categoryLabel || "")}<select name="card_category" required>${categoryOptions}</select></label>
          <div class="card-type-grid" data-card-type-grid>
            ${categories.map((category, index) => categoryCard(category, index === 0)).join("")}
          </div>
        </div>
        <div class="card-configurator span-all">
          <div class="card-preview-panel">
            <div class="card-view-toggle" role="group" aria-label="${escape(c.title || "")}">
              <button class="mini-toggle is-active" type="button" data-card-view="outside">${escape(c.outsideTab || "")}</button>
              <button class="mini-toggle" type="button" data-card-view="inside">${escape(c.insideTab || "")}</button>
            </div>
            <div class="fold-card-preview is-outside" data-card-preview>
              <div class="card-cover" data-card-cover>
                <div class="cover-copy position-middle font-elegant" data-cover-copy>
                  <strong data-preview-cover-text>${escape(templateText(copy, firstCategory.id))}</strong>
                  <span data-preview-cover-name></span>
                  <em data-preview-cover-extra></em>
                </div>
              </div>
              <div class="card-inside" data-card-inside hidden>
                <div class="inside-page inside-left">
                  <small>${escape(c.leftPage || "")}</small>
                  <p data-preview-left-text></p>
                </div>
                <div class="inside-fold" aria-hidden="true"></div>
                <div class="inside-page inside-right">
                  <small>${escape(c.rightPage || "")}</small>
                  <div class="inside-right-content">
                    <div class="inside-photo" data-inside-photo hidden></div>
                    <p data-preview-right-text></p>
                  </div>
                  <div class="qr-reserved">${escape(c.qrText || "")}</div>
                </div>
              </div>
            </div>
            <p class="live-price" data-live-price>${escape(c.priceBaseText || "")}</p>
            <p class="preview-note">${escape(c.previewHint || "")}</p>
          </div>
          <div class="card-config-panel">
            <h3>${escape(c.title || "")}</h3>
            <div class="config-group">
              <h4>${escape(c.coverSectionTitle || "")}</h4>
              <label>${escape(c.templateModeLabel || "")}<select name="design_mode">
                <option value="template">${escape(c.templateModeTemplate || "")}</option>
                <option value="custom">${escape(c.templateModeCustom || "")}</option>
              </select></label>
              <label class="cover-template-field">${escape(c.templateLabel || "")}<select name="cover_template">${templateOptions(copy, firstCategory.id)}</select></label>
              <label class="cover-custom-field" hidden>${escape(c.coverTextLabel || "")}<input name="cover_text" value="${escape(templateText(copy, firstCategory.id))}" /></label>
              <label class="cover-custom-field" hidden>${escape(c.coverNameLabel || "")}<input name="cover_name" /></label>
              <label class="cover-custom-field" hidden>${escape(c.coverExtraLabel || "")}<input name="cover_extra" /></label>
            </div>
            <div class="config-group">
              <h4>${escape(c.insideLeftSectionTitle || "")}</h4>
              <label>${escape(c.textModeLabel || "")}<select name="inside_text_mode">
                <option value="empty">${escape(c.textModeEmpty || "")}</option>
                <option value="melody">${escape(c.textModeMelody || "")}</option>
                <option value="self">${escape(c.textModeSelf || "")}</option>
              </select></label>
              <label class="inside-left-field" hidden>${escape(c.insideLeftTextLabel || "")}<textarea name="inside_left_text" rows="4"></textarea></label>
              <label class="text-brief-field" hidden>${escape(c.textBriefLabel || "")}<textarea name="text_brief" rows="3" placeholder="${escape(c.textBriefPlaceholder || "")}"></textarea></label>
            </div>
            <div class="config-group">
              <h4>${escape(c.insideRightSectionTitle || "")}</h4>
              <label>${escape(c.rightPhotoToggleLabel || "")}<select name="right_photo_enabled">
                <option value="no">${escape(c.noLabel || "")}</option>
                <option value="yes">${escape(c.yesLabel || "")}</option>
              </select></label>
              <label class="right-photo-field" hidden>${escape(c.coverPhotoLabel || "")}<input name="customer_photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
              <label>${escape(c.rightTextToggleLabel || "")}<select name="right_text_enabled">
                <option value="no">${escape(c.noLabel || "")}</option>
                <option value="yes">${escape(c.yesLabel || "")}</option>
              </select></label>
              <label class="right-text-mode-field" hidden>${escape(c.rightTextModeLabel || "")}<select name="right_text_mode">
                <option value="empty">${escape(c.textModeEmpty || "")}</option>
                <option value="melody">${escape(c.textModeMelody || "")}</option>
                <option value="self">${escape(c.textModeSelf || "")}</option>
              </select></label>
              <label class="right-text-field" hidden>${escape(c.rightTextLabel || "")}<textarea name="inside_right_text" rows="3"></textarea></label>
            </div>
            <label>${escape(c.relationshipLabel || "")}<input name="relationship" /></label>
            <label class="song-brief-field">${escape(c.storyLabel || "")}<small>${escape(c.storyHelp || "")}</small><textarea name="personal_story" rows="8" required placeholder="${escape(storyPlaceholder(copy, firstCategory.id))}"></textarea></label>
          </div>
        </div>
        <div class="order-dynamic-fields span-all" data-category-fields-root>
          ${categories.map((category, index) => renderCategoryFieldGroup(copy, category.id, index === 0)).join("")}
        </div>
        <label>${escape(copy.nameLabel)}<input name="name" required /></label>
        <label>${escape(copy.emailLabel)}<input name="email" type="email" required /></label>
        <label>${escape(copy.phoneLabel)}<input name="phone" type="tel" /></label>
        <label>${escape(copy.songLanguageLabel)}<select name="song_language" required><option value="">${escape(copy.selectPlaceholder || "")}</option>${optionList(copy.songLanguageOptions)}</select></label>
        <label>${escape(copy.voiceLabel)}<select name="voice" required><option value="">${escape(copy.selectPlaceholder || "")}</option>${optionList(copy.voiceOptions)}</select></label>
        <label>${escape(copy.musicStyleLabel)}<select name="music_style" required><option value="">${escape(copy.selectPlaceholder || "")}</option>${optionList(copy.musicStyleOptions)}</select></label>
        <label class="span-all">${escape(copy.messageLabel)}<textarea name="message" rows="5" placeholder="${escape(copy.messagePlaceholder || "")}"></textarea></label>
        <button class="btn btn-primary" type="submit">${escape(copy.submitLabel)}</button>
        <p class="form-status" id="premium-order-status" role="status" aria-live="polite"></p>
      </form>
    </section>`;
  }

  function categoryCard(category, selected) {
    return `<button class="card-type-card ${selected ? "is-selected" : ""}" type="button" data-card-category-option="${escape(category.id)}" aria-pressed="${selected ? "true" : "false"}">
      <span class="card-type-icon icon-${escape(category.id)}" aria-hidden="true"></span>
      <span><strong>${escape(category.title || "")}</strong><small>${escape(category.description || "")}</small></span>
    </button>`;
  }

  function templateOptions(copy, categoryId) {
    return (copy.coverTemplates?.[categoryId] || []).map((label) => `<option value="${escape(label)}">${escape(label)}</option>`).join("");
  }

  function templateText(copy, categoryId) {
    return copy.coverTemplates?.[categoryId]?.[0] || "";
  }

  function storyPlaceholder(copy, categoryId) {
    return copy.configurator?.storyPlaceholders?.[categoryId] || copy.configurator?.storyPlaceholder || "";
  }

  function renderCategoryFieldGroup(copy, categoryId, isActive) {
    const fields = copy.categoryFields?.[categoryId] || [];
    return `<div class="category-field-group" data-category-fields="${escape(categoryId)}" ${isActive ? "" : "hidden"}>${fields.map((field) => renderOrderField(field, !isActive)).join("")}</div>`;
  }

  function renderOrderField(field, disabled) {
    const required = field.required ? "required" : "";
    const disabledAttr = disabled ? "disabled" : "";
    const placeholder = field.placeholder ? `placeholder="${escape(field.placeholder)}"` : "";
    const value = field.defaultValue ? `value="${escape(field.defaultValue)}"` : "";
    if (field.type === "textarea") {
      return `<label>${escape(field.label)}<textarea name="${escape(field.name)}" rows="4" ${required} ${disabledAttr} ${placeholder}></textarea></label>`;
    }
    if (field.options?.length) {
      return `<label>${escape(field.label)}<select name="${escape(field.name)}" ${required} ${disabledAttr}><option value=""></option>${field.options.map((option) => `<option value="${escape(option)}">${escape(option)}</option>`).join("")}</select></label>`;
    }
    return `<label>${escape(field.label)}<input name="${escape(field.name)}" type="${escape(field.type || "text")}" ${required} ${disabledAttr} ${placeholder} ${value} /></label>`;
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
        setOrderCategory(category);
      }, 20);
      const categoryCard = event.target.closest("[data-card-category-option]");
      if (categoryCard) setOrderCategory(categoryCard.dataset.cardCategoryOption);
    });
    $("#premium-order-form select[name='card_category']")?.addEventListener("change", updateOrderCategoryHelp);
    $("#premium-order-form")?.addEventListener("invalid", handleOrderInvalid, true);
    $("#premium-order-form")?.addEventListener("input", clearOrderInvalid);
    $("#premium-order-form")?.addEventListener("change", clearOrderInvalid);
    bindCardConfigurator();
    $("#premium-order-form")?.addEventListener("submit", submitOrder);
    reveal();
  }

  function setOrderCategory(categoryId) {
    const form = $("#premium-order-form");
    const select = form?.elements.card_category;
    if (!select || !categoryId) return;
    select.value = categoryId;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function bindCardConfigurator() {
    const form = $("#premium-order-form");
    if (!form) return;
    form.querySelectorAll("[data-card-view]").forEach((button) => {
      button.addEventListener("click", () => {
        form.querySelectorAll("[data-card-view]").forEach((item) => item.classList.toggle("is-active", item === button));
        const outside = button.dataset.cardView === "outside";
        const preview = form.querySelector("[data-card-preview]");
        const cover = form.querySelector("[data-card-cover]");
        const inside = form.querySelector("[data-card-inside]");
        preview?.classList.toggle("is-outside", outside);
        preview?.classList.toggle("is-inside", !outside);
        if (cover) {
          cover.hidden = !outside;
          cover.style.display = outside ? "grid" : "none";
        }
        if (inside) {
          inside.hidden = outside;
          inside.style.display = outside ? "none" : "grid";
        }
      });
    });
    ["input", "change"].forEach((eventName) => form.addEventListener(eventName, updateCardConfigurator));
    form.elements.customer_photo?.addEventListener("change", previewCustomerPhoto);
    updateCardConfigurator();
  }

  function updateOrderCategoryHelp(event) {
    const help = $("[data-category-help]");
    const selected = event.currentTarget.selectedOptions?.[0];
    if (help) help.textContent = selected?.dataset.description || "";
    updateCategoryCards(event.currentTarget.value);
    updateTemplateOptions(event.currentTarget.value);
    updateStoryPlaceholder(event.currentTarget.value);
    document.querySelectorAll("[data-category-fields]").forEach((group) => {
      const active = group.dataset.categoryFields === event.currentTarget.value;
      group.hidden = !active;
      group.querySelectorAll("input, textarea, select").forEach((field) => {
        field.disabled = !active;
        field.setCustomValidity("");
      });
    });
    updateCardConfigurator();
  }

  function updateCategoryCards(categoryId) {
    document.querySelectorAll("[data-card-category-option]").forEach((button) => {
      const selected = button.dataset.cardCategoryOption === categoryId;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function updateStoryPlaceholder(categoryId) {
    const form = $("#premium-order-form");
    if (!form?.elements.personal_story) return;
    form.elements.personal_story.placeholder = storyPlaceholder(orderCopy(), categoryId);
  }

  function updateTemplateOptions(categoryId) {
    const form = $("#premium-order-form");
    if (!form?.elements.cover_template) return;
    const copy = orderCopy();
    const options = copy.coverTemplates?.[categoryId] || [];
    form.elements.cover_template.innerHTML = options.map((label) => `<option value="${escape(label)}">${escape(label)}</option>`).join("");
    if (form.elements.design_mode?.value === "template") form.elements.cover_text.value = options[0] || "";
  }

  function updateCardConfigurator() {
    const form = $("#premium-order-form");
    if (!form) return;
    const copy = orderCopy();
    const c = copy.configurator || {};
    const isCustomCover = form.elements.design_mode?.value === "custom";
    form.querySelectorAll(".cover-custom-field").forEach((field) => {
      field.hidden = !isCustomCover;
      field.querySelectorAll("input, textarea, select").forEach((input) => {
        input.disabled = !isCustomCover;
      });
    });
    form.querySelectorAll(".cover-template-field").forEach((field) => {
      field.hidden = isCustomCover;
      field.querySelectorAll("input, textarea, select").forEach((input) => {
        input.disabled = isCustomCover;
      });
    });
    if (!isCustomCover && form.elements.cover_template?.value) {
      form.elements.cover_text.value = form.elements.cover_template.value;
      if (form.elements.cover_name) form.elements.cover_name.value = "";
      if (form.elements.cover_extra) form.elements.cover_extra.value = "";
    }
    const coverCopy = $("[data-cover-copy]");
    if (coverCopy) {
      coverCopy.className = "cover-copy position-middle font-elegant";
      coverCopy.style.fontSize = "";
    }
    $("[data-preview-cover-text]").textContent = form.elements.cover_text?.value || "";
    $("[data-preview-cover-name]").textContent = form.elements.cover_name?.value || "";
    $("[data-preview-cover-extra]").textContent = form.elements.cover_extra?.value || "";
    const textMode = form.elements.inside_text_mode?.value || "empty";
    form.querySelector(".inside-left-field").hidden = textMode !== "self";
    form.querySelector(".text-brief-field").hidden = textMode !== "melody";
    form.querySelectorAll(".inside-left-field, .text-brief-field").forEach((field) => {
      field.querySelectorAll("input, textarea, select").forEach((input) => {
        input.disabled = field.hidden;
      });
    });
    const leftText = textMode === "empty" ? "" : textMode === "melody" ? (form.elements.text_brief?.value || c.textModeMelody || "") : (form.elements.inside_left_text?.value || "");
    $("[data-preview-left-text]").textContent = leftText;
    const photoEnabled = form.elements.right_photo_enabled?.value === "yes";
    const rightTextEnabled = form.elements.right_text_enabled?.value === "yes";
    const rightTextMode = form.elements.right_text_mode?.value || "empty";
    const rightPhotoField = form.querySelector(".right-photo-field");
    const rightTextModeField = form.querySelector(".right-text-mode-field");
    const rightTextField = form.querySelector(".right-text-field");
    if (rightPhotoField) rightPhotoField.hidden = !photoEnabled;
    if (rightTextModeField) rightTextModeField.hidden = !rightTextEnabled;
    if (rightTextField) rightTextField.hidden = !(rightTextEnabled && rightTextMode === "self");
    [rightPhotoField, rightTextModeField, rightTextField].filter(Boolean).forEach((field) => {
      field.querySelectorAll("input, textarea, select").forEach((input) => {
        input.disabled = field.hidden;
      });
    });
    const rightText = !rightTextEnabled || rightTextMode === "empty" ? "" : rightTextMode === "melody" ? (c.textModeMelody || "") : (form.elements.inside_right_text?.value || "");
    $("[data-preview-right-text]").textContent = rightText;
    if (!photoEnabled || !form.elements.customer_photo?.files?.length) {
      document.querySelectorAll("[data-inside-photo]").forEach((node) => {
        node.hidden = true;
        node.innerHTML = "";
      });
    }
    $("[data-live-price]").textContent = hasPersonalization(form) ? (c.priceCustomText || "") : (c.priceBaseText || "");
  }

  function hasPersonalization(form) {
    const textMode = form.elements.inside_text_mode?.value || "empty";
    const rightTextMode = form.elements.right_text_enabled?.value === "yes" ? form.elements.right_text_mode?.value : "empty";
    return form.elements.design_mode?.value === "custom"
      || textMode === "self"
      || textMode === "melody"
      || (form.elements.right_photo_enabled?.value === "yes" && Boolean(form.elements.customer_photo?.files?.length))
      || rightTextMode === "self"
      || rightTextMode === "melody";
  }

  function previewCustomerPhoto(event) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      document.querySelectorAll("[data-inside-photo]").forEach((node) => {
        node.hidden = false;
        node.innerHTML = `<img src="${escape(reader.result)}" alt="" />`;
      });
      updateCardConfigurator();
    };
    reader.readAsDataURL(file);
  }

  function handleOrderInvalid(event) {
    const copy = orderCopy();
    const message = copy.requiredMessage || "";
    if (message) event.target.setCustomValidity(message);
    const status = $("#premium-order-status");
    if (status) {
      status.textContent = message;
      status.dataset.state = "error";
    }
  }

  function clearOrderInvalid(event) {
    if (event.target?.setCustomValidity) event.target.setCustomValidity("");
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
    const selectedCategory = form.elements.card_category?.selectedOptions?.[0];
    const categoryLabel = selectedCategory?.textContent?.trim() || values.card_category || "";
    const setStatus = (message, state = "") => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state;
    };
    if (!form.checkValidity()) {
      setStatus(copy.requiredMessage || copy.error || "", "error");
      form.reportValidity();
      return;
    }
    setStatus(copy.sending || "", "loading");
    if (submit) submit.disabled = true;
    try {
      if (!window.MelodySupabase?.createPremiumOrder) {
        throw new Error(copy.error || "");
      }
      let uploadedPhotoUrl = "";
      const photoFile = form.elements.right_photo_enabled?.value === "yes" ? form.elements.customer_photo?.files?.[0] : null;
      if (photoFile) {
        if (!window.MelodySupabase?.uploadOrderFile) throw new Error(copy.error || "");
        uploadedPhotoUrl = await window.MelodySupabase.uploadOrderFile(photoFile, "customer-photos");
      }
      const configuratorDetails = collectConfiguratorDetails(form, copy, uploadedPhotoUrl);
      const orderPayload = buildPremiumOrderPayload(form, values, copy, categoryLabel, configuratorDetails);
      const orderDetails = {
        card_category: values.card_category || "",
        card_category_label: categoryLabel,
        recipient_name: recipientName(values),
        occasion: occasionName(values, categoryLabel),
        category_fields: dynamicOrderFields(copy, values.card_category, values),
        configurator: configuratorDetails,
        song_language: values.song_language || "",
        voice: values.voice || "",
        music_style: values.music_style || "",
        story: values.message || "",
        customer_name: values.name || "",
        email: values.email || "",
        phone: values.phone || ""
      };
      const cardText = [
        `${copy.cardTextCategory || ""}: ${categoryLabel}`,
        `${copy.cardTextRecipient || ""}: ${recipientName(values)}`,
        `${copy.cardTextOccasion || ""}: ${occasionName(values, categoryLabel)}`,
        `${copy.configurator?.templateModeLabel || ""}: ${configuratorDetails.design_mode_label}`,
        `${copy.configurator?.coverTextLabel || ""}: ${configuratorDetails.cover_text}`,
        `${copy.configurator?.coverNameLabel || ""}: ${configuratorDetails.cover_name}`,
        `${copy.configurator?.coverExtraLabel || ""}: ${configuratorDetails.cover_extra}`,
        `${copy.configurator?.insideLeftTitle || ""}: ${configuratorDetails.inside_left_text || configuratorDetails.text_brief || ""}`,
        `${copy.configurator?.insideRightTitle || ""}: ${configuratorDetails.inside_right_text || configuratorDetails.inside_right_text_mode_label || ""}`,
        `${copy.configurator?.rightPhotoToggleLabel || ""}: ${configuratorDetails.right_photo_enabled ? copy.configurator?.yesLabel || "Ja" : copy.configurator?.noLabel || "Nein"}`,
        `${copy.configurator?.rightTextToggleLabel || ""}: ${configuratorDetails.right_text_enabled ? copy.configurator?.yesLabel || "Ja" : copy.configurator?.noLabel || "Nein"}`,
        `${copy.configurator?.priceLabel || ""}: ${configuratorDetails.price_note}`,
        ...dynamicOrderFields(copy, values.card_category, values).map((field) => `${field.label}: ${field.value}`)
      ].filter((line) => !line.endsWith(": ")).join("\n");
      await window.MelodySupabase.createPremiumOrder({
        name: (values.name || "").trim(),
        customer_name: (values.name || "").trim(),
        email: (values.email || "").trim(),
        phone: (values.phone || "").trim(),
        address: "",
        card_category: categoryLabel,
        recipient_name: recipientName(values),
        occasion: occasionName(values, categoryLabel),
        song_language: values.song_language || "",
        voice: values.voice || "",
        music_style: values.music_style || "",
        story: [dynamicOrderFields(copy, values.card_category, values).map((field) => `${field.label}: ${field.value}`).join("\n"), configuratorDetails.personal_story, values.message || ""].filter(Boolean).join("\n\n"),
        card_text: cardText,
        image_url: configuratorDetails.photo_url || "",
        card_photo_url: configuratorDetails.photo_url || "",
        configurator: configuratorDetails,
        music_wish: JSON.stringify({
          ...orderDetails,
          labels: {
            card_category: copy.cardTextCategory || "",
            recipient_name: copy.cardTextRecipient || "",
            occasion: copy.cardTextOccasion || "",
            song_language: copy.musicWishLanguage || "",
            voice: copy.musicWishVoice || "",
            music_style: copy.musicWishStyle || ""
          }
        }),
        message: values.message || "",
        status: "neu",
        ...orderPayload
      });
      form.reset();
      updateOrderCategoryHelp({ currentTarget: form.elements.card_category });
      setStatus(copy.success || "", "success");
    } catch (error) {
      console.error("Order submit failed:", error);
      setStatus(error.message || copy.error || "", "error");
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  function dynamicOrderFields(copy, categoryId, values) {
    return (copy.categoryFields?.[categoryId] || [])
      .map((field) => ({ name: field.name, label: field.label || field.name, value: values[field.name] || "" }))
      .filter((field) => field.value);
  }

  function collectConfiguratorDetails(form, copy, uploadedPhotoUrl = "") {
    const c = copy.configurator || {};
    const designMode = form.elements.design_mode?.value || "template";
    const textMode = form.elements.inside_text_mode?.value || "empty";
    const rightPhotoEnabled = form.elements.right_photo_enabled?.value === "yes";
    const rightTextEnabled = form.elements.right_text_enabled?.value === "yes";
    const rightTextMode = rightTextEnabled ? (form.elements.right_text_mode?.value || "empty") : "empty";
    const personalized = hasPersonalization(form);
    return {
      design_mode: designMode,
      design_mode_label: designMode === "custom" ? c.templateModeCustom : c.templateModeTemplate,
      template: designMode === "template" ? (form.elements.cover_template?.value || "") : "",
      cover_text: designMode === "custom" ? (form.elements.cover_text?.value || "") : (form.elements.cover_template?.value || ""),
      cover_name: designMode === "custom" ? (form.elements.cover_name?.value || "") : "",
      cover_extra: designMode === "custom" ? (form.elements.cover_extra?.value || "") : "",
      inside_text_mode: textMode,
      inside_text_mode_label: textMode === "melody" ? c.textModeMelody : textMode === "empty" ? c.textModeEmpty : c.textModeSelf,
      inside_left_text: textMode === "self" ? (form.elements.inside_left_text?.value || "") : "",
      text_brief: textMode === "melody" ? (form.elements.text_brief?.value || "") : "",
      right_photo_enabled: rightPhotoEnabled,
      right_text_enabled: rightTextEnabled,
      inside_right_text_mode: rightTextMode,
      inside_right_text_mode_label: rightTextMode === "melody" ? c.textModeMelody : rightTextMode === "empty" ? c.textModeEmpty : c.textModeSelf,
      inside_right_text: rightTextMode === "self" ? (form.elements.inside_right_text?.value || "") : "",
      relationship: form.elements.relationship?.value || "",
      personal_story: form.elements.personal_story?.value || "",
      complex_design: false,
      photo_url: rightPhotoEnabled ? uploadedPhotoUrl : "",
      price: null,
      price_note: personalized ? (c.priceCustomText || "") : (c.priceBaseText || ""),
      currency: "€",
      qr_position: "inside_right_bottom_center"
    };
  }

  function buildPremiumOrderPayload(form, values, copy, categoryLabel, config = {}) {
    const dynamicFields = dynamicOrderFields(copy, values.card_category, values);
    const dynamicSummary = dynamicFields.map((field) => `${field.label}: ${field.value}`).join("\n");
    const specialDetails = [
      values.romantic_style ? `Romantischer Stil: ${values.romantic_style}` : "",
      dynamicSummary,
      values.message || ""
    ].filter(Boolean).join("\n\n");
    const songNotes = config.personal_story || "";
    return {
      card_type: categoryLabel,
      language_ui: currentLanguage,
      customer_name: (values.name || "").trim(),
      customer_email: (values.email || "").trim(),
      customer_phone: (values.phone || "").trim(),
      recipient_name: recipientName(values),
      recipient_age: values.age || "",
      relationship_to_recipient: config.relationship || "",
      cover_mode: config.design_mode_label || config.design_mode || "",
      cover_template: config.template || "",
      cover_text: config.cover_text || "",
      cover_name: config.cover_name || "",
      cover_extra_text: config.cover_extra || "",
      inside_left_mode: config.inside_text_mode_label || config.inside_text_mode || "",
      inside_left_text: config.inside_left_text || "",
      inside_left_melody_notes: config.text_brief || "",
      inside_right_photo_enabled: Boolean(config.right_photo_enabled),
      inside_right_photo_url: config.photo_url || "",
      inside_right_text_enabled: Boolean(config.right_text_enabled),
      inside_right_mode: config.inside_right_text_mode_label || config.inside_right_text_mode || "",
      inside_right_text: config.inside_right_text || "",
      inside_right_melody_notes: config.inside_right_text_mode === "melody" ? (config.personal_story || "") : "",
      song_language: values.song_language || "",
      voice: values.voice || "",
      music_style: values.music_style || "",
      song_notes: songNotes,
      apology_reason: values.apology_for || "",
      mood: values.mood || "",
      personal_story: values.love_story || values.memory || config.personal_story || "",
      special_details: specialDetails,
      image_url: config.photo_url || "",
      video_url: "",
      audio_url: "",
      personalization_selected: hasPersonalization(form),
      price_note: config.price_note || ""
    };
  }

  function recipientName(values) {
    return (values.recipient || values.partner_name || values.mother_name || values.father_name || "").trim();
  }

  function occasionName(values, categoryLabel) {
    return (values.occasion || values.apology_for || values.romantic_style || categoryLabel || "").trim();
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
