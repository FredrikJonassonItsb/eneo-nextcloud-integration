# Installationsguide - Eneo + Nextcloud Integration

Denna guide beskriver hur du installerar och konfigurerar Eneo tillsammans med Nextcloud i samma miljö.

## Förutsättningar

### Systemkrav

- **Operativsystem**: Linux (Ubuntu 22.04 rekommenderas), macOS, eller Windows med WSL2
- **RAM**: Minst 8 GB (16 GB rekommenderas för AI-modeller)
- **Disk**: Minst 20 GB ledigt utrymme
- **CPU**: 4 kärnor eller fler (GPU rekommenderas för AI-modeller)

### Programvara

- **Docker**: Version 20.10 eller senare
- **Docker Compose**: Version 2.0 eller senare
- **Git**: För att klona repositoryt
- **OpenSSL**: För att generera säkra lösenord (oftast förinstallerat)

### Installera Docker

#### Ubuntu/Debian

```bash
# Uppdatera paketlistan
sudo apt-get update

# Installera Docker
sudo apt-get install -y docker.io docker-compose-plugin

# Lägg till din användare i docker-gruppen
sudo usermod -aG docker $USER

# Logga ut och in igen för att aktivera gruppmedlemskapet
```

#### macOS

```bash
# Installera Docker Desktop från https://www.docker.com/products/docker-desktop
# Eller använd Homebrew:
brew install --cask docker
```

#### Windows

1. Installera WSL2: https://docs.microsoft.com/en-us/windows/wsl/install
2. Installera Docker Desktop: https://www.docker.com/products/docker-desktop

## Installation

### Steg 1: Klona repositoryt

```bash
git clone https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration.git
cd eneo-nextcloud-integration
```

### Steg 2: Kör setup-skriptet

Setup-skriptet skapar `.env`-filen och genererar säkra lösenord:

```bash
./scripts/setup.sh
```

Detta skript kommer att:
- Skapa `.env`-fil från `.env.example`
- Generera säkra slumpmässiga lösenord
- Skapa nödvändiga kataloger
- Bygga Docker-images

### Steg 3: Granska och anpassa konfiguration

Öppna `.env`-filen och granska inställningarna:

```bash
nano .env
```

Viktiga inställningar att kontrollera:

- **NEXTCLOUD_ADMIN_PASSWORD**: Ändra till ett säkert lösenord
- **DOMAIN**: Om du kör på en server, ange domännamnet
- **PROTOCOL**: Ändra till `https` om du använder SSL/TLS

### Steg 4: Starta tjänsterna

```bash
./scripts/start.sh
```

Detta startar alla tjänster i bakgrunden. Första gången kan det ta några minuter eftersom Docker måste ladda ner alla images.

### Steg 5: Verifiera att tjänsterna körs

```bash
docker compose ps
```

Du bör se följande tjänster köra:
- traefik
- nextcloud
- nextcloud-db
- nextcloud-redis
- eneo-backend
- eneo-frontend
- eneo-db
- eneo-redis

### Steg 6: Öppna i webbläsare

- **Nextcloud**: http://localhost
- **Eneo**: http://localhost/eneo
- **Traefik Dashboard**: http://localhost:8080

## Första inloggning i Nextcloud

1. Öppna http://localhost i din webbläsare
2. Logga in med:
   - **Användarnamn**: `admin`
   - **Lösenord**: Det du satte i `.env` (standard: `changeme_secure_password`)

3. Följ Nextclouds installationsguide för att slutföra konfigurationen

## Konfigurera OAuth2 för SSO

För att Eneo ska kunna använda Nextcloud för inloggning måste du konfigurera OAuth2:

### Steg 1: Aktivera OAuth2-appen i Nextcloud

1. Logga in i Nextcloud som administratör
2. Gå till **Inställningar** → **Appar**
3. Sök efter "OAuth 2.0" och aktivera den om den inte redan är aktiverad

### Steg 2: Registrera Eneo som OAuth2-klient

1. Gå till **Inställningar** → **Säkerhet** → **OAuth 2.0**
2. Klicka på **Lägg till klient**
3. Fyll i:
   - **Namn**: `Eneo`
   - **Redirect URI**: `http://localhost/eneo/oauth/callback`
