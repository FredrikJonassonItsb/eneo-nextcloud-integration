# Deployment Guide: Outlook Add-in till GitHub Pages

Denna guide beskriver hur du deployer Outlook-tillägget till GitHub Pages för permanent hosting.

## Förutsättningar

- GitHub-repository: `FredrikJonassonItsb/eneo-nextcloud-integration`
- Branch: `feature/outlook-nextcloud-talk-addin`
- Administratörsrättigheter till repositoryt

## Steg 1: Aktivera GitHub Pages

### Via GitHub Web UI (Rekommenderat)

1. **Gå till repository-inställningar:**
   - Öppna https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration
   - Klicka på "Settings" (⚙️)

2. **Navigera till Pages:**
   - I vänstermenyn, klicka på "Pages"

3. **Konfigurera Pages:**
   - **Source:** Välj "Deploy from a branch"
   - **Branch:** Välj `feature/outlook-nextcloud-talk-addin`
   - **Folder:** Välj `/outlook-addin` (eller `/root` om `/outlook-addin` inte finns som alternativ)
   - Klicka "Save"

4. **Vänta på deployment:**
   - GitHub Pages bygger och deployer automatiskt
   - Detta tar vanligtvis 1-2 minuter
   - Du ser en grön bock när det är klart

5. **Verifiera URL:**
   - GitHub Pages-URL:en kommer att vara:
   - `https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/`
   - Eller om du valde `/root`:
   - `https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/`

### Alternativ: Via GitHub Actions

Om du föredrar automatisk deployment via GitHub Actions, skapa `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy Outlook Add-in to GitHub Pages

on:
  push:
    branches:
      - feature/outlook-nextcloud-talk-addin
    paths:
      - 'outlook-addin/**'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './outlook-addin'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Steg 2: Uppdatera konfiguration

Efter att GitHub Pages är aktiverat, uppdatera följande filer med den korrekta URL:en:

### 1. Uppdatera manifest.xml

Om din GitHub Pages-URL är annorlunda än förväntat, uppdatera alla URL:er i `manifest.xml`:

```xml
<!-- Sök och ersätt -->
https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/

<!-- Med din faktiska URL -->
https://din-faktiska-url.github.io/path/
```

### 2. Uppdatera config.js

Uppdatera OAuth2 redirect URI i `src/utils/config.js`:

```javascript
oauth: {
  redirectUri: 'https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/src/taskpane/callback.html',
  // Uppdatera med din faktiska URL
}
```

### 3. Uppdatera Nextcloud OAuth2-klient

Gå till Nextcloud → Inställningar → Säkerhet → OAuth 2.0 och uppdatera Redirect URI för din OAuth2-klient:

```
https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/src/taskpane/callback.html
```

## Steg 3: Verifiera deployment

### Testa landningssidan

1. Öppna: `https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/`
2. Du bör se landningssidan med information om tillägget

### Testa manifest.xml

1. Öppna: `https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/manifest.xml`
2. Du bör se XML-innehållet
3. Kontrollera att alla URL:er i manifestet är korrekta

### Testa taskpane

1. Öppna: `https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/src/taskpane/taskpane.html`
2. Du bör se tilläggets gränssnitt (även om Office.js inte är tillgängligt utanför Outlook)

## Steg 4: Installera i Outlook

### För testning (Sideloading)

1. **Öppna Outlook Web:**
   - Gå till https://outlook.office.com

2. **Öppna tilläggsinställningar:**
   - Klicka på kugghjulet (⚙️)
   - "Visa alla Outlook-inställningar"
   - "Anpassa åtgärder" → "Tillägg"

3. **Lägg till anpassat tillägg:**
   - Klicka "+ Lägg till från URL"
   - Ange: `https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/manifest.xml`
   - Klicka "OK"

4. **Testa tillägget:**
   - Skapa eller öppna en kalenderhändelse
   - Du bör se "Nextcloud Talk" i ribbon

### För produktion (Centralt deployment)

1. **Gå till Microsoft 365 Admin Center:**
   - https://admin.microsoft.com

2. **Navigera till Integrerade appar:**
   - "Inställningar" → "Integrerade appar"

3. **Ladda upp tillägg:**
   - Klicka "Ladda upp anpassade appar"
   - Välj "Ange en länk till manifestfilen"
   - Ange: `https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/manifest.xml`

4. **Konfigurera deployment:**
   - Välj användare eller grupper
   - Välj om tillägget ska vara obligatoriskt eller valfritt
   - Klicka "Distribuera"

## Steg 5: Konfigurera CORS på Nextcloud

För att tillägget ska fungera måste Nextcloud tillåta CORS-anrop från GitHub Pages:

### Apache (.htaccess eller VirtualHost)

```apache
<IfModule mod_headers.c>
  # Remove any duplicate headers
  Header unset Access-Control-Allow-Origin
  
  # Set correct CORS headers
  Header set Access-Control-Allow-Origin "https://fredrikjonassonitsb.github.io"
  Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization, OCS-APIRequest, Accept"
  Header set Access-Control-Allow-Credentials "true"
  
  # Handle preflight OPTIONS requests
  RewriteEngine On
  RewriteCond %{REQUEST_METHOD} OPTIONS
  RewriteRule ^(.*)$ $1 [R=200,L]
