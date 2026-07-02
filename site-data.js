(function () {
  const productNames = [
    ["Geburtstag", "Eine persönliche Karte mit Foto, Botschaft und auf Wunsch QR-Code oder Lied."],
    ["Hochzeit", "Ein ruhiger Gruß für Worte, Erinnerungen und kleine Momente rund um den Tag."],
    ["Liebe", "Eine schlichte Karte für Nähe, Dankbarkeit und Sätze, die bleiben sollen."],
    ["Familie", "Für Eltern, Großeltern, Geschwister oder Menschen, die sich wie Familie anfühlen."],
    ["Muttertag", "Eine handgemachte Karte mit warmem Text und persönlichem Bild."],
    ["Erinnerung", "Für Abschied, Dankbarkeit oder einen Moment, den man bewahren möchte."]
  ];

  const galleryTypes = ["Papier", "Foto", "Botschaft", "QR-Code", "Umschlag", "Detail"];
  const faqQuestions = [
    "Ist das Formular eine Bestellung?", "Kann ich ein Foto hochladen?", "Muss jede Karte ein Lied haben?", "Kann ein QR-Code integriert werden?",
    "Kann ich den Text selbst schreiben?", "Wie läuft die Abstimmung ab?", "Gibt es automatische Zahlungen?", "Welche Dateien kann ich mitsenden?"
  ];

  window.MELODY_DEMO_CONTENT = {
    settings: {
      id: 1,
      content: {
        brandName: "Melody Cards",
        logoText: "MC",
        heroEyebrow: "Melody Cards",
        heroTitleLine1: "Handgemachte Karten",
        heroTitleLine2: "für besondere Menschen.",
        heroText: "Persönliche Botschaften, Fotos, Erinnerungen und auf Wunsch ein QR-Code oder Lied. Warm gestaltet, handgemacht gedacht, bewusst verschenkt.",
        primaryButtonText: "Karte gestalten",
        primaryButtonHref: "#order",
        secondaryButtonText: "Beispiele ansehen",
        secondaryButtonHref: "#examples",
        footerText: "Handgemachte Karten mit persönlicher Botschaft, Foto, Lied oder QR-Code.",
        contactTitle: "Offen für Fragen vor der Anfrage.",
        contactText: "Wenn du unsicher bist, ob Karte, Foto, Audio, Video, Lied oder QR-Code passt, schreibe uns kurz. Wir antworten persönlich und ohne Verkaufsdruck.",
        contactEmail: "hello@melody-cards.example",
        whatsappNumber: "491701234567",
        whatsappMessage: "Hallo Melody Cards, ich möchte eine Premium-Karte bestellen.",
        socialInstagram: "https://instagram.com/",
        socialTikTok: "https://www.tiktok.com/",
        socialYouTube: "https://www.youtube.com/"
      },
      design: {
        background: "#fffaf4",
        text: "#1d1d1f",
        muted: "#746b62"
      }
    },
    products: productNames.map(([title, description], index) => ({
      id: `demo-product-${index + 1}`,
      title,
      description,
      price: "",
      image_url: "",
      tags: ["Handmade", "Persönlich"],
      sort_order: index + 1,
      active: true
    })),
    gallery: Array.from({ length: 6 }, (_, index) => {
      const type = galleryTypes[index % galleryTypes.length];
      return {
        id: `demo-gallery-${index + 1}`,
        title: type,
        description: `Ruhige Richtung für ${type.toLowerCase()} im Melody Cards Stil.`,
        category: type,
        image_url: "",
        sort_order: index + 1,
        active: true
      };
    }),
    reviews: [],
    faqs: faqQuestions.map((question, index) => ({
      id: `demo-faq-${index + 1}`,
      question,
      answer: "Wir klären diesen Punkt persönlich im Anfrageprozess. So bleibt die Karte passend zur Geschichte und es entstehen keine falschen Versprechen.",
      sort_order: index + 1,
      active: true
    })),
    blog: [],
    audio: []
  };
})();
