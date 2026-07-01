(function () {
  function forceTop() {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (error) {
      window.scrollTo(0, 0);
    }
  }

  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  if (window.location.hash) {
    window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }

  forceTop();
  window.addEventListener("DOMContentLoaded", forceTop, { once: true });
  window.addEventListener("load", () => {
    forceTop();
    window.requestAnimationFrame(forceTop);
    window.setTimeout(forceTop, 0);
    window.setTimeout(forceTop, 180);
  }, { once: true });
  window.addEventListener("pageshow", () => {
    forceTop();
    window.requestAnimationFrame(forceTop);
  });
})();
