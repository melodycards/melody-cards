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
    setText(".brand-text", content.brandName);
    document.querySelectorAll(".brand-mark").forEach((element) => {
      if (content.logoImage) element.innerHTML = `<img class="logo-image" src="${content.logoImage}" alt="">`;
      else if (content.logoText) element.textContent = content.logoText;
    });
    if (content.faviconImage) document.querySelector('link[rel="icon"]')?.setAttribute("href", content.faviconImage);
    const legalText = content.legalPages?.[page];
    if (legalText) {
      const target = document.querySelector(".legal-content");
      if (target) target.innerHTML = legalText;
    }
  } catch (error) {
    console.warn("Legal content fallback active:", error.message);
  }
})();
