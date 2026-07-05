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

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element && value) element.textContent = value;
  }

  try {
    const data = await window.MelodySupabase.fetchContent();
    const content = data.settings?.content || {};
    const brand = content.brand || {};
    setText(".brand-text", brand.name || content.brandName);
    document.querySelectorAll(".brand-mark").forEach((element) => {
      if (brand.logoImage || content.logoImage) element.innerHTML = `<img class="logo-image" src="${brand.logoImage || content.logoImage}" alt="">`;
      else if (brand.logoText || content.logoText) element.textContent = brand.logoText || content.logoText;
    });
    if (content.seo?.favicon || content.faviconImage) document.querySelector('link[rel="icon"]')?.setAttribute("href", content.seo?.favicon || content.faviconImage);
    const legalText = content.legalPages?.[page];
    if (legalText) {
      const target = document.querySelector(".legal-content");
      if (target) target.innerHTML = legalText;
    }
  } catch (error) {
    console.warn("Legal content fallback active:", error.message);
  }
})();
