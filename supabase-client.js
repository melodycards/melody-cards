(function () {
  const config = window.MELODY_SUPABASE_CONFIG || {};
  const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  let supabaseLoadPromise = null;

  function ensureSupabaseLoaded() {
    if (window.supabase) return Promise.resolve(true);
    if (!config.url || !config.anonKey || !document?.head) return Promise.resolve(false);
    if (supabaseLoadPromise) return supabaseLoadPromise;
    supabaseLoadPromise = new Promise((resolve) => {
      const existing = Array.from(document.scripts).find((script) => script.src === SUPABASE_CDN);
      const script = existing || document.createElement("script");
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve(Boolean(window.supabase));
      };
      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", finish, { once: true });
      window.setTimeout(finish, 8000);
      if (!existing) {
        script.src = SUPABASE_CDN;
        script.async = true;
        document.head.appendChild(script);
      }
    });
    return supabaseLoadPromise;
  }

  function isConfigured() {
    return Boolean(config.url && config.anonKey && window.supabase);
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (!window.melodySupabaseClient) {
      window.melodySupabaseClient = window.supabase.createClient(config.url, config.anonKey);
    }
    return window.melodySupabaseClient;
  }

  const allowedMediaTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/ogg"
  ];

  function validateMediaFile(file) {
    if (!file) return;
    const maxMb = Number(config.maxUploadMB || 80);
    const type = file.type || "";
    const extensionAllowed = /\.(jpe?g|png|webp|gif|mp4|webm|mov|ogg)$/i.test(file.name || "");
    if (!allowedMediaTypes.includes(type) && !extensionAllowed) {
      throw new Error("Dieses Dateiformat wird nicht unterstützt. Erlaubt sind JPG, PNG, WebP, GIF, MP4, WebM und MOV.");
    }
    if (file.size > maxMb * 1024 * 1024) {
      throw new Error(`Die Datei ist zu groß. Maximal erlaubt sind ${maxMb} MB.`);
    }
  }

  async function getReadyClient() {
    await ensureSupabaseLoaded();
    return getClient();
  }

  async function selectTable(client, table, options = {}) {
    let query = client.from(table).select("*");
    if (options.activeOnly) query = query.eq("active", true);
    if (options.order) query = query.order(options.order, { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function fetchContent() {
    const fallback = window.MELODY_DEMO_CONTENT;
    const client = await getReadyClient();
    if (!client) return { ...fallback, source: "demo" };

    try {
      const [{ data: settings, error: settingsError }, products, gallery, reviews, faqs, blog] = await Promise.all([
        client.from("site_settings").select("*").eq("id", 1).maybeSingle(),
        selectTable(client, "products", { activeOnly: true, order: "sort_order" }),
        selectTable(client, "gallery_items", { activeOnly: true, order: "sort_order" }),
        selectTable(client, "reviews", { activeOnly: true, order: "sort_order" }),
        selectTable(client, "faqs", { activeOnly: true, order: "sort_order" }),
        selectTable(client, "blog_posts", { activeOnly: true, order: "published_at" })
      ]);
      if (settingsError) throw settingsError;
      return {
        ...fallback,
        settings: settings || fallback.settings,
        products: products.length ? products : fallback.products,
        gallery: gallery.length ? gallery : fallback.gallery,
        reviews: reviews.length ? reviews : fallback.reviews,
        faqs: faqs.length ? faqs : fallback.faqs,
        blog: blog.length ? blog : fallback.blog,
        source: "supabase"
      };
    } catch (error) {
      console.warn("Supabase fallback active:", error.message);
      return { ...fallback, source: "demo" };
    }
  }

  async function uploadFile(file, folder = "uploads") {
    const client = await getReadyClient();
    if (!client || !file) return null;
    validateMediaFile(file);
    const bucket = config.storageBucket || "melody-assets";
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `${folder}/${Date.now()}-${safeName}`;
    const { error } = await client.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  function readableOrderError(error) {
    const message = error?.message || "Unbekannter Supabase-Fehler.";
    const code = error?.code || "";
    if (code === "PGRST205" || code === "42P01" || message.toLowerCase().includes("premium_orders")) {
      return "Die Supabase-Tabelle premium_orders fehlt. Bitte fuehre die SQL-Datei premium_orders.sql oder supabase.sql im Supabase SQL Editor aus.";
    }
    if (code === "42501" || message.toLowerCase().includes("row-level security") || message.toLowerCase().includes("permission")) {
      return "Supabase verweigert das Speichern. Bitte pruefe die RLS-Policy fuer premium_orders und die Storage-Policy fuer orders-Uploads.";
    }
    return `Supabase-Fehler: ${message}`;
  }

  async function uploadOrderFile(file, kind) {
    if (!file) return null;
    if (!(await getReadyClient())) {
      throw new Error("Supabase ist nicht verbunden. Bitte config.js mit URL und Anon Key pruefen.");
    }
    try {
      return await uploadFile(file, `orders/${kind}`);
    } catch (error) {
      throw new Error(`Upload fuer ${kind} fehlgeschlagen: ${readableOrderError(error)}`);
    }
  }

  async function createPremiumOrder(order) {
    const client = await getReadyClient();
    if (!client) {
      throw new Error("Supabase ist nicht verbunden. Bitte config.js mit URL und Anon Key pruefen.");
    }
    const { error } = await client.from("premium_orders").insert(order);
    if (error) throw new Error(readableOrderError(error));
    return true;
  }

  window.MelodySupabase = {
    isConfigured,
    ensureSupabaseLoaded,
    getClient,
    fetchContent,
    uploadFile,
    uploadOrderFile,
    createPremiumOrder
  };
})();
