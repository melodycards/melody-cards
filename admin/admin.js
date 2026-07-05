(async function () {
  const ADMIN_EMAIL = "koglu@hotmail.de";
  const defaults = window.MELODY_DEFAULT_SITE || window.MELODY_DEMO_CONTENT;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  let api = window.MelodySupabase;
  let client = null;
  let state = clone(defaults);
  let content = clone(defaults.settings.content);
  let demoMode = true;
  let editing = {};

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const escape = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  const sorted = (items = []) => [...items].sort((a, b) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0));

  function setStatus(message, stateName = "") {
    const node = $("[data-admin-status]");
    if (!node) return;
    node.textContent = message || "";
    node.dataset.state = stateName;
  }

  function loginStatus(message) {
    const node = $("[data-login-status]");
    if (node) node.textContent = message || "";
  }

  async function refreshClient() {
    await api.ensureSupabaseLoaded?.();
    client = api.getClient?.() || null;
    demoMode = !client;
    return client;
  }

  async function loadSite() {
    await refreshClient();
    state = await api.fetchContent().catch(() => clone(defaults));
    content = mergeContent(defaults.settings.content, state.settings?.content || {});
    return content;
  }

  function mergeContent(base, remote) {
    return {
      ...clone(base),
      ...clone(remote || {}),
      seo: { ...base.seo, ...(remote?.seo || {}) },
      brand: { ...base.brand, ...(remote?.brand || {}) },
      theme: {
        ...base.theme,
        ...(remote?.theme || {}),
        colors: { ...base.theme.colors, ...(remote?.theme?.colors || {}) },
        typography: { ...base.theme.typography, ...(remote?.theme?.typography || {}) },
        layout: { ...base.theme.layout, ...(remote?.theme?.layout || {}) },
        motion: { ...base.theme.motion, ...(remote?.theme?.motion || {}) }
      },
      contact: { ...base.contact, ...(remote?.contact || {}) },
      footer: { ...base.footer, ...(remote?.footer || {}) },
      legalPages: { ...base.legalPages, ...(remote?.legalPages || {}) }
    };
  }

  async function saveSite(label = "Website") {
    setStatus(`${label} wird gespeichert...`);
    if (demoMode) {
      state.settings.content = clone(content);
      renderAll();
      setStatus(`${label} wurde im Demo-Modus gespeichert.`, "success");
      return true;
    }
    const { error } = await client.from("site_settings").upsert({
      id: 1,
      content,
      design: state.settings?.design || {},
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
    setStatus(`${label} wurde gespeichert.`, "success");
    return true;
  }

  async function action(label, fn) {
    try {
      await fn();
    } catch (error) {
      console.warn(error);
      setStatus(`${label} fehlgeschlagen: ${error.message || error}`, "error");
    }
  }

  function showDashboard() {
    $("[data-login]").hidden = true;
    $("[data-admin-app]").hidden = false;
    $("[data-mode-label]").textContent = demoMode ? "Demo-Modus" : "Supabase verbunden";
    renderAll();
  }

  async function openForSession(session) {
    if (!session?.user?.email || session.user.email.toLowerCase() !== ADMIN_EMAIL) {
      loginStatus(`Bitte mit ${ADMIN_EMAIL} anmelden.`);
      return;
    }
    await loadSite();
    showDashboard();
  }

  $("#admin-login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await action("Login", async () => {
      loginStatus("Login wird geprüft...");
      await refreshClient();
      if (!client) throw new Error("Supabase konnte nicht geladen werden.");
      const form = new FormData(event.currentTarget);
      const { data, error } = await client.auth.signInWithPassword({ email: String(form.get("email")).trim(), password: String(form.get("password")) });
      if (error) throw error;
      loginStatus("Login erfolgreich.");
      await openForSession(data.session || { user: data.user });
    });
  });

  $("[data-demo-admin]")?.addEventListener("click", async () => {
    demoMode = true;
    content = clone(defaults.settings.content);
    showDashboard();
  });

  $("[data-logout]")?.addEventListener("click", async () => {
    if (client) await client.auth.signOut();
    location.reload();
  });

  $(".admin-sidebar")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-section]");
    if (!button) return;
    selectPanel(button.dataset.section);
  });

  function selectPanel(name) {
    $$("[data-section]").forEach((button) => button.classList.toggle("is-active", button.dataset.section === name));
    $$("[data-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
    $("[data-admin-title]").textContent = $(`[data-section="${name}"]`)?.textContent || "Admin";
  }

  function renderAll() {
    renderDashboard();
    renderBrand();
    renderTheme();
    renderSeo();
    renderNavigation();
    renderSections();
    renderCollection("products", productFields());
    renderCollection("gallery", galleryFields());
    renderCollection("reviews", reviewFields());
    renderCollection("faqs", faqFields());
    renderContact();
    renderLegal();
    renderMedia();
    renderOrders();
    renderDatabase();
  }

  function card(title, inner) {
    return `<div class="admin-card"><h3>${escape(title)}</h3>${inner}</div>`;
  }

  function renderDashboard() {
    $('[data-panel="dashboard"]').innerHTML = `<div class="admin-grid">
      ${card("Inhalte", `<p>Produkte: ${content.products?.length || 0}</p><p>Galerie: ${content.gallery?.length || 0}</p><p>Bewertungen: ${content.reviews?.length || 0}</p><p>FAQ: ${content.faqs?.length || 0}</p>`)}
      ${card("Workflow", `<p>Bearbeite Inhalte links. Speichern schreibt alles in Supabase <code>site_settings.content</code>.</p><button class="btn btn-primary" type="button" data-save-all>Alles speichern</button>`)}
    </div>`;
    $('[data-save-all]')?.addEventListener("click", () => action("Speichern", () => saveSite("Website")));
  }

  function renderBrand() {
    $('[data-panel="brand"]').innerHTML = card("Logo & Brand", `<form data-brand-form class="admin-grid">
      ${input("brand.name", "Markenname", content.brand.name)}
      ${input("brand.logoText", "Logo Text", content.brand.logoText)}
      ${input("brand.logoImage", "Logo Bild URL", content.brand.logoImage)}
      ${file("logoUpload", "Logo hochladen")}
      ${input("brand.footerText", "Footer Text", content.brand.footerText, "textarea")}
      <button class="btn btn-primary span-all" type="submit">Brand speichern</button>
    </form>`);
    $('[data-brand-form]').addEventListener("submit", (event) => saveForm(event, "Brand", async (form) => {
      await uploadInto(form.logoUpload, "brand", (url) => content.brand.logoImage = url);
      readPathForm(form);
    }));
  }

  function renderTheme() {
    const c = content.theme.colors, t = content.theme.typography, l = content.theme.layout, m = content.theme.motion;
    $('[data-panel="theme"]').innerHTML = card("Design komplett bearbeiten", `<form data-theme-form class="admin-grid">
      ${Object.keys(c).map((key) => input(`theme.colors.${key}`, `Farbe: ${key}`, c[key], "color")).join("")}
      ${input("theme.typography.headingFont", "Google Font Überschriften", t.headingFont)}
      ${input("theme.typography.bodyFont", "Google Font Text", t.bodyFont)}
      ${input("theme.typography.heroSize", "Hero Schriftgröße", t.heroSize, "number")}
      ${input("theme.typography.headingSize", "Überschrift Größe", t.headingSize, "number")}
      ${input("theme.typography.bodySize", "Textgröße", t.bodySize, "number")}
      ${input("theme.typography.weightHeading", "Überschrift Stärke", t.weightHeading, "number")}
      ${input("theme.typography.weightBody", "Text Stärke", t.weightBody, "number")}
      ${input("theme.layout.maxWidth", "Max Breite", l.maxWidth, "number")}
      ${input("theme.layout.sectionPadding", "Section Abstand", l.sectionPadding, "number")}
      ${input("theme.layout.radius", "Rundung", l.radius, "number")}
      ${input("theme.layout.buttonRadius", "Button Rundung", l.buttonRadius, "number")}
      ${input("theme.layout.cardShadow", "Schatten Stärke", l.cardShadow, "number")}
      ${checkbox("theme.motion.enabled", "Animationen aktiv", m.enabled)}
      ${checkbox("theme.motion.parallax", "Parallax aktiv", m.parallax)}
      ${input("theme.motion.duration", "Animationsdauer", m.duration, "number")}
      <button class="btn btn-primary span-all" type="submit">Design speichern</button>
    </form>`);
    $('[data-theme-form]').addEventListener("submit", (event) => saveForm(event, "Design", readPathForm));
  }

  function renderSeo() {
    $('[data-panel="seo"]').innerHTML = card("SEO & Open Graph", `<form data-seo-form class="admin-grid">
      ${input("seo.title", "Meta Titel", content.seo.title)}
      ${input("seo.description", "Meta Beschreibung", content.seo.description, "textarea")}
      ${input("seo.ogTitle", "Open Graph Titel", content.seo.ogTitle)}
      ${input("seo.ogDescription", "Open Graph Beschreibung", content.seo.ogDescription, "textarea")}
      ${input("seo.ogImage", "Open Graph Bild URL", content.seo.ogImage)}
      ${file("ogUpload", "OG Bild hochladen")}
      ${input("seo.favicon", "Favicon URL", content.seo.favicon)}
      ${file("faviconUpload", "Favicon hochladen")}
      <button class="btn btn-primary span-all" type="submit">SEO speichern</button>
    </form>`);
    $('[data-seo-form]').addEventListener("submit", (event) => saveForm(event, "SEO", async (form) => {
      await uploadInto(form.ogUpload, "seo", (url) => content.seo.ogImage = url);
      await uploadInto(form.faviconUpload, "favicons", (url) => content.seo.favicon = url);
      readPathForm(form);
    }));
  }

  function renderNavigation() {
    renderJsonPanel("navigation", "Navigation bearbeiten", "navigation", content.navigation);
  }

  function renderSections() {
    renderJsonPanel("sections", "Startseiten-Bereiche bearbeiten", "sections", content.sections);
  }

  function renderContact() {
    $('[data-panel="contact"]').innerHTML = card("Kontakt & Social Media", `<form data-contact-form class="admin-grid">
      ${input("contact.email", "E-Mail", content.contact.email)}
      ${input("contact.phone", "Telefon", content.contact.phone)}
      ${input("contact.address", "Adresse", content.contact.address, "textarea")}
      ${input("contact.whatsappNumber", "WhatsApp Nummer", content.contact.whatsappNumber)}
      ${input("contact.instagram", "Instagram", content.contact.instagram)}
      ${input("contact.tiktok", "TikTok", content.contact.tiktok)}
      ${input("contact.youtube", "YouTube", content.contact.youtube)}
      <button class="btn btn-primary span-all" type="submit">Kontakt speichern</button>
    </form>`);
    $('[data-contact-form]').addEventListener("submit", (event) => saveForm(event, "Kontakt", readPathForm));
  }

  function renderLegal() {
    $('[data-panel="legal"]').innerHTML = card("Rechtliche Seiten", `<form data-legal-form class="admin-grid">
      ${input("legalPages.impressum", "Impressum HTML/Text", content.legalPages.impressum, "textarea")}
      ${input("legalPages.datenschutz", "Datenschutz HTML/Text", content.legalPages.datenschutz, "textarea")}
      ${input("legalPages.agb", "AGB HTML/Text", content.legalPages.agb, "textarea")}
      ${input("legalPages.widerruf", "Widerruf HTML/Text", content.legalPages.widerruf, "textarea")}
      ${input("legalPages.versand", "Versand & Zahlung HTML/Text", content.legalPages.versand, "textarea")}
      <button class="btn btn-primary span-all" type="submit">Rechtliches speichern</button>
    </form>`);
    $('[data-legal-form]').addEventListener("submit", (event) => saveForm(event, "Rechtliches", readPathForm));
  }

  function renderJsonPanel(panel, title, key, value) {
    $(`[data-panel="${panel}"]`).innerHTML = card(title, `<form data-json-form="${key}"><textarea class="json-editor" name="json">${escape(JSON.stringify(value || [], null, 2))}</textarea><button class="btn btn-primary" type="submit">${title} speichern</button></form>`);
    $(`[data-json-form="${key}"]`).addEventListener("submit", (event) => {
      event.preventDefault();
      action(title, async () => {
        content[key] = JSON.parse(event.currentTarget.elements.json.value);
        await saveSite(title);
      });
    });
  }

  function renderCollection(key, fields) {
    const panel = $(`[data-panel="${key}"]`);
    const items = content[key] || [];
    panel.innerHTML = `<div class="admin-grid">
      ${card(`${labelFor(key)} bearbeiten`, `<form data-item-form="${key}" class="admin-grid">${fields.map((f) => fieldInput(f)).join("")}<button class="btn btn-primary span-all" type="submit">Speichern</button></form>`)}
      ${card(`${labelFor(key)} Liste`, `<button class="btn btn-glass" type="button" data-new-item="${key}">Neu</button><div class="admin-list">${sorted(items).map((item) => row(key, item)).join("")}</div>`)}
    </div>`;
    panel.querySelector(`[data-item-form="${key}"]`).addEventListener("submit", (event) => saveItem(event, key, fields));
    panel.querySelector(`[data-new-item="${key}"]`).addEventListener("click", () => {
      editing[key] = null;
      panel.querySelector(`[data-item-form="${key}"]`).reset();
      setStatus(`${labelFor(key)}: Neuer Eintrag bereit.`);
    });
    panel.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => editItem(key, button.dataset.edit, fields)));
    panel.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deleteItem(key, button.dataset.delete)));
    panel.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => moveItem(key, button.dataset.move, Number(button.dataset.direction))));
  }

  function productFields() {
    return [["title","Titel"],["description","Beschreibung","textarea"],["price","Preis"],["discount","Rabatt"],["category","Kategorie"],["status","Status"],["featured","Empfohlen","checkbox"],["sortOrder","Reihenfolge","number"],["imagesText","Bild-URLs, eine pro Zeile","textarea"],["upload","Bild hochladen","file"]];
  }
  function galleryFields() {
    return [["title","Titel"],["alt","Alt Text"],["category","Kategorie"],["sortOrder","Reihenfolge","number"],["active","Aktiv","checkbox"],["url","Bild URL"],["upload","Bild hochladen","file"]];
  }
  function reviewFields() {
    return [["name","Name"],["text","Text","textarea"],["rating","Sterne","number"],["sortOrder","Reihenfolge","number"],["active","Aktiv","checkbox"],["photo","Foto URL"],["upload","Foto hochladen","file"]];
  }
  function faqFields() {
    return [["question","Frage"],["answer","Antwort","textarea"],["sortOrder","Reihenfolge","number"],["active","Aktiv","checkbox"]];
  }

  function row(key, item) {
    const image = item.url || item.photo || item.images?.[0] || "";
    return `<article class="admin-row"><img class="admin-thumb" src="${escape(image)}" alt="" /><div><strong>${escape(item.title || item.name || item.question || item.id)}</strong><p>${escape(item.description || item.text || item.answer || "")}</p></div><div class="admin-actions"><button class="mini-btn" data-edit="${escape(item.id)}">Bearbeiten</button><button class="mini-btn" data-move="${escape(item.id)}" data-direction="-1">↑</button><button class="mini-btn" data-move="${escape(item.id)}" data-direction="1">↓</button><button class="mini-btn danger" data-delete="${escape(item.id)}">Löschen</button></div></article>`;
  }

  function editItem(key, id, fields) {
    const item = (content[key] || []).find((entry) => String(entry.id) === String(id));
    if (!item) return;
    editing[key] = item;
    const form = $(`[data-item-form="${key}"]`);
    fields.forEach(([name, , type]) => {
      if (!form.elements[name]) return;
      if (name === "imagesText") form.elements[name].value = (item.images || []).join("\n");
      else if (type === "checkbox") form.elements[name].checked = Boolean(item[name]);
      else if (type !== "file") form.elements[name].value = item[name] ?? "";
    });
    setStatus(`${labelFor(key)} geladen.`);
  }

  async function saveItem(event, key, fields) {
    event.preventDefault();
    await action(labelFor(key), async () => {
      const form = event.currentTarget;
      const item = editing[key] || { id: uid(key), active: true, status: "active" };
      for (const [name, , type] of fields) {
        if (type === "file") continue;
        if (!form.elements[name]) continue;
        if (name === "imagesText") item.images = form.elements[name].value.split("\n").map((line) => line.trim()).filter(Boolean);
        else if (type === "checkbox") item[name] = form.elements[name].checked;
        else if (type === "number") item[name] = Number(form.elements[name].value || 0);
        else item[name] = form.elements[name].value;
      }
      await uploadInto(form.elements.upload, key, (url) => {
        if (key === "products") item.images = [url, ...(item.images || [])];
        else if (key === "gallery") item.url = url;
        else if (key === "reviews") item.photo = url;
      });
      content[key] = content[key] || [];
      if (!editing[key]) content[key].push(item);
      editing[key] = null;
      await saveSite(labelFor(key));
    });
  }

  async function deleteItem(key, id) {
    await action(labelFor(key), async () => {
      content[key] = (content[key] || []).filter((item) => String(item.id) !== String(id));
      await saveSite(labelFor(key));
    });
  }

  async function moveItem(key, id, direction) {
    await action(labelFor(key), async () => {
      const items = sorted(content[key] || []);
      const index = items.findIndex((item) => String(item.id) === String(id));
      const target = index + direction;
      if (index < 0 || target < 0 || target >= items.length) return;
      [items[index], items[target]] = [items[target], items[index]];
      items.forEach((item, order) => item.sortOrder = order + 1);
      content[key] = items;
      await saveSite(labelFor(key));
    });
  }

  function renderMedia() {
    $('[data-panel="media"]').innerHTML = card("Bilder hochladen", `<form data-media-form class="admin-grid">${input("title","Titel","")}${input("alt","Alt Text","")}${input("category","Kategorie","")}${file("upload","Bild")}<button class="btn btn-primary span-all" type="submit">Bild speichern</button></form><div class="admin-list">${(content.mediaLibrary || []).map((item) => `<article class="admin-row"><img class="admin-thumb" src="${escape(item.url)}" alt="" /><div><strong>${escape(item.title || "Bild")}</strong><p>${escape(item.alt || item.category || "")}</p></div><div class="admin-actions"><a class="mini-btn" href="${escape(item.url)}" target="_blank" rel="noreferrer">Öffnen</a><button class="mini-btn danger" data-delete-media="${escape(item.id)}">Entfernen</button></div></article>`).join("")}</div>`);
    $('[data-media-form]').addEventListener("submit", async (event) => {
      event.preventDefault();
      await action("Bild", async () => {
        const form = event.currentTarget;
        let uploaded = "";
        await uploadInto(form.upload, "media", (url) => uploaded = url);
        if (!uploaded) throw new Error("Bitte ein Bild auswählen.");
        content.mediaLibrary = content.mediaLibrary || [];
        content.mediaLibrary.unshift({ id: uid("media"), title: form.title.value, alt: form.alt.value, category: form.category.value, url: uploaded, active: true, sortOrder: 1 });
        await saveSite("Bilder");
      });
    });
    $$("[data-delete-media]").forEach((button) => button.addEventListener("click", () => action("Bild entfernen", async () => {
      content.mediaLibrary = (content.mediaLibrary || []).filter((item) => String(item.id) !== String(button.dataset.deleteMedia));
      await saveSite("Bilder");
    })));
  }

  async function renderOrders() {
    $('[data-panel="orders"]').innerHTML = card("Bestellungen", `<button class="btn btn-glass" data-load-orders>Bestellungen laden</button><div class="admin-list" data-orders-list></div>`);
    $('[data-load-orders]')?.addEventListener("click", () => loadOrders());
  }

  async function loadOrders() {
    await action("Bestellungen", async () => {
      await refreshClient();
      if (!client) throw new Error("Supabase nicht verbunden.");
      const { data, error } = await client.from("premium_orders").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      $('[data-orders-list]').innerHTML = (data || []).map((order) => `<article class="admin-row"><div></div><div><strong>${escape(order.name)}</strong><p>${escape(order.email)} · ${escape(order.status)}</p><p>${escape(order.card_text || order.message || "")}</p></div></article>`).join("") || "<p>Keine Bestellungen.</p>";
      setStatus("Bestellungen geladen.", "success");
    });
  }

  function renderDatabase() {
    $('[data-panel="database"]').innerHTML = card("Datenbank & Storage prüfen", `<button class="btn btn-primary" data-db-check>Automatisch prüfen</button><pre class="db-result" data-db-result>Bereit.</pre><p>Strukturelle SQL-Änderungen benötigen aus Sicherheitsgründen eine Supabase-Dashboard-Session oder einen Service-Role-Key. Öffentliche Secret Keys werden nicht im Frontend gespeichert.</p>`);
    $('[data-db-check]').addEventListener("click", runDatabaseCheck);
  }

  async function runDatabaseCheck() {
    const target = $('[data-db-result]');
    await action("Datenbankprüfung", async () => {
      await refreshClient();
      if (!client) throw new Error("Supabase nicht verbunden.");
      const checks = [
        ["site_settings", "id,content,design,updated_at"],
        ["premium_orders", "id,name,email,phone,address,card_text,music_wish,message,file_url,image_url,video_url,audio_url,status,created_at"]
      ];
      const results = [];
      for (const [table, select] of checks) {
        const { error } = await client.from(table).select(select).limit(1);
        results.push(`${table}: ${error ? error.message : "OK"}`);
      }
      const testPath = `audit/admin-${Date.now()}.txt`;
      const upload = await client.storage.from((window.MELODY_SUPABASE_CONFIG || {}).storageBucket || "melody-assets").upload(testPath, new Blob(["audit"], { type: "text/plain" }), { upsert: true });
      results.push(`storage: ${upload.error ? upload.error.message : "OK"}`);
      target.textContent = results.join("\n");
      setStatus("Datenbankprüfung abgeschlossen.", "success");
    });
  }

  function input(name, label, value, type = "text") {
    const tag = type === "textarea" ? `<textarea name="${name}" rows="4">${escape(value || "")}</textarea>` : `<input name="${name}" type="${type}" value="${escape(value ?? "")}" />`;
    return `<label class="${type === "textarea" ? "span-all" : ""}">${escape(label)}${tag}</label>`;
  }
  function checkbox(name, label, checked) {
    return `<label>${escape(label)}<input name="${name}" type="checkbox" ${checked ? "checked" : ""} /></label>`;
  }
  function file(name, label) {
    return `<label>${escape(label)}<input name="${name}" type="file" accept="image/*" /></label>`;
  }
  function fieldInput([name, label, type = "text"]) {
    if (type === "checkbox") return checkbox(name, label, false);
    if (type === "file") return file(name, label);
    return input(name, label, "", type);
  }
  function setPath(path, value) {
    const parts = path.split(".");
    let target = content;
    while (parts.length > 1) {
      const part = parts.shift();
      target[part] = target[part] || {};
      target = target[part];
    }
    target[parts[0]] = value;
  }
  function readPathForm(form) {
    Array.from(form.elements).forEach((el) => {
      if (!el.name || el.type === "file") return;
      const value = el.type === "checkbox" ? el.checked : el.type === "number" ? Number(el.value || 0) : el.value;
      if (el.name.includes(".")) setPath(el.name, value);
    });
  }
  async function saveForm(event, label, reader) {
    event.preventDefault();
    await action(label, async () => {
      await reader(event.currentTarget);
      await saveSite(label);
    });
  }
  async function uploadInto(input, folder, setter) {
    if (!input?.files?.[0]) return;
    await refreshClient();
    if (!client) throw new Error("Upload benötigt Supabase.");
    const url = await api.uploadFile(input.files[0], folder);
    if (!url) throw new Error("Upload fehlgeschlagen.");
    setter(url);
  }
  function labelFor(key) {
    return ({ products: "Produkte", gallery: "Galerie", reviews: "Bewertungen", faqs: "FAQ" }[key] || key);
  }

  await refreshClient();
  if (client) {
    const { data } = await client.auth.getSession();
    if (data.session) await openForSession(data.session);
  }
})();
