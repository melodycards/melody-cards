(async function () {
  const ADMIN_EMAIL = "koglu@hotmail.de";
  let api = window.MelodySupabase || {
    getClient: () => null,
    fetchContent: async () => ({ ...window.MELODY_DEMO_CONTENT, source: "demo" }),
    uploadFile: async () => null
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  let client = api.getClient();
  let demoMode = !client;
  let state = clone(window.MELODY_DEMO_CONTENT);
  let settings = clone(window.MELODY_DEMO_CONTENT.settings);
  let editing = {};
  let loginInProgress = false;
  let forcedDemoMode = false;
  let contentReady = loadContent();

  function refreshClient() {
    if (window.MelodySupabase) api = window.MelodySupabase;
    client = api.getClient?.() || null;
    demoMode = forcedDemoMode || !client;
    return client;
  }

  function loginStatus(message) {
    const target = $("[data-login-status]");
    if (target) target.textContent = message || "";
  }

  function readableAuthError(error) {
    const message = error?.message || "Unbekannter Login-Fehler.";
    const lower = message.toLowerCase();
    if (lower.includes("invalid login credentials")) {
      return "Login fehlgeschlagen: E-Mail oder Passwort ist falsch. Prüfe das Passwort oder nutze „Passwort zurücksetzen“. Originalmeldung: Invalid login credentials.";
    }
    if (lower.includes("email not confirmed")) {
      return "Login fehlgeschlagen: Die E-Mail ist in Supabase noch nicht bestätigt. Bitte bestätige die Mail in Supabase Auth oder deaktiviere Confirm email.";
    }
    return `Login fehlgeschlagen: ${message}`;
  }

  async function ensureAdminProfile(user) {
    if (!client || !user?.id) return { ok: false, message: "Keine Supabase-Session gefunden." };
    const email = String(user.email || "").toLowerCase();
    const { data, error } = await client.from("admin_profiles").select("role").eq("user_id", user.id).maybeSingle();
    if (error) {
      return {
        ok: false,
        message: `Login erfolgreich, aber Admin-Profil konnte nicht geprüft werden: ${error.message}`
      };
    }
    if (data?.role === "admin") return { ok: true, message: "Admin-Profil bestätigt." };

    if (email !== ADMIN_EMAIL) {
      return {
        ok: false,
        message: `Login erfolgreich, aber ${email || "dieser Benutzer"} ist kein freigegebener Admin.`
      };
    }

    const { error: insertError } = await client
      .from("admin_profiles")
      .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id" });

    if (!insertError) return { ok: true, message: "Admin-Profil automatisch erstellt." };

    const blockedByPolicy = insertError.code === "42501" || /row-level security|permission|policy/i.test(insertError.message || "");
    if (blockedByPolicy) {
      return {
        ok: true,
        warning: true,
        message: `Dashboard geöffnet. ${ADMIN_EMAIL} ist authentifiziert, aber Supabase blockiert das automatische Anlegen in admin_profiles. Führe die aktualisierten Policies aus supabase.sql aus oder die Datei admin_koglu_profile.sql. Originalmeldung: ${insertError.message}`
      };
    }

    return {
      ok: false,
      message: `Login erfolgreich, aber Admin-Profil konnte nicht erstellt werden: ${insertError.message}`
    };
  }

  async function openDashboardForSession(session) {
    if (!session?.user?.id) {
      loginStatus("Login fehlgeschlagen: Supabase hat keine gültige Session zurückgegeben.");
      return false;
    }
    const email = String(session.user.email || "").toLowerCase();
    if (email !== ADMIN_EMAIL) {
      loginStatus(`Login verweigert: Bitte melde dich mit ${ADMIN_EMAIL} an.`);
      await client?.auth?.signOut?.();
      return false;
    }
    const profile = await ensureAdminProfile(session.user);
    if (!profile.ok) {
      loginStatus(profile.message);
      console.warn("Supabase admin profile check failed:", profile.message);
      await client?.auth?.signOut?.();
      return false;
    }
    loginStatus(profile.warning ? profile.message : "Login erfolgreich. Dashboard wird geöffnet...");
    showDashboard();
    if (profile.warning) {
      setStatus(profile.message);
      console.warn("Supabase admin profile bootstrap warning:", profile.message);
    }
    refreshDashboardAfterOpen();
    return true;
  }

  function withTimeout(promise, ms, fallback) {
    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(fallback), ms))
    ]);
  }

  async function fetchOrders() {
    if (demoMode || !client) {
      return JSON.parse(localStorage.getItem("melodyDemoOrders") || "[]");
    }
    try {
      const { data, error } = await client.from("premium_orders").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn("Orders fallback active:", error.message);
      return JSON.parse(localStorage.getItem("melodyDemoOrders") || "[]");
    }
  }

  async function loadContent() {
    try {
      refreshClient();
      if (demoMode) {
        state = clone(window.MELODY_DEMO_CONTENT);
        state.orders = await fetchOrders();
        settings = clone(state.settings || window.MELODY_DEMO_CONTENT.settings);
        return state;
      }
      state = await withTimeout(api.fetchContent(), 7000, { ...window.MELODY_DEMO_CONTENT, source: "demo-timeout" });
      state.orders = await withTimeout(fetchOrders(), 7000, []);
      settings = clone(state.settings || window.MELODY_DEMO_CONTENT.settings);
    } catch (error) {
      console.warn("Admin content fallback active:", error.message);
      state = clone(window.MELODY_DEMO_CONTENT);
      state.orders = await fetchOrders();
      settings = clone(window.MELODY_DEMO_CONTENT.settings);
      demoMode = true;
    }
    return state;
  }

  const tables = {
    products: {
      title: "Produkte",
      table: "products",
      collection: "products",
      folder: "products",
      fields: [
        ["title", "Titel", "text"],
        ["description", "Beschreibung", "textarea"],
        ["category", "Kategorie", "text"],
        ["price", "Preis", "text"],
        ["tags", "Tags, durch Komma getrennt", "text"],
        ["image_url", "Bild URL", "text"],
        ["sort_order", "Sortierung", "number"],
        ["active", "Aktiv", "checkbox"]
      ]
    },
    gallery: {
      title: "Galerie",
      table: "gallery_items",
      collection: "gallery",
      folder: "gallery",
      fields: [
        ["title", "Titel", "text"],
        ["description", "Beschreibung", "textarea"],
        ["category", "Kategorie", "text"],
        ["image_url", "Bild URL", "text"],
        ["sort_order", "Sortierung", "number"],
        ["active", "Aktiv", "checkbox"]
      ]
    },
    reviews: {
      title: "Bewertungen",
      table: "reviews",
      collection: "reviews",
      folder: "reviews",
      fields: [
        ["name", "Name", "text"],
        ["text", "Bewertung", "textarea"],
        ["rating", "Sterne", "number"],
        ["image_url", "Profilbild URL", "text"],
        ["verified", "Verifiziert", "checkbox"],
        ["sort_order", "Sortierung", "number"],
        ["active", "Aktiv", "checkbox"]
      ]
    },
    faqs: {
      title: "FAQ",
      table: "faqs",
      collection: "faqs",
      folder: "faq",
      fields: [
        ["question", "Frage", "text"],
        ["answer", "Antwort", "textarea"],
        ["sort_order", "Sortierung", "number"],
        ["active", "Aktiv", "checkbox"]
      ]
    }
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  let statusTimer = null;

  function setStatus(message, options = {}) {
    const target = $("[data-admin-status]");
    if (!target) return;
    if (statusTimer) window.clearTimeout(statusTimer);
    target.textContent = message || "";
    target.dataset.state = options.error ? "error" : options.success ? "success" : "";
    if (message && !options.persist) {
      statusTimer = window.setTimeout(() => {
        target.textContent = "";
        target.dataset.state = "";
      }, options.duration || 6500);
    }
  }

  function readableAdminError(error) {
    const message = error?.message || String(error || "Unbekannter Fehler.");
    const code = error?.code || "";
    const lower = message.toLowerCase();
    if (code === "42501" || lower.includes("row-level security") || lower.includes("permission denied")) {
      return `Supabase verweigert das Speichern. Prüfe, ob koglu@hotmail.de in admin_profiles als admin eingetragen ist und ob die Storage-/RLS-Policies aus supabase.sql ausgeführt wurden. Originalmeldung: ${message}`;
    }
    if (lower.includes("bucket not found") || lower.includes("storage bucket")) {
      return `Storage-Upload fehlgeschlagen: Der Bucket melody-assets fehlt oder ist nicht erreichbar. Originalmeldung: ${message}`;
    }
    if (lower.includes("site_settings")) {
      return `Startseite konnte nicht gespeichert werden: Tabelle site_settings fehlt oder ist nicht freigegeben. Originalmeldung: ${message}`;
    }
    if (lower.includes("storage") || lower.includes("upload")) {
      return `Upload/Speichern fehlgeschlagen: ${message}`;
    }
    if (lower.includes("failed to fetch") || lower.includes("network")) {
      return `Netzwerkfehler: Supabase konnte nicht erreicht werden. Originalmeldung: ${message}`;
    }
    return message;
  }

  async function runAdminAction(source, pendingMessage, successMessage, action, options = {}) {
    const button = source?.matches?.("button") ? source : source?.querySelector?.('button[type="submit"]');
    try {
      if (button) button.disabled = true;
      setStatus(pendingMessage, { persist: true });
      const result = await action();
      setStatus(successMessage, { success: true, persist: options.persistSuccess });
      return result ?? true;
    } catch (error) {
      const message = readableAdminError(error);
      setStatus(message, { error: true, persist: true });
      console.warn("Admin action failed:", error);
      return false;
    } finally {
      if (button) button.disabled = false;
    }
  }

  function isDemoId(id) {
    return String(id || "").startsWith("demo-");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function shortText(value, length = 260) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > length ? `${text.slice(0, length)}...` : text;
  }

  function ensureDashboardShell() {
    const sidebar = $(".admin-sidebar");
    const main = $(".admin-main");
    const firstPanel = $('[data-panel="home"]');
    const settingsButton = $('[data-section="settings"]');

    if (sidebar && !$('[data-section="dashboard"]')) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.section = "dashboard";
      button.textContent = "Dashboard";
      sidebar.insertBefore(button, sidebar.querySelector('[data-section="home"]'));
    }

    if (main && firstPanel && !$('[data-panel="dashboard"]')) {
      const panel = document.createElement("section");
      panel.className = "admin-panel";
      panel.dataset.panel = "dashboard";
      panel.innerHTML = `
        <div class="admin-form glass">
          <h3>Dashboard</h3>
          <div class="dashboard-overview" data-dashboard-overview></div>
          <p>Wähle links einen Bereich aus und bearbeite Produkte, Galerie, Bewertungen, FAQ, Blog oder Einstellungen.</p>
        </div>`;
      main.insertBefore(panel, firstPanel);
    }

    if (sidebar && settingsButton && !$('[data-section="blog"]')) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.section = "blog";
      button.textContent = "Blog";
      sidebar.insertBefore(button, settingsButton);
    }

    if (main && !$('[data-panel="blog"]')) {
      const panel = document.createElement("section");
      panel.className = "admin-panel";
      panel.dataset.panel = "blog";
      panel.innerHTML = `
        <div class="admin-form glass">
          <h3>Blog</h3>
          <p>Blog-Verwaltung ist vorbereitet. Hier können später Artikel, Bilder und SEO-Texte bearbeitet werden.</p>
        </div>`;
      main.appendChild(panel);
    }
  }

  function selectSection(section) {
    const targetButton = $(`[data-section="${section}"]`) || $('[data-section="dashboard"]');
    const targetPanel = $(`[data-panel="${section}"]`) || $('[data-panel="dashboard"]');
    document.querySelectorAll("[data-section]").forEach((item) => item.classList.remove("is-active"));
    document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.remove("is-active"));
    targetButton?.classList.add("is-active");
    targetPanel?.classList.add("is-active");
    $("[data-admin-title]").textContent = section === "dashboard" ? "Dashboard" : targetButton?.textContent || "Dashboard";
  }

  function renderDashboard(activate = true) {
    ensureDashboardShell();
    const overview = $("[data-dashboard-overview]");
    if (overview) {
      const stats = [
        ["Bestellungen", state.orders?.length || 0],
        ["Produkte", state.products?.length || 0],
        ["Galerie", state.gallery?.length || 0],
        ["Bewertungen", state.reviews?.length || 0],
        ["FAQ", state.faqs?.length || 0]
      ];
      overview.innerHTML = stats.map(([label, value]) => `
        <article class="dashboard-card">
          <strong>${value}</strong>
          <span>${label}</span>
        </article>`).join("");
    }
    if (activate) selectSection("dashboard");
  }

  function showDashboard() {
    ensureDashboardShell();
    const login = $("[data-login]");
    const app = $("[data-admin-app]");
    login.hidden = true;
    login.setAttribute("aria-hidden", "true");
    login.style.display = "none";
    app.hidden = false;
    app.removeAttribute("aria-hidden");
    app.style.display = "";
    $("[data-mode-label]").textContent = demoMode ? "Demo-Modus ohne Speichern" : "Supabase CMS verbunden";
    $("[data-connection-status]").textContent = demoMode ? "Nicht verbunden - Demo-Daten aktiv" : "Verbunden";
    $("[data-bucket-name]").textContent = (window.MELODY_SUPABASE_CONFIG || {}).storageBucket || "melody-assets";
    try {
      fillSettingsForms();
      Object.keys(tables).forEach(renderCrud);
      renderOrders();
      renderDashboard();
    } catch (error) {
      setStatus(`Dashboard geöffnet, Inhalte konnten nicht vollständig geladen werden: ${error.message}`);
    }
  }

  function showApp() {
    showDashboard();
  }

  async function refreshDashboardAfterOpen() {
    try {
      contentReady = loadContent();
      await contentReady;
      showApp();
    } catch (error) {
      setStatus(`Dashboard geöffnet. Supabase-Inhalte laden später: ${error.message}`);
    }
  }

  function openDashboard() {
    showDashboard();
    refreshDashboardAfterOpen();
  }

  async function requireSession() {
    await api.ensureSupabaseLoaded?.();
    refreshClient();
    if (demoMode) return;
    const { data } = await client.auth.getSession();
    if (data.session) {
      await openDashboardForSession(data.session);
    }
  }

  if (client?.auth) {
    client.auth.onAuthStateChange((event, session) => {
      if (!session || loginInProgress || !["SIGNED_IN", "INITIAL_SESSION", "TOKEN_REFRESHED"].includes(event)) return;
      window.setTimeout(() => {
        openDashboardForSession(session);
      }, 0);
    });
  }

  const loginForm = $("#admin-login-form") || $("[data-login-form]");
  if (!loginForm) {
    loginStatus("Admin-Login konnte nicht initialisiert werden: Formular nicht gefunden.");
    console.warn("Admin login form not found.");
  }

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    loginStatus("Login wird geprüft...");
    await api.ensureSupabaseLoaded?.();
    refreshClient();
    if (demoMode) {
      const cfg = window.MELODY_SUPABASE_CONFIG || {};
      loginStatus(`Supabase ist nicht bereit. Project URL vorhanden: ${cfg.url ? "ja" : "nein"}. Anon Key vorhanden: ${cfg.anonKey ? "ja" : "nein"}. Supabase JS geladen: ${window.supabase ? "ja" : "nein"}.`);
      submitButton.disabled = false;
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      loginInProgress = true;
      const email = String(form.get("email") || "").trim().toLowerCase();
      const password = String(form.get("password") || "");
      if (email !== ADMIN_EMAIL) {
        loginStatus(`Bitte melde dich mit ${ADMIN_EMAIL} an.`);
        return;
      }
      const { data, error } = await client.auth.signInWithPassword({
        email: form.get("email"),
        password
      });
      if (error) {
        loginStatus(readableAuthError(error));
        console.warn("Supabase admin login failed:", error);
        return;
      }
      await openDashboardForSession(data?.session || { user: data?.user });
    } catch (error) {
      loginStatus(readableAuthError(error));
      console.warn("Supabase admin login exception:", error);
    } finally {
      loginInProgress = false;
      submitButton.disabled = false;
    }
  });

  $("[data-reset-password]")?.addEventListener("click", async () => {
    await api.ensureSupabaseLoaded?.();
    refreshClient();
    if (demoMode) {
      loginStatus("Passwort-Reset nicht möglich: Supabase ist nicht verbunden oder die Supabase JS-Bibliothek wurde nicht geladen.");
      return;
    }
    try {
      loginStatus("Passwort-Reset wird gesendet...");
      const { error } = await client.auth.resetPasswordForEmail(ADMIN_EMAIL, {
        redirectTo: `${location.origin}${location.pathname}`
      });
      if (error) {
        loginStatus(`Passwort-Reset fehlgeschlagen: ${error.message}`);
        console.warn("Supabase password reset failed:", error);
        return;
      }
      loginStatus(`Passwort-Reset wurde an ${ADMIN_EMAIL} gesendet. Prüfe dein Postfach.`);
    } catch (error) {
      loginStatus(`Passwort-Reset fehlgeschlagen: ${error.message}`);
      console.warn("Supabase password reset exception:", error);
    }
  });

  $("[data-demo-admin]").addEventListener("click", async () => {
    loginStatus("Demo-Dashboard wird geöffnet...");
    forcedDemoMode = true;
    demoMode = true;
    state = clone(window.MELODY_DEMO_CONTENT);
    settings = clone(window.MELODY_DEMO_CONTENT.settings);
    openDashboard();
  });
  $("[data-logout]").addEventListener("click", async (event) => {
    const ok = await runAdminAction(event.currentTarget, "Logout läuft...", "Logout erfolgreich.", async () => {
      if (client) {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      }
    });
    if (ok) location.reload();
  });
  $("[data-refresh]").addEventListener("click", async (event) => {
    await runAdminAction(event.currentTarget, "Inhalte werden neu geladen...", "Inhalte wurden neu geladen.", async () => {
      contentReady = loadContent();
      state = await contentReady;
      state.orders = await fetchOrders();
      settings = clone(state.settings);
      fillSettingsForms();
      Object.keys(tables).forEach(renderCrud);
      renderOrders();
      renderDashboard(false);
    });
  });

  ensureDashboardShell();
  $(".admin-sidebar").addEventListener("click", (event) => {
    const button = event.target.closest("[data-section]");
    if (!button) return;
    selectSection(button.dataset.section);
  });

  function fillForm(form, values) {
    if (!form) return;
    Object.entries(values || {}).forEach(([key, value]) => {
      const input = form.elements[key];
      if (!input) return;
      if (input.type === "checkbox") input.checked = Boolean(value);
      else if (input.type === "file") input.value = "";
      else input.value = value ?? "";
    });
  }

  function readForm(form, fields) {
    const data = {};
    fields.forEach(([key, , type]) => {
      const input = form.elements[key];
      if (!input) return;
      if (type === "checkbox") data[key] = input.checked;
      else if (type === "number") data[key] = Number(input.value || 0);
      else if (key === "tags") data[key] = input.value.split(",").map((tag) => tag.trim()).filter(Boolean);
      else data[key] = input.value;
    });
    return data;
  }

  function parseLines(value, mapper) {
    return String(value || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map(mapper)
      .filter(Boolean);
  }

  function boolFromText(value) {
    return !["false", "0", "nein", "no", "inaktiv", "aus"].includes(String(value || "").trim().toLowerCase());
  }

  function formatNavItems(items) {
    return (items || []).map((item) => `${item.label || ""} | ${item.href || ""} | ${item.active === false ? "false" : "true"}`).join("\n");
  }

  function parseNavItems(value) {
    return parseLines(value, (line) => {
      const [label, href, active] = line.split("|").map((part) => part.trim());
      if (!label || !href) return null;
      return { label, href, active: boolFromText(active), className: /karte gestalten|bestellung|anfrage/i.test(label) ? "nav-order" : "" };
    });
  }

  function formatAboutCards(cards) {
    return (cards || []).map((item) => `${item.title || ""} | ${item.text || ""} | ${item.active === false ? "false" : "true"}`).join("\n");
  }

  function parseAboutCards(value) {
    return parseLines(value, (line) => {
      const [title, text, active] = line.split("|").map((part) => part.trim());
      if (!title || !text) return null;
      return { title, text, active: boolFromText(active) };
    });
  }

  function formatNumberedItems(items) {
    return (items || []).map((item) => `${item.number || ""} | ${item.title || ""} | ${item.text || ""} | ${item.active === false ? "false" : "true"}`).join("\n");
  }

  function parseNumberedItems(value) {
    return parseLines(value, (line) => {
      const [number, title, text, active] = line.split("|").map((part) => part.trim());
      if (!title || !text) return null;
      return { number, title, text, active: boolFromText(active) };
    });
  }

  function formatExampleItems(items) {
    return (items || []).map((item) => `${item.category || ""} | ${item.text || ""} | ${item.active === false ? "false" : "true"}`).join("\n");
  }

  function parseExampleItems(value) {
    return parseLines(value, (line) => {
      const [category, text, active] = line.split("|").map((part) => part.trim());
      if (!category || !text) return null;
      return { category, text, active: boolFromText(active) };
    });
  }

  function lineList(value) {
    return String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
  }

  function fillSettingsForms() {
    fillForm($("[data-settings-form]"), settings.content);
    fillForm($("[data-contact-form]"), settings.content);
    fillForm($("[data-design-form]"), settings.design);
    fillForm($("[data-about-form]"), settings.content);
    fillForm($("[data-legal-form]"), settings.content);
    const navForm = $("[data-navigation-form]");
    if (navForm) navForm.elements.navItemsText.value = formatNavItems(settings.content.navItems || window.MELODY_DEMO_CONTENT.settings.content.navItems);
    const aboutForm = $("[data-about-form]");
    if (aboutForm) aboutForm.elements.aboutCardsText.value = formatAboutCards(settings.content.aboutCards || []);
    const legalForm = $("[data-legal-form]");
    if (legalForm) {
      const legal = settings.content.legalPages || {};
      ["impressum", "datenschutz", "agb", "widerruf", "versand"].forEach((key) => {
        if (legalForm.elements[key]) legalForm.elements[key].value = legal[key] || "";
      });
    }
    const configForm = $("[data-configurator-form]");
    if (configForm) {
      const cfg = settings.content.configurator || window.MELODY_DEMO_CONTENT.settings.content.configurator;
      configForm.elements.backText.value = cfg.backText || "Zurück";
      configForm.elements.nextText.value = cfg.nextText || "Weiter";
      configForm.elements.submitText.value = cfg.submitText || "Anfrage senden";
      configForm.elements.recipientForOptions.value = (cfg.steps?.recipientFor?.options || []).join("\n");
      configForm.elements.occasionOptions.value = (cfg.steps?.occasion?.options || []).join("\n");
      configForm.elements.includedOptions.value = (cfg.steps?.included?.options || []).join("\n");
      configForm.elements.configuratorJson.value = JSON.stringify(cfg, null, 2);
    }
    renderMediaList();
    const settingsForm = $("[data-settings-form]");
    if (settingsForm) {
      settingsForm.elements.promiseItemsText.value = formatNumberedItems(settings.content.promiseItems || []);
      settingsForm.elements.processStepsText.value = formatNumberedItems(settings.content.processSteps || []);
      settingsForm.elements.exampleItemsText.value = formatExampleItems(settings.content.exampleItems || []);
    }
  }

  async function uploadMaybe(fileInput, folder) {
    if (!fileInput?.files?.[0]) return "";
    if (demoMode) {
      setStatus("Upload benötigt Supabase. Im Demo-Modus bleibt die lokale Vorschau unverändert.");
      return "";
    }
    const file = fileInput.files[0];
    setStatus(`Bild wird hochgeladen: ${file.name}`, { persist: true });
    try {
      return await api.uploadFile(file, folder);
    } catch (error) {
      throw new Error(`Upload fehlgeschlagen (${file.name}): ${readableAdminError(error)}`);
    }
  }

  async function saveSettings(patch, folder, form, label = "Startseite") {
    refreshClient();
    const logoUrl = await uploadMaybe(form?.elements.logoImageFile, "logos");
    const faviconUrl = await uploadMaybe(form?.elements.faviconImageFile, "favicons");
    const heroUrl = await uploadMaybe(form?.elements.heroImageFile, "hero");
    const aboutUrl = await uploadMaybe(form?.elements.aboutImageFile, "about");
    if (logoUrl) patch.logoImage = logoUrl;
    if (faviconUrl) patch.faviconImage = faviconUrl;
    if (heroUrl) patch.heroImage = heroUrl;
    if (aboutUrl) patch.aboutImage = aboutUrl;
    settings.content = { ...settings.content, ...patch };
    if (demoMode) {
      fillSettingsForms();
      setStatus("Demo gespeichert. Für echtes Speichern Supabase verbinden.");
      return;
    }
    setStatus(`${label} wird in Supabase gespeichert...`, { persist: true });
    const { error } = await client.from("site_settings").upsert({ id: 1, content: settings.content, design: settings.design, updated_at: new Date().toISOString() });
    if (error) throw error;
    fillSettingsForms();
  }

  $("[data-settings-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await runAdminAction(form, "Startseite wird gespeichert...", "Startseite wurde erfolgreich gespeichert.", async () => {
      const fields = [
        "logoText", "heroEyebrow", "heroTitleLine1", "heroTitleLine2", "heroText", "primaryButtonText", "primaryButtonHref", "secondaryButtonText", "secondaryButtonHref",
        "introEyebrow", "introTitle", "introText", "processEyebrow", "processTitle", "processText", "productsEyebrow", "productsTitle", "productsText",
        "examplesEyebrow", "examplesTitle", "examplesText", "galleryEyebrow", "galleryTitle", "galleryText", "faqEyebrow", "faqTitle", "orderEyebrow", "orderTitle", "orderText"
      ];
      const patch = Object.fromEntries(fields.map((key) => [key, form.elements[key].value]));
      patch.promiseItems = parseNumberedItems(form.elements.promiseItemsText.value);
      patch.processSteps = parseNumberedItems(form.elements.processStepsText.value);
      patch.exampleItems = parseExampleItems(form.elements.exampleItemsText.value);
      await saveSettings(patch, "hero", form, "Startseite");
    });
  });

  $("[data-contact-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await runAdminAction(form, "Kontaktdaten werden gespeichert...", "Kontaktdaten wurden erfolgreich gespeichert.", async () => {
      const fields = ["contactTitle", "contactText", "contactEmail", "contactPhone", "contactAddress", "whatsappNumber", "whatsappMessage", "socialInstagram", "socialTikTok", "socialYouTube", "footerText"];
      await saveSettings(Object.fromEntries(fields.map((key) => [key, form.elements[key].value])), "contact", form, "Kontaktdaten");
    });
  });

  $("[data-about-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await runAdminAction(form, "Über uns wird gespeichert...", "Über uns wurde erfolgreich gespeichert.", async () => {
      const fields = ["aboutEyebrow", "aboutTitle", "aboutText"];
      const patch = Object.fromEntries(fields.map((key) => [key, form.elements[key].value]));
      patch.aboutCards = parseAboutCards(form.elements.aboutCardsText.value);
      await saveSettings(patch, "about", form, "Über uns");
    });
  });

  $("[data-navigation-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await runAdminAction(form, "Navigation wird gespeichert...", "Navigation wurde erfolgreich gespeichert.", async () => {
      await saveSettings({ navItems: parseNavItems(form.elements.navItemsText.value) }, "navigation", form, "Navigation");
    });
  });

  $("[data-configurator-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await runAdminAction(form, "Konfigurator wird gespeichert...", "Konfigurator wurde erfolgreich gespeichert.", async () => {
      const current = settings.content.configurator || window.MELODY_DEMO_CONTENT.settings.content.configurator;
      let jsonConfig = {};
      const rawJson = form.elements.configuratorJson.value.trim();
      if (rawJson) {
        try {
          jsonConfig = JSON.parse(rawJson);
        } catch (error) {
          throw new Error(`Konfigurator JSON ist ungültig: ${error.message}`);
        }
      }
      const base = { ...current, ...jsonConfig };
      const baseSteps = { ...(current.steps || {}), ...(jsonConfig.steps || {}) };
      const configurator = {
        ...base,
        backText: form.elements.backText.value,
        nextText: form.elements.nextText.value,
        submitText: form.elements.submitText.value,
        steps: {
          ...baseSteps,
          recipientFor: { ...(baseSteps.recipientFor || {}), options: lineList(form.elements.recipientForOptions.value) },
          occasion: { ...(baseSteps.occasion || {}), options: lineList(form.elements.occasionOptions.value) },
          included: { ...(baseSteps.included || {}), options: lineList(form.elements.includedOptions.value) }
        }
      };
      await saveSettings({ configurator }, "configurator", form, "Konfigurator");
    });
  });

  $("[data-legal-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await runAdminAction(form, "Rechtliches wird gespeichert...", "Rechtliches wurde erfolgreich gespeichert.", async () => {
      const legalPages = {
        impressum: form.elements.impressum.value,
        datenschutz: form.elements.datenschutz.value,
        agb: form.elements.agb.value,
        widerruf: form.elements.widerruf.value,
        versand: form.elements.versand.value
      };
      await saveSettings({
        legalEyebrow: form.elements.legalEyebrow.value,
        legalTitle: form.elements.legalTitle.value,
        legalText: form.elements.legalText.value,
        legalPages
      }, "legal", form, "Rechtliches");
    });
  });

  $("[data-design-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await runAdminAction(form, "Design wird gespeichert...", demoMode ? "Demo-Design aktualisiert." : "Design wurde erfolgreich gespeichert.", async () => {
      settings.design = {
        gold: form.elements.gold.value,
        gold2: form.elements.gold2.value,
        background: form.elements.background.value,
        text: form.elements.text.value,
        muted: form.elements.muted.value
      };
      if (!demoMode) {
        const { error } = await client.from("site_settings").upsert({ id: 1, content: settings.content, design: settings.design, updated_at: new Date().toISOString() });
        if (error) throw error;
      }
    });
  });

  function fieldInput([key, label, type]) {
    if (type === "textarea") return `<label class="span-all">${label}<textarea name="${key}" rows="3"></textarea></label>`;
    if (type === "checkbox") return `<label>${label}<input name="${key}" type="checkbox" /></label>`;
    return `<label>${label}<input name="${key}" type="${type}" /></label>`;
  }

  function renderCrud(kind) {
    const cfg = tables[kind];
    const host = document.querySelector(`[data-crud="${kind}"]`);
    const items = state[cfg.collection] || [];
    host.innerHTML = `
      <div class="crud-header"><div><p class="eyebrow">${cfg.title}</p><h3>${cfg.title} bearbeiten</h3></div><button class="btn btn-primary" type="button" data-new="${kind}">Neu</button></div>
      <form class="crud-editor" data-editor="${kind}">
        <h3 data-editor-title="${kind}">Neuer Eintrag</h3>
        ${cfg.fields.map(fieldInput).join("")}
        <label class="span-all">Bild hochladen<input name="upload" type="file" accept="image/*" /></label>
        <button class="btn btn-primary" type="submit">Speichern</button>
      </form>
      <div class="crud-list">${items.map((item) => crudRow(kind, item)).join("")}</div>
    `;
    const form = host.querySelector(`[data-editor="${kind}"]`);
    const active = form.elements.active;
    if (active) active.checked = true;
    form.addEventListener("submit", (event) => saveCrud(event, kind));
    host.querySelector(`[data-new="${kind}"]`).addEventListener("click", () => {
      editing[kind] = null;
      form.reset();
      const active = form.elements.active;
      if (active) active.checked = true;
      host.querySelector(`[data-editor-title="${kind}"]`).textContent = "Neuer Eintrag";
      setStatus(`${cfg.title}: Neuer Eintrag bereit.`);
    });
    host.querySelectorAll("[data-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = items.find((entry) => String(entry.id) === button.dataset.edit);
        if (!item) {
          setStatus(`${cfg.title}: Eintrag nicht gefunden. Bitte Inhalte neu laden.`, { error: true, persist: true });
          return;
        }
        editing[kind] = item;
        fillForm(form, { ...item, tags: Array.isArray(item.tags) ? item.tags.join(", ") : item.tags });
        host.querySelector(`[data-editor-title="${kind}"]`).textContent = "Eintrag bearbeiten";
        setStatus(`${cfg.title}: Eintrag geladen. Änderungen bearbeiten und speichern.`);
      });
    });
    host.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", () => deleteCrud(kind, button.dataset.delete, button));
    });
  }

  function crudRow(kind, item) {
    const title = item.title || item.question || item.name || "Eintrag";
    const text = item.description || item.answer || item.text || item.price || "";
    const img = item.image_url || "assets/images/premium-card-detail.png";
    const thumb = img.startsWith("http") ? img : `../${img}`;
    return `
      <article class="crud-row">
        <div class="crud-thumb" style="--photo:url('${thumb}')"></div>
        <div><strong>${title}</strong><p>${text}</p></div>
        <div class="crud-row-actions">
          <button class="mini-btn" type="button" data-edit="${item.id}">Bearbeiten</button>
          <button class="mini-btn danger" type="button" data-delete="${item.id}">Löschen</button>
        </div>
      </article>`;
  }

  function renderMediaList() {
    const host = $("[data-media-list]");
    if (!host) return;
    const media = settings.content.mediaLibrary || [];
    host.innerHTML = `
      <div class="crud-header"><div><p class="eyebrow">Bilder</p><h3>Gespeicherte Bilder</h3></div></div>
      <div class="crud-list">
        ${media.length ? media.map((item) => `
          <article class="crud-row">
            <div class="crud-thumb" style="--photo:url('${escapeHtml(item.url || "")}')"></div>
            <div><strong>${escapeHtml(item.title || "Bild")}</strong><p>${escapeHtml(item.alt || "")}<br>${escapeHtml(item.category || "")}</p></div>
            <div class="crud-row-actions">
              <a class="mini-btn" href="${escapeHtml(item.url || "#")}" target="_blank" rel="noreferrer">Öffnen</a>
              <button class="mini-btn danger" type="button" data-media-delete="${escapeHtml(item.id)}">Entfernen</button>
            </div>
          </article>
        `).join("") : `<p class="form-status">Noch keine Bilder gespeichert.</p>`}
      </div>
    `;
    host.querySelectorAll("[data-media-delete]").forEach((button) => {
      button.addEventListener("click", () => deleteMedia(button.dataset.mediaDelete, button));
    });
  }

  async function saveMedia(event) {
    event.preventDefault();
    const form = event.currentTarget;
    await runAdminAction(form, "Bild wird gespeichert...", "Bild wurde erfolgreich gespeichert.", async () => {
      refreshClient();
      const file = form.elements.file.files?.[0];
      if (!file) throw new Error("Bitte wähle zuerst ein Bild aus.");
      const url = await uploadMaybe(form.elements.file, "media");
      if (!url) throw new Error("Bild konnte nicht hochgeladen werden. Prüfe Supabase Storage oder den Bucket melody-assets.");
      const media = settings.content.mediaLibrary || [];
      media.unshift({
        id: `media-${Date.now()}`,
        title: form.elements.title.value || file.name,
        alt: form.elements.alt.value || form.elements.title.value || file.name,
        category: form.elements.category.value || "Allgemein",
        url,
        created_at: new Date().toISOString()
      });
      await saveSettings({ mediaLibrary: media }, "media", form, "Bilder");
      form.reset();
      renderMediaList();
    });
  }

  async function deleteMedia(id, button) {
    await runAdminAction(button, "Bild wird entfernt...", "Bild wurde entfernt.", async () => {
      const media = (settings.content.mediaLibrary || []).filter((item) => String(item.id) !== String(id));
      await saveSettings({ mediaLibrary: media }, "media", null, "Bilder");
      renderMediaList();
    });
  }

  async function saveCrud(event, kind) {
    event.preventDefault();
    const form = event.currentTarget;
    const cfg = tables[kind];
    await runAdminAction(form, `${cfg.title} wird gespeichert...`, `${cfg.title} wurde erfolgreich gespeichert.`, async () => {
      refreshClient();
      const row = readForm(form, cfg.fields);
      const uploaded = await uploadMaybe(form.elements.upload, cfg.folder);
      if (uploaded) row.image_url = uploaded;
      const current = editing[kind];
      row.id = current?.id && !isDemoId(current.id) ? current.id : undefined;
      if (demoMode) {
        if (current) Object.assign(current, row);
        else state[cfg.collection].push({ ...row, id: `demo-${kind}-${Date.now()}` });
        renderCrud(kind);
        return;
      }
      const { error } = await client.from(cfg.table).upsert(row);
      if (error) throw error;
      contentReady = loadContent();
      state = await contentReady;
      renderCrud(kind);
    });
  }

  $("[data-media-form]")?.addEventListener("submit", saveMedia);

  async function deleteCrud(kind, id, button) {
    const cfg = tables[kind];
    await runAdminAction(button, `${cfg.title}: Eintrag wird gelöscht...`, `${cfg.title}: Eintrag wurde gelöscht.`, async () => {
      refreshClient();
      if (demoMode || isDemoId(id)) {
        state[cfg.collection] = state[cfg.collection].filter((item) => String(item.id) !== String(id));
        renderCrud(kind);
        return;
      }
      const { error } = await client.from(cfg.table).delete().eq("id", id);
      if (error) throw error;
      contentReady = loadContent();
      state = await contentReady;
      renderCrud(kind);
    });
  }

  function renderOrders() {
    const host = $("[data-orders-list]");
    if (!host) return;
    const orders = state.orders || [];
    if (!orders.length) {
      host.innerHTML = `<p class="form-status">Noch keine Bestellungen gefunden.</p>`;
      return;
    }
    host.innerHTML = orders.map((order) => {
      const date = order.created_at ? new Date(order.created_at).toLocaleString("de-DE") : "Ohne Datum";
      const links = [
        ["Datei", order.file_url],
        ["Foto", order.image_url],
        ["Video", order.video_url],
        ["Audio", order.audio_url]
      ].filter(([, url]) => url).map(([label, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${label}</a>`).join("");
      return `
        <article class="order-row">
          <div class="order-row-head">
            <div>
              <strong>${escapeHtml(order.name || "Unbekannt")}</strong>
              <p>${escapeHtml(order.email || "")}${order.phone ? ` · ${escapeHtml(order.phone)}` : ""}</p>
            </div>
            <span>${escapeHtml(order.status || "new")}</span>
          </div>
          <p class="order-date">${escapeHtml(date)}</p>
          <p>${escapeHtml(shortText(order.card_text || order.message || ""))}</p>
          ${links ? `<div class="order-links">${links}</div>` : ""}
        </article>`;
    }).join("");
  }

  $("[data-refresh-orders]")?.addEventListener("click", async (event) => {
    await runAdminAction(event.currentTarget, "Bestellungen werden neu geladen...", "Bestellungen wurden neu geladen.", async () => {
      state.orders = await fetchOrders();
      renderOrders();
      renderDashboard(false);
    });
  });

  window.addEventListener("error", (event) => {
    setStatus(event.message, { error: true, persist: true });
    loginStatus(event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason?.message || String(event.reason || "Unbekannter JavaScript-Fehler.");
    setStatus(message, { error: true, persist: true });
    loginStatus(message);
  });
  await requireSession();
})();
