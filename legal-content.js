(async function () {
  const pageMap = {
    "impressum.html": "impressum",
    "datenschutz.html": "datenschutz",
    "agb.html": "agb",
    "widerruf.html": "widerruf",
    "versand-zahlung.html": "versand"
  };
  const page = pageMap[location.pathname.split("/").pop()];
  if (!page || !window.MelodySupabase?.fetchContent) return;
  const legalMeta = {
    de: {
      impressum: ["Rechtliches", "Impressum", "Angaben gemäß den gesetzlichen Informationspflichten."],
      datenschutz: ["Rechtliches", "Datenschutz", "Informationen zur Verarbeitung personenbezogener Daten bei Nutzung dieser Webseite und bei Premium-Anfragen."],
      agb: ["Rechtliches", "AGB", "Allgemeine Geschäftsbedingungen für Anfragen und Bestellungen bei Melody Cards."],
      widerruf: ["Rechtliches", "Widerruf", "Informationen zum Widerrufsrecht und zu personalisierten Produkten."],
      versand: ["Rechtliches", "Versand & Zahlung", "Informationen zu Versand, Zahlung und Abwicklung."]
    },
    tr: {
      impressum: ["Yasal", "Künye", "Yasal bilgilendirme yükümlülüklerine ilişkin bilgiler."],
      datenschutz: ["Yasal", "Gizlilik", "Web sitesinin kullanımı ve talepler sırasında kişisel verilerin işlenmesine ilişkin bilgiler."],
      agb: ["Yasal", "Şartlar", "Melody Cards talepleri ve siparişleri için genel şartlar."],
      widerruf: ["Yasal", "Cayma Hakkı", "Cayma hakkı ve kişiselleştirilmiş ürünlere ilişkin bilgiler."],
      versand: ["Yasal", "Kargo & Ödeme", "Kargo, ödeme ve işlem süreci hakkında bilgiler."]
    }
  };

  function mergeContent(base, remote) {
    return {
      ...base,
      ...(remote || {}),
      brand: { ...(base.brand || {}), ...(remote?.brand || {}) },
      seo: { ...(base.seo || {}), ...(remote?.seo || {}) },
      legalPages: { ...(base.legalPages || {}), ...(remote?.legalPages || {}) },
      translations: { ...(base.translations || {}), ...(remote?.translations || {}) },
      languages: remote?.languages || base.languages || []
    };
  }

  function currentLanguage(content) {
    const languages = (content.languages || []).filter((language) => language.active !== false);
    const codes = languages.map((language) => language.code);
    const urlLanguage = new URLSearchParams(location.search).get("lang");
    const storedLanguage = localStorage.getItem("melodyLanguage");
    if (codes.includes(urlLanguage)) return urlLanguage;
    if (codes.includes(storedLanguage)) return storedLanguage;
    return content.defaultLanguage || "de";
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element && value) element.textContent = value;
  }

  function renderLanguageSwitcher(content, language) {
    const header = document.querySelector(".site-header");
    if (!header || header.querySelector("[data-language-switcher]")) return;
    const languages = (content.languages || []).filter((item) => item.active !== false);
    const switcher = document.createElement("div");
    switcher.className = "language-switcher";
    switcher.dataset.languageSwitcher = "true";
    switcher.setAttribute("aria-label", "Sprache wechseln");
    switcher.innerHTML = languages.map((item) => `<button class="lang-btn ${item.code === language ? "is-active" : ""}" type="button" data-language="${item.code}">${item.label || item.code.toUpperCase()}</button>`).join("");
    header.insertBefore(switcher, header.querySelector(".main-nav"));
    switcher.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => {
        localStorage.setItem("melodyLanguage", button.dataset.language);
        const url = new URL(location.href);
        url.searchParams.set("lang", button.dataset.language);
        location.href = url.toString();
      });
    });
  }

  try {
    const data = await window.MelodySupabase.fetchContent();
    const fallback = window.MELODY_DEFAULT_SITE?.settings?.content || window.MELODY_DEMO_CONTENT?.settings?.content || {};
    const content = mergeContent(fallback, data.settings?.content || {});
    const language = currentLanguage(content);
    const translation = content.translations?.[language] || {};
    document.documentElement.lang = language;
    renderLanguageSwitcher(content, language);
    const meta = legalMeta[language]?.[page];
    if (meta) {
      setText(".legal-hero .eyebrow", meta[0]);
      setText(".legal-hero h1 span", meta[1]);
      setText(".legal-hero > p:last-child", meta[2]);
      document.title = `${meta[1]} | Melody Cards`;
    }
    const brand = { ...(content.brand || {}), ...(translation.brand || {}) };
    setText(".brand-text", brand.name || content.brandName);
    if (language === "tr") {
      const navLinks = document.querySelectorAll(".main-nav a");
      if (navLinks[0]) navLinks[0].textContent = "Kartlar";
      if (navLinks[1]) navLinks[1].textContent = "İletişim";
      if (navLinks[2]) navLinks[2].textContent = "Sipariş";
    }
    document.querySelectorAll(".brand-mark").forEach((element) => {
      if (brand.logoImage || content.logoImage) element.innerHTML = `<img class="logo-image" src="${brand.logoImage || content.logoImage}" alt="">`;
      else if (brand.logoText || content.logoText) element.textContent = brand.logoText || content.logoText;
    });
    if (content.seo?.favicon || content.faviconImage) document.querySelector('link[rel="icon"]')?.setAttribute("href", content.seo?.favicon || content.faviconImage);
    const legalText = translation.legalPages?.[page] || content.legalPages?.[page];
    if (legalText) {
      const target = document.querySelector(".legal-content");
      if (target) target.innerHTML = legalText;
    }
  } catch (error) {
    console.warn("Legal content fallback active:", error.message);
  }
})();
