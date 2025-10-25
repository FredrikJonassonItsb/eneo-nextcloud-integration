# Nextcloud Talk för Outlook

Microsoft Outlook-tillägg för att integrera Nextcloud Talk-videomöten i Outlook-kalendern.

## Översikt

Detta tillägg gör det möjligt att skapa Nextcloud Talk-videomöten direkt från Outlook-kalendern. Möteslänkar läggs automatiskt till i kalenderinbjudan och mötet synkroniseras till Nextcloud Kalender.

## Funktioner

- ✨ **Enkel integration** - Skapa Talk-möten med ett klick från Outlook
- 🔐 **Säker autentisering** - OAuth2 med stöd för SSO
- 📅 **Kalendersynk** - Automatisk synkronisering till Nextcloud Kalender
- 🗑️ **Teams-borttagning** - Tar automatiskt bort Teams-länkar
- 🌍 **Flerspråksstöd** - Svenska och engelska
- 💻 **Plattformsoberoende** - Fungerar i Outlook Web, Desktop (Windows/Mac)

## Installation

### För användare

1. Ladda ner [manifest.xml](manifest.xml)
2. Öppna Outlook Web (outlook.office.com)
3. Gå till Inställningar → Tillägg
4. Klicka "+ Lägg till från fil" och välj manifest.xml
5. Klart!

### För administratörer

Distribuera centralt via Microsoft 365 Admin Center:

1. Gå till [admin.microsoft.com](https://admin.microsoft.com)
2. Navigera till Inställningar → Integrerade appar
3. Ladda upp manifest.xml
4. Välj användare/grupper som ska ha tillgång

## Konfiguration

### Nextcloud-server

1. **Aktivera nödvändiga appar:**
   ```bash
   php occ app:enable spreed
   php occ app:enable oauth2
   ```

2. **Skapa OAuth2-klient:**
   - Gå till Nextcloud → Inställningar → Säkerhet → OAuth 2.0
   - Namn: `outlook-nextcloud-addin`
   - Redirect URI: `https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/src/taskpane/callback.html`
   - Kopiera Client ID och Secret

3. **Konfigurera CORS:**
   ```apache
   Header set Access-Control-Allow-Origin "https://fredrikjonassonitsb.github.io"
   Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
   Header set Access-Control-Allow-Headers "Content-Type, Authorization, OCS-APIRequest, Accept"
   Header set Access-Control-Allow-Credentials "true"
   ```

### Tillägg

Uppdatera `src/utils/config.js` med dina värden:

```javascript
const CONFIG = {
  nextcloud: {
    serverUrl: 'https://din-nextcloud-server.se'
  },
  oauth: {
    clientId: 'DIN_CLIENT_ID',
    clientSecret: 'DIN_CLIENT_SECRET'
  }
};
```

## Användning

1. Öppna eller skapa en kalenderhändelse i Outlook
2. Klicka på "Nextcloud Talk" i ribbon
3. Logga in med ditt Nextcloud-konto (första gången)
4. Klicka "Lägg till Nextcloud Talk-möte"
5. Möteslänken läggs automatiskt till i inbjudan

## Utveckling

### Projektstruktur

```
outlook-addin/
├── src/
│   ├── assets/          # Ikoner
│   ├── utils/           # Hjälpfunktioner (config, i18n, storage)
│   ├── services/        # API-tjänster (auth, nextcloud, outlook)
│   ├── taskpane/        # Huvudgränssnitt
│   └── commands/        # Ribbon-kommandon
├── manifest.xml         # Office Add-in manifest
├── index.html          # Landningssida
└── README.md
```

### Lokal utveckling

1. **Klona repository:**
   ```bash
   git clone https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration.git
   cd eneo-nextcloud-integration
   git checkout feature/outlook-nextcloud-talk-addin
   ```

2. **Konfigurera:**
   - Uppdatera `outlook-addin/src/utils/config.js`
   - Uppdatera `outlook-addin/manifest.xml` med din URL

3. **Testa lokalt:**
   - Kör en lokal webbserver: `python3 -m http.server 8080`
   - Sideload manifest.xml i Outlook Web

4. **Deploy till GitHub Pages:**
   - Push till GitHub
   - Aktivera GitHub Pages för branchen
   - Tillägget är nu tillgängligt på `https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/`

## API-endpoints

Tillägget använder följande Nextcloud API:er:

- **OAuth2:** `/apps/oauth2/authorize`, `/apps/oauth2/api/v1/token`
- **Talk:** `/ocs/v2.php/apps/spreed/api/v4/room`
- **CalDAV:** `/remote.php/dav/calendars/{user}/{calendar}/`

## Säkerhet

- All kommunikation sker över HTTPS
- OAuth2 med PKCE för autentisering
- Tokens lagras säkert i localStorage
- Inga lösenord lagras i klartext
- CORS konfigurerat för säker cross-origin kommunikation

## Felsökning

### Tillägget visas inte i Outlook

- Kontrollera att manifest.xml är korrekt formaterad
- Verifiera att alla URL:er i manifestet är tillgängliga
- Kontrollera att Outlook stöder tillägg (kräver Exchange Online/M365)

### Inloggning fungerar inte

- Kontrollera OAuth2-konfiguration i Nextcloud
- Verifiera att Redirect URI matchar exakt
- Kontrollera CORS-headers på Nextcloud-servern
- Se webbläsarkonsolen för felmeddelanden

### Kan inte skapa möte

- Kontrollera att Nextcloud Talk är aktiverat
- Verifiera att användaren har behörighet att skapa rum
- Kontrollera nätverksanslutning till Nextcloud-servern
- Se webbläsarkonsolen för API-fel

## Support

- **Dokumentation:** [docs/outlook-addin-requirements.md](../docs/outlook-addin-requirements.md)
- **GitHub Issues:** [github.com/FredrikJonassonItsb/eneo-nextcloud-integration/issues](https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration/issues)
- **Eneo-projekt:** [Huvudrepository](https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration)

## Licens

Detta projekt är utvecklat för Sundsvalls kommun som en del av Eneo-projektet.

## Bidra

Bidrag är välkomna! Skapa en pull request eller öppna ett issue på GitHub.

## Changelog

### v2.0.0 (2025-10-25)

- Första versionen av Outlook-tillägget
- OAuth2-autentisering med Nextcloud
- Skapa Talk-möten från Outlook
- Synkronisering till Nextcloud Kalender
- Automatisk borttagning av Teams-länkar
- Stöd för svenska och engelska
- Plattformsoberoende (Web/Desktop)

## Författare

- **Manus AI** - Initial implementation
- **Fredrik Jonasson (ITSB)** - Projektägare och kravställare

## Tack till

- Nextcloud-communityn för API-dokumentation
- Microsoft för Office Add-ins-plattformen
- Sundsvalls kommun för projektstöd

