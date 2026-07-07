(function () {
  window.MELODY_LANGUAGE_PACK = {
    de: {
      categories: {
        birthday: {
          title: "Geburtstagskarte",
          description: "Hochwertige Geburtstagskarten mit persönlichem QR-Code und einem Lied, das nur für diesen besonderen Menschen gestaltet wird."
        },
        apology: {
          title: "Entschuldigungskarte",
          description: "Persönliche Entschuldigungskarten mit QR-Code und einem emotionalen Entschuldigungssong."
        },
        valentine: {
          title: "Valentinstagskarte",
          description: "Romantische Karten mit persönlicher Botschaft, QR-Code und einem Lied für Herzensmenschen."
        },
        mothers_day: {
          title: "Muttertagskarte",
          description: "Liebevolle Muttertagskarten mit QR-Code und einem persönlichen Lied voller Wertschätzung."
        },
        fathers_day: {
          title: "Vatertagskarte",
          description: "Persönliche Vatertagskarten mit QR-Code und einem Lied für gemeinsame Erinnerungen."
        }
      },
      orderForm: {
        categoryLabel: "Kartentyp",
        categoryHelp: "Wähle zuerst, welche Karte du gestalten möchtest.",
        nameLabel: "Dein Name",
        emailLabel: "E-Mail",
        phoneLabel: "Telefon optional",
        songLanguageLabel: "Sprache des Liedes",
        selectPlaceholder: "Bitte auswählen",
        songLanguageOptions: ["Deutsch", "Türkisch"],
        voiceLabel: "Stimme",
        voiceOptions: ["Männlich", "Weiblich"],
        musicStyleLabel: "Musikrichtung",
        musicStyleOptions: ["Pop", "Türkisch emotional", "Ballade", "Rap", "Akustik", "Arabesk", "Überrasch mich"],
        messageLabel: "Nachricht",
        messagePlaceholder: "Gibt es noch etwas, das wir wissen sollen?",
        submitLabel: "Anfrage senden",
        sending: "Anfrage wird gesendet...",
        success: "Danke. Deine Anfrage wurde gesendet.",
        error: "Die Anfrage konnte nicht gespeichert werden.",
        requiredMessage: "Bitte fülle dieses Feld aus.",
        cardTextCategory: "Kartentyp",
        cardTextRecipient: "Person",
        cardTextOccasion: "Anlass",
        musicWishLanguage: "Sprache des Liedes",
        musicWishVoice: "Stimme",
        musicWishStyle: "Musikrichtung",
        requestButton: "Anfragen",
        categoryFields: {
          birthday: [
            { name: "occasion", label: "Anlass", placeholder: "Geburtstag", defaultValue: "Geburtstag", required: true },
            { name: "recipient", label: "Name", placeholder: "z. B. Mama, Sarah, mein Schatz", required: true },
            { name: "age", label: "Alter optional", type: "number", required: false }
          ],
          apology: [
            { name: "apology_for", label: "Wofür entschuldigen?", type: "textarea", placeholder: "Beschreibe kurz, wofür du dich entschuldigen möchtest.", required: true },
            { name: "recipient", label: "Name der Person", placeholder: "z. B. Elif, Sarah, mein Schatz", required: true },
            { name: "mood", label: "Stimmung", placeholder: "z. B. sanft, ehrlich, versöhnlich", required: true }
          ],
          valentine: [
            { name: "recipient", label: "Partnername", placeholder: "z. B. mein Schatz, Elif, Sarah", required: true },
            { name: "love_story", label: "Kennenlern-Geschichte optional", type: "textarea", placeholder: "Erzähle kurz, wie ihr euch kennengelernt habt.", required: false },
            { name: "romantic_style", label: "Romantischer Stil", placeholder: "z. B. zärtlich, modern, leidenschaftlich", required: true }
          ],
          mothers_day: [
            { name: "recipient", label: "Name der Mutter", placeholder: "z. B. Mama, Anne, Ayşe", required: true },
            { name: "memory", label: "Besondere Erinnerung", type: "textarea", placeholder: "Welche Erinnerung soll in die Karte einfließen?", required: true }
          ],
          fathers_day: [
            { name: "recipient", label: "Name des Vaters", placeholder: "z. B. Papa, Baba, Mehmet", required: true },
            { name: "memory", label: "Gemeinsame Erinnerung", type: "textarea", placeholder: "Welche gemeinsame Erinnerung ist euch wichtig?", required: true }
          ]
        }
      }
    },
    tr: {
      categories: {
        birthday: {
          title: "Doğum Günü Kartı",
          description: "Kişiye özel QR kodu ve yalnızca o özel kişi için hazırlanan şarkıyla tasarlanan yüksek kaliteli doğum günü kartları."
        },
        apology: {
          title: "Özür Kartı",
          description: "QR kodlu ve duygusal bir özür şarkısıyla kişiselleştirilen özel özür kartları."
        },
        valentine: {
          title: "Sevgililer Günü Kartı",
          description: "Sevdiğin kişi için kişisel mesaj, QR kod ve özel şarkı içeren romantik kartlar."
        },
        mothers_day: {
          title: "Anneler Günü Kartı",
          description: "Annen için değerli anıları ve özel bir şarkıyı birleştiren sevgi dolu kartlar."
        },
        fathers_day: {
          title: "Babalar Günü Kartı",
          description: "Baban için ortak anılar, QR kod ve kişisel şarkıyla hazırlanan özel kartlar."
        }
      },
      orderForm: {
        categoryLabel: "Kart türü",
        categoryHelp: "Önce hangi kartı tasarlamak istediğini seç.",
        nameLabel: "Adın",
        emailLabel: "E-posta",
        phoneLabel: "Telefon isteğe bağlı",
        songLanguageLabel: "Şarkının dili",
        selectPlaceholder: "Lütfen seçin",
        songLanguageOptions: ["Almanca", "Türkçe"],
        voiceLabel: "Ses",
        voiceOptions: ["Erkek", "Kadın"],
        musicStyleLabel: "Müzik tarzı",
        musicStyleOptions: ["Pop", "Duygusal Türkçe", "Balad", "Rap", "Akustik", "Arabesk", "Beni şaşırt"],
        messageLabel: "Not",
        messagePlaceholder: "Bilmemizi istediğin başka bir şey var mı?",
        submitLabel: "Talep gönder",
        sending: "Talebin gönderiliyor...",
        success: "Teşekkürler. Talebin gönderildi.",
        error: "Talep kaydedilemedi.",
        requiredMessage: "Lütfen bu alanı doldurun.",
        cardTextCategory: "Kart türü",
        cardTextRecipient: "Kişi",
        cardTextOccasion: "Sebep",
        musicWishLanguage: "Şarkının dili",
        musicWishVoice: "Ses",
        musicWishStyle: "Müzik tarzı",
        requestButton: "Talep et",
        categoryFields: {
          birthday: [
            { name: "occasion", label: "Sebep", placeholder: "Doğum günü", defaultValue: "Doğum günü", required: true },
            { name: "recipient", label: "İsim", placeholder: "örn. Anne, Sarah, sevgilim", required: true },
            { name: "age", label: "Yaş isteğe bağlı", type: "number", required: false }
          ],
          apology: [
            { name: "apology_for", label: "Ne için özür diliyorsun?", type: "textarea", placeholder: "Neden özür dilemek istediğini kısaca anlat.", required: true },
            { name: "recipient", label: "Kişinin adı", placeholder: "örn. Elif, Sarah, sevgilim", required: true },
            { name: "mood", label: "Duygu", placeholder: "örn. yumuşak, samimi, barışçıl", required: true }
          ],
          valentine: [
            { name: "recipient", label: "Partnerin adı", placeholder: "örn. aşkım, Elif, Sarah", required: true },
            { name: "love_story", label: "Tanışma hikayesi isteğe bağlı", type: "textarea", placeholder: "Nasıl tanıştığınızı kısaca anlat.", required: false },
            { name: "romantic_style", label: "Romantik stil", placeholder: "örn. şefkatli, modern, tutkulu", required: true }
          ],
          mothers_day: [
            { name: "recipient", label: "Annenin adı", placeholder: "örn. Anne, Ayşe", required: true },
            { name: "memory", label: "Özel anı", type: "textarea", placeholder: "Karta hangi anı dahil edilsin?", required: true }
          ],
          fathers_day: [
            { name: "recipient", label: "Babanın adı", placeholder: "örn. Baba, Mehmet", required: true },
            { name: "memory", label: "Ortak anı", type: "textarea", placeholder: "Sizin için hangi ortak anı önemli?", required: true }
          ]
        }
      },
      legacyOrderOptions: {
        voiceOptions: ["Männlich", "Weiblich"],
        songLanguageOptions: ["Deutsch", "Türkisch"],
        musicStyleOptions: ["Türkisch emotional", "Ballade", "Überrasch mich"]
      },
      legacyCategoryTitles: {
        birthday: ["Doğum günü kartı"],
        apology: ["Özür kartı"]
      }
    }
  };
})();
