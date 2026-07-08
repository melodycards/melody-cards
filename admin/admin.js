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
  const assetUrl = (url = "") => !url ? "" : /^(https?:|data:|\/|\.\.\/)/.test(url) ? url : `../${url}`;

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
      legalPages: { ...base.legalPages, ...(remote?.legalPages || {}) },
      orderForm: mergeOrderForm(base.orderForm || {}, remote?.orderForm || {}, "de"),
      translations: mergeTranslations(base.translations || {}, remote?.translations || {}),
      languages: remote?.languages || base.languages || [],
      categories: mergeCollectionById(base.categories || [], remote?.categories || []),
      defaultLanguage: remote?.defaultLanguage || base.defaultLanguage || "de"
    };
  }

  function mergeCollectionById(baseItems = [], remoteItems = []) {
    const byId = new Map();
    [...clone(baseItems), ...clone(remoteItems || [])].forEach((item) => {
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
    return merged;
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
    const result = { ...clone(base), ...clone(remote || {}) };
    Object.keys(result).forEach((language) => {
      const baseLanguage = base[language] || {};
      const remoteLanguage = remote[language] || {};
      result[language] = {
        ...clone(baseLanguage),
        ...clone(remoteLanguage),
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

  async function saveSite(label = "Website") {
    setStatus(`${label} wird gespeichert...`);
    localStorage.setItem("melodyPreviewContent", JSON.stringify(content));
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
    demoMode = false;
    loginStatus("Login erfolgreich. Dashboard wird geöffnet...");
    showDashboard();
    setStatus("Dashboard wird geöffnet...", "success");
    try {
      await loadSite();
      showDashboard();
      setStatus("Dashboard geöffnet.", "success");
    } catch (error) {
      console.warn("Dashboard content load failed:", error);
      setStatus(`Dashboard sichtbar. Inhalte konnten nicht geladen werden: ${error.message || error}`, "error");
    }
  }

  $("#admin-login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formNode = event.currentTarget;
    const submit = formNode.querySelector("button[type='submit']");
    submit.disabled = true;
    try {
      loginStatus("Login wird geprüft...");
      await refreshClient();
      if (!client) throw new Error("Supabase konnte nicht geladen werden.");
      const form = new FormData(formNode);
      const { data, error } = await client.auth.signInWithPassword({ email: String(form.get("email")).trim(), password: String(form.get("password")) });
      if (error) throw error;
      await openForSession(data.session || { user: data.user });
    } catch (error) {
      console.error("Admin login failed:", error);
      loginStatus(`Login fehlgeschlagen: ${error.message || error}`);
    } finally {
      submit.disabled = false;
    }
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

  document.addEventListener("change", (event) => {
    const select = event.target.closest?.('select[name^="existing"]');
    if (!select || !select.value) return;
    const form = select.closest("form");
    const preview = form?.querySelector(".visual-image-preview, .gallery-form-preview");
    if (preview) preview.innerHTML = mediaPreview(select.value, select.selectedOptions?.[0]?.dataset.mediaType || mediaTypeForUrl(select.value), "Ausgewähltes Medium");
  });

  function selectPanel(name) {
    $$("[data-section]").forEach((button) => button.classList.toggle("is-active", button.dataset.section === name));
    $$("[data-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
    $("[data-admin-title]").textContent = $(`[data-section="${name}"]`)?.textContent || "Admin";
  }

  function renderAll() {
    renderDashboard();
    renderVisualEditor();
    renderBrand();
    renderTheme();
    renderSeo();
    renderTranslations();
    renderNavigation();
    renderSections();
    renderCategoryEditor();
    renderProductManager();
    renderGalleryEditor();
    renderReviewManager();
    renderCollection("faqs", faqFields());
    renderOrderFormEditor();
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
      ${card("Schneller Einstieg", `<p>Nutze den visuellen Editor, um die Website direkt anzuklicken und Inhalte ohne technische Felder zu bearbeiten.</p><button class="btn btn-primary" type="button" data-open-visual>Website visuell bearbeiten</button>`)}
    </div>`;
    $('[data-open-visual]')?.addEventListener("click", () => selectPanel("visual"));
    $('[data-save-all]')?.addEventListener("click", () => action("Speichern", () => saveSite("Website")));
  }

  function renderVisualEditor() {
    const panel = $('[data-panel="visual"]');
    panel.innerHTML = `<div class="visual-editor-shell">
      <div class="visual-preview-wrap">
        <div class="visual-toolbar">
          <strong>Live-Vorschau</strong>
          <div class="visual-device-switch">
            <button class="mini-btn is-active" type="button" data-visual-device="desktop">Desktop</button>
            <button class="mini-btn" type="button" data-visual-device="tablet">Tablet</button>
            <button class="mini-btn" type="button" data-visual-device="mobile">Handy</button>
            <button class="mini-btn" type="button" data-visual-refresh>Neu laden</button>
          </div>
        </div>
        <iframe class="visual-preview" title="Melody Cards Vorschau" data-visual-frame src="../index.html?admin-preview=${Date.now()}"></iframe>
      </div>
      <aside class="visual-editor-panel" data-visual-editor>
        <p class="eyebrow">Visueller Editor</p>
        <h3>Bereich anklicken</h3>
        <p>Klicke links auf Logo, Navigation, Hero, Kategorie, Produkt, Galerie-Medium, FAQ, Kontakt oder Footer. Die passenden Felder erscheinen hier.</p>
        <div class="visual-quick-actions">
          <button class="mini-btn" type="button" data-visual-new-product>Produkt hinzufügen</button>
          <button class="mini-btn" type="button" data-visual-open-gallery>Galerie bearbeiten</button>
          <button class="mini-btn" type="button" data-visual-new-faq>FAQ hinzufügen</button>
        </div>
      </aside>
    </div>`;
    $('[data-visual-refresh]')?.addEventListener("click", reloadVisualPreview);
    $$("[data-visual-device]").forEach((button) => button.addEventListener("click", () => setVisualDevice(button.dataset.visualDevice, button)));
    $('[data-visual-new-product]')?.addEventListener("click", () => renderProductVisualEditor(""));
    $('[data-visual-open-gallery]')?.addEventListener("click", () => selectPanel("gallery"));
    $('[data-visual-new-faq]')?.addEventListener("click", () => renderFaqVisualEditor(""));
    const frame = $('[data-visual-frame]');
    frame?.addEventListener("load", () => window.setTimeout(prepareVisualFrame, 700));
  }

  function reloadVisualPreview() {
    const frame = $('[data-visual-frame]');
    if (frame) frame.src = `../index.html?admin-preview=${Date.now()}`;
  }

  function setVisualDevice(device, button) {
    const wrap = $(".visual-preview-wrap");
    wrap.dataset.device = device;
    $$("[data-visual-device]").forEach((item) => item.classList.toggle("is-active", item === button));
  }

  function prepareVisualFrame() {
    const frame = $('[data-visual-frame]');
    const doc = frame?.contentDocument;
    if (!doc) return;
    if (!doc.querySelector("[data-visual-editor-style]")) {
      const style = doc.createElement("style");
      style.dataset.visualEditorStyle = "true";
      style.textContent = `
        [data-edit-kind]{outline:2px solid rgba(200,169,106,.0); outline-offset:6px; cursor:pointer;}
        [data-edit-kind]:hover{outline-color:rgba(200,169,106,.95);}
        [data-edit-selected="true"]{outline:3px solid #c8a96a!important; outline-offset:7px;}
      `;
      doc.head.appendChild(style);
    }
    if (doc.body.dataset.visualEditorReady === "true") return;
    doc.body.dataset.visualEditorReady = "true";
    doc.addEventListener("click", (event) => {
      const node = event.target.closest?.("[data-edit-kind]");
      if (!node) return;
      event.preventDefault();
      event.stopPropagation();
      doc.querySelectorAll("[data-edit-selected]").forEach((item) => item.removeAttribute("data-edit-selected"));
      node.setAttribute("data-edit-selected", "true");
      showVisualEditor(node.dataset.editKind, node.dataset.editId);
    });
  }

  function mediaSelect(name = "existingMedia", label = "Vorhandenes Medium auswählen", selected = "") {
    const items = content.mediaLibrary || [];
    return `<label>${escape(label)}<select name="${escape(name)}">
      <option value="">Kein vorhandenes Medium</option>
      ${items.map((item) => `<option value="${escape(item.url)}" data-media-type="${escape(item.mediaType || mediaTypeForUrl(item.url))}" ${item.url === selected ? "selected" : ""}>${escape(item.title || item.alt || item.category || item.url)}</option>`).join("")}
    </select></label>`;
  }

  function selectedMedia(select) {
    if (!select?.value) return null;
    const option = select.selectedOptions?.[0];
    return { url: select.value, mediaType: option?.dataset.mediaType || mediaTypeForUrl(select.value) };
  }

  function applyMediaSelection(select, setter) {
    const item = selectedMedia(select);
    if (item) setter(item.url, item.mediaType);
  }

  function showVisualEditor(kind, id) {
    if (kind === "section") return renderSectionVisualEditor(id);
    if (kind === "step-item") return renderStepItemVisualEditor(id);
    if (kind === "product") return renderProductVisualEditor(id);
    if (kind === "category") return renderCategoryVisualEditor(id);
    if (kind === "gallery") return renderGalleryVisualEditor(id);
    if (kind === "media-item") return renderMediaSectionItemVisualEditor(id);
    if (kind === "faq") return renderFaqVisualEditor(id);
    if (kind === "review") return renderReviewVisualEditor(id);
    if (kind === "brand") return renderBrandVisualEditor();
    if (kind === "navigation" || kind === "nav-item") return renderNavigationVisualEditor(id);
    if (kind === "footer" || kind === "footer-link") return renderFooterVisualEditor(id);
    $('[data-visual-editor]').innerHTML = `<p>Dieses Element kann noch nicht visuell bearbeitet werden.</p>`;
  }

  function renderSectionVisualEditor(id) {
    const section = (content.sections || []).find((item) => item.id === id);
    if (!section) return;
    const trSection = content.translations?.tr?.sections?.[id] || {};
    const style = section.style || {};
    $('[data-visual-editor]').innerHTML = `<form data-visual-section-form class="visual-form">
      <p class="eyebrow">Bereich</p>
      <h3>${escape(section.title || section.id)}</h3>
      ${checkbox("active", "Sichtbar", section.active !== false)}
      ${input("eyebrow", "Eyebrow DE", section.eyebrow || "")}
      ${input("title", "Überschrift DE", section.title || "", "textarea")}
      ${input("subtitle", "Untertitel DE", section.subtitle || section.text || "", "textarea")}
      ${input("trEyebrow", "Eyebrow TR", trSection.eyebrow || "")}
      ${input("trTitle", "Überschrift TR", trSection.title || "", "textarea")}
      ${input("trText", "Text TR", trSection.subtitle || trSection.text || "", "textarea")}
      ${section.primaryButton ? input("primaryLabel", "Buttontext DE", section.primaryButton.label || "") : ""}
      ${section.primaryButton ? input("trPrimaryLabel", "Buttontext TR", trSection.primaryButton?.label || "") : ""}
      ${section.primaryButton ? input("primaryHref", "Buttonlink", section.primaryButton.href || "") : ""}
      ${section.secondaryButton ? input("secondaryLabel", "Zweiter Button DE", section.secondaryButton.label || "") : ""}
      ${section.secondaryButton ? input("trSecondaryLabel", "Zweiter Button TR", trSection.secondaryButton?.label || "") : ""}
      ${section.secondaryButton ? input("secondaryHref", "Zweiter Button Link", section.secondaryButton.href || "") : ""}
      ${section.id === "contact" ? input("contactEmail", "Kontakt E-Mail", content.contact.email || "") + input("contactPhone", "Telefon", content.contact.phone || "") + input("contactAddress", "Adresse", content.contact.address || "", "textarea") : ""}
      ${section.image !== undefined ? `<div class="visual-image-preview">${galleryPreview({ url: section.video || section.image, mediaType: section.video ? "video" : "" })}</div>${mediaSelect("existingMedia", "Vorhandenes Medium auswählen", section.video || section.image || "")}${file("upload", "Medium auswählen")}${checkbox("controls", "Videosteuerung anzeigen", Boolean(section.controls))}<button class="mini-btn danger" type="button" data-clear-section-image>Medium löschen</button>` : ""}
      ${input("textColor", "Textfarbe", style.textColor || "#ffffff", "color")}
      ${input("titleSize", "Schriftgröße Desktop", style.titleSize || "", "number")}
      ${input("mobileTitleSize", "Schriftgröße Handy", style.mobileTitleSize || "", "number")}
      ${input("overlayOpacity", "Overlay Dunkelheit 0-1", style.overlayOpacity ?? "", "number")}
      ${input("paddingTop", "Abstand oben", style.paddingTop || "", "number")}
      ${input("paddingBottom", "Abstand unten", style.paddingBottom || "", "number")}
      <label>Ausrichtung<select name="align"><option value="left" ${section.align !== "center" ? "selected" : ""}>Links</option><option value="center" ${section.align === "center" ? "selected" : ""}>Zentriert</option></select></label>
      <button class="btn btn-primary" type="submit" data-visual-save>Speichern</button>
    </form>`;
    $('[data-clear-section-image]')?.addEventListener("click", () => {
      section.image = "";
      section.video = "";
      setStatus("Medium entfernt. Bitte speichern.", "warning");
      renderSectionVisualEditor(id);
    });
    $('[data-visual-section-form]').addEventListener("submit", (event) => saveVisualSection(event, section, trSection));
  }

  async function saveVisualSection(event, section, trSection) {
    event.preventDefault();
    const form = event.currentTarget;
    const valueOf = (name) => form.elements[name]?.value || "";
    const checked = (name) => Boolean(form.elements[name]?.checked);
    await withButtonLoading(form.querySelector("[data-visual-save]"), "Speichert...", async () => action("Visueller Editor", async () => {
      section.active = checked("active");
      section.eyebrow = valueOf("eyebrow");
      section.title = valueOf("title");
      if ("subtitle" in section) section.subtitle = valueOf("subtitle");
      else section.text = valueOf("subtitle");
      section.align = valueOf("align");
      if (section.primaryButton) {
        section.primaryButton.label = valueOf("primaryLabel");
        section.primaryButton.href = valueOf("primaryHref");
      }
      if (section.secondaryButton && form.elements.secondaryLabel) {
        section.secondaryButton.label = valueOf("secondaryLabel");
        section.secondaryButton.href = valueOf("secondaryHref");
      }
      if (section.id === "contact") {
        content.contact.email = valueOf("contactEmail");
        content.contact.phone = valueOf("contactPhone");
        content.contact.address = valueOf("contactAddress");
      }
      section.style = {
        ...(section.style || {}),
        textColor: valueOf("textColor"),
        titleSize: Number(valueOf("titleSize") || 0) || "",
        mobileTitleSize: Number(valueOf("mobileTitleSize") || 0) || "",
        overlayOpacity: valueOf("overlayOpacity") === "" ? "" : Number(valueOf("overlayOpacity")),
        paddingTop: Number(valueOf("paddingTop") || 0) || "",
        paddingBottom: Number(valueOf("paddingBottom") || 0) || ""
      };
      section.controls = checked("controls");
      applyMediaSelection(form.existingMedia, (url, type) => {
        if (isVideoMedia(url, type)) section.video = url;
        else {
          section.image = url;
          section.video = "";
        }
      });
      await uploadInto(form.upload, "sections", (url, fileItem) => {
        if (isVideoMedia(url, fileItem?.type)) section.video = url;
        else {
          section.image = url;
          section.video = "";
        }
      });
      content.translations = content.translations || {};
      content.translations.tr = content.translations.tr || {};
      content.translations.tr.sections = content.translations.tr.sections || {};
      const translatedSection = {
        ...trSection,
        eyebrow: valueOf("trEyebrow"),
        title: valueOf("trTitle"),
        [section.subtitle !== undefined ? "subtitle" : "text"]: valueOf("trText")
      };
      if (section.primaryButton && form.elements.trPrimaryLabel) {
        translatedSection.primaryButton = {
          ...(trSection.primaryButton || {}),
          label: valueOf("trPrimaryLabel")
        };
      }
      if (section.secondaryButton && form.elements.trSecondaryLabel) {
        translatedSection.secondaryButton = {
          ...(trSection.secondaryButton || {}),
          label: valueOf("trSecondaryLabel")
        };
      }
      content.translations.tr.sections[section.id] = translatedSection;
      await saveSite("Visueller Editor");
      reloadVisualPreview();
    }));
  }

  function renderStepItemVisualEditor(rawId) {
    const [sectionId, indexValue] = String(rawId || "").split(":");
    const index = Number(indexValue);
    const section = (content.sections || []).find((item) => item.id === sectionId);
    const item = section?.items?.[index];
    if (!section || !item) return setStatus("Ablauf-Element nicht gefunden.", "error");
    const trItem = content.translations?.tr?.sections?.[sectionId]?.items?.[index] || {};
    const style = item.style || {};
    $('[data-visual-editor]').innerHTML = `<form data-visual-step-form class="visual-form">
      <p class="eyebrow">Ablauf-Karte</p><h3>${escape(item.title || "Schritt bearbeiten")}</h3>
      ${checkbox("active", "Sichtbar", item.active !== false)}
      ${input("number", "Nummer", item.number || String(index + 1).padStart(2, "0"))}
      ${input("title", "Überschrift DE", item.title || "")}
      ${input("text", "Text DE", item.text || "", "textarea")}
      ${input("trTitle", "Überschrift TR", trItem.title || "")}
      ${input("trText", "Text TR", trItem.text || "", "textarea")}
      <div class="visual-image-preview">${galleryPreview({ url: item.media, mediaType: item.mediaType })}</div>
      ${mediaSelect("existingMedia", "Vorhandenes Medium auswählen", item.media || "")}
      ${file("upload", "Medium auswählen")}
      ${checkbox("controls", "Videosteuerung anzeigen", Boolean(item.controls))}
      <button class="mini-btn danger" type="button" data-clear-step-media>Medium löschen</button>
      ${input("color", "Textfarbe", style.color || "#090909", "color")}
      ${input("numberColor", "Nummernfarbe", style.numberColor || "#c8a96a", "color")}
      ${input("fontSize", "Textgröße", style.fontSize || "", "number")}
      ${input("fontWeight", "Schriftstärke", style.fontWeight || "", "number")}
      ${input("paddingTop", "Abstand oben", style.paddingTop || "", "number")}
      ${input("paddingBottom", "Abstand unten", style.paddingBottom || "", "number")}
      <label>Ausrichtung<select name="align"><option value="left" ${item.align !== "center" ? "selected" : ""}>Links</option><option value="center" ${item.align === "center" ? "selected" : ""}>Zentriert</option></select></label>
      <button class="btn btn-primary" type="submit" data-visual-save>Speichern</button>
    </form>`;
    $('[data-clear-step-media]')?.addEventListener("click", () => {
      item.media = "";
      item.mediaType = "";
      renderStepItemVisualEditor(rawId);
      setStatus("Medium entfernt. Bitte speichern.", "warning");
    });
    $('[data-visual-step-form]').addEventListener("submit", (event) => saveVisualStepItem(event, section, item, index, trItem));
  }

  async function saveVisualStepItem(event, section, item, index, trItem) {
    event.preventDefault();
    const form = event.currentTarget;
    await withButtonLoading(form.querySelector("[data-visual-save]"), "Speichert...", async () => action("Ablauf-Karte", async () => {
      item.active = form.active.checked;
      item.number = form.number.value;
      item.title = form.title.value;
      item.text = form.text.value;
      item.align = form.align.value;
      item.style = {
        ...(item.style || {}),
        color: form.color.value,
        numberColor: form.numberColor.value,
        fontSize: Number(form.fontSize.value || 0) || "",
        fontWeight: Number(form.fontWeight.value || 0) || "",
        paddingTop: Number(form.paddingTop.value || 0) || "",
        paddingBottom: Number(form.paddingBottom.value || 0) || ""
      };
      item.controls = form.controls.checked;
      applyMediaSelection(form.existingMedia, (url, type) => {
        item.media = url;
        item.mediaType = type;
      });
      await uploadInto(form.upload, "steps", (url, fileItem) => {
        item.media = url;
        item.mediaType = fileItem?.type || mediaTypeForUrl(url);
      });
      content.translations = content.translations || {};
      content.translations.tr = content.translations.tr || {};
      content.translations.tr.sections = content.translations.tr.sections || {};
      content.translations.tr.sections[section.id] = content.translations.tr.sections[section.id] || {};
      content.translations.tr.sections[section.id].items = content.translations.tr.sections[section.id].items || [];
      content.translations.tr.sections[section.id].items[index] = {
        ...trItem,
        title: form.trTitle.value,
        text: form.trText.value
      };
      await saveSite("Ablauf-Karte");
      reloadVisualPreview();
    }));
  }

  function renderProductVisualEditor(id) {
    const item = (content.products || []).find((entry) => String(entry.id) === String(id)) || { id: uid("products"), status: "active", sortOrder: (content.products || []).length + 1, images: [] };
    const isNew = !(content.products || []).some((entry) => String(entry.id) === String(id));
    const trProduct = content.translations?.tr?.products?.[item.id] || {};
    $('[data-visual-editor]').innerHTML = `<form data-visual-product-form class="visual-form">
      <p class="eyebrow">Produkt</p><h3>${isNew ? "Produkt hinzufügen" : "Produkt bearbeiten"}</h3>
      ${input("title", "Titel", item.title || "")}
      ${input("description", "Beschreibung", item.description || "", "textarea")}
      ${input("trTitle", "Titel TR", trProduct.title || "")}
      ${input("trDescription", "Beschreibung TR", trProduct.description || "", "textarea")}
      ${input("price", "Preis", item.price || "")}
      ${input("category", "Kategorie", item.category || "")}
      ${checkbox("active", "Aktiv", item.status !== "inactive")}
      <div class="visual-image-preview">${galleryPreview({ url: item.images?.[0], mediaType: item.mediaType })}</div>
      ${mediaSelect("existingMedia", "Vorhandenes Medium auswählen", item.images?.[0] || "")}
      ${file("upload", "Medium auswählen")}
      ${checkbox("controls", "Videosteuerung anzeigen", Boolean(item.controls))}
      <button class="btn btn-primary" type="submit" data-visual-save>Speichern</button>
      ${isNew ? "" : `<button class="mini-btn danger" type="button" data-visual-delete>Produkt löschen</button>`}
    </form>`;
    $('[data-visual-product-form]').addEventListener("submit", (event) => saveVisualProduct(event, item, isNew));
    $('[data-visual-delete]')?.addEventListener("click", () => deleteVisualItem("products", item.id, "Produkt"));
  }

  async function saveVisualProduct(event, item, isNew) {
    event.preventDefault();
    const form = event.currentTarget;
    await withButtonLoading(form.querySelector("[data-visual-save]"), "Speichert...", async () => action("Produkt", async () => {
      item.title = form.title.value;
      item.description = form.description.value;
      item.price = form.price.value;
      item.category = form.category.value;
      item.status = form.active.checked ? "active" : "inactive";
      item.controls = form.controls.checked;
      applyMediaSelection(form.existingMedia, (url, type) => {
        item.images = [url];
        item.mediaType = type;
      });
      await uploadInto(form.upload, "products", (url, fileItem) => {
        item.images = [url];
        item.mediaType = fileItem?.type || mediaTypeForUrl(url);
      });
      if (isNew) content.products = [...(content.products || []), item];
      content.translations = content.translations || {};
      content.translations.tr = content.translations.tr || {};
      content.translations.tr.products = content.translations.tr.products || {};
      content.translations.tr.products[item.id] = {
        ...(content.translations.tr.products[item.id] || {}),
        title: form.trTitle.value,
        description: form.trDescription.value,
        category: form.category.value,
        price: form.price.value
      };
      await saveSite("Produkt");
      reloadVisualPreview();
    }));
  }

  function renderCategoryVisualEditor(id) {
    const item = (content.categories || []).find((entry) => String(entry.id) === String(id)) || { id: uid("category"), active: true, sortOrder: (content.categories || []).length + 1 };
    const isNew = !(content.categories || []).some((entry) => String(entry.id) === String(id));
    const trCategory = content.translations?.tr?.categories?.[item.id] || {};
    $('[data-visual-editor]').innerHTML = `<form data-visual-category-form class="visual-form">
      <p class="eyebrow">Kategorie</p><h3>${isNew ? "Kategorie hinzufügen" : "Kategorie bearbeiten"}</h3>
      <div class="visual-image-preview">${galleryPreview({ url: item.image, mediaType: item.mediaType })}</div>
      ${mediaSelect("existingMedia", "Vorhandenes Medium auswählen", item.image || "")}
      ${file("upload", "Medium auswählen")}
      ${checkbox("controls", "Videosteuerung anzeigen", Boolean(item.controls))}
      <button class="mini-btn danger" type="button" data-visual-clear-category-image>Medium löschen</button>
      ${input("title", "Titel DE", item.title || "")}
      ${input("description", "Beschreibung DE", item.description || "", "textarea")}
      ${input("trTitle", "Titel TR", trCategory.title || "")}
      ${input("trDescription", "Beschreibung TR", trCategory.description || "", "textarea")}
      ${checkbox("active", "Aktiv", item.active !== false)}
      <button class="btn btn-primary" type="submit" data-visual-save>Speichern</button>
      ${isNew ? "" : `<button class="mini-btn danger" type="button" data-visual-delete>Kategorie löschen</button>`}
    </form>`;
    $('[data-visual-clear-category-image]')?.addEventListener("click", () => {
      item.image = "";
      item.mediaType = "";
      setStatus("Medium entfernt. Bitte speichern.", "warning");
      renderCategoryVisualEditor(item.id);
    });
    $('[data-visual-category-form]').addEventListener("submit", (event) => saveVisualCategory(event, item, isNew));
    $('[data-visual-delete]')?.addEventListener("click", () => deleteVisualItem("categories", item.id, "Kategorie"));
  }

  async function saveVisualCategory(event, item, isNew) {
    event.preventDefault();
    const form = event.currentTarget;
    await withButtonLoading(form.querySelector("[data-visual-save]"), "Speichert...", async () => action("Kategorie", async () => {
      item.title = form.title.value;
      item.description = form.description.value;
      item.active = form.active.checked;
      item.controls = form.controls.checked;
      applyMediaSelection(form.existingMedia, (url, type) => {
        item.image = url;
        item.mediaType = type;
      });
      await uploadInto(form.upload, "categories", (url, fileItem) => {
        item.image = url;
        item.mediaType = fileItem?.type || mediaTypeForUrl(url);
      });
      if (isNew) content.categories = [...(content.categories || []), item];
      content.translations = content.translations || {};
      content.translations.tr = content.translations.tr || {};
      content.translations.tr.categories = content.translations.tr.categories || {};
      content.translations.tr.categories[item.id] = {
        ...(content.translations.tr.categories[item.id] || {}),
        title: form.trTitle.value,
        description: form.trDescription.value
      };
      await saveSite("Kategorie");
      reloadVisualPreview();
    }));
  }

  function renderGalleryVisualEditor(id) {
    const item = (content.gallery || []).find((entry) => String(entry.id) === String(id)) || { id: uid("gallery"), active: true, sortOrder: (content.gallery || []).length + 1 };
    const isNew = !(content.gallery || []).some((entry) => String(entry.id) === String(id));
    $('[data-visual-editor]').innerHTML = `<form data-visual-gallery-form class="visual-form">
      <p class="eyebrow">Galerie</p><h3>${isNew ? "Medium hinzufügen" : "Medium bearbeiten"}</h3>
      <div class="visual-image-preview">${galleryPreview(item)}</div>
      ${mediaSelect("existingMedia", "Vorhandenes Medium auswählen", item.url || item.image_url || "")}
      ${file("upload", "Medium auswählen")}
      ${checkbox("controls", "Videosteuerung anzeigen", Boolean(item.controls))}
      ${input("title", "Titel", item.title || "")}
      ${input("description", "Beschreibung", item.description || item.alt || "", "textarea")}
      ${input("category", "Kategorie", item.category || "")}
      ${checkbox("active", "Aktiv", item.active !== false)}
      <button class="btn btn-primary" type="submit" data-visual-save>Speichern</button>
      ${isNew ? "" : `<button class="mini-btn danger" type="button" data-visual-delete>Medium löschen</button>`}
    </form>`;
    $('[data-visual-gallery-form]').addEventListener("submit", (event) => saveVisualGallery(event, item, isNew));
    $('[data-visual-delete]')?.addEventListener("click", () => deleteVisualItem("gallery", item.id, "Galerie-Medium"));
  }

  async function saveVisualGallery(event, item, isNew) {
    event.preventDefault();
    const form = event.currentTarget;
    await withButtonLoading(form.querySelector("[data-visual-save]"), "Speichert...", async () => action("Galerie", async () => {
      item.title = form.title.value;
      item.description = form.description.value;
      item.alt = form.description.value;
      item.category = form.category.value;
      item.active = form.active.checked;
      item.controls = form.controls.checked;
      applyMediaSelection(form.existingMedia, (url, type) => {
        item.url = url;
        item.image_url = url;
        item.mediaType = type;
      });
      await uploadInto(form.upload, "gallery", (url, fileItem) => {
        item.url = url;
        item.image_url = url;
        item.mediaType = fileItem?.type || mediaTypeForUrl(url);
      });
      if (isNew && !item.url && !item.image_url) throw new Error("Bitte ein Medium auswählen.");
      if (isNew) content.gallery = [...(content.gallery || []), item];
      await saveSite("Galerie");
      reloadVisualPreview();
    }));
  }

  function renderMediaSectionItemVisualEditor(rawId) {
    const [sectionId, indexValue] = String(rawId || "").split(":");
    const index = Number(indexValue);
    const section = (content.sections || []).find((item) => item.id === sectionId);
    const item = section?.items?.[index];
    if (!section || !item) return setStatus("Medium nicht gefunden.", "error");
    $('[data-visual-editor]').innerHTML = `<form data-visual-media-item-form class="visual-form">
      <p class="eyebrow">Mediensektion</p><h3>Medium bearbeiten</h3>
      <div class="visual-image-preview">${galleryPreview(item)}</div>
      ${mediaSelect("existingMedia", "Vorhandenes Medium auswählen", item.url || "")}
      ${file("upload", "Medium auswählen")}
      ${checkbox("controls", "Videosteuerung anzeigen", Boolean(item.controls))}
      ${input("title", "Titel", item.title || "")}
      ${input("description", "Beschreibung", item.description || item.alt || "", "textarea")}
      ${checkbox("active", "Sichtbar", item.active !== false)}
      <button class="btn btn-primary" type="submit" data-visual-save>Speichern</button>
      <button class="mini-btn danger" type="button" data-visual-delete>Medium löschen</button>
    </form>`;
    $('[data-visual-media-item-form]').addEventListener("submit", (event) => saveMediaSectionItem(event, section, item));
    $('[data-visual-delete]')?.addEventListener("click", async () => {
      if (!window.confirm("Dieses Medium wirklich löschen?")) return;
      section.items = (section.items || []).filter((entry) => entry !== item);
      await action("Medium löschen", async () => {
        await saveSite("Mediensektion");
        reloadVisualPreview();
        $('[data-visual-editor]').innerHTML = "<p>Medium wurde gelöscht.</p>";
      });
    });
  }

  async function saveMediaSectionItem(event, section, item) {
    event.preventDefault();
    const form = event.currentTarget;
    await withButtonLoading(form.querySelector("[data-visual-save]"), "Speichert...", async () => action("Mediensektion", async () => {
      item.title = form.title.value;
      item.description = form.description.value;
      item.alt = form.description.value;
      item.active = form.active.checked;
      item.controls = form.controls.checked;
      applyMediaSelection(form.existingMedia, (url, type) => {
        item.url = url;
        item.mediaType = type;
      });
      await uploadInto(form.upload, "media-sections", (url, fileItem) => {
        item.url = url;
        item.mediaType = fileItem?.type || mediaTypeForUrl(url);
      });
      await saveSite("Mediensektion");
      reloadVisualPreview();
    }));
  }

  function renderFaqVisualEditor(id) {
    const item = (content.faqs || []).find((entry) => String(entry.id) === String(id)) || { id: uid("faq"), active: true, sortOrder: (content.faqs || []).length + 1 };
    const isNew = !(content.faqs || []).some((entry) => String(entry.id) === String(id));
    const trFaq = content.translations?.tr?.faqs?.[item.id] || {};
    $('[data-visual-editor]').innerHTML = `<form data-visual-faq-form class="visual-form">
      <p class="eyebrow">FAQ</p><h3>${isNew ? "FAQ hinzufügen" : "FAQ bearbeiten"}</h3>
      ${input("question", "Frage DE", item.question || "")}
      ${input("answer", "Antwort DE", item.answer || "", "textarea")}
      ${input("trQuestion", "Frage TR", trFaq.question || "")}
      ${input("trAnswer", "Antwort TR", trFaq.answer || "", "textarea")}
      ${checkbox("active", "Sichtbar", item.active !== false)}
      <button class="btn btn-primary" type="submit" data-visual-save>Speichern</button>
      ${isNew ? "" : `<button class="mini-btn danger" type="button" data-visual-delete>FAQ löschen</button>`}
    </form>`;
    $('[data-visual-faq-form]').addEventListener("submit", (event) => saveVisualFaq(event, item, isNew));
    $('[data-visual-delete]')?.addEventListener("click", () => deleteVisualItem("faqs", item.id, "FAQ"));
  }

  async function saveVisualFaq(event, item, isNew) {
    event.preventDefault();
    const form = event.currentTarget;
    await withButtonLoading(form.querySelector("[data-visual-save]"), "Speichert...", async () => action("FAQ", async () => {
      item.question = form.question.value;
      item.answer = form.answer.value;
      item.active = form.active.checked;
      if (isNew) content.faqs = [...(content.faqs || []), item];
      content.translations = content.translations || {};
      content.translations.tr = content.translations.tr || {};
      content.translations.tr.faqs = content.translations.tr.faqs || {};
      content.translations.tr.faqs[item.id] = { question: form.trQuestion.value, answer: form.trAnswer.value };
      await saveSite("FAQ");
      reloadVisualPreview();
    }));
  }

  function renderReviewVisualEditor(id) {
    const item = (content.reviews || []).find((entry) => String(entry.id) === String(id)) || { id: uid("review"), active: true, rating: 5, sortOrder: (content.reviews || []).length + 1 };
    const isNew = !(content.reviews || []).some((entry) => String(entry.id) === String(id));
    const trReview = content.translations?.tr?.reviews?.[item.id] || {};
    $('[data-visual-editor]').innerHTML = `<form data-visual-review-form class="visual-form">
      <p class="eyebrow">Bewertung</p><h3>${isNew ? "Bewertung hinzufügen" : "Bewertung bearbeiten"}</h3>
      <div class="visual-image-preview">${galleryPreview({ url: item.photo || item.image_url, mediaType: item.mediaType })}</div>
      ${mediaSelect("existingMedia", "Vorhandenes Medium auswählen", item.photo || item.image_url || "")}
      ${file("upload", "Medium auswählen")}
      ${checkbox("controls", "Videosteuerung anzeigen", Boolean(item.controls))}
      ${input("name", "Name", item.name || "")}
      ${input("text", "Text DE", item.text || "", "textarea")}
      ${input("trText", "Text TR", trReview.text || "", "textarea")}
      ${input("rating", "Sterne", item.rating || 5, "number")}
      ${checkbox("active", "Sichtbar", item.active !== false)}
      <button class="btn btn-primary" type="submit" data-visual-save>Speichern</button>
      ${isNew ? "" : `<button class="mini-btn danger" type="button" data-visual-delete>Bewertung löschen</button>`}
    </form>`;
    $('[data-visual-review-form]').addEventListener("submit", (event) => saveVisualReview(event, item, isNew));
    $('[data-visual-delete]')?.addEventListener("click", () => deleteVisualItem("reviews", item.id, "Bewertung"));
  }

  async function saveVisualReview(event, item, isNew) {
    event.preventDefault();
    const form = event.currentTarget;
    await withButtonLoading(form.querySelector("[data-visual-save]"), "Speichert...", async () => action("Bewertung", async () => {
      item.name = form.name.value;
      item.text = form.text.value;
      item.rating = Number(form.rating.value || 5);
      item.active = form.active.checked;
      item.controls = form.controls.checked;
      applyMediaSelection(form.existingMedia, (url, type) => {
        item.photo = url;
        item.image_url = url;
        item.mediaType = type;
      });
      await uploadInto(form.upload, "reviews", (url, fileItem) => {
        item.photo = url;
        item.image_url = url;
        item.mediaType = fileItem?.type || mediaTypeForUrl(url);
      });
      if (isNew) content.reviews = [...(content.reviews || []), item];
      content.translations = content.translations || {};
      content.translations.tr = content.translations.tr || {};
      content.translations.tr.reviews = content.translations.tr.reviews || {};
      content.translations.tr.reviews[item.id] = { ...(content.translations.tr.reviews[item.id] || {}), text: form.trText.value };
      await saveSite("Bewertung");
      reloadVisualPreview();
    }));
  }

  async function deleteVisualItem(key, id, label) {
    if (!window.confirm(`${label} wirklich löschen?`)) return;
    await action(label, async () => {
      content[key] = (content[key] || []).filter((item) => String(item.id) !== String(id));
      await saveSite(label);
      reloadVisualPreview();
      $('[data-visual-editor]').innerHTML = `<p>${escape(label)} wurde gelöscht.</p>`;
    });
  }

  function renderNavigationVisualEditor(activeIndex = 0) {
    const items = sorted(content.navigation || []);
    const item = items[Number(activeIndex)] || items[0] || { label: "", href: "#", active: true };
    const trItems = content.translations?.tr?.navigation || [];
    const trItem = trItems[Number(activeIndex)] || {};
    $('[data-visual-editor]').innerHTML = `<form data-visual-nav-form class="visual-form">
      <p class="eyebrow">Navigation</p><h3>Menüpunkt bearbeiten</h3>
      <label>Menüpunkt<select name="index">${items.map((entry, index) => `<option value="${index}" ${entry === item ? "selected" : ""}>${escape(entry.label || `Menüpunkt ${index + 1}`)}</option>`).join("")}</select></label>
      ${input("label", "Text Deutsch", item.label || "")}
      ${input("trLabel", "Text Türkisch", trItem.label || "")}
      ${input("href", "Link", item.href || "")}
      ${checkbox("active", "Sichtbar", item.active !== false)}
      <button class="btn btn-primary" type="submit" data-visual-save>Speichern</button>
    </form>`;
    const form = $('[data-visual-nav-form]');
    form.index.addEventListener("change", () => renderNavigationVisualEditor(form.index.value));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await withButtonLoading(form.querySelector("[data-visual-save]"), "Speichert...", async () => action("Navigation", async () => {
        item.label = form.label.value;
        item.href = form.href.value;
        item.active = form.active.checked;
        content.translations = content.translations || {};
        content.translations.tr = content.translations.tr || {};
        content.translations.tr.navigation = content.translations.tr.navigation || [];
        content.translations.tr.navigation[Number(form.index.value)] = {
          ...item,
          ...(content.translations.tr.navigation[Number(form.index.value)] || {}),
          label: form.trLabel.value,
          href: form.href.value,
          active: form.active.checked
        };
        await saveSite("Navigation");
        reloadVisualPreview();
      }));
    });
  }

  function renderBrandVisualEditor() {
    $('[data-visual-editor]').innerHTML = `<form data-visual-brand-form class="visual-form">
      <p class="eyebrow">Logo & Marke</p><h3>Logo bearbeiten</h3>
      <div class="visual-image-preview">${galleryPreview({ url: content.brand.logoImage, title: content.brand.name })}</div>
      ${mediaSelect("existingLogo", "Vorhandenes Medium auswählen", content.brand.logoImage || "")}
      ${file("logoUpload", "Logo-Medium auswählen")}
      ${input("name", "Markenname", content.brand.name || "")}
      ${input("logoText", "Logo Text", content.brand.logoText || "")}
      ${input("footerText", "Footer Text", content.brand.footerText || "", "textarea")}
      ${file("faviconUpload", "Favicon hochladen")}
      <button class="btn btn-primary" type="submit" data-visual-save>Speichern</button>
    </form>`;
    const form = $('[data-visual-brand-form]');
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await withButtonLoading(form.querySelector("[data-visual-save]"), "Speichert...", async () => action("Logo & Marke", async () => {
        content.brand.name = form.name.value;
        content.brand.logoText = form.logoText.value;
        content.brand.footerText = form.footerText.value;
        applyMediaSelection(form.existingLogo, (url) => content.brand.logoImage = url);
        await uploadInto(form.logoUpload, "brand", (url) => content.brand.logoImage = url);
        await uploadInto(form.faviconUpload, "favicons", (url) => content.seo.favicon = url);
        await saveSite("Logo & Marke");
        reloadVisualPreview();
      }));
    });
  }

  function renderFooterVisualEditor(activeIndex = 0) {
    content.footer.links = content.footer.links || [];
    const item = content.footer.links[Number(activeIndex)] || content.footer.links[0] || { label: "", href: "" };
    $('[data-visual-editor]').innerHTML = `<form data-visual-footer-form class="visual-form">
      <p class="eyebrow">Footer</p><h3>Footer bearbeiten</h3>
      ${input("footerText", "Footer Text", content.brand.footerText || "", "textarea")}
      <label>Link auswählen<select name="index">${content.footer.links.map((entry, index) => `<option value="${index}" ${entry === item ? "selected" : ""}>${escape(entry.label || `Link ${index + 1}`)}</option>`).join("")}</select></label>
      ${input("label", "Linktext", item.label || "")}
      ${input("href", "Linkziel", item.href || "")}
      <button class="btn btn-primary" type="submit" data-visual-save>Speichern</button>
    </form>`;
    const form = $('[data-visual-footer-form]');
    form.index.addEventListener("change", () => renderFooterVisualEditor(form.index.value));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await withButtonLoading(form.querySelector("[data-visual-save]"), "Speichert...", async () => action("Footer", async () => {
        content.brand.footerText = form.footerText.value;
        item.label = form.label.value;
        item.href = form.href.value;
        await saveSite("Footer");
        reloadVisualPreview();
      }));
    });
  }

  function renderBrand() {
    $('[data-panel="brand"]').innerHTML = card("Logo & Brand", `<form data-brand-form class="admin-grid">
      ${input("brand.name", "Markenname", content.brand.name)}
      ${input("brand.logoText", "Logo Text", content.brand.logoText)}
      <div class="gallery-form-preview span-all">${galleryPreview({ url: content.brand.logoImage, title: content.brand.name })}</div>
      ${mediaSelect("existingLogo", "Vorhandenes Logo-Medium auswählen", content.brand.logoImage || "")}
      ${file("logoUpload", "Logo-Medium auswählen")}
      ${input("brand.footerText", "Footer Text", content.brand.footerText, "textarea")}
      <button class="btn btn-primary span-all" type="submit">Brand speichern</button>
    </form>`);
    $('[data-brand-form]').addEventListener("submit", (event) => saveForm(event, "Brand", async (form) => {
      applyMediaSelection(form.existingLogo, (url) => content.brand.logoImage = url);
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
      <div class="gallery-form-preview span-all">${galleryPreview({ url: content.seo.ogImage, title: content.seo.ogTitle })}</div>
      ${mediaSelect("existingOg", "Vorhandenes Open-Graph-Medium auswählen", content.seo.ogImage || "")}
      ${file("ogUpload", "Open-Graph-Medium auswählen")}
      ${mediaSelect("existingFavicon", "Vorhandenes Favicon-Medium auswählen", content.seo.favicon || "")}
      ${file("faviconUpload", "Favicon-Medium auswählen")}
      <button class="btn btn-primary span-all" type="submit">SEO speichern</button>
    </form>`);
    $('[data-seo-form]').addEventListener("submit", (event) => saveForm(event, "SEO", async (form) => {
      applyMediaSelection(form.existingOg, (url) => content.seo.ogImage = url);
      applyMediaSelection(form.existingFavicon, (url) => content.seo.favicon = url);
      await uploadInto(form.ogUpload, "seo", (url) => content.seo.ogImage = url);
      await uploadInto(form.faviconUpload, "favicons", (url) => content.seo.favicon = url);
      readPathForm(form);
    }));
  }

  function renderTranslations() {
    $('[data-panel="translations"]').innerHTML = card("Mehrsprachigkeit DE / TR", `<form data-translations-form class="admin-grid">
      ${input("defaultLanguage", "Standardsprache", content.defaultLanguage || "de")}
      <label class="span-all">Sprachen<textarea name="languages" rows="6">${escape(JSON.stringify(content.languages || [], null, 2))}</textarea></label>
      <label class="span-all">Übersetzungen für Türkisch und weitere Sprachen<textarea class="json-editor" name="translations" rows="18">${escape(JSON.stringify(content.translations || {}, null, 2))}</textarea></label>
      <p class="span-all">Deutsch bearbeitest du in den normalen Bereichen. Türkisch und zusätzliche Sprachvarianten bearbeitest du hier als strukturierte JSON-Daten.</p>
      <button class="btn btn-primary span-all" type="submit">Sprachen speichern</button>
    </form>`);
    $('[data-translations-form]').addEventListener("submit", (event) => {
      event.preventDefault();
      action("Sprachen", async () => {
        const form = event.currentTarget;
        content.defaultLanguage = form.defaultLanguage.value.trim() || "de";
        content.languages = JSON.parse(form.languages.value || "[]");
        content.translations = JSON.parse(form.translations.value || "{}");
        await saveSite("Sprachen");
      });
    });
  }

  function renderNavigation() {
    renderJsonPanel("navigation", "Navigation bearbeiten", "navigation", content.navigation);
  }

  function renderSections() {
    renderJsonPanel("sections", "Startseiten-Bereiche bearbeiten", "sections", content.sections);
  }

  function renderCategoryEditor() {
    const current = editing.categories || {};
    const items = sorted(content.categories || []);
    $('[data-panel="categories"]').innerHTML = `<div class="gallery-editor">
      ${card(editing.categories ? "Kategorie bearbeiten" : "Kategorie hinzufügen", `<form data-category-form class="gallery-form">
        <div class="gallery-form-preview" data-category-preview>${galleryPreview(current)}</div>
      ${mediaSelect("existingMedia", "Vorhandenes Medium auswählen", current.image || "")}
      ${file("upload", editing.categories ? "Medium ersetzen" : "Medium auswählen")}
      ${input("title", "Titel", current.title || "")}
      ${input("description", "Beschreibung", current.description || "", "textarea")}
      ${input("trTitle", "Titel Türkisch", content.translations?.tr?.categories?.[current.id]?.title || "")}
      ${input("trDescription", "Beschreibung Türkisch", content.translations?.tr?.categories?.[current.id]?.description || "", "textarea")}
      ${checkbox("active", "Aktiv", current.active !== false)}
        <div class="admin-actions span-all">
          <button class="btn btn-primary" type="submit" data-category-save>${editing.categories ? "Änderungen speichern" : "Kategorie speichern"}</button>
          <button class="btn btn-glass" type="button" data-category-new>Neue Kategorie</button>
        </div>
      </form>`)}
      ${card("Kategorien", `<div class="gallery-card-grid">${items.map(categoryAdminCard).join("")}</div>`)}
    </div>`;
    const form = $('[data-category-form]');
    form.addEventListener("submit", saveCategoryItem);
    form.upload?.addEventListener("change", () => previewCategoryFile(form.upload));
    $('[data-category-new]')?.addEventListener("click", () => {
      editing.categories = null;
      renderCategoryEditor();
      setStatus("Neue Kategorie bereit.");
    });
    $$("[data-category-edit]").forEach((button) => button.addEventListener("click", () => editCategoryItem(button.dataset.categoryEdit)));
    $$("[data-category-delete]").forEach((button) => button.addEventListener("click", () => deleteCategoryItem(button.dataset.categoryDelete, button)));
    $$("[data-category-move]").forEach((button) => button.addEventListener("click", () => moveCategoryItem(button.dataset.categoryMove, Number(button.dataset.direction), button)));
  }

  function categoryAdminCard(item) {
    return `<article class="gallery-admin-card">
      <div class="gallery-admin-image">${galleryPreview(item)}</div>
      <div class="gallery-admin-copy"><div><strong>${escape(item.title || "Kategorie")}</strong><p>${escape(item.description || "")}</p></div><span class="status-pill ${item.active === false ? "is-muted" : ""}">${item.active === false ? "Inaktiv" : "Aktiv"}</span></div>
      <div class="gallery-admin-actions">
        <button class="mini-btn" type="button" data-category-edit="${escape(item.id)}">Bearbeiten</button>
        <button class="mini-btn danger" type="button" data-category-delete="${escape(item.id)}">Löschen</button>
        <button class="mini-btn" type="button" data-category-move="${escape(item.id)}" data-direction="-1">Nach oben</button>
        <button class="mini-btn" type="button" data-category-move="${escape(item.id)}" data-direction="1">Nach unten</button>
      </div>
    </article>`;
  }

  function previewCategoryFile(input) {
    const preview = $('[data-category-preview]');
    const fileItem = input?.files?.[0];
    if (!preview || !fileItem) return;
    preview.innerHTML = mediaPreview(URL.createObjectURL(fileItem), fileItem.type, "Ausgewählte Kategorie");
  }

  function editCategoryItem(id) {
    const item = (content.categories || []).find((entry) => String(entry.id) === String(id));
    if (!item) return setStatus("Kategorie nicht gefunden.", "error");
    editing.categories = item;
    renderCategoryEditor();
    setStatus("Kategorie geladen.", "success");
  }

  async function saveCategoryItem(event) {
    event.preventDefault();
    const form = event.currentTarget;
    await withButtonLoading(form.querySelector("[data-category-save]"), "Speichert...", async () => action("Kategorie", async () => {
      const item = editing.categories || { id: uid("category"), sortOrder: (content.categories || []).length + 1 };
      item.title = form.title.value.trim();
      item.description = form.description.value.trim();
      item.active = form.active.checked;
      applyMediaSelection(form.existingMedia, (url, type) => {
        item.image = url;
        item.mediaType = type;
      });
      await uploadInto(form.upload, "categories", (url, fileItem) => {
        item.image = url;
        item.mediaType = fileItem?.type || mediaTypeForUrl(url);
      });
      content.categories = content.categories || [];
      if (!editing.categories) content.categories.push(item);
      content.translations = content.translations || {};
      content.translations.tr = content.translations.tr || {};
      content.translations.tr.categories = content.translations.tr.categories || {};
      content.translations.tr.categories[item.id] = {
        ...(content.translations.tr.categories[item.id] || {}),
        title: form.trTitle.value.trim(),
        description: form.trDescription.value.trim()
      };
      editing.categories = null;
      await saveSite("Kategorien");
      renderCategoryEditor();
    }));
  }

  async function deleteCategoryItem(id, button) {
    if (!window.confirm("Diese Kategorie wirklich löschen?")) return;
    await withButtonLoading(button, "Löscht...", async () => action("Kategorie", async () => {
      content.categories = (content.categories || []).filter((item) => String(item.id) !== String(id));
      await saveSite("Kategorien");
      renderCategoryEditor();
    }));
  }

  async function moveCategoryItem(id, direction, button) {
    await withButtonLoading(button, "Speichert...", async () => action("Kategorien sortieren", async () => {
      const items = sorted(content.categories || []);
      const index = items.findIndex((item) => String(item.id) === String(id));
      const target = index + direction;
      if (index < 0 || target < 0 || target >= items.length) return;
      [items[index], items[target]] = [items[target], items[index]];
      items.forEach((item, order) => item.sortOrder = order + 1);
      content.categories = items;
      await saveSite("Kategorien");
      renderCategoryEditor();
    }));
  }

  function renderProductManager() {
    const current = editing.products || {};
    const trProduct = content.translations?.tr?.products?.[current.id] || {};
    const items = sorted(content.products || []);
    $('[data-panel="products"]').innerHTML = `<div class="gallery-editor">
      ${card(editing.products ? "Produkt bearbeiten" : "Produkt hinzufügen", `<form data-product-card-form class="gallery-form">
        <div class="gallery-form-preview">${galleryPreview({ url: current.images?.[0] || current.image_url, mediaType: current.mediaType })}</div>
        ${mediaSelect("existingMedia", "Vorhandenes Medium auswählen", current.images?.[0] || current.image_url || "")}
        ${file("upload", editing.products ? "Medium ersetzen" : "Medium auswählen")}
        ${input("title", "Titel Deutsch", current.title || "")}
        ${input("description", "Beschreibung Deutsch", current.description || "", "textarea")}
        ${input("trTitle", "Titel Türkisch", trProduct.title || "")}
        ${input("trDescription", "Beschreibung Türkisch", trProduct.description || "", "textarea")}
        ${input("price", "Preis", current.price || "")}
        ${input("category", "Kategorie", current.category || "")}
        ${checkbox("featured", "Empfohlen", Boolean(current.featured))}
        ${checkbox("active", "Aktiv", current.status !== "inactive")}
        <div class="admin-actions span-all">
          <button class="btn btn-primary" type="submit" data-product-save>${editing.products ? "Änderungen speichern" : "Produkt speichern"}</button>
          <button class="btn btn-glass" type="button" data-product-new>Neues Produkt</button>
        </div>
      </form>`)}
      ${card("Produkte", `<div class="gallery-card-grid">${items.map(productAdminCard).join("") || `<div class="empty-state">Noch keine Produkte vorhanden.</div>`}</div>`)}
    </div>`;
    const form = $('[data-product-card-form]');
    form.addEventListener("submit", saveProductCardItem);
    form.upload?.addEventListener("change", () => previewAdminFile(form.upload, form.querySelector(".gallery-form-preview")));
    $('[data-product-new]')?.addEventListener("click", () => {
      editing.products = null;
      renderProductManager();
      setStatus("Neues Produkt bereit.");
    });
    $$("[data-product-edit]").forEach((button) => button.addEventListener("click", () => editProductCardItem(button.dataset.productEdit)));
    $$("[data-product-delete]").forEach((button) => button.addEventListener("click", () => deleteProductCardItem(button.dataset.productDelete, button)));
    $$("[data-product-move]").forEach((button) => button.addEventListener("click", () => moveManagedItem("products", button.dataset.productMove, Number(button.dataset.direction), button, "Produkte")));
  }

  function productAdminCard(item) {
    return `<article class="gallery-admin-card">
      <div class="gallery-admin-image">${galleryPreview({ url: item.images?.[0] || item.image_url, title: item.title })}</div>
      <div class="gallery-admin-copy"><div><strong>${escape(item.title || "Produkt")}</strong><p>${escape(item.category || "")}</p></div><span class="status-pill ${item.status === "inactive" ? "is-muted" : ""}">${item.status === "inactive" ? "Inaktiv" : "Aktiv"}</span></div>
      <div class="gallery-admin-actions">
        <button class="mini-btn" type="button" data-product-edit="${escape(item.id)}">Bearbeiten</button>
        <button class="mini-btn danger" type="button" data-product-delete="${escape(item.id)}">Löschen</button>
        <button class="mini-btn" type="button" data-product-move="${escape(item.id)}" data-direction="-1">Nach oben</button>
        <button class="mini-btn" type="button" data-product-move="${escape(item.id)}" data-direction="1">Nach unten</button>
      </div>
    </article>`;
  }

  function editProductCardItem(id) {
    const item = (content.products || []).find((entry) => String(entry.id) === String(id));
    if (!item) return setStatus("Produkt nicht gefunden.", "error");
    editing.products = item;
    renderProductManager();
    setStatus("Produkt geladen.", "success");
  }

  async function saveProductCardItem(event) {
    event.preventDefault();
    const form = event.currentTarget;
    await withButtonLoading(form.querySelector("[data-product-save]"), "Speichert...", async () => action("Produkt", async () => {
      const item = editing.products || { id: uid("product"), sortOrder: (content.products || []).length + 1, images: [] };
      item.title = form.title.value.trim();
      item.description = form.description.value.trim();
      item.price = form.price.value.trim();
      item.category = form.category.value.trim();
      item.featured = form.featured.checked;
      item.status = form.active.checked ? "active" : "inactive";
      applyMediaSelection(form.existingMedia, (url, type) => {
        item.images = [url];
        item.mediaType = type;
      });
      await uploadInto(form.upload, "products", (url, fileItem) => {
        item.images = [url];
        item.mediaType = fileItem?.type || mediaTypeForUrl(url);
      });
      content.products = content.products || [];
      if (!editing.products) content.products.push(item);
      content.translations = content.translations || {};
      content.translations.tr = content.translations.tr || {};
      content.translations.tr.products = content.translations.tr.products || {};
      content.translations.tr.products[item.id] = {
        ...(content.translations.tr.products[item.id] || {}),
        title: form.trTitle.value.trim(),
        description: form.trDescription.value.trim(),
        category: form.category.value.trim(),
        price: form.price.value.trim()
      };
      editing.products = null;
      await saveSite("Produkt");
      renderProductManager();
    }));
  }

  async function deleteProductCardItem(id, button) {
    if (!window.confirm("Dieses Produkt wirklich löschen?")) return;
    await withButtonLoading(button, "Löscht...", async () => action("Produkt", async () => {
      content.products = (content.products || []).filter((item) => String(item.id) !== String(id));
      await saveSite("Produkt");
      renderProductManager();
    }));
  }

  function renderReviewManager() {
    const current = editing.reviews || {};
    const trReview = content.translations?.tr?.reviews?.[current.id] || {};
    const items = sorted(content.reviews || []);
    $('[data-panel="reviews"]').innerHTML = `<div class="gallery-editor">
      ${card(editing.reviews ? "Bewertung bearbeiten" : "Bewertung hinzufügen", `<form data-review-card-form class="gallery-form">
        <div class="gallery-form-preview">${galleryPreview({ url: current.photo || current.image_url, mediaType: current.mediaType, title: current.name })}</div>
        ${mediaSelect("existingMedia", "Vorhandenes Medium auswählen", current.photo || current.image_url || "")}
        ${file("upload", editing.reviews ? "Medium ersetzen" : "Medium auswählen")}
        ${input("name", "Name", current.name || "")}
        ${input("text", "Text Deutsch", current.text || "", "textarea")}
        ${input("trText", "Text Türkisch", trReview.text || "", "textarea")}
        ${input("rating", "Sterne", current.rating || 5, "number")}
        ${checkbox("active", "Aktiv", current.active !== false)}
        <div class="admin-actions span-all">
          <button class="btn btn-primary" type="submit" data-review-save>${editing.reviews ? "Änderungen speichern" : "Bewertung speichern"}</button>
          <button class="btn btn-glass" type="button" data-review-new>Neue Bewertung</button>
        </div>
      </form>`)}
      ${card("Bewertungen", `<div class="gallery-card-grid">${items.map(reviewAdminCard).join("") || `<div class="empty-state">Noch keine Bewertungen vorhanden.</div>`}</div>`)}
    </div>`;
    const form = $('[data-review-card-form]');
    form.addEventListener("submit", saveReviewCardItem);
    form.upload?.addEventListener("change", () => previewAdminFile(form.upload, form.querySelector(".gallery-form-preview")));
    $('[data-review-new]')?.addEventListener("click", () => {
      editing.reviews = null;
      renderReviewManager();
      setStatus("Neue Bewertung bereit.");
    });
    $$("[data-review-edit]").forEach((button) => button.addEventListener("click", () => editReviewCardItem(button.dataset.reviewEdit)));
    $$("[data-review-delete]").forEach((button) => button.addEventListener("click", () => deleteReviewCardItem(button.dataset.reviewDelete, button)));
    $$("[data-review-move]").forEach((button) => button.addEventListener("click", () => moveManagedItem("reviews", button.dataset.reviewMove, Number(button.dataset.direction), button, "Bewertungen")));
  }

  function reviewAdminCard(item) {
    return `<article class="gallery-admin-card">
      <div class="gallery-admin-image">${galleryPreview({ url: item.photo || item.image_url, mediaType: item.mediaType, title: item.name })}</div>
      <div class="gallery-admin-copy"><div><strong>${escape(item.name || "Bewertung")}</strong><p>${"★".repeat(Number(item.rating || 5))}</p></div><span class="status-pill ${item.active === false ? "is-muted" : ""}">${item.active === false ? "Inaktiv" : "Aktiv"}</span></div>
      <p>${escape(item.text || "")}</p>
      <div class="gallery-admin-actions">
        <button class="mini-btn" type="button" data-review-edit="${escape(item.id)}">Bearbeiten</button>
        <button class="mini-btn danger" type="button" data-review-delete="${escape(item.id)}">Löschen</button>
        <button class="mini-btn" type="button" data-review-move="${escape(item.id)}" data-direction="-1">Nach oben</button>
        <button class="mini-btn" type="button" data-review-move="${escape(item.id)}" data-direction="1">Nach unten</button>
      </div>
    </article>`;
  }

  function editReviewCardItem(id) {
    const item = (content.reviews || []).find((entry) => String(entry.id) === String(id));
    if (!item) return setStatus("Bewertung nicht gefunden.", "error");
    editing.reviews = item;
    renderReviewManager();
    setStatus("Bewertung geladen.", "success");
  }

  async function saveReviewCardItem(event) {
    event.preventDefault();
    const form = event.currentTarget;
    await withButtonLoading(form.querySelector("[data-review-save]"), "Speichert...", async () => action("Bewertung", async () => {
      const item = editing.reviews || { id: uid("review"), sortOrder: (content.reviews || []).length + 1 };
      item.name = form.name.value.trim();
      item.text = form.text.value.trim();
      item.rating = Number(form.rating.value || 5);
      item.active = form.active.checked;
      applyMediaSelection(form.existingMedia, (url, type) => {
        item.photo = url;
        item.image_url = url;
        item.mediaType = type;
      });
      await uploadInto(form.upload, "reviews", (url, fileItem) => {
        item.photo = url;
        item.image_url = url;
        item.mediaType = fileItem?.type || mediaTypeForUrl(url);
      });
      content.reviews = content.reviews || [];
      if (!editing.reviews) content.reviews.push(item);
      content.translations = content.translations || {};
      content.translations.tr = content.translations.tr || {};
      content.translations.tr.reviews = content.translations.tr.reviews || {};
      content.translations.tr.reviews[item.id] = { ...(content.translations.tr.reviews[item.id] || {}), text: form.trText.value.trim() };
      editing.reviews = null;
      await saveSite("Bewertung");
      renderReviewManager();
    }));
  }

  async function deleteReviewCardItem(id, button) {
    if (!window.confirm("Diese Bewertung wirklich löschen?")) return;
    await withButtonLoading(button, "Löscht...", async () => action("Bewertung", async () => {
      content.reviews = (content.reviews || []).filter((item) => String(item.id) !== String(id));
      await saveSite("Bewertung");
      renderReviewManager();
    }));
  }

  async function moveManagedItem(key, id, direction, button, label) {
    await withButtonLoading(button, "Speichert...", async () => action(label, async () => {
      const items = sorted(content[key] || []);
      const index = items.findIndex((item) => String(item.id) === String(id));
      const target = index + direction;
      if (index < 0 || target < 0 || target >= items.length) return;
      [items[index], items[target]] = [items[target], items[index]];
      items.forEach((item, order) => item.sortOrder = order + 1);
      content[key] = items;
      await saveSite(label);
      if (key === "products") renderProductManager();
      if (key === "reviews") renderReviewManager();
    }));
  }

  function galleryPreview(item = {}) {
    const media = item.url || item.media || item.video || item.photo || item.image_url || item.image || item.images?.[0] || "";
    return media
      ? mediaPreview(media, item.mediaType || item.type, item.alt || item.title || "Medium")
      : `<span>Kein Medium ausgewählt</span>`;
  }

  function mediaTypeForUrl(url = "") {
    if (/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(String(url))) return "video";
    if (/\.gif(\?.*)?$/i.test(String(url))) return "gif";
    return "image";
  }

  function isVideoMedia(url = "", type = "") {
    return String(type).startsWith("video") || mediaTypeForUrl(url) === "video";
  }

  function normalizedMediaType(fileItem, url = "") {
    const type = fileItem?.type || "";
    if (type.startsWith("video/") || /\.(mp4|webm|mov|ogg)$/i.test(fileItem?.name || "") || mediaTypeForUrl(url) === "video") return "video";
    if (type === "image/gif" || /\.gif$/i.test(fileItem?.name || "") || mediaTypeForUrl(url) === "gif") return "gif";
    return "image";
  }

  function mediaPreview(url, type = "", alt = "Medium") {
    const src = escape(assetUrl(url));
    return isVideoMedia(url, type)
      ? `<video src="${src}" muted loop playsinline preload="metadata" controls></video>`
      : `<img src="${src}" alt="${escape(alt)}" />`;
  }

  function previewAdminFile(input, preview) {
    const fileItem = input?.files?.[0];
    if (!preview || !fileItem) return;
    preview.innerHTML = mediaPreview(URL.createObjectURL(fileItem), fileItem.type, "Ausgewähltes Medium");
  }

  function renderGalleryEditor() {
    const current = editing.gallery || {};
    const items = sorted(content.gallery || []);
    $('[data-panel="gallery"]').innerHTML = `<div class="gallery-editor">
      ${card(editing.gallery ? "Galerie-Medium bearbeiten" : "Neues Galerie-Medium", `<form data-gallery-form class="gallery-form">
        <div class="gallery-form-preview" data-gallery-form-preview>${galleryPreview(current)}</div>
        ${mediaSelect("existingMedia", "Vorhandenes Medium auswählen", current.url || current.image_url || "")}
        ${file("upload", editing.gallery ? "Medium ersetzen" : "Medium auswählen")}
        ${input("title", "Titel", current.title || "")}
        ${input("description", "Beschreibung", current.description || current.alt || "", "textarea")}
        ${input("category", "Kategorie", current.category || "")}
        ${checkbox("active", "Aktiv anzeigen", current.active !== false)}
        <div class="admin-actions span-all">
          <button class="btn btn-primary" type="submit" data-gallery-save>${editing.gallery ? "Änderungen speichern" : "Medium speichern"}</button>
          <button class="btn btn-glass" type="button" data-gallery-new>Neues Medium</button>
        </div>
      </form>`)}
      ${card("Galerie-Medien", `<div class="gallery-card-grid">${items.map(galleryAdminCard).join("") || `<div class="empty-state">Noch keine Galerie-Medien vorhanden.</div>`}</div>`)}
    </div>`;

    const form = $('[data-gallery-form]');
    form.addEventListener("submit", saveGalleryItem);
    form.upload?.addEventListener("change", () => previewSelectedGalleryFile(form.upload));
    $('[data-gallery-new]')?.addEventListener("click", () => {
      editing.gallery = null;
      renderGalleryEditor();
      setStatus("Neues Galerie-Medium bereit.");
    });
    $$("[data-gallery-edit]").forEach((button) => button.addEventListener("click", () => editGalleryItem(button.dataset.galleryEdit)));
    $$("[data-gallery-delete]").forEach((button) => button.addEventListener("click", () => deleteGalleryItem(button.dataset.galleryDelete, button)));
    $$("[data-gallery-move]").forEach((button) => button.addEventListener("click", () => moveGalleryItem(button.dataset.galleryMove, Number(button.dataset.direction), button)));
  }

  function galleryAdminCard(item) {
    return `<article class="gallery-admin-card">
      <div class="gallery-admin-image">${galleryPreview(item)}</div>
      <div class="gallery-admin-copy">
        <div>
          <strong>${escape(item.title || "Ohne Titel")}</strong>
          <p>${escape(item.category || "Keine Kategorie")}</p>
        </div>
        <span class="status-pill ${item.active === false ? "is-muted" : ""}">${item.active === false ? "Inaktiv" : "Aktiv"}</span>
      </div>
      <div class="gallery-admin-actions">
        <button class="mini-btn" type="button" data-gallery-edit="${escape(item.id)}">Bearbeiten</button>
        <button class="mini-btn danger" type="button" data-gallery-delete="${escape(item.id)}">Löschen</button>
        <button class="mini-btn" type="button" data-gallery-move="${escape(item.id)}" data-direction="-1">Nach oben</button>
        <button class="mini-btn" type="button" data-gallery-move="${escape(item.id)}" data-direction="1">Nach unten</button>
      </div>
    </article>`;
  }

  function previewSelectedGalleryFile(input) {
    const preview = $('[data-gallery-form-preview]');
    const fileItem = input?.files?.[0];
    if (!preview || !fileItem) return;
    const url = URL.createObjectURL(fileItem);
    preview.innerHTML = mediaPreview(url, fileItem.type, "Ausgewähltes Galerie-Medium");
  }

  function editGalleryItem(id) {
    const item = (content.gallery || []).find((entry) => String(entry.id) === String(id));
    if (!item) {
      setStatus("Galerie-Medium nicht gefunden.", "error");
      return;
    }
    editing.gallery = item;
    renderGalleryEditor();
    setStatus("Galerie-Medium geladen.", "success");
  }

  async function saveGalleryItem(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("[data-gallery-save]");
    await withButtonLoading(button, "Speichert...", async () => {
      await action("Galerie", async () => {
        setStatus("Galerie wird gespeichert...");
        const existing = editing.gallery;
        const item = existing || { id: uid("gallery"), sortOrder: (content.gallery || []).length + 1 };
        item.title = form.title.value.trim();
        item.description = form.description.value.trim();
        item.alt = form.description.value.trim();
        item.category = form.category.value.trim();
        item.active = form.active.checked;
        applyMediaSelection(form.existingMedia, (url, type) => {
          item.url = url;
          item.image_url = url;
          item.mediaType = type;
        });
        await uploadInto(form.upload, "gallery", async (url, fileItem) => {
          item.url = url;
          item.image_url = url;
          item.mediaType = fileItem?.type || mediaTypeForUrl(url);
        });
        if (!item.url && !item.image_url) throw new Error("Bitte ein Medium auswählen.");
        content.gallery = content.gallery || [];
        if (!existing) content.gallery.push(item);
        editing.gallery = null;
        await saveSite("Galerie");
        renderGalleryEditor();
      });
    });
  }

  async function deleteGalleryItem(id, button) {
    const item = (content.gallery || []).find((entry) => String(entry.id) === String(id));
    if (!item) {
      setStatus("Galerie-Medium nicht gefunden.", "error");
      return;
    }
    if (!window.confirm("Dieses Medium wirklich löschen?")) return;
    await withButtonLoading(button, "Löscht...", async () => {
      await action("Galerie löschen", async () => {
        setStatus("Galerie-Medium wird gelöscht...");
        const cleanupWarnings = [
          await deleteGalleryTableRow(id),
          await deleteStorageFile(item.url || item.image_url)
        ].filter(Boolean);
        content.gallery = (content.gallery || []).filter((entry) => String(entry.id) !== String(id));
        if (editing.gallery && String(editing.gallery.id) === String(id)) editing.gallery = null;
        await saveSite("Galerie");
        renderGalleryEditor();
        setStatus(cleanupWarnings.length ? `Galerie-Medium wurde gelöscht. Hinweis: ${cleanupWarnings.join(" ")}` : "Galerie-Medium wurde gelöscht.", cleanupWarnings.length ? "warning" : "success");
      });
    });
  }

  async function moveGalleryItem(id, direction, button) {
    await withButtonLoading(button, "Speichert...", async () => {
      await action("Galerie sortieren", async () => {
        const items = sorted(content.gallery || []);
        const index = items.findIndex((item) => String(item.id) === String(id));
        const target = index + direction;
        if (index < 0 || target < 0 || target >= items.length) return;
        [items[index], items[target]] = [items[target], items[index]];
        items.forEach((item, order) => item.sortOrder = order + 1);
        content.gallery = items;
        await saveSite("Galerie");
        renderGalleryEditor();
      });
    });
  }

  async function deleteGalleryTableRow(id) {
    if (demoMode) return "";
    await refreshClient();
    if (!client) return "";
    const { error } = await client.from("gallery_items").delete().eq("id", id);
    if (!error || ["42P01", "PGRST205", "22P02"].includes(error.code)) return "";
    return `gallery_items konnte nicht bereinigt werden: ${error.message || error}.`;
  }

  async function deleteStorageFile(url) {
    const path = storagePathFromUrl(url);
    if (!path || demoMode) return "";
    await refreshClient();
    if (!client) return "";
    const bucket = (window.MELODY_SUPABASE_CONFIG || {}).storageBucket || "melody-assets";
    const { error } = await client.storage.from(bucket).remove([path]);
    return error ? `Storage-Datei konnte nicht gelöscht werden: ${error.message || error}.` : "";
  }

  function storagePathFromUrl(url = "") {
    if (!url || !url.includes("/storage/v1/object/public/")) return "";
    const bucket = (window.MELODY_SUPABASE_CONFIG || {}).storageBucket || "melody-assets";
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = url.indexOf(marker);
    if (index === -1) return "";
    return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
  }

  function renderOrderFormEditor() {
    const deOrder = content.orderForm || {};
    const trOrder = content.translations?.tr?.orderForm || {};
    const pricing = deOrder.pricing || {};
    const textKeys = [
      ["categoryLabel", "Kartentyp Label"],
      ["categoryHelp", "Kartentyp Hilfetext"],
      ["nameLabel", "Kundenname Label"],
      ["emailLabel", "E-Mail Label"],
      ["phoneLabel", "Telefon Label"],
      ["songLanguageLabel", "Sprache Label"],
      ["voiceLabel", "Stimme Label"],
      ["musicStyleLabel", "Musikrichtung Label"],
      ["messageLabel", "Nachricht Label"],
      ["messagePlaceholder", "Nachricht Platzhalter"],
      ["selectPlaceholder", "Auswahl Platzhalter"],
      ["submitLabel", "Buttontext"],
      ["sending", "Meldung beim Senden"],
      ["success", "Erfolgsmeldung"],
      ["error", "Fehlermeldung"],
      ["requiredMessage", "Pflichtfeld-Meldung"],
      ["requestButton", "Karten-Button"]
    ];
    const optionKeys = [
      ["songLanguageOptions", "Sprache des Liedes Optionen"],
      ["voiceOptions", "Stimme Optionen"],
      ["musicStyleOptions", "Musikrichtung Optionen"]
    ];
    const priceFields = [
      ["base", "Basispreis"],
      ["personalizedCover", "Aufpreis personalisiertes Cover"],
      ["melodyText", "Aufpreis Text von Melody Cards"],
      ["photo", "Aufpreis Foto"],
      ["complexDesign", "Aufpreis aufwendiges Design"]
    ];
    const fieldEditor = Object.entries(deOrder.categoryFields || {}).map(([categoryId, fields]) => {
      const trFields = trOrder.categoryFields?.[categoryId] || [];
      const category = (content.categories || []).find((item) => item.id === categoryId);
      const deTemplates = deOrder.coverTemplates?.[categoryId] || [];
      const trTemplates = trOrder.coverTemplates?.[categoryId] || [];
      return `<div class="admin-card span-all"><h3>${escape(category?.title || categoryId)}</h3><div class="admin-grid">
        ${input(`templates.${categoryId}.de`, "Cover-Vorlagen DE", deTemplates.join("\n"), "textarea")}
        ${input(`templates.${categoryId}.tr`, "Cover-Vorlagen TR", trTemplates.join("\n"), "textarea")}
        ${(fields || []).map((field, index) => {
          const trField = trFields[index] || {};
          return `
            ${input(`field.${categoryId}.${index}.label.de`, `${field.name} Label DE`, field.label || "")}
            ${input(`field.${categoryId}.${index}.label.tr`, `${field.name} Label TR`, trField.label || "")}
            ${input(`field.${categoryId}.${index}.placeholder.de`, `${field.name} Platzhalter DE`, field.placeholder || "")}
            ${input(`field.${categoryId}.${index}.placeholder.tr`, `${field.name} Platzhalter TR`, trField.placeholder || "")}
          `;
        }).join("")}
      </div></div>`;
    }).join("");
    $('[data-panel="orderform"]').innerHTML = `<form data-orderform-editor class="admin-grid">
      ${textKeys.map(([key, label]) => `${input(`order.${key}.de`, `${label} DE`, deOrder[key] || "", key.includes("Placeholder") || key.includes("Message") || key === "categoryHelp" ? "textarea" : "text")}${input(`order.${key}.tr`, `${label} TR`, trOrder[key] || "", key.includes("Placeholder") || key.includes("Message") || key === "categoryHelp" ? "textarea" : "text")}`).join("")}
      ${optionKeys.map(([key, label]) => `${input(`order.${key}.de`, `${label} DE`, (deOrder[key] || []).join("\n"), "textarea")}${input(`order.${key}.tr`, `${label} TR`, (trOrder[key] || []).join("\n"), "textarea")}`).join("")}
      <div class="admin-card span-all"><h3>Preise</h3><div class="admin-grid">
        ${priceFields.map(([key, label]) => input(`pricing.${key}`, label, pricing[key] ?? "", "number")).join("")}
        ${input("pricing.currency", "Währung", pricing.currency || "€")}
      </div></div>
      ${fieldEditor}
      <button class="btn btn-primary span-all" type="submit" data-orderform-save>Bestellformular speichern</button>
    </form>`;
    $('[data-orderform-editor]')?.addEventListener("submit", saveOrderFormEditor);
  }

  async function saveOrderFormEditor(event) {
    event.preventDefault();
    const form = event.currentTarget;
    await withButtonLoading(form.querySelector("[data-orderform-save]"), "Speichert...", async () => action("Bestellformular", async () => {
      content.orderForm = content.orderForm || {};
      content.translations = content.translations || {};
      content.translations.tr = content.translations.tr || {};
      content.translations.tr.orderForm = content.translations.tr.orderForm || {};
      const textKeys = [
        "categoryLabel", "categoryHelp", "nameLabel", "emailLabel", "phoneLabel", "songLanguageLabel", "voiceLabel", "musicStyleLabel",
        "messageLabel", "messagePlaceholder", "selectPlaceholder", "submitLabel", "sending", "success", "error", "requiredMessage", "requestButton"
      ];
      const optionKeys = ["songLanguageOptions", "voiceOptions", "musicStyleOptions"];
      textKeys.forEach((key) => {
        content.orderForm[key] = form.elements[`order.${key}.de`]?.value || "";
        content.translations.tr.orderForm[key] = form.elements[`order.${key}.tr`]?.value || "";
      });
      optionKeys.forEach((key) => {
        content.orderForm[key] = splitLines(form.elements[`order.${key}.de`]?.value || "");
        content.translations.tr.orderForm[key] = splitLines(form.elements[`order.${key}.tr`]?.value || "");
      });
      content.orderForm.pricing = content.orderForm.pricing || {};
      ["base", "personalizedCover", "melodyText", "photo", "complexDesign"].forEach((key) => {
        content.orderForm.pricing[key] = Number(form.elements[`pricing.${key}`]?.value || 0);
      });
      content.orderForm.pricing.currency = form.elements["pricing.currency"]?.value || "€";
      content.translations.tr.orderForm.pricing = { ...content.orderForm.pricing };
      Object.entries(content.orderForm.categoryFields || {}).forEach(([categoryId, fields]) => {
        content.orderForm.coverTemplates = content.orderForm.coverTemplates || {};
        content.translations.tr.orderForm.coverTemplates = content.translations.tr.orderForm.coverTemplates || {};
        content.orderForm.coverTemplates[categoryId] = splitLines(form.elements[`templates.${categoryId}.de`]?.value || "");
        content.translations.tr.orderForm.coverTemplates[categoryId] = splitLines(form.elements[`templates.${categoryId}.tr`]?.value || "");
        content.translations.tr.orderForm.categoryFields = content.translations.tr.orderForm.categoryFields || {};
        content.translations.tr.orderForm.categoryFields[categoryId] = content.translations.tr.orderForm.categoryFields[categoryId] || [];
        fields.forEach((field, index) => {
          field.label = form.elements[`field.${categoryId}.${index}.label.de`]?.value || "";
          field.placeholder = form.elements[`field.${categoryId}.${index}.placeholder.de`]?.value || "";
          content.translations.tr.orderForm.categoryFields[categoryId][index] = {
            ...(content.translations.tr.orderForm.categoryFields[categoryId][index] || {}),
            ...field,
            label: form.elements[`field.${categoryId}.${index}.label.tr`]?.value || "",
            placeholder: form.elements[`field.${categoryId}.${index}.placeholder.tr`]?.value || ""
          };
        });
      });
      await saveSite("Bestellformular");
      renderOrderFormEditor();
    }));
  }

  function splitLines(value = "") {
    return String(value).split("\n").map((line) => line.trim()).filter(Boolean);
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
    return [["title","Titel"],["description","Beschreibung","textarea"],["price","Preis"],["discount","Rabatt"],["category","Kategorie"],["status","Status"],["featured","Empfohlen","checkbox"],["sortOrder","Reihenfolge","number"],["upload","Medium auswählen","file"]];
  }
  function galleryFields() {
    return [["title","Titel"],["alt","Alt Text"],["category","Kategorie"],["sortOrder","Reihenfolge","number"],["active","Aktiv","checkbox"],["upload","Medium auswählen","file"]];
  }
  function reviewFields() {
    return [["name","Name"],["text","Text","textarea"],["rating","Sterne","number"],["sortOrder","Reihenfolge","number"],["active","Aktiv","checkbox"],["upload","Medium auswählen","file"]];
  }
  function faqFields() {
    return [["question","Frage"],["answer","Antwort","textarea"],["sortOrder","Reihenfolge","number"],["active","Aktiv","checkbox"]];
  }

  function row(key, item) {
    const image = item.url || item.photo || item.images?.[0] || "";
    return `<article class="admin-row"><img class="admin-thumb" src="${escape(assetUrl(image))}" alt="" /><div><strong>${escape(item.title || item.name || item.question || item.id)}</strong><p>${escape(item.description || item.text || item.answer || "")}</p></div><div class="admin-actions"><button class="mini-btn" data-edit="${escape(item.id)}">Bearbeiten</button><button class="mini-btn" data-move="${escape(item.id)}" data-direction="-1">↑</button><button class="mini-btn" data-move="${escape(item.id)}" data-direction="1">↓</button><button class="mini-btn danger" data-delete="${escape(item.id)}">Löschen</button></div></article>`;
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
    content.mediaLibrary = content.mediaLibrary || [];
    $('[data-panel="media"]').innerHTML = `<div class="gallery-editor">
      ${card("Medien hochladen", `<form data-media-form class="gallery-form">
        <div class="gallery-form-preview" data-media-preview><span>Kein Medium ausgewählt</span></div>
        ${input("title","Titel","")}
        ${input("alt","Beschreibung / Alt-Text","")}
        ${input("category","Kategorie","")}
        <label>Zuweisen zu<select name="target">
          <option value="">Nur in Medien speichern</option>
          <option value="hero-video">Hero-Video / Startseiten-Clip</option>
          <option value="hero-image">Hero-Fallback-Medium</option>
          <option value="gallery">Galerie</option>
          <option value="products">Produktbereich</option>
          <option value="process">Ablauf-Bereich</option>
          <option value="about">Über-uns-Bereich</option>
          <option value="media-section">Neue Mediensektion</option>
        </select></label>
        ${file("upload","Medium auswählen")}
        <button class="btn btn-primary span-all" type="submit" data-media-save>Medium speichern</button>
      </form>`)}
      ${card("Medien", `<div class="gallery-card-grid">${content.mediaLibrary.map(mediaLibraryCard).join("") || `<div class="empty-state">Noch keine Medien vorhanden.</div>`}</div>`)}
    </div>`;
    $('[data-media-form]').addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("[data-media-save]");
      await withButtonLoading(button, "Speichert...", async () => action("Medium", async () => {
        const form = event.currentTarget;
        let uploaded = "";
        let uploadedType = "";
        await uploadInto(form.upload, "media", (url, fileItem) => {
          uploaded = url;
          uploadedType = fileItem?.type || mediaTypeForUrl(url);
        });
        if (!uploaded) throw new Error("Bitte ein Medium auswählen.");
        content.mediaLibrary = content.mediaLibrary || [];
        const item = { id: uid("media"), title: form.title.value, alt: form.alt.value, category: form.category.value, url: uploaded, mediaType: uploadedType, active: true, sortOrder: 1 };
        content.mediaLibrary.unshift(item);
        assignMediaToTarget(item, form.target.value);
        await saveSite("Medien");
        renderMedia();
      }));
    });
    $('[data-media-form] input[type="file"]')?.addEventListener("change", (event) => previewAdminFile(event.currentTarget, $('[data-media-preview]')));
    $$("[data-delete-media]").forEach((button) => button.addEventListener("click", () => deleteMediaItem(button.dataset.deleteMedia, button)));
    $$("[data-assign-media]").forEach((button) => button.addEventListener("click", () => assignExistingMedia(button.dataset.assignMedia, button)));
  }

  function mediaLibraryCard(item) {
    return `<article class="gallery-admin-card">
      <div class="gallery-admin-image">${galleryPreview(item)}</div>
      <div class="gallery-admin-copy"><div><strong>${escape(item.title || "Medium")}</strong><p>${escape(item.category || item.mediaType || "")}</p></div><span class="status-pill">${isVideoMedia(item.url, item.mediaType) ? "Video" : (item.mediaType === "gif" || /\.gif(\?.*)?$/i.test(item.url || "")) ? "GIF" : "Bild"}</span></div>
      <label>Zuweisen zu<select data-media-target="${escape(item.id)}">
        <option value="hero-video">Hero-Video</option>
        <option value="hero-image">Hero-Fallback-Medium</option>
        <option value="gallery">Galerie</option>
        <option value="products">Produktbereich</option>
        <option value="process">Ablauf-Bereich</option>
        <option value="about">Über uns</option>
        <option value="media-section">Neue Mediensektion</option>
      </select></label>
      <div class="gallery-admin-actions">
        <button class="mini-btn" type="button" data-assign-media="${escape(item.id)}">Zuweisen</button>
        <a class="mini-btn" href="${escape(assetUrl(item.url))}" target="_blank" rel="noreferrer">Öffnen</a>
        <button class="mini-btn danger" type="button" data-delete-media="${escape(item.id)}">Löschen</button>
      </div>
    </article>`;
  }

  async function assignExistingMedia(id, button) {
    const item = (content.mediaLibrary || []).find((entry) => String(entry.id) === String(id));
    if (!item) return setStatus("Medium nicht gefunden.", "error");
    const target = $$("[data-media-target]").find((select) => String(select.dataset.mediaTarget) === String(id))?.value || "";
    await withButtonLoading(button, "Speichert...", async () => action("Medium zuweisen", async () => {
      assignMediaToTarget(item, target);
      await saveSite("Medien");
      renderMedia();
    }));
  }

  function assignMediaToTarget(item, target) {
    if (!target) return;
    const url = item.url;
    const type = item.mediaType || mediaTypeForUrl(url);
    const sectionById = (id) => (content.sections || []).find((section) => section.id === id);
    if (target === "hero-video") {
      const heroSection = sectionById("home");
      if (heroSection) heroSection.video = url;
      return;
    }
    if (target === "hero-image") {
      const heroSection = sectionById("home");
      if (heroSection) heroSection.image = url;
      return;
    }
    if (target === "gallery") {
      content.gallery = content.gallery || [];
      content.gallery.unshift({ id: uid("gallery"), title: item.title || "Galerie", description: item.alt || "", alt: item.alt || item.title || "", category: item.category || "", url, image_url: url, mediaType: type, active: true, sortOrder: 1 });
      return;
    }
    if (target === "products") {
      const product = sorted(content.products || [])[0];
      if (product) {
        product.images = [url];
        product.mediaType = type;
      }
      return;
    }
    if (target === "process") {
      const process = sectionById("process");
      if (process?.items?.[0]) {
        process.items[0].media = url;
        process.items[0].mediaType = type;
      }
      return;
    }
    if (target === "about") {
      const about = sectionById("about");
      if (about) {
        if (isVideoMedia(url, type)) about.video = url;
        else about.image = url;
      }
      return;
    }
    if (target === "media-section") {
      content.sections = content.sections || [];
      content.sections.push({
        id: uid("media-section"),
        type: "media",
        active: true,
        order: (content.sections || []).length + 1,
        eyebrow: "Medien",
        title: item.title || "Medien",
        text: item.alt || "",
        items: [{ id: uid("media-item"), title: item.title || "Medium", description: item.alt || "", alt: item.alt || "", url, mediaType: type, active: true, sortOrder: 1 }]
      });
    }
  }

  async function deleteMediaItem(id, button) {
    const item = (content.mediaLibrary || []).find((entry) => String(entry.id) === String(id));
    if (!item) return setStatus("Medium nicht gefunden.", "error");
    if (!window.confirm("Dieses Medium wirklich löschen?")) return;
    await withButtonLoading(button, "Löscht...", async () => action("Medium löschen", async () => {
      const storageWarning = await deleteStorageFile(item.url);
      content.mediaLibrary = (content.mediaLibrary || []).filter((entry) => String(entry.id) !== String(id));
      await saveSite("Medien");
      renderMedia();
      if (storageWarning) setStatus(`Medium gelöscht. Hinweis: ${storageWarning}`, "warning");
    }));
  }

  async function renderOrders() {
    $('[data-panel="orders"]').innerHTML = card("Bestellungen", `<button class="btn btn-glass" data-load-orders>Bestellungen laden</button><div class="admin-list" data-orders-list></div>`);
    $('[data-load-orders]')?.addEventListener("click", () => loadOrders());
  }

  const songLanguageOptions = ["Deutsch", "Türkisch"];
  const voiceOptions = ["Männlich", "Weiblich"];
  const musicStyleOptions = ["Pop", "Türkisch emotional", "Ballade", "Rap", "Akustik", "Arabesk", "Überrasch mich"];

  async function loadOrders() {
    await action("Bestellungen", async () => {
      await refreshClient();
      if (!client) throw new Error("Supabase nicht verbunden.");
      const { data, error } = await loadOrderRows();
      if (error) throw error;
      $('[data-orders-list]').innerHTML = (data || []).map(orderAdminCard).join("") || "<p>Keine Bestellungen.</p>";
      $$("[data-order-form]").forEach((form) => form.addEventListener("submit", saveOrderEdits));
      setStatus("Bestellungen geladen.", "success");
    });
  }

  async function loadOrderRows() {
    const tables = ["premium_orders", "orders"];
    const rows = [];
    const errors = [];
    for (const table of tables) {
      const { data, error } = await client.from(table).select("*").order("created_at", { ascending: false }).limit(50);
      if (error) {
        if (isMissingOrderTable(error)) {
          errors.push(`${table}: ${error.message}`);
          continue;
        }
        return { data: rows, error };
      }
      rows.push(...(data || []).map((row) => ({ ...row, _order_table: table })));
    }
    if (!rows.length && errors.length === tables.length) {
      return { data: [], error: new Error("Keine Bestelltabelle gefunden. Bitte premium_orders oder orders in Supabase anlegen.") };
    }
    rows.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    return { data: rows.slice(0, 50), error: null };
  }

  function orderAdminCard(order) {
    const wish = parseMusicWish(order.music_wish);
    const categoryValue = order.card_category || wish.card_category || "";
    const recipientValue = order.recipient_name || wish.recipient_name || "";
    const occasionValue = order.occasion || wish.occasion || "";
    const languageValue = order.song_language || wish.song_language || "";
    const voiceValue = order.voice || wish.voice || "";
    const styleValue = order.music_style || wish.music_style || "";
    const storyValue = order.story || wish.story || order.message || "";
    const cardConfig = order.configurator || wish.configurator || {};
    const photoValue = order.card_photo_url || cardConfig.photo_url || order.image_url || "";
    return `<article class="order-admin-card">
      <header>
        <div>
          <strong>${escape(order.name || "Ohne Name")}</strong>
          <p>${escape(order.email || "")}${order.phone ? ` · ${escape(order.phone)}` : ""}</p>
        </div>
        <span class="status-pill">${escape(order.status || "neu")}</span>
      </header>
      ${orderConfiguratorSummary(cardConfig, order)}
      <form data-order-form="${escape(order.id)}" data-order-table="${escape(order._order_table || "premium_orders")}" class="order-admin-form">
        ${adminSelect("card_category", "Kartentyp", categoryOrderOptions(categoryValue), categoryValue)}
        <label>Name der Person<input name="recipient_name" value="${escape(recipientValue)}" /></label>
        <label>Anlass<input name="occasion" value="${escape(occasionValue)}" /></label>
        ${adminSelect("song_language", "Sprache des Liedes", songLanguageOptions, languageValue)}
        ${adminSelect("voice", "Stimme", voiceOptions, voiceValue)}
        ${adminSelect("music_style", "Musikrichtung", musicStyleOptions, styleValue)}
        ${adminSelect("status", "Status", ["neu", "in_bearbeitung", "fertig", "archiviert", "new", "in_progress", "done", "archived"], order.status || "neu")}
        <label class="span-all">Kartentext<textarea name="card_text" rows="3">${escape(order.card_text || "")}</textarea></label>
        <div class="order-config-edit span-all">
          <strong>Karten-Konfiguration</strong>
          ${adminSelectWithLabels("inside_text_mode", "Textmodus", [
            ["self", "Kunde schreibt selbst"],
            ["melody", "Melody Cards schreibt"],
            ["empty", "Innen leer lassen"]
          ], cardConfig.inside_text_mode || "self")}
          <label>Vorlage<input name="config_template" value="${escape(cardConfig.template || "")}" /></label>
          <label>Cover-Text<input name="config_cover_text" value="${escape(cardConfig.cover_text || "")}" /></label>
          <label>Cover-Name<input name="config_cover_name" value="${escape(cardConfig.cover_name || "")}" /></label>
          <label>Kurzer Zusatztext<input name="config_cover_extra" value="${escape(cardConfig.cover_extra || "")}" /></label>
          <label class="span-all">Innen links<textarea name="config_inside_left_text" rows="3">${escape(cardConfig.inside_left_text || "")}</textarea></label>
          <label class="span-all">Melody-Textwunsch<textarea name="config_text_brief" rows="3">${escape(cardConfig.text_brief || "")}</textarea></label>
          <label class="span-all">Innen rechts<textarea name="config_inside_right_text" rows="3">${escape(cardConfig.inside_right_text || "")}</textarea></label>
          <label>Beziehung<input name="config_relationship" value="${escape(cardConfig.relationship || "")}" /></label>
          <label class="span-all">Preis-Hinweis<input name="price_note" value="${escape(cardConfig.price_note || "")}" /></label>
          <input name="card_photo_url" type="hidden" value="${escape(photoValue)}" />
        </div>
        <label class="span-all">Persönliche Infos / Geschichte<textarea name="story" rows="3">${escape(storyValue)}</textarea></label>
        <label class="span-all">Nachricht<textarea name="message" rows="3">${escape(order.message || "")}</textarea></label>
        <button class="btn btn-primary span-all" type="submit" data-order-save>Bestellung speichern</button>
      </form>
    </article>`;
  }

  function orderConfiguratorSummary(config = {}, order = {}) {
    if (!Object.keys(config || {}).length && !order.image_url && !order.card_photo_url) return "";
    const photo = config.photo_url || order.card_photo_url || order.image_url || "";
    return `<div class="order-config-summary">
      ${photo ? `<img class="admin-thumb" src="${escape(photo)}" alt="" />` : ""}
      <dl>
        ${summaryRow("Vorlage", config.template)}
        ${summaryRow("Cover-Text", config.cover_text)}
        ${summaryRow("Cover-Name", config.cover_name)}
        ${summaryRow("Zusatztext", config.cover_extra)}
        ${summaryRow("Innen links", config.inside_left_text || config.text_brief)}
        ${summaryRow("Foto rechts", config.right_photo_enabled ? "Ja" : "")}
        ${summaryRow("Text rechts aktiv", config.right_text_enabled ? "Ja" : "")}
        ${summaryRow("Textmodus rechts", config.inside_right_text_mode_label)}
        ${summaryRow("Innen rechts", config.inside_right_text)}
        ${summaryRow("Textmodus", config.inside_text_mode_label)}
        ${summaryRow("Beziehung", config.relationship)}
        ${summaryRow("Preis", config.price_note || (config.price ? `${config.price} ${config.currency || "€"}` : ""))}
        ${summaryRow("QR-Code", config.qr_position === "inside_left_bottom_center" ? "Innen links unten mittig" : config.qr_position)}
      </dl>
    </div>`;
  }

  function summaryRow(label, value) {
    return value ? `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>` : "";
  }

  function categoryOrderOptions(current = "") {
    const items = sorted(content.categories || []).filter((item) => item.active !== false);
    const options = items.map((item) => item.title || item.id).filter(Boolean);
    if (current && !options.includes(current)) options.unshift(current);
    return options;
  }

  function adminSelect(name, label, options, selected) {
    return `<label>${escape(label)}<select name="${escape(name)}" required>${options.map((option) => `<option value="${escape(option)}" ${option === selected ? "selected" : ""}>${escape(option)}</option>`).join("")}</select></label>`;
  }

  function adminSelectWithLabels(name, label, options, selected) {
    return `<label>${escape(label)}<select name="${escape(name)}">${options.map(([value, title]) => `<option value="${escape(value)}" ${value === selected ? "selected" : ""}>${escape(title)}</option>`).join("")}</select></label>`;
  }

  function parseMusicWish(value = "") {
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return {
        card_category: parsed.card_category || parsed.category || "",
        recipient_name: parsed.recipient_name || parsed.recipient || "",
        occasion: parsed.occasion || "",
        song_language: parsed.song_language || parsed.language || "",
        voice: parsed.voice || "",
        music_style: parsed.music_style || parsed.style || "",
        story: parsed.story || parsed.message || "",
        configurator: parsed.configurator || {}
      };
    } catch {
      const text = String(value);
      return {
        card_category: extractMusicWishLine(text, ["Kartentyp", "Kart türü"]),
        recipient_name: extractMusicWishLine(text, ["Beschenkte Person", "Alıcı"]),
        occasion: extractMusicWishLine(text, ["Anlass", "Sebep"]),
        song_language: extractMusicWishLine(text, ["Sprache des Liedes", "Şarkının dili"]),
        voice: extractMusicWishLine(text, ["Stimme", "Ses"]),
        music_style: extractMusicWishLine(text, ["Musikrichtung", "Müzik tarzı"]),
        story: ""
      };
    }
  }

  function extractMusicWishLine(text, labels) {
    for (const label of labels) {
      const match = text.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"));
      if (match) return match[1].trim();
    }
    return "";
  }

  function serializeMusicWish(form) {
    return JSON.stringify({
      card_category: form.elements.card_category.value,
      recipient_name: form.elements.recipient_name.value,
      occasion: form.elements.occasion.value,
      song_language: form.elements.song_language.value,
      voice: form.elements.voice.value,
      music_style: form.elements.music_style.value,
      story: form.elements.story.value,
      configurator: collectOrderConfiguratorFromAdmin(form),
      labels: {
        card_category: "Kartentyp",
        recipient_name: "Name der Person",
        occasion: "Anlass",
        song_language: "Sprache des Liedes",
        voice: "Stimme",
        music_style: "Musikrichtung"
      }
    });
  }

  function collectOrderConfiguratorFromAdmin(form) {
    const mode = form.elements.inside_text_mode?.value || "self";
    return {
      design_mode: "template",
      template: form.elements.config_template?.value || "",
      cover_text: form.elements.config_cover_text?.value || "",
      cover_name: form.elements.config_cover_name?.value || "",
      cover_extra: form.elements.config_cover_extra?.value || "",
      inside_text_mode: mode,
      inside_text_mode_label: mode === "melody" ? "Melody Cards schreibt" : mode === "empty" ? "Innen leer lassen" : "Kunde schreibt selbst",
      inside_left_text: form.elements.config_inside_left_text?.value || "",
      text_brief: form.elements.config_text_brief?.value || "",
      inside_right_text: form.elements.config_inside_right_text?.value || "",
      relationship: form.elements.config_relationship?.value || "",
      photo_url: form.elements.card_photo_url?.value || "",
      price: null,
      price_note: form.elements.price_note?.value || "",
      currency: "€",
      qr_position: "inside_left_bottom_center"
    };
  }

  async function saveOrderEdits(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("[data-order-save]");
    const id = form.dataset.orderForm;
    const table = form.dataset.orderTable || "premium_orders";
    await withButtonLoading(button, "Speichert...", async () => {
      await action("Bestellung", async () => {
        await refreshClient();
        if (!client) throw new Error("Supabase nicht verbunden.");
        const payload = {
          configurator: collectOrderConfiguratorFromAdmin(form),
          card_category: form.elements.card_category.value,
          recipient_name: form.elements.recipient_name.value,
          occasion: form.elements.occasion.value,
          song_language: form.elements.song_language.value,
          voice: form.elements.voice.value,
          music_style: form.elements.music_style.value,
          story: form.elements.story.value,
          music_wish: serializeMusicWish(form),
          calculated_price: null,
          card_photo_url: form.elements.card_photo_url?.value || "",
          status: form.elements.status.value,
          card_text: form.elements.card_text.value,
          message: form.elements.message.value
        };
        let { error } = await client.from(table).update(payload).eq("id", id);
        if (error && isMissingOrderColumn(error)) {
          const fallback = {
            music_wish: payload.music_wish,
            status: payload.status,
            card_text: payload.card_text,
            message: payload.message
          };
          const retry = await client.from(table).update(fallback).eq("id", id);
          error = retry.error;
        }
        if (error) throw error;
        setStatus("Bestellung wurde gespeichert.", "success");
      });
    });
  }

  function isMissingOrderColumn(error) {
    const message = error?.message || "";
    return error?.code === "PGRST204" || message.toLowerCase().includes("could not find");
  }

  function isMissingOrderTable(error) {
    const message = (error?.message || "").toLowerCase();
    const details = (error?.details || "").toLowerCase();
    return error?.code === "PGRST205" || error?.code === "42P01" || message.includes("could not find the table") || (details.includes("relation") && details.includes("does not exist"));
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
        ["premium_orders", "id,name,email,phone,address,card_category,recipient_name,occasion,song_language,voice,music_style,story,configurator,calculated_price,card_photo_url,card_text,music_wish,message,file_url,image_url,video_url,audio_url,status,created_at"],
        ["orders", "id,name,email,phone,address,card_category,recipient_name,occasion,song_language,voice,music_style,story,configurator,calculated_price,card_photo_url,card_text,music_wish,message,file_url,image_url,video_url,audio_url,status,created_at"]
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
    return `<label>${escape(label)}<input name="${name}" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/ogg,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov" /></label>`;
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
    const fileItem = input.files[0];
    const url = await api.uploadFile(fileItem, folder);
    if (!url) throw new Error("Upload fehlgeschlagen.");
    setter(url, { file: fileItem, type: normalizedMediaType(fileItem, url) });
  }
  async function withButtonLoading(button, text, fn) {
    if (!button) return fn();
    const original = button.textContent;
    button.disabled = true;
    button.textContent = text;
    try {
      return await fn();
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
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