4. Klicka på **Lägg till**
5. Kopiera **Client ID** och **Client Secret**

### Steg 3: Uppdatera .env-filen

Öppna `.env` och uppdatera följande:

```bash
OAUTH2_CLIENT_ID=<ditt-client-id>
OAUTH2_CLIENT_SECRET=<ditt-client-secret>
```

### Steg 4: Starta om tjänsterna

```bash
./scripts/stop.sh
./scripts/start.sh
```

## Testa integrationen

1. Öppna http://localhost/eneo
2. Klicka på **Logga in med Nextcloud**
3. Du bör omdirigeras till Nextclouds inloggningssida
4. Logga in med dina Nextcloud-credentials
5. Godkänn att Eneo får åtkomst
6. Du bör omdirigeras tillbaka till Eneo och vara inloggad

## Felsökning

### Tjänster startar inte

Kontrollera loggar:
```bash
docker compose logs -f
```

### Nextcloud visar "Access through untrusted domain"

Lägg till din domän i Nextclouds konfiguration:
```bash
docker compose exec nextcloud php occ config:system:set trusted_domains 1 --value=localhost
```

### Eneo kan inte ansluta till Nextcloud

Kontrollera att alla tjänster är på samma Docker-nätverk:
```bash
docker compose ps
docker network inspect eneo-nextcloud_eneo-network
```

### OAuth2-fel

- Kontrollera att Redirect URI är exakt `http://localhost/eneo/oauth/callback`
- Kontrollera att Client ID och Secret är korrekt kopierade till `.env`
- Starta om tjänsterna efter att ha uppdaterat `.env`

### Portar redan används

Om port 80 eller 8080 redan används, ändra portarna i `docker-compose.yml`:

```yaml
services:
  traefik:
    ports:
      - "8000:80"  # Ändra från 80 till 8000
      - "8081:8080"  # Ändra från 8080 till 8081
```

## Avancerad konfiguration

### Använda HTTPS

För att använda HTTPS i produktion, konfigurera Traefik med Let's Encrypt:

1. Uppdatera `docker-compose.yml` med Let's Encrypt-konfiguration
2. Ändra `PROTOCOL=https` i `.env`
3. Konfigurera DNS att peka på din server

### Använda extern databas

Om du vill använda en extern PostgreSQL-databas:

1. Kommentera ut `nextcloud-db` och `eneo-db` i `docker-compose.yml`
2. Uppdatera databas-inställningar i `.env`

### Aktivera AI-modeller

För att använda lokala AI-modeller:

1. Ladda ner en modell (t.ex. LLaMA 2)
2. Placera modellen i `data/models/`
3. Uppdatera `AI_MODEL_PATH` i `.env`

## Backup och återställning

### Skapa backup

```bash
# Backup av databaser
docker compose exec nextcloud-db pg_dump -U nextcloud nextcloud > backup-nextcloud-$(date +%Y%m%d).sql
docker compose exec eneo-db pg_dump -U eneo eneo > backup-eneo-$(date +%Y%m%d).sql

# Backup av filer
docker compose exec nextcloud tar czf /tmp/nextcloud-data.tar.gz /var/www/html/data
docker compose cp nextcloud:/tmp/nextcloud-data.tar.gz ./backup-nextcloud-data-$(date +%Y%m%d).tar.gz
```

### Återställa från backup

```bash
# Återställ databas
cat backup-nextcloud-20240101.sql | docker compose exec -T nextcloud-db psql -U nextcloud nextcloud

# Återställ filer
docker compose cp backup-nextcloud-data-20240101.tar.gz nextcloud:/tmp/
docker compose exec nextcloud tar xzf /tmp/nextcloud-data-20240101.tar.gz -C /
```

## Nästa steg

- Läs [OAuth Setup Guide](oauth-setup.md) för detaljerad OAuth2-konfiguration
- Läs [Architecture Documentation](architecture.md) för att förstå systemets arkitektur
- Konfigurera filåtkomst och indexering i Eneo
- Utforska Smart Picker-integration (kommande)

## Support

Om du stöter på problem:

1. Kontrollera [Felsökning](#felsökning)-sektionen ovan
2. Sök i GitHub Issues: https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration/issues
3. Skapa ett nytt issue om problemet kvarstår

