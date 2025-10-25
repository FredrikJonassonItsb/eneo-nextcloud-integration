# OAuth2 Setup Guide

Denna guide beskriver i detalj hur man konfigurerar OAuth2-baserad Single Sign-On (SSO) mellan Nextcloud och Eneo.

## Översikt

OAuth2 är en öppen standard för auktorisering som gör det möjligt för användare att logga in på Eneo med sina Nextcloud-credentials utan att dela sitt lösenord. Nextcloud fungerar som **Identity Provider** och Eneo som **OAuth2-klient**.

## OAuth2-flöde

```
1. Användare klickar "Logga in" i Eneo
2. Eneo omdirigerar till Nextcloud authorization endpoint
3. Användare loggar in i Nextcloud (om inte redan inloggad)
4. Användare godkänner att Eneo får åtkomst
5. Nextcloud omdirigerar tillbaka till Eneo med authorization code
6. Eneo byter ut code mot access token
7. Eneo använder access token för att hämta användarinfo
8. Eneo skapar session och loggar in användaren
```

## Steg-för-steg konfiguration

### Steg 1: Aktivera OAuth2 i Nextcloud

OAuth2-appen är oftast förinstallerad i Nextcloud Hub, men kan behöva aktiveras:

1. Logga in i Nextcloud som administratör
2. Klicka på din profilbild → **Appar**
3. Sök efter "OAuth 2.0"
4. Om appen inte är aktiverad, klicka **Aktivera**

### Steg 2: Registrera Eneo som OAuth2-klient

1. Gå till **Inställningar** (klicka på profilbild → Inställningar)
2. I vänstermenyn, under **Administration**, klicka på **Säkerhet**
3. Scrolla ner till sektionen **OAuth 2.0**
4. Under "OAuth 2.0 clients" klicka på **Lägg till klient**

Fyll i följande information:

| Fält | Värde | Beskrivning |
|------|-------|-------------|
| **Namn** | `Eneo` | Namnet på applikationen |
| **Redirect URI** | `http://localhost/eneo/oauth/callback` | URL dit Nextcloud omdirigerar efter inloggning |

**OBS**: Om du kör på en annan domän än localhost, ersätt med din faktiska domän, t.ex. `https://eneo.sundsvall.se/oauth/callback`

5. Klicka **Lägg till**

### Steg 3: Kopiera Client ID och Secret

Efter att ha lagt till klienten visas:
- **Client Identifier** (Client ID)
- **Secret**

**Viktigt**: Kopiera dessa värden omedelbart! Secret visas bara en gång.

Exempel:
```
Client Identifier: abc123def456ghi789
Secret: xyz789uvw456rst123
```

### Steg 4: Uppdatera Eneo-konfiguration

Öppna `.env`-filen i projektets rotkatalog:

```bash
nano .env
```

Uppdatera följande variabler:

```bash
# OAuth2 Settings
OAUTH2_CLIENT_ID=abc123def456ghi789
OAUTH2_CLIENT_SECRET=xyz789uvw456rst123
OAUTH2_AUTHORIZE_URL=http://localhost/index.php/apps/oauth2/authorize
OAUTH2_TOKEN_URL=http://localhost/index.php/apps/oauth2/api/v1/token
OAUTH2_USERINFO_URL=http://localhost/ocs/v2.php/cloud/user
OAUTH2_REDIRECT_URI=http://localhost/eneo/oauth/callback
```

**OBS**: Om du använder en annan domän, uppdatera alla URL:er:

```bash
OAUTH2_AUTHORIZE_URL=https://nextcloud.sundsvall.se/index.php/apps/oauth2/authorize
OAUTH2_TOKEN_URL=https://nextcloud.sundsvall.se/index.php/apps/oauth2/api/v1/token
OAUTH2_USERINFO_URL=https://nextcloud.sundsvall.se/ocs/v2.php/cloud/user
OAUTH2_REDIRECT_URI=https://eneo.sundsvall.se/oauth/callback
```

### Steg 5: Starta om Eneo

För att ändringarna ska träda i kraft, starta om tjänsterna:

```bash
./scripts/stop.sh
./scripts/start.sh
```

Eller om tjänsterna redan körs:

```bash
docker compose restart eneo-backend eneo-frontend
```

## Testa OAuth2-integrationen

### Test 1: Grundläggande inloggning

1. Öppna http://localhost/eneo i din webbläsare
2. Klicka på **Logga in med Nextcloud**
3. Du bör omdirigeras till Nextclouds inloggningssida
4. Logga in med dina Nextcloud-credentials
5. På godkännandesidan, klicka **Godkänn**
6. Du bör omdirigeras tillbaka till Eneo och vara inloggad

### Test 2: Verifiera användarinfo

Efter inloggning, öppna utvecklarverktyg (F12) och kör:

