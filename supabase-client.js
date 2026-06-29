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

  window.MelodySupabase = {
    isConfigured,
    getClient,
    fetchContent,
    uploadFile
  };
})();
