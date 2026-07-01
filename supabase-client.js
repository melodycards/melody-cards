(function () {
  const config = window.MELODY_SUPABASE_CONFIG || {};

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
    const client = getClient();
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
    const client = getClient();
    if (!client || !file) return null;
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
    if (!getClient()) {
      throw new Error("Supabase ist nicht verbunden. Bitte config.js mit URL und Anon Key pruefen.");
    }
    try {
      return await uploadFile(file, `orders/${kind}`);
    } catch (error) {
      throw new Error(`Upload fuer ${kind} fehlgeschlagen: ${readableOrderError(error)}`);
    }
  }

  async function createPremiumOrder(order) {
    const client = getClient();
    if (!client) {
      throw new Error("Supabase ist nicht verbunden. Bitte config.js mit URL und Anon Key pruefen.");
    }
    const { error } = await client.from("premium_orders").insert(order);
    if (error) throw new Error(readableOrderError(error));
    return true;
  }

  window.MelodySupabase = {
    isConfigured,
    getClient,
    fetchContent,
    uploadFile,
    uploadOrderFile,
    createPremiumOrder
  };
})();
