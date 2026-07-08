(function () {
  const image = (name) => `assets/images/${name}`;
  const languagePack = window.MELODY_LANGUAGE_PACK || {};
  const de = languagePack.de || {};
  const tr = languagePack.tr || {};

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
        defaultLanguage: "de",
        languages: [
          { code: "de", label: "DE", name: "Deutsch", active: true },
          { code: "tr", label: "TR", name: "Türkçe", active: true }
        ],
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
        categories: [
          {
            id: "birthday",
            title: de.categories?.birthday?.title || "Geburtstagskarte",
            description: de.categories?.birthday?.description || "",
            image: image("premium-card-detail.png"),
            active: true,
            sortOrder: 1
          },
          {
            id: "apology",
            title: de.categories?.apology?.title || "Entschuldigungskarte",
            description: de.categories?.apology?.description || "",
            image: image("gift-moment.png"),
            active: true,
            sortOrder: 2
          },
          {
            id: "valentine",
            title: de.categories?.valentine?.title || "Valentinstagskarte",
            description: de.categories?.valentine?.description || "",
            image: image("melody-cards-premium-hero.png"),
            active: true,
            sortOrder: 3
          },
          {
            id: "mothers_day",
            title: de.categories?.mothers_day?.title || "Muttertagskarte",
            description: de.categories?.mothers_day?.description || "",
            image: image("premium-card-detail.png"),
            active: true,
            sortOrder: 4
          },
          {
            id: "fathers_day",
            title: de.categories?.fathers_day?.title || "Vatertagskarte",
            description: de.categories?.fathers_day?.description || "",
            image: image("gift-moment.png"),
            active: true,
            sortOrder: 5
          }
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
            text: "Entdecke hochwertige Geburtstagskarten mit persönlichem QR-Code und einem Lied, das nur für diesen besonderen Menschen gestaltet wird."
          },
          {
            id: "gallery",
            type: "gallery",
            active: true,
            order: 5,
            eyebrow: "Galerie",
            title: "Papier, Details und Geschenkgefühl",
            text: "Inspirationen für besondere Geburtstagsmomente, liebevolle Details und Karten, die lange in Erinnerung bleiben."
          },
          {
            id: "reviews",
            type: "reviews",
            active: true,
            order: 6,
            eyebrow: "Stimmen",
            title: "Kundenbewertungen",
            text: "Persönliche Geschenke leben von echten Momenten. Hier teilen Kundinnen und Kunden ihre Erfahrungen mit Melody Cards."
          },
          {
            id: "faq",
            type: "faq",
            active: true,
            order: 7,
            eyebrow: "FAQ",
            title: "Häufige Fragen",
            text: "Hier findest du Antworten zu Bestellung, Ablauf, Lieferung und persönlichem Lied."
          },
          {
            id: "about",
            type: "about",
            active: true,
            order: 8,
            eyebrow: "Über Melody Cards",
            title: "Hochwertig gestaltet. Persönlich produziert.",
            text: "Melody Cards verbindet hochwertige Karten mit persönlicher Musik und macht aus einem Geschenk eine bleibende Erinnerung.",
            image: image("gift-moment.png")
          },
          {
            id: "order",
            type: "order",
            active: true,
            order: 9,
            eyebrow: "Bestellung",
            title: "Karte anfragen",
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
        orderForm: { ...(de.orderForm || {}) },
        translations: {
          tr: {
            seo: {
              title: "Melody Cards | Kişiye özel şarkılı premium doğum günü kartları",
              description: "Melody Cards, QR kodla açılan kişiye özel şarkıya sahip yüksek kaliteli doğum günü kartları sunar.",
              ogTitle: "Melody Cards",
              ogDescription: "QR kodla kişiye özel şarkı içeren premium doğum günü kartları."
            },
            brand: {
              footerText: "Kişiye özel şarkıya bağlanan QR kodlu yüksek kaliteli doğum günü kartları."
            },
            navigation: [
              { label: "Ana Sayfa", href: "#home", active: true },
              { label: "Kartlar", href: "#products", active: true },
              { label: "Süreç", href: "#process", active: true },
              { label: "Galeri", href: "#gallery", active: true },
              { label: "SSS", href: "#faq", active: true },
              { label: "İletişim", href: "#contact", active: true },
              { label: "Sipariş", href: "#order", active: true, style: "primary" }
            ],
            sections: {
              home: {
                eyebrow: "Melody Cards",
                title: "Şarkı söyleyen bir doğum günü kartı.",
                subtitle: "Sen kartı sipariş edersin. Biz kişiye özel şarkıyı hazırlar, QR kodu oluşturur ve yüksek kaliteli doğum günü kartına basarız.",
                primaryButton: { label: "Doğum günü kartı sipariş et" },
                secondaryButton: { label: "Nasıl çalışır" }
              },
              intro: {
                eyebrow: "Fikir",
                title: "Kişisel bir şarkı. Doğrudan kartın üzerinde.",
                text: "Melody Cards, zarif bir doğum günü kartını özel hazırlanmış bir şarkıyla birleştirir. Hediye edilen kişi QR kodu okutur ve kişisel sürprizini hemen dinler."
              },
              process: {
                eyebrow: "Süreç",
                title: "Kolayca sipariş ver. Gerisini biz hallederiz.",
                text: "Web sitesinde yalnızca kartı sipariş edersin. QR kod, şarkı ve baskı profesyonelce arka planda hazırlanır.",
                items: [
                  { title: "Kartı seç", text: "Bir doğum günü kartı seçer ve talebini gönderirsin." },
                  { title: "Şarkı hazırlanır", text: "Hediye edilecek kişiye uygun kişisel şarkıyı oluştururuz." },
                  { title: "QR kod karta basılır", text: "QR kod doğrudan tamamlanan şarkıya yönlendirir ve karta basılır." }
                ]
              },
              products: {
                eyebrow: "Doğum günü kartları",
                title: "Güncel koleksiyon",
                text: "Kişisel QR kodu ve yalnızca o özel kişi için hazırlanan şarkıyla tasarlanan yüksek kaliteli doğum günü kartlarını keşfet."
              },
              gallery: {
                eyebrow: "Galeri",
                title: "Kağıt, detay ve hediye hissi",
                text: "Özel doğum günü anları, zarif detaylar ve uzun süre hatırlanacak kartlar için ilhamlar."
              },
              reviews: {
                eyebrow: "Yorumlar",
                title: "Müşteri yorumları",
                text: "Kişisel hediyeler gerçek anlardan beslenir. Melody Cards deneyimlerini burada okuyabilirsin."
              },
              faq: {
                eyebrow: "SSS",
                title: "Sık sorulan sorular",
                text: "Sipariş, süreç, teslimat ve kişisel şarkı hakkında yanıtları burada bulabilirsin."
              },
              about: {
                eyebrow: "Melody Cards hakkında",
                title: "Özenle tasarlandı. Kişiye özel üretildi.",
                text: "Melody Cards, yüksek kaliteli kartları kişisel müzikle birleştirir ve hediyeyi kalıcı bir anıya dönüştürür."
              },
              order: {
                eyebrow: "Sipariş",
                title: "Kart talep et",
                text: "Talebini gönder. Sonraki adımlar için seninle iletişime geçeriz."
              },
              contact: {
                eyebrow: "İletişim",
                title: "Sipariş öncesi soruların mı var?",
                text: "Önceden netleştirmek istediğin bir konu varsa bize yaz."
              }
            },
            products: {
              "birthday-signature": {
                title: "Signature Doğum Günü Kartı",
                description: "Kişiye özel şarkıya yönlendiren QR kodlu zarif doğum günü kartı.",
                price: "Talep üzerine",
                category: "Doğum günü"
              }
            },
            categories: {
              ...(tr.categories || {})
            },
            faqs: {
              "faq-1": { question: "Şarkıyı ben mi hazırlıyorum?", answer: "Hayır. Sen doğum günü kartını sipariş edersin. Kişiye özel şarkı ve QR kod daha sonra Melody Cards tarafından hazırlanır." },
              "faq-2": { question: "QR kodu benim sağlamam gerekiyor mu?", answer: "Hayır. QR kod arka planda oluşturulur ve karta basılır." },
              "faq-3": { question: "Metin ve isteklerimi iletebilir miyim?", answer: "Evet. Sipariş formunda hediye edilecek kişi ve kart hakkında notlarını yazabilirsin." }
            },
            contact: {
              emailLabel: "E-posta",
              phoneLabel: "Telefon",
              addressLabel: "Adres"
            },
            footer: {
              links: [
                { label: "Künye", href: "impressum.html" },
                { label: "Gizlilik", href: "datenschutz.html" },
                { label: "Şartlar", href: "agb.html" },
                { label: "Cayma Hakkı", href: "widerruf.html" },
                { label: "Kargo & Ödeme", href: "versand-zahlung.html" }
              ]
            },
            legalPages: {
              impressum: "<h1>Künye</h1><p>Melody Cards için yasal iletişim ve şirket bilgileri.</p>",
              datenschutz: "<h1>Gizlilik Politikası</h1><p>Kişisel veriler talepleri işlemek, iletişim kurmak ve sipariş sürecini yürütmek için kullanılır.</p>",
              agb: "<h1>Genel Şartlar</h1><p>Melody Cards siparişleri, kişiselleştirilmiş kartlar ve hizmet süreci için geçerli şartlar.</p>",
              widerruf: "<h1>Cayma Hakkı</h1><p>Cayma hakkı ve kişiselleştirilmiş ürünlere ilişkin bilgiler.</p>",
              versand: "<h1>Kargo & Ödeme</h1><p>Kargo, ödeme ve sipariş süreci hakkında bilgiler.</p>"
            },
            orderForm: { ...(tr.orderForm || {}) }
          }
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
