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
        logoImage: "",
        faviconImage: "",
        heroImage: "",
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
        contactPhone: "+49 170 1234567",
        contactAddress: "Musterstraße 1, 12345 Musterstadt",
        whatsappNumber: "491701234567",
        whatsappMessage: "Hallo Melody Cards, ich möchte eine Premium-Karte bestellen.",
        socialInstagram: "https://instagram.com/",
        socialTikTok: "https://www.tiktok.com/",
        socialYouTube: "https://www.youtube.com/",
        introEyebrow: "Der Gedanke",
        introTitle: "Ein Geschenk, das sich persönlich anfühlt.",
        introText: "Melody Cards ist für Geburtstage, Hochzeiten, Liebe, Familie, Muttertag und Erinnerungen gemacht. Jede Karte beginnt mit einer echten Geschichte und wird anschließend warm, ruhig und hochwertig gestaltet.",
        promiseItems: [
          { number: "01", title: "Botschaft", text: "Du erzählst, für wen die Karte ist und was sie ausdrücken soll.", active: true },
          { number: "02", title: "Gestaltung", text: "Wir verbinden Text, Foto, Papierwirkung und digitale Elemente zu einem klaren Entwurf.", active: true },
          { number: "03", title: "Erinnerung", text: "Optional ergänzen wir ein Lied oder einen QR-Code, wenn es zur Geschichte passt.", active: true }
        ],
        processEyebrow: "So funktioniert es",
        processTitle: "Wenige Schritte. Viel Gefühl.",
        processText: "Keine automatische Bestellung und keine Zahlung auf der Webseite. Du sendest eine Anfrage, wir melden uns persönlich mit Rückfragen und einem klaren Vorschlag.",
        processSteps: [
          { number: "01", title: "Anlass beschreiben", text: "Du wählst den Moment und beschreibst die Person, die Botschaft und die Stimmung.", active: true },
          { number: "02", title: "Material senden", text: "Optional lädst du Foto, Text, Audio oder andere Erinnerungen hoch.", active: true },
          { number: "03", title: "Entwurf abstimmen", text: "Wir klären, ob Karte, Lied oder QR-Code sinnvoll sind und wie schlicht das Ergebnis wirken soll.", active: true }
        ],
        productsEyebrow: "Anlässe",
        productsTitle: "Für Momente, die Nähe brauchen.",
        productsText: "Die Anlasskarten sind nur ein Startpunkt. Jede Melody Card wird danach individuell und ohne Standardtext gestaltet.",
        examplesEyebrow: "Beispiele",
        examplesTitle: "Warm außen. Persönlich innen.",
        examplesText: "Feine Papierwirkung, ruhige Bilder, ein sichtbarer QR-Code und Worte, die zur Person passen.",
        exampleItems: [
          { category: "Geburtstag", text: "Eine offene Karte mit Foto, Namen und wenigen ehrlichen Zeilen.", active: true },
          { category: "Hochzeit", text: "Champagnerfarbenes Papier für Worte, die bleiben sollen.", active: true },
          { category: "Liebe", text: "Ein persönlicher Gruß, weich und nah, ohne Überladung.", active: true },
          { category: "Familie", text: "Eine Botschaft, die Nähe über Generationen hinweg bewahrt.", active: true }
        ],
        galleryEyebrow: "Galerie",
        galleryTitle: "Material, Licht und kleine Details.",
        galleryText: "Die Galerie zeigt die Richtung: geöffnete Karten, QR-Code, Blumen, Geschenkband, Foto, Papierstruktur und warmes Licht.",
        faqEyebrow: "FAQ",
        faqTitle: "Antworten, bevor du anfragst.",
        aboutEyebrow: "Über uns",
        aboutTitle: "Handmade, persönlich und bewusst reduziert.",
        aboutText: "Melody Cards entsteht aus der Idee, dass ein Geschenk nicht größer, lauter oder teurer wirken muss, um wichtig zu sein. Wir gestalten Karten mit Liebe zum Detail, ruhiger Typografie und einem klaren Blick für die Geschichte dahinter.",
        aboutImage: "",
        aboutCards: [
          { title: "Persönlich", text: "Jede Anfrage wird gelesen, nicht automatisch verarbeitet.", active: true },
          { title: "Handmade", text: "Das Ergebnis soll sich nach einem echten, gedachten Geschenk anfühlen.", active: true },
          { title: "Zurückhaltend", text: "Design, Foto, Lied und QR-Code werden nur eingesetzt, wenn sie den Moment stärken.", active: true }
        ],
        orderEyebrow: "Karte gestalten",
        orderTitle: "Erzähl uns, was die Karte sagen soll.",
        orderText: "Das Formular ist eine Anfrage. Wir prüfen deine Angaben und melden uns persönlich zurück. Es wird keine Zahlung ausgelöst.",
        legalEyebrow: "Rechtliches",
        legalTitle: "Transparent vor deiner Anfrage.",
        legalText: "Alle wichtigen rechtlichen Informationen sind jederzeit erreichbar: Datenschutz, AGB, Impressum, Widerruf sowie Versand und Zahlung.",
        mediaLibrary: [],
        navItems: [
          { label: "Startseite", href: "#home", active: true },
          { label: "So funktioniert es", href: "#process", active: true },
          { label: "Anlässe", href: "#products", active: true },
          { label: "Beispiele", href: "#examples", active: true },
          { label: "Galerie", href: "#gallery", active: true },
          { label: "Über uns", href: "#about", active: true },
          { label: "FAQ", href: "#faq", active: true },
          { label: "Kontakt", href: "#contact", active: true },
          { label: "Karte gestalten", href: "#order", active: true, className: "nav-order" }
        ],
        configurator: {
          backText: "Zurück",
          nextText: "Weiter",
          submitText: "Anfrage senden",
          steps: {
            recipientFor: { title: "Für wen ist die Karte?", options: ["Ehemann", "Ehefrau", "Partner/in", "Freundin", "Freund", "Kind", "Vater", "Mutter", "Großeltern", "Enkelkind", "Schwester/Bruder", "Lehrer/in", "Haustier", "Ich selbst", "Sonstiges"], required: true },
            recipientName: { title: "Wie heißt die Person?", required: true },
            occasion: { title: "Was ist der Anlass?", options: ["Geburtstag", "Hochzeit", "Jahrestag", "Valentinstag", "Muttertag", "Vatertag", "Geburt", "Freundschaft", "Gute Besserung", "Abschied", "Danke", "Erinnerung", "Einfach so", "Sonstiges"], required: true },
            included: { title: "Was soll in der Karte enthalten sein?", options: ["Persönliche Nachricht", "Foto", "Video", "Audioaufnahme", "QR-Code", "Persönliches Lied"], required: true },
            specialPerson: { title: "Was macht die Person besonders?", required: true },
            memoryMessage: { title: "Welche Erinnerung oder Botschaft soll rein?", required: true },
            heartWords: { title: "Worte aus dem Herzen", required: true },
            contact: { title: "Zusammenfassung + Kontaktdaten", required: true }
          }
        },
        legalPages: {
          impressum: "",
          datenschutz: "",
          agb: "",
          widerruf: "",
          versand: ""
        }
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
