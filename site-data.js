(function () {
  const imageAssets = [
    "assets/images/melody-cards-premium-hero.png",
    "assets/images/premium-card-detail.png",
    "assets/images/gift-moment.png",
    "assets/images/gift-box-packaging.png",
    "assets/images/phone-music-player.png"
  ];

  const productNames = [
    ["Geburtstag", "Signature Karte mit Geburtstagslied, QR-Seite und Goldfolie.", "ab 49 EUR"],
    ["Hochzeit", "Elegante Karte für Eheversprechen, Gäste oder Geschenkübergabe.", "ab 79 EUR"],
    ["Jahrestag", "Romantischer Song mit gemeinsamen Erinnerungen und Premium-Design.", "ab 69 EUR"],
    ["Muttertag", "Warme Worte, sanfte Melodie und hochwertiges Kartenpapier.", "ab 59 EUR"],
    ["Vatertag", "Persönlicher Song mit Humor, Dankbarkeit und klarer Stimme.", "ab 59 EUR"],
    ["Weihnachten", "Festliche Karte mit winterlichem Klang und Geschenkbox.", "ab 64 EUR"],
    ["Neujahr", "Moderner Song für Wünsche, Rückblick und Neustart.", "ab 54 EUR"],
    ["Valentinstag", "Liebesbotschaft als Song mit privatem QR-Code.", "ab 69 EUR"],
    ["Baby", "Sanfte Willkommenskarte mit Schlaflied-Charakter.", "ab 64 EUR"],
    ["Taufe", "Feierliche Karte mit ruhiger, emotionaler Komposition.", "ab 64 EUR"],
    ["Abschluss", "Motivierender Song für Meilensteine und Zukunftspläne.", "ab 59 EUR"],
    ["Firmenjubiläum", "Corporate-Karte mit Markenfarbe, Teamtext und Hymne.", "ab 129 EUR"]
  ];

  const galleryTypes = ["Karte", "QR-Code", "Geschenkmoment", "Geschenkbox", "Smartphone", "Verpackung", "Detailaufnahme", "Goldfolie"];
  const reviewNames = ["Laura M.", "Daniel R.", "Sabrina K.", "Nina W.", "Omar A.", "Clara P.", "Jonas F.", "Melek T.", "Felix B.", "Emma S.", "Hannah L.", "Tobias G.", "Miriam N.", "Leon C.", "Julia H.", "Marco E.", "Sofia R.", "Ben K.", "Lea V.", "Noah D."];
  const faqQuestions = [
    "Wie funktioniert der QR-Code?", "Wie entsteht das Lied?", "Kann ich Text und Namen vorgeben?", "Welche Musikstile sind möglich?", "Gibt es männliche und weibliche Stimmen?",
    "Kann ich die Sprache wählen?", "Wie lange dauert die Produktion?", "Gibt es Express?", "Kann ich ein Foto hochladen?", "Ist die Song-Seite privat?",
    "Kann der QR-Code farbig sein?", "Welche Kartenfarben gibt es?", "Kann ich vorab eine Vorschau sehen?", "Was passiert nach der Bestellung?", "Wie wird die Karte verpackt?",
    "Gibt es Geschenkboxen?", "Kann ich mehrere Karten bestellen?", "Sind Firmenbestellungen möglich?", "Kann ich Änderungen wünschen?", "Welche Dateiformate sind erlaubt?",
    "Kann ich Audio aufnehmen?", "Wie lange bleibt der Song online?", "Kann ich den Song herunterladen?", "Was kostet eine Karte?", "Wie kontaktiere ich den Support?"
  ];
  const blogTitles = ["Die perfekte Geburtstagsbotschaft", "Warum Musik Erinnerungen stärker macht", "QR-Code Geschenke richtig einsetzen", "Luxusverpackung für kleine Momente", "Songstil für Mama wählen", "Kartenfarben und Emotionen", "Geschenkideen für Hochzeitspaare", "Firmenjubiläum persönlich gestalten", "Checkliste für Express-Geschenke", "Wie ein Songbriefing gelingt", "Premium-Papier erklärt", "Digitale Geschenkseiten im Trend"];

  window.MELODY_DEMO_CONTENT = {
    settings: {
      id: 1,
      content: {
        brandName: "Melody Cards",
        logoText: "MC",
        heroEyebrow: "Luxury sound gifting",
        heroTitleLine1: "Personalisierte Karten.",
        heroTitleLine2: "Ein Lied, das bleibt.",
        heroText: "Melody Cards verbindet hochwertige Grußkarten, individuelle Kompositionen und elegante QR-Code-Technologie zu einem Geschenk, das sofort berührt.",
        primaryButtonText: "Jetzt bestellen",
        primaryButtonHref: "#order",
        secondaryButtonText: "Live Demo testen",
        secondaryButtonHref: "#demo",
        heroImage: imageAssets[0],
        footerText: "Premium-Karten mit QR-Code und eigens komponiertem Lied.",
        contactTitle: "Bereit für dein persönliches Lied?",
        contactText: "Schreibe uns direkt per WhatsApp, E-Mail oder über das Bestellformular. Wir melden uns mit Preis, Timing und Designvorschlag.",
        contactEmail: "hello@melody-cards.example",
        whatsappNumber: "491701234567",
        whatsappMessage: "Hallo Melody Cards, ich möchte eine Premium-Karte bestellen.",
        socialInstagram: "https://instagram.com/",
        socialTikTok: "https://www.tiktok.com/",
        socialYouTube: "https://www.youtube.com/"
      },
      design: {
        gold: "#F4C542",
        gold2: "#ffe086",
        background: "#fbf8ef",
        text: "#2f2f2f",
        muted: "#74706a"
      }
    },
    products: productNames.map(([title, description, price], index) => ({
      id: `demo-product-${index + 1}`,
      title,
      description,
      price,
      image_url: imageAssets[index % imageAssets.length],
      tags: ["QR-Code", "Custom Song", "Premium Print"],
      sort_order: index + 1,
      active: true
    })),
    gallery: Array.from({ length: 40 }, (_, index) => {
      const type = galleryTypes[index % galleryTypes.length];
      return {
        id: `demo-gallery-${index + 1}`,
        title: `${type} ${String(index + 1).padStart(2, "0")}`,
        description: `Premium-Beispiel: ${type.toLowerCase()} mit heller Gold-Ästhetik.`,
        category: type,
        image_url: imageAssets[index % imageAssets.length],
        sort_order: index + 1,
        active: true
      };
    }),
    reviews: reviewNames.map((name, index) => ({
      id: `demo-review-${index + 1}`,
      name,
      rating: 5,
      text: "Die Karte wirkte unfassbar hochwertig und das Lied war genau auf uns zugeschnitten.",
      verified: true,
      image_url: "",
      sort_order: index + 1,
      active: true
    })),
    faqs: faqQuestions.map((question, index) => ({
      id: `demo-faq-${index + 1}`,
      question,
      answer: "Ja. Melody Cards begleitet dich von Auswahl und Briefing bis zur fertigen Karte mit privater Song-Seite, QR-Code und optionaler Geschenkbox.",
      sort_order: index + 1,
      active: true
    })),
    blog: blogTitles.map((title, index) => ({
      id: `demo-blog-${index + 1}`,
      title,
      excerpt: "Inspiration, Tipps und Premium-Ideen für persönliche Karten mit eigenem Lied.",
      image_url: imageAssets[(index + 1) % imageAssets.length],
      published_at: new Date(Date.now() - index * 86400000).toISOString(),
      active: true
    })),
    audio: [
      ["Golden Pop", "Emotionaler Pop für Geburtstage"],
      ["Velvet Piano", "Ruhige Ballade für Familie"],
      ["Corporate Pulse", "Moderner Sound für Teams"],
      ["Acoustic Heart", "Akustisch, warm, nah"],
      ["Cinematic Vow", "Großes Gefühl für Hochzeit"],
      ["Holiday Glow", "Festliche Weihnachtsstimmung"]
    ].map(([title, description], index) => ({ id: `demo-audio-${index + 1}`, title, description }))
  };
})();
