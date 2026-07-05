(function () {
  const image = (name) => `assets/images/${name}`;

  window.MELODY_DEFAULT_SITE = {
    settings: {
      id: 1,
      content: {
        seo: {
          title: "Melody Cards | Premium Geburtstagskarten mit persönlichem Lied",
          description: "Melody Cards verkauft hochwertige Geburtstagskarten mit QR-Code zu einem persönlichen Lied, das nach der Bestellung individuell erstellt wird.",
          ogTitle: "Melody Cards",
          ogDescription: "Premium-Geburtstagskarten mit persönlichem Lied per QR-Code.",
          ogImage: "",
          favicon: ""
        },
        brand: {
          name: "Melody Cards",
          logoText: "MC",
          logoImage: "",
          footerText: "Hochwertige Geburtstagskarten mit QR-Code zu einem persönlichen Lied."
        },
        theme: {
          colors: {
            background: "#f7f4ef",
            surface: "#ffffff",
            ink: "#090909",
            anthracite: "#202020",
            muted: "#706a61",
            accent: "#c8a96a",
            accentSoft: "#eadfc9",
            border: "#e5ded3"
          },
          typography: {
            headingFont: "Inter",
            bodyFont: "Inter",
            heroSize: 78,
            headingSize: 48,
            bodySize: 17,
            weightHeading: 700,
            weightBody: 400
          },
          layout: {
            maxWidth: 1180,
            sectionPadding: 128,
            radius: 28,
            buttonRadius: 999,
            cardShadow: 28
          },
          motion: {
            enabled: true,
            parallax: true,
            duration: 650
          }
        },
        navigation: [
          { label: "Start", href: "#home", active: true },
          { label: "Karten", href: "#products", active: true },
          { label: "Ablauf", href: "#process", active: true },
          { label: "Galerie", href: "#gallery", active: true },
          { label: "FAQ", href: "#faq", active: true },
          { label: "Kontakt", href: "#contact", active: true },
          { label: "Bestellen", href: "#order", active: true, style: "primary" }
        ],
        sections: [
          {
            id: "home",
            type: "hero",
            active: true,
            order: 1,
            align: "left",
            image: image("premium-card-detail.png"),
            eyebrow: "Melody Cards",
            title: "Eine Geburtstagskarte, die singt.",
            subtitle: "Du bestellst die Karte. Wir gestalten das persönliche Lied, erstellen den QR-Code und drucken ihn auf deine hochwertige Geburtstagskarte.",
            primaryButton: { label: "Geburtstagskarte bestellen", href: "#order" },
            secondaryButton: { label: "So funktioniert es", href: "#process" }
          },
          {
            id: "intro",
            type: "editorial",
            active: true,
            order: 2,
            eyebrow: "Die Idee",
            title: "Ein persönliches Lied. Direkt auf der Karte.",
            text: "Melody Cards verbindet eine edle Geburtstagskarte mit einem individuell erstellten Lied. Die beschenkte Person scannt den QR-Code und hört sofort ihre persönliche Geburtstagsüberraschung.",
            image: image("melody-cards-premium-hero.png")
          },
          {
            id: "process",
            type: "steps",
            active: true,
            order: 3,
            eyebrow: "Ablauf",
            title: "Einfach bestellen. Alles Weitere erledigen wir.",
            text: "Auf der Website bestellst du nur die Karte. QR-Code, Lied und Druck werden im Hintergrund professionell vorbereitet.",
            items: [
              { title: "Karte auswählen", text: "Du entscheidest dich für eine Geburtstagskarte und sendest deine Anfrage ab." },
              { title: "Lied entsteht", text: "Wir erstellen das persönliche Lied passend zur beschenkten Person." },
              { title: "QR-Code auf Karte", text: "Der QR-Code führt direkt zum fertigen Lied und wird auf die Karte gedruckt." }
            ]
          },
          {
            id: "products",
            type: "products",
            active: true,
            order: 4,
            eyebrow: "Geburtstagskarten",
            title: "Aktuelle Kollektion",
            text: "Alle Produkte sind Geburtstagskarten. Varianten, Bilder und Preise kannst du komplett im Admin verwalten."
          },
          {
            id: "gallery",
            type: "gallery",
            active: true,
            order: 5,
            eyebrow: "Galerie",
            title: "Papier, Details und Geschenkgefühl",
            text: "Alle Bilder sind über den Admin austauschbar und sortierbar."
          },
          {
            id: "reviews",
            type: "reviews",
            active: true,
            order: 6,
            eyebrow: "Stimmen",
            title: "Kundenbewertungen",
            text: "Bewertungen werden erst angezeigt, wenn du sie im Admin aktivierst."
          },
          {
            id: "faq",
            type: "faq",
            active: true,
            order: 7,
            eyebrow: "FAQ",
            title: "Häufige Fragen",
            text: "Alle Antworten lassen sich im Admin bearbeiten."
          },
          {
            id: "about",
            type: "about",
            active: true,
            order: 8,
            eyebrow: "Über Melody Cards",
            title: "Hochwertig gestaltet. Persönlich produziert.",
            text: "Melody Cards entsteht für Menschen, die nicht einfach nur eine Karte verschenken möchten. Jede Karte soll wie ein bewusst gewähltes, wertiges Geburtstagsgeschenk wirken.",
            image: image("gift-moment.png")
          },
          {
            id: "order",
            type: "order",
            active: true,
            order: 9,
            eyebrow: "Bestellung",
            title: "Geburtstagskarte anfragen",
            text: "Sende deine Anfrage. Wir melden uns mit den nächsten Schritten zurück."
          },
          {
            id: "contact",
            type: "contact",
            active: true,
            order: 10,
            eyebrow: "Kontakt",
            title: "Fragen vor der Bestellung?",
            text: "Schreibe uns, wenn du vorab etwas klären möchtest."
          }
        ],
        products: [
          {
            id: "birthday-signature",
            title: "Signature Birthday Card",
            description: "Edle Geburtstagskarte mit QR-Code zum persönlichen Lied.",
            price: "Auf Anfrage",
            discount: "",
            category: "Geburtstag",
            status: "active",
            featured: true,
            sortOrder: 1,
            images: [image("premium-card-detail.png")]
          }
        ],
        gallery: [],
        reviews: [],
        faqs: [
          { id: "faq-1", question: "Erstelle ich das Lied selbst?", answer: "Nein. Du bestellst die Geburtstagskarte. Das persönliche Lied und der QR-Code werden anschließend von Melody Cards erstellt.", active: true, sortOrder: 1 },
          { id: "faq-2", question: "Muss ich einen QR-Code bereitstellen?", answer: "Nein. Der QR-Code wird im Hintergrund erstellt und auf die Karte gedruckt.", active: true, sortOrder: 2 },
          { id: "faq-3", question: "Kann ich Texte und Wünsche mitteilen?", answer: "Ja. Im Bestellformular kannst du Hinweise zur beschenkten Person und zur Karte eintragen.", active: true, sortOrder: 3 }
        ],
        contact: {
          email: "hello@melody-cards.example",
          phone: "",
          address: "",
          whatsappNumber: "",
          instagram: "",
          tiktok: "",
          youtube: ""
        },
        footer: {
          links: [
            { label: "Impressum", href: "impressum.html" },
            { label: "Datenschutz", href: "datenschutz.html" },
            { label: "AGB", href: "agb.html" },
            { label: "Widerruf", href: "widerruf.html" },
            { label: "Versand & Zahlung", href: "versand-zahlung.html" }
          ]
        },
        legalPages: {
          impressum: "",
          datenschutz: "",
          agb: "",
          widerruf: "",
          versand: ""
        },
        mediaLibrary: []
      },
      design: {}
    },
    products: [],
    gallery: [],
    reviews: [],
    faqs: [],
    blog: [],
    audio: []
  };

  window.MELODY_DEMO_CONTENT = window.MELODY_DEFAULT_SITE;
})();
