(function () {
  const imageAssets = [
    "assets/images/melody-cards-premium-hero.png",
    "assets/images/premium-card-detail.png",
    "assets/images/gift-moment.png",
    "assets/images/gift-box-packaging.png",
    "assets/images/phone-music-player.png"
  ];

  const productNames = [
    ["Geburtstag", "Eine warme Geburtstagskarte mit Foto, Widmung und einem Lied, das Namen und Erinnerungen aufgreift.", "ab 49 EUR"],
    ["Hochzeit", "Elegante Karte für Brautpaar, Trauzeugen oder Gäste mit privater Songseite und QR-Code.", "ab 79 EUR"],
    ["Jahrestag", "Romantische Karte für gemeinsame Jahre, besondere Orte und kleine Sätze, die nur ihr versteht.", "ab 69 EUR"],
    ["Muttertag", "Liebevoll gestaltete Karte mit sanfter Musik, persönlichem Foto und Worten, die Danke sagen.", "ab 59 EUR"],
    ["Vatertag", "Persönliches Geschenk mit Humor, Dankbarkeit und einem Song, der Familie hörbar macht.", "ab 59 EUR"],
    ["Weihnachten", "Festliche Karte mit Geschenkpapier-Atmosphäre, Familienfoto und warmem Winterklang.", "ab 64 EUR"],
    ["Neujahr", "Moderner Gruß für Rückblick, Neubeginn und Wünsche, die per Lied länger bleiben.", "ab 54 EUR"],
    ["Valentinstag", "Eine ruhige Liebesbotschaft mit Foto, Text und Song, die direkt auf dem Smartphone startet.", "ab 69 EUR"],
    ["Baby", "Sanfte Willkommenskarte für Geburt, Babyshower oder erste Familienmomente.", "ab 64 EUR"],
    ["Taufe", "Feierliche Karte mit klarer Gestaltung, ruhiger Melodie und persönlicher Widmung.", "ab 64 EUR"],
    ["Abschluss", "Motivierender Song für Meilensteine, Stolz und den nächsten Schritt.", "ab 59 EUR"],
    ["Firmenjubiläum", "Seriöse Teamkarte mit Markenfarbe, gemeinsamem Text und optionalem Corporate-Song.", "ab 129 EUR"]
  ];

  const galleryTypes = ["Handgemachte Karte", "QR-Code Detail", "Hände beim Verschenken", "Geschenkpapier", "Smartphone mit Musik", "Blumen und Karte", "Familienmoment", "Premium-Verpackung"];
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
        heroEyebrow: "Handmade sound gifting",
        heroTitleLine1: "Grußkarten, die singen.",
        heroTitleLine2: "Persönlich. Warm. Unvergesslich.",
        heroText: "Melody Cards verbindet handgemachte Premium-Grußkarten mit deinem Foto, deinen Worten und einem eigens komponierten Lied, das per QR-Code sofort abgespielt wird.",
        primaryButtonText: "Jetzt bestellen",
        primaryButtonHref: "#order",
        secondaryButtonText: "Live Demo testen",
        secondaryButtonHref: "#demo",
        heroImage: imageAssets[0],
        footerText: "Handgemachte Premium-Grußkarten mit persönlichem Lied, Foto, Text und QR-Code.",
        contactTitle: "Bereit für eine Karte, die wirklich ankommt?",
        contactText: "Schreibe uns direkt per WhatsApp, E-Mail oder über das Anfrageformular. Wir antworten persönlich und ohne Verkaufsdruck.",
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
        description: `Warmer Eindruck: ${type.toLowerCase()} im Melody Cards Stil.`,
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
      text: "Die Karte fühlte sich sehr hochwertig an und das Lied war so persönlich, dass beim Auspacken alle still wurden.",
      verified: true,
      image_url: "",
      sort_order: index + 1,
      active: true
    })),
    faqs: faqQuestions.map((question, index) => ({
      id: `demo-faq-${index + 1}`,
      question,
      answer: "Ja. Melody Cards begleitet dich von Auswahl und Briefing bis zur fertigen Karte mit privater Song-Seite, QR-Code und optionaler Verpackung.",
      sort_order: index + 1,
      active: true
    })),
    blog: blogTitles.map((title, index) => ({
      id: `demo-blog-${index + 1}`,
      title,
      excerpt: "Ruhige Inspiration und praktische Tipps für persönliche Geschenke mit Foto, Text, QR-Code und eigenem Lied.",
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
