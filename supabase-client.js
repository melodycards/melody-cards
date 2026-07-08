(function () {
  const config = window.MELODY_SUPABASE_CONFIG || {};
  const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  let supabaseLoadPromise = null;

  function ensureSupabaseLoaded(timeoutMs) {
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
        const loaded = Boolean(window.supabase);
        if (!loaded) supabaseLoadPromise = null;
        resolve(loaded);
      };
      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", finish, { once: true });
      window.setTimeout(finish, timeoutMs ?? (document.body?.dataset.admin === "true" ? 8000 : 1600));
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

  async function getReadyClient(timeoutMs) {
    await ensureSupabaseLoaded(timeoutMs);
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
    const client = await getReadyClient(1600);
    if (!client) return { ...fallback, source: "demo" };

    try {
      const { data: settings, error: settingsError } = await client.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (settingsError) throw settingsError;
      return {
        ...fallback,
        settings: settings || fallback.settings,
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

  function readableOrderError(error, table = "premium_orders") {
    const message = error?.message || "Unbekannter Supabase-Fehler.";
    const code = error?.code || "";
    if (isMissingTableError(error)) {
      return `Die Supabase-Tabelle ${table} fehlt oder ist nicht im API-Schema erreichbar. Bitte fuehre die aktuelle supabase.sql im Supabase SQL Editor aus.`;
    }
    if (code === "PGRST204" || message.toLowerCase().includes("could not find")) {
      return `In ${table} fehlt eine Spalte: ${message}. Bitte fuehre die aktuelle supabase.sql aus. Die Bestellung wird automatisch mit den kompatiblen Basisfeldern erneut versucht.`;
    }
    if (code === "42501" || message.toLowerCase().includes("row-level security") || message.toLowerCase().includes("permission")) {
      return `Supabase verweigert das Speichern in ${table}. Bitte pruefe die RLS-Policy fuer Bestellungen und die Storage-Policy fuer orders-Uploads.`;
    }
    return `Supabase-Fehler: ${message}`;
  }

  function isMissingTableError(error) {
    const message = (error?.message || "").toLowerCase();
    const details = (error?.details || "").toLowerCase();
    return error?.code === "PGRST205" || error?.code === "42P01" || message.includes("could not find the table") || details.includes("relation") && details.includes("does not exist");
  }

  function isMissingColumnError(error) {
    const message = error?.message || "";
    return error?.code === "PGRST204" || message.toLowerCase().includes("could not find");
  }

  function legacyPremiumOrder(order) {
    const allowed = [
      "name",
      "email",
      "phone",
      "address",
      "card_text",
      "music_wish",
      "message",
      "file_url",
      "image_url",
      "video_url",
      "audio_url",
      "status"
    ];
    return allowed.reduce((payload, key) => {
      if (order[key] !== undefined) payload[key] = order[key];
      return payload;
    }, {});
  }

  async function uploadOrderFile(file, kind) {
    if (!file) return null;
    if (!(await getReadyClient(8000))) {
      throw new Error("Supabase ist nicht verbunden. Bitte config.js mit URL und Anon Key pruefen.");
    }
    try {
      return await uploadFile(file, `orders/${kind}`);
    } catch (error) {
      throw new Error(`Upload fuer ${kind} fehlgeschlagen: ${readableOrderError(error)}`);
    }
  }

  async function createPremiumOrder(order) {
    const client = await getReadyClient(8000);
    if (!client) {
      throw new Error("Supabase ist nicht verbunden. Bitte config.js mit URL und Anon Key pruefen.");
    }
    const preferredTables = ["premium_orders", "orders"];
    const errors = [];
    for (const table of preferredTables) {
      const { error } = await client.from(table).insert(order);
      if (!error) return { saved: true, table };
      if (isMissingColumnError(error)) {
        const retry = await client.from(table).insert(legacyPremiumOrder(order));
        if (!retry.error) return { saved: true, table, fallback: true };
        errors.push(`${table}: ${readableOrderError(retry.error, table)}`);
      } else {
        errors.push(`${table}: ${readableOrderError(error, table)}`);
      }
    }
    throw new Error(errors.join(" | "));
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