```javascript
fetch('http://localhost/eneo/api/auth/me', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

Du bör se användarinformation från Nextcloud.

### Test 3: Testa filåtkomst

När du är inloggad, försök lista filer från Nextcloud:

```javascript
fetch('http://localhost/eneo/api/documents/nextcloud/files?path=/', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

## Felsökning

### Problem: "Invalid redirect URI"

**Orsak**: Redirect URI i Nextcloud matchar inte den som Eneo använder.

**Lösning**:
1. Kontrollera att Redirect URI i Nextcloud är exakt: `http://localhost/eneo/oauth/callback`
2. Kontrollera att `OAUTH2_REDIRECT_URI` i `.env` är samma
3. Inga extra mellanslag eller tecken
4. Protokoll (http/https) måste matcha

### Problem: "Client authentication failed"

**Orsak**: Client ID eller Secret är felaktigt.

**Lösning**:
1. Verifiera att Client ID och Secret är korrekt kopierade till `.env`
2. Inga extra mellanslag
3. Om du tappat Secret, ta bort klienten i Nextcloud och skapa en ny

### Problem: "Access denied"

**Orsak**: Användaren nekade åtkomst eller så finns det ett problem med scopes.

**Lösning**:
1. Försök logga in igen och klicka **Godkänn**
2. Kontrollera att OAuth2-appen är aktiverad i Nextcloud
3. Kontrollera Nextcloud-loggar: `docker compose logs nextcloud`

### Problem: Omdirigeras till fel URL

**Orsak**: `OAUTH2_REDIRECT_URI` är felkonfigurerad.

**Lösning**:
1. Kontrollera att `OAUTH2_REDIRECT_URI` i `.env` matchar din faktiska URL
2. Om du använder Traefik eller annan reverse proxy, kontrollera routing-regler

### Problem: "CORS error"

**Orsak**: Cross-Origin Resource Sharing är inte korrekt konfigurerat.

**Lösning**:
1. Kontrollera `CORS_ORIGINS` i `.env`
2. Lägg till din frontend-URL om den är annorlunda
3. Starta om backend: `docker compose restart eneo-backend`

## Avancerad konfiguration

### Anpassa OAuth2-scopes

I `eneo/backend/app/api/auth.py`, kan du anpassa vilka scopes som begärs:

```python
auth_url = (
    f"{settings.OAUTH2_AUTHORIZE_URL}"
    f"?client_id={settings.OAUTH2_CLIENT_ID}"
    f"&redirect_uri={settings.OAUTH2_REDIRECT_URI}"
    f"&response_type=code"
    f"&scope=openid profile email files"  # Lägg till fler scopes här
)
```

Tillgängliga scopes i Nextcloud:
- `openid`: Grundläggande OpenID Connect
- `profile`: Användarens profil (namn, etc.)
- `email`: Användarens e-postadress
- `files`: Åtkomst till filer (om implementerat)

### Implementera refresh tokens

För att hålla användare inloggade längre, implementera refresh token-logik:

```python
# I auth.py
async def refresh_access_token(refresh_token: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            settings.OAUTH2_TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": settings.OAUTH2_CLIENT_ID,
                "client_secret": settings.OAUTH2_CLIENT_SECRET,
            }
        )
        return response.json()
```

### Lagra tokens säkert

Tokens bör lagras krypterade i databasen:

```python
from cryptography.fernet import Fernet

# Generera nyckel (gör detta en gång och spara i .env)
key = Fernet.generate_key()

# Kryptera token
cipher = Fernet(key)
encrypted_token = cipher.encrypt(access_token.encode())

# Dekryptera token
decrypted_token = cipher.decrypt(encrypted_token).decode()
```

## Säkerhet

### Best practices

1. **Använd HTTPS i produktion**: OAuth2 över HTTP är osäkert
2. **Rotera secrets regelbundet**: Byt Client Secret var 6:e månad
3. **Begränsa scopes**: Be bara om de scopes du verkligen behöver
4. **Validera redirect URI**: Nextcloud validerar automatiskt, men dubbelkolla konfigurationen
5. **Lagra tokens säkert**: Kryptera tokens i databasen
6. **Implementera token expiration**: Kontrollera och förnya tokens regelbundet
7. **Logga OAuth-händelser**: Logga inloggningar och token-användning för audit

### PKCE (Proof Key for Code Exchange)

För extra säkerhet, överväg att implementera PKCE:

```python
import hashlib
import base64
import secrets

# Generera code verifier
code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')

# Generera code challenge
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode('utf-8')).digest()
).decode('utf-8').rstrip('=')

# Lägg till i authorization request
auth_url = (
    f"{settings.OAUTH2_AUTHORIZE_URL}"
    f"?client_id={settings.OAUTH2_CLIENT_ID}"
    f"&redirect_uri={settings.OAUTH2_REDIRECT_URI}"
    f"&response_type=code"
    f"&code_challenge={code_challenge}"
    f"&code_challenge_method=S256"
)
```

## Nästa steg

Efter att ha konfigurerat OAuth2:

1. Implementera filåtkomst via WebDAV (se [File Access Guide](file-access.md))
2. Konfigurera användarroller och behörigheter
3. Implementera session management
4. Sätt upp monitoring av OAuth-händelser

## Resurser

- [Nextcloud OAuth2 Documentation](https://docs.nextcloud.com/server/latest/admin_manual/configuration_server/oauth2.html)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [FastAPI OAuth2 Guide](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)