</IfModule>
```

### Nginx

```nginx
add_header Access-Control-Allow-Origin "https://fredrikjonassonitsb.github.io" always;
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE" always;
add_header Access-Control-Allow-Headers "Content-Type, Authorization, OCS-APIRequest, Accept" always;
add_header Access-Control-Allow-Credentials "true" always;

if ($request_method = 'OPTIONS') {
  return 200;
}
```

### Nextcloud config.php

Lägg till i `config/config.php`:

```php
'cors.allowed-domains' => [
  'https://fredrikjonassonitsb.github.io',
  'https://outlook.office.com',
  'https://outlook.office365.com',
],
```

## Felsökning

### GitHub Pages visar 404

**Problem:** Sidan visar "404 - File not found"

**Lösning:**
1. Kontrollera att branchen är korrekt vald i Settings → Pages
2. Kontrollera att `/outlook-addin` finns i branchen
3. Vänta 1-2 minuter efter att ha aktiverat Pages
4. Försök med `/root` istället för `/outlook-addin` som folder

### Manifest.xml kan inte laddas i Outlook

**Problem:** Outlook säger "Kunde inte ladda manifestet"

**Lösning:**
1. Kontrollera att manifest.xml är tillgänglig via URL:en
2. Verifiera att XML-syntaxen är korrekt
3. Kontrollera att alla URL:er i manifestet är tillgängliga
4. Testa att öppna manifest.xml direkt i webbläsaren

### CORS-fel i webbläsarkonsolen

**Problem:** "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Lösning:**
1. Kontrollera att CORS-headers är korrekt konfigurerade på Nextcloud
2. Verifiera att Origin matchar exakt (inklusive https://)
3. Kontrollera att det inte finns flera Access-Control-Allow-Origin headers
4. Testa med curl:
   ```bash
   curl -I -H "Origin: https://fredrikjonassonitsb.github.io" \
     https://din-nextcloud-server.se/ocs/v2.php/apps/spreed/api/v4/room
   ```

### OAuth2-callback fungerar inte

**Problem:** Efter inloggning händer ingenting

**Lösning:**
1. Kontrollera att callback.html är tillgänglig
2. Verifiera att Redirect URI i Nextcloud matchar exakt
3. Öppna webbläsarkonsolen och se efter felmeddelanden
4. Kontrollera att callback.html innehåller korrekt JavaScript

## Uppdatering av tillägget

När du gör ändringar i tillägget:

1. **Commit och push:**
   ```bash
   git add -A
   git commit -m "Update Outlook add-in"
   git push origin feature/outlook-nextcloud-talk-addin
   ```

2. **GitHub Pages uppdateras automatiskt:**
   - Vanligtvis inom 1-2 minuter
   - Kontrollera status under Settings → Pages

3. **Användare får uppdateringen:**
   - Outlook cachar manifestet i upp till 24 timmar
   - För omedelbar uppdatering: ta bort och lägg till tillägget igen
   - Eller öka version i manifest.xml

## Permanent URL

Din permanenta URL för tillägget är:

```
https://fredrikjonassonitsb.github.io/eneo-nextcloud-integration/outlook-addin/
```

Denna URL kommer att fungera så länge:
- GitHub Pages är aktiverat för repositoryt
- Branchen `feature/outlook-nextcloud-talk-addin` finns kvar
- Filerna i `/outlook-addin` är intakta

## Backup och återställning

### Backup

```bash
# Klona branchen
git clone -b feature/outlook-nextcloud-talk-addin \
  https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration.git \
  outlook-addin-backup

# Eller skapa en release
gh release create outlook-addin-v2.0.0 \
  --title "Outlook Add-in v2.0.0" \
  --notes "Backup of Outlook add-in" \
  --target feature/outlook-nextcloud-talk-addin
```

### Återställning

```bash
# Återställ från backup
cd outlook-addin-backup
git push origin feature/outlook-nextcloud-talk-addin --force

# Eller från release
gh release download outlook-addin-v2.0.0
```

## Support

Om du stöter på problem:

1. Kontrollera denna guide
2. Se [README.md](README.md) för felsökning
3. Öppna ett issue på GitHub
4. Kontakta projektägare

---

**Status:** ✅ Redo för deployment  
**Senast uppdaterad:** 2025-10-25  
**Version:** 2.0.0

