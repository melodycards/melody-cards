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
  let contentReady = loadContent();

  function refreshClient() {
    if (window.MelodySupabase) api = window.MelodySupabase;
    client = api.getClient?.() || null;
    demoMode = !client;
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
    if (!client) {
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

  function setStatus(message) {
    $("[data-admin-status]").textContent = message || "";
    if (message) setTimeout(() => ($("[data-admin-status]").textContent = ""), 3500);
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

  function renderDashboard() {
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
    selectSection("dashboard");
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
    openDashboard();
  });
  $("[data-logout]").addEventListener("click", async () => {
    if (client) await client.auth.signOut();
    location.reload();
  });
  $("[data-refresh]").addEventListener("click", async () => {
    contentReady = loadContent();
    state = await contentReady;
    state.orders = await fetchOrders();
    settings = clone(state.settings);
    fillSettingsForms();
    Object.keys(tables).forEach(renderCrud);
    renderOrders();
    renderDashboard();
    setStatus("Inhalte neu geladen.");
  });

  ensureDashboardShell();
  $(".admin-sidebar").addEventListener("click", (event) => {
    const button = event.target.closest("[data-section]");
    if (!button) return;
    selectSection(button.dataset.section);
  });

  function fillForm(form, values) {
    Object.entries(values || {}).forEach(([key, value]) => {
      const input = form.elements[key];
      if (!input) return;
      if (input.type === "checkbox") input.checked = Boolean(value);
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

  function fillSettingsForms() {
    fillForm($("[data-settings-form]"), settings.content);
    fillForm($("[data-contact-form]"), settings.content);
    fillForm($("[data-design-form]"), settings.design);
  }

  async function uploadMaybe(fileInput, folder) {
    if (!fileInput?.files?.[0]) return "";
    if (demoMode) {
      setStatus("Upload benötigt Supabase. Im Demo-Modus bleibt die lokale Vorschau unverändert.");
      return "";
    }
    return await api.uploadFile(fileInput.files[0], folder);
  }

  async function saveSettings(patch, folder, form) {
    const logoUrl = await uploadMaybe(form?.elements.logoImageFile, "logos");
    const heroUrl = await uploadMaybe(form?.elements.heroImageFile, "hero");
    if (logoUrl) patch.logoImage = logoUrl;
    if (heroUrl) patch.heroImage = heroUrl;
    settings.content = { ...settings.content, ...patch };
    if (demoMode) {
      fillSettingsForms();
      setStatus("Demo gespeichert. Für echtes Speichern Supabase verbinden.");
      return;
    }
    const { error } = await client.from("site_settings").upsert({ id: 1, content: settings.content, design: settings.design, updated_at: new Date().toISOString() });
    if (error) throw error;
    setStatus("Gespeichert.");
  }

  $("[data-settings-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = ["logoText", "heroEyebrow", "heroTitleLine1", "heroTitleLine2", "heroText", "primaryButtonText", "primaryButtonHref", "secondaryButtonText", "secondaryButtonHref"];
    const patch = Object.fromEntries(fields.map((key) => [key, form.elements[key].value]));
    await saveSettings(patch, "hero", form);
  });

  $("[data-contact-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = ["contactTitle", "contactText", "contactEmail", "whatsappNumber", "whatsappMessage", "socialInstagram", "socialTikTok", "socialYouTube", "footerText"];
    await saveSettings(Object.fromEntries(fields.map((key) => [key, form.elements[key].value])), "contact", form);
  });

  $("[data-design-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
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
    setStatus(demoMode ? "Demo-Design aktualisiert." : "Design gespeichert.");
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
    form.addEventListener("submit", (event) => saveCrud(event, kind));
    host.querySelector(`[data-new="${kind}"]`).addEventListener("click", () => {
      editing[kind] = null;
      form.reset();
      const active = form.elements.active;
      if (active) active.checked = true;
      host.querySelector(`[data-editor-title="${kind}"]`).textContent = "Neuer Eintrag";
    });
    host.querySelectorAll("[data-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = items.find((entry) => String(entry.id) === button.dataset.edit);
        editing[kind] = item;
        fillForm(form, { ...item, tags: Array.isArray(item.tags) ? item.tags.join(", ") : item.tags });
        host.querySelector(`[data-editor-title="${kind}"]`).textContent = "Eintrag bearbeiten";
      });
    });
    host.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", () => deleteCrud(kind, button.dataset.delete));
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

  async function saveCrud(event, kind) {
    event.preventDefault();
    const cfg = tables[kind];
    const form = event.currentTarget;
    const row = readForm(form, cfg.fields);
    const uploaded = await uploadMaybe(form.elements.upload, cfg.folder);
    if (uploaded) row.image_url = uploaded;
    const current = editing[kind];
    row.id = current?.id && !isDemoId(current.id) ? current.id : undefined;
    if (demoMode) {
      if (current) Object.assign(current, row);
      else state[cfg.collection].push({ ...row, id: `demo-${kind}-${Date.now()}` });
      renderCrud(kind);
      setStatus("Demo-Eintrag aktualisiert. Für echtes Speichern Supabase verbinden.");
      return;
    }
    const { error } = await client.from(cfg.table).upsert(row);
    if (error) throw error;
    contentReady = loadContent();
    state = await contentReady;
    renderCrud(kind);
    setStatus("Eintrag gespeichert.");
  }

  async function deleteCrud(kind, id) {
    const cfg = tables[kind];
    if (demoMode || isDemoId(id)) {
      state[cfg.collection] = state[cfg.collection].filter((item) => String(item.id) !== String(id));
      renderCrud(kind);
      setStatus("Demo-Eintrag gelöscht.");
      return;
    }
    const { error } = await client.from(cfg.table).delete().eq("id", id);
    if (error) throw error;
    contentReady = loadContent();
    state = await contentReady;
    renderCrud(kind);
    setStatus("Eintrag gelöscht.");
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

  $("[data-refresh-orders]")?.addEventListener("click", async () => {
    state.orders = await fetchOrders();
    renderOrders();
    renderDashboard();
    setStatus("Bestellungen neu geladen.");
  });

  window.addEventListener("error", (event) => {
    setStatus(event.message);
    loginStatus(event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason?.message || String(event.reason || "Unbekannter JavaScript-Fehler.");
    setStatus(message);
    loginStatus(message);
  });
  await requireSession();
})();
