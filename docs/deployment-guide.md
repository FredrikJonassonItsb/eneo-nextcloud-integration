# Steg-för-steg Deployment Guide

Denna guide tar dig genom hela processen att distribuera Eneo och Nextcloud med Docker, från installation till produktion.

## Innehållsförteckning

1. [Förberedelser](#förberedelser)
2. [Installation av Docker](#installation-av-docker)
3. [Klona och konfigurera projektet](#klona-och-konfigurera-projektet)
4. [Första körningen](#första-körningen)
5. [Konfigurera Nextcloud](#konfigurera-nextcloud)
6. [Konfigurera OAuth2](#konfigurera-oauth2)
7. [Testa integrationen](#testa-integrationen)
8. [Produktionsdistribution](#produktionsdistribution)
9. [Felsökning](#felsökning)
10. [Underhåll och backup](#underhåll-och-backup)

---

## Förberedelser

### Systemkrav

Innan du börjar, se till att din server uppfyller följande krav:

**Hårdvara**:
- **CPU**: Minst 4 kärnor (8+ rekommenderas för produktion)
- **RAM**: Minst 8 GB (16 GB+ rekommenderas)
- **Disk**: Minst 50 GB ledigt utrymme (SSD rekommenderas)
- **Nätverk**: Stabil internetanslutning

**Operativsystem**:
- Ubuntu 22.04 LTS (rekommenderas)
- Debian 11+
- CentOS/RHEL 8+
- macOS 12+ (för utveckling)
- Windows 11 med WSL2 (för utveckling)

**Nätverksportar**:
Följande portar måste vara tillgängliga:
- **80**: HTTP (Traefik)
- **443**: HTTPS (Traefik, i produktion)
- **8080**: Traefik Dashboard (valfritt)

### Användarrättigheter

Du behöver:
- Root-åtkomst eller sudo-rättigheter
- Möjlighet att öppna portar i brandvägg
- Åtkomst till DNS-konfiguration (för produktion)

---

## Installation av Docker

### Ubuntu/Debian

#### Steg 1: Uppdatera systemet

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

#### Steg 2: Installera förutsättningar

```bash
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
```

#### Steg 3: Lägg till Dockers GPG-nyckel

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

#### Steg 4: Lägg till Docker-repository

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

#### Steg 5: Installera Docker

```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

#### Steg 6: Lägg till din användare i docker-gruppen

```bash
sudo usermod -aG docker $USER
```

**Viktigt**: Logga ut och in igen för att gruppmedlemskapet ska aktiveras.

#### Steg 7: Verifiera installationen

```bash
docker --version
docker compose version
```

Du bör se något liknande:
```
Docker version 24.0.7, build afdd53b
Docker Compose version v2.23.0
```

#### Steg 8: Testa Docker

```bash
docker run hello-world
```

Om du ser "Hello from Docker!", är installationen lyckad!

### macOS

#### Alternativ 1: Docker Desktop (Rekommenderas)

1. Ladda ner Docker Desktop från: https://www.docker.com/products/docker-desktop
2. Öppna `.dmg`-filen och dra Docker till Applications
3. Starta Docker Desktop från Applications
4. Vänta tills Docker är igång (ikon i menyraden)

#### Alternativ 2: Homebrew

```bash
brew install --cask docker
```

#### Verifiera installation

```bash
docker --version
docker compose version
```

### Windows (WSL2)

#### Steg 1: Aktivera WSL2

Öppna PowerShell som administratör:

```powershell
wsl --install
```

Starta om datorn.

#### Steg 2: Installera Ubuntu från Microsoft Store

1. Öppna Microsoft Store
2. Sök efter "Ubuntu 22.04"
3. Klicka "Installera"
4. Starta Ubuntu och skapa ett användarkonto

#### Steg 3: Installera Docker Desktop

1. Ladda ner Docker Desktop från: https://www.docker.com/products/docker-desktop
2. Kör installationsprogrammet
3. Aktivera "Use WSL 2 instead of Hyper-V" under installationen
4. Starta Docker Desktop

#### Steg 4: Konfigurera WSL2-integration

1. Öppna Docker Desktop
2. Gå till Settings → Resources → WSL Integration
3. Aktivera integration för din Ubuntu-distribution
4. Klicka "Apply & Restart"

#### Verifiera installation

Öppna Ubuntu-terminalen:

```bash
docker --version
docker compose version
```

---

## Klona och konfigurera projektet

### Steg 1: Klona repositoryt

```bash
cd ~
git clone https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration.git
cd eneo-nextcloud-integration
```

### Steg 2: Granska projektstrukturen

```bash
ls -la
```

Du bör se:
```
.env.example
.gitignore
README.md
docker-compose.yml
docs/
eneo/
nextcloud/
scripts/
```

### Steg 3: Kör setup-skriptet

Setup-skriptet skapar `.env`-filen och genererar säkra lösenord:

```bash
chmod +x scripts/*.sh
./scripts/setup.sh
```

Skriptet kommer att:
- ✅ Kontrollera att Docker är installerat
- ✅ Skapa `.env`-fil från `.env.example`
- ✅ Generera säkra slumpmässiga lösenord
- ✅ Skapa nödvändiga kataloger
- ✅ Bygga Docker-images

**Output**:
```
=========================================
Eneo + Nextcloud Integration - Setup
=========================================

✅ Docker and Docker Compose are installed

📝 Creating .env file from .env.example...
✅ .env file created with random passwords

📦 Creating necessary directories...

🔧 Building Docker images...
[+] Building 45.2s (23/23) FINISHED
...

=========================================
✅ Setup completed successfully!
=========================================
```

### Steg 4: Anpassa konfiguration (valfritt)

Öppna `.env`-filen för att granska och anpassa inställningar:

```bash
nano .env
```

**Viktiga inställningar att kontrollera**:

```bash
# Ändra admin-lösenord för Nextcloud
NEXTCLOUD_ADMIN_PASSWORD=ditt_säkra_lösenord_här

# Om du kör på en server med domännamn
DOMAIN=eneo.sundsvall.se
PROTOCOL=https

# För produktion, aktivera HTTPS
TRAEFIK_DASHBOARD_ENABLED=false
```

Spara och stäng (Ctrl+X, Y, Enter).

---

## Första körningen

### Steg 1: Starta alla tjänster

```bash
./scripts/start.sh
```

**Output**:
```
=========================================
Starting Eneo + Nextcloud Integration
=========================================

🚀 Starting services with Docker Compose...
[+] Running 9/9
 ✔ Network eneo-network              Created
 ✔ Container traefik                 Started
 ✔ Container nextcloud-db            Started
 ✔ Container nextcloud-redis         Started
 ✔ Container eneo-db                 Started
 ✔ Container eneo-redis              Started
 ✔ Container nextcloud               Started
 ✔ Container eneo-backend            Started
 ✔ Container eneo-frontend           Started

⏳ Waiting for services to be ready...

=========================================
✅ Services started successfully!
=========================================

Access the services:
  Nextcloud: http://localhost
  Eneo: http://localhost/eneo
  Traefik Dashboard: http://localhost:8080
```

### Steg 2: Verifiera att alla containers körs

```bash
docker compose ps
```

**Förväntat resultat**:
```
NAME                IMAGE                        STATUS
traefik             traefik:v2.10               Up 2 minutes
nextcloud           nextcloud:27-apache         Up 2 minutes (healthy)
nextcloud-db        postgres:15-alpine          Up 2 minutes (healthy)
nextcloud-redis     redis:7-alpine              Up 2 minutes (healthy)
eneo-backend        eneo-backend:latest         Up 2 minutes (healthy)
eneo-frontend       eneo-frontend:latest        Up 2 minutes
eneo-db             pgvector/pgvector:pg15      Up 2 minutes (healthy)
eneo-redis          redis:7-alpine              Up 2 minutes (healthy)
```

Alla containers ska ha status "Up" och (healthy) där det är applicerbart.

### Steg 3: Kontrollera loggar

Om något inte fungerar, kontrollera loggarna:

```bash
# Visa alla loggar
docker compose logs

# Följ loggar i realtid
docker compose logs -f

# Visa loggar för en specifik tjänst
docker compose logs nextcloud
docker compose logs eneo-backend
```

### Steg 4: Öppna i webbläsare

Öppna din webbläsare och navigera till:

- **Nextcloud**: http://localhost
- **Eneo**: http://localhost/eneo
- **Traefik Dashboard**: http://localhost:8080

---

## Konfigurera Nextcloud

### Steg 1: Första inloggningen

1. Öppna http://localhost i din webbläsare
2. Du möts av Nextclouds installationssida
3. Logga in med:
   - **Användarnamn**: `admin`
   - **Lösenord**: Det du satte i `.env` (standard: `changeme_secure_password`)

### Steg 2: Slutför installationsguiden

Nextcloud kan visa en guide för nya användare. Gå igenom den eller klicka "Skip" för att hoppa över.

### Steg 3: Installera rekommenderade appar

1. Klicka på din profilbild → **Appar**
2. Installera följande appar (om de inte redan är installerade):
   - **OAuth 2.0** (krävs för Eneo-integration)
   - **Files** (förinstallerad)
   - **Text** (för dokumentredigering)
   - **Talk** (för chatt, valfritt)

### Steg 4: Konfigurera trusted domains

Om du får felmeddelandet "Access through untrusted domain", kör:

```bash
docker compose exec nextcloud php occ config:system:set trusted_domains 1 --value=localhost
```

För produktion med domännamn:

```bash
docker compose exec nextcloud php occ config:system:set trusted_domains 1 --value=eneo.sundsvall.se
```

### Steg 5: Skapa testfiler (valfritt)

För att testa Eneo-integrationen, skapa några testfiler i Nextcloud:

1. Gå till **Filer**
2. Skapa en ny mapp: "Dokument"
3. Ladda upp några PDF- eller Word-filer
4. Eller skapa nya textfiler med Nextcloud Text

---

## Konfigurera OAuth2

OAuth2 krävs för att Eneo ska kunna autentisera användare via Nextcloud.

### Steg 1: Aktivera OAuth2-appen

1. Logga in i Nextcloud som administratör
2. Klicka på din profilbild → **Appar**
3. Sök efter "OAuth 2.0"
4. Om appen inte är aktiverad, klicka **Aktivera**

### Steg 2: Registrera Eneo som OAuth2-klient

1. Klicka på din profilbild → **Inställningar**
2. I vänstermenyn, under **Administration**, klicka på **Säkerhet**
3. Scrolla ner till sektionen **OAuth 2.0**
4. Under "OAuth 2.0 clients", klicka på **Lägg till klient**

Fyll i:
- **Namn**: `Eneo`
- **Redirect URI**: `http://localhost/eneo/oauth/callback`

**För produktion med domännamn**:
- **Redirect URI**: `https://eneo.sundsvall.se/oauth/callback`

5. Klicka **Lägg till**

### Steg 3: Kopiera Client ID och Secret

Efter att ha lagt till klienten visas:
- **Client Identifier** (Client ID)
- **Secret**

**Viktigt**: Kopiera dessa värden omedelbart! Secret visas bara en gång.

Exempel:
```
Client Identifier: abc123def456ghi789jkl012
Secret: xyz789uvw456rst123abc456def789
```

### Steg 4: Uppdatera .env-filen

Öppna `.env`-filen:

```bash
nano .env
```

Hitta och uppdatera följande rader:

```bash
OAUTH2_CLIENT_ID=abc123def456ghi789jkl012
OAUTH2_CLIENT_SECRET=xyz789uvw456rst123abc456def789
```

**För produktion med domännamn**, uppdatera även URL:erna:

```bash
OAUTH2_AUTHORIZE_URL=https://eneo.sundsvall.se/index.php/apps/oauth2/authorize
OAUTH2_TOKEN_URL=https://eneo.sundsvall.se/index.php/apps/oauth2/api/v1/token
OAUTH2_USERINFO_URL=https://eneo.sundsvall.se/ocs/v2.php/cloud/user
OAUTH2_REDIRECT_URI=https://eneo.sundsvall.se/oauth/callback
```

Spara och stäng (Ctrl+X, Y, Enter).

### Steg 5: Starta om tjänsterna

För att ändringarna ska träda i kraft:

```bash
docker compose restart eneo-backend eneo-frontend
```

Eller starta om allt:

```bash
./scripts/stop.sh
./scripts/start.sh
```

---

## Testa integrationen

### Test 1: Grundläggande inloggning

1. Öppna http://localhost/eneo i din webbläsare
2. Klicka på **Logga in med Nextcloud**
3. Du bör omdirigeras till Nextclouds inloggningssida
4. Logga in med dina Nextcloud-credentials (admin / ditt lösenord)
5. På godkännandesidan, klicka **Godkänn**
6. Du bör omdirigeras tillbaka till Eneo och vara inloggad

**Förväntat resultat**: Du ser Eneo-gränssnittet med ditt användarnamn i headern.

### Test 2: Skicka ett meddelande

1. I Eneo-gränssnittet, skriv ett meddelande: "Hej! Vad kan du hjälpa mig med?"
2. Klicka **Skicka**
3. Du bör få ett svar från AI-assistenten

**Förväntat resultat**: Ett svar visas i chatten.

### Test 3: Verifiera API-åtkomst

Öppna en ny flik och testa API:et direkt:

```bash
curl http://localhost/eneo/api/health
```

**Förväntat resultat**:
```json
{
  "status": "healthy",
  "timestamp": "2024-10-25T12:00:00.000000",
  "version": "1.0.0",
  "environment": "development"
}
```

### Test 4: Lista dokument

```bash
curl http://localhost/eneo/api/documents
```

**Förväntat resultat**: En JSON-lista med dokument (kan vara tom om inga dokument indexerats än).

---

## Produktionsdistribution

För produktion behöver du konfigurera HTTPS, domännamn och säkerhetsinställningar.

### Steg 1: Skaffa ett domännamn

Registrera eller använd ett befintligt domännamn, t.ex.:
- `eneo.sundsvall.se`
- `nextcloud.sundsvall.se`

### Steg 2: Konfigurera DNS

Skapa A-records som pekar på din servers IP-adress:

```
eneo.sundsvall.se       A    203.0.113.10
nextcloud.sundsvall.se  A    203.0.113.10
```

Eller använd en subpath:
```
sundsvall.se            A    203.0.113.10
```

### Steg 3: Uppdatera .env för produktion

```bash
nano .env
```

Ändra:

```bash
DOMAIN=eneo.sundsvall.se
PROTOCOL=https
TRAEFIK_DASHBOARD_ENABLED=false
```

### Steg 4: Konfigurera Traefik för HTTPS

Skapa en ny fil `traefik.yml`:

```bash
nano traefik.yml
```

Innehåll:

```yaml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: it@sundsvall.se
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

### Steg 5: Uppdatera docker-compose.yml

Lägg till i `traefik`-sektionen:

```yaml
traefik:
  volumes:
    - ./traefik.yml:/etc/traefik/traefik.yml:ro
    - ./letsencrypt:/letsencrypt
  ports:
    - "443:443"
```

Lägg till labels för HTTPS på `nextcloud` och `eneo-frontend`:

```yaml
nextcloud:
  labels:
    - "traefik.http.routers.nextcloud.tls=true"
    - "traefik.http.routers.nextcloud.tls.certresolver=letsencrypt"
```

### Steg 6: Öppna portar i brandvägg

```bash
# Ubuntu/Debian med ufw
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL med firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Steg 7: Starta om med nya inställningar

```bash
./scripts/stop.sh
./scripts/start.sh
```

### Steg 8: Verifiera HTTPS

Öppna https://eneo.sundsvall.se i din webbläsare. Du bör se ett giltigt SSL-certifikat.

---

## Felsökning

### Problem: Containers startar inte

**Symptom**: `docker compose ps` visar "Exited" eller "Restarting"

**Lösning**:
```bash
# Visa felmeddelanden
docker compose logs <container-name>

# Exempel
docker compose logs nextcloud-db
```

Vanliga orsaker:
- Portar redan används
- Otillräckligt minne
- Felaktig konfiguration i `.env`

### Problem: "Access through untrusted domain"

**Symptom**: Nextcloud visar felmeddelande om untrusted domain

**Lösning**:
```bash
docker compose exec nextcloud php occ config:system:set trusted_domains 1 --value=<ditt-domännamn>
```

### Problem: OAuth2-fel "Invalid redirect URI"

**Symptom**: Efter inloggning visas "Invalid redirect URI"

**Lösning**:
1. Kontrollera att Redirect URI i Nextcloud är exakt: `http://localhost/eneo/oauth/callback`
2. Kontrollera att `OAUTH2_REDIRECT_URI` i `.env` matchar
3. Inga extra mellanslag eller tecken
4. Protokoll (http/https) måste matcha

### Problem: Eneo kan inte ansluta till Nextcloud

**Symptom**: Fel vid filåtkomst eller användarinfo

**Lösning**:
```bash
# Kontrollera att alla containers är på samma nätverk
docker network inspect eneo-nextcloud_eneo-network

# Testa anslutning från eneo-backend till nextcloud
docker compose exec eneo-backend ping nextcloud
```

### Problem: Databas-anslutningsfel

**Symptom**: "Connection refused" eller "Could not connect to database"

**Lösning**:
```bash
# Kontrollera att databas-containern körs
docker compose ps eneo-db nextcloud-db

# Kontrollera databaslösenord i .env
grep DB_PASSWORD .env

# Återskapa databas-containern
docker compose down
docker volume rm eneo-nextcloud_eneo-db-data
docker compose up -d
```

---

## Underhåll och backup

### Skapa backup

#### Backup av databaser

```bash
# Nextcloud-databas
docker compose exec nextcloud-db pg_dump -U nextcloud nextcloud > backup-nextcloud-$(date +%Y%m%d).sql

# Eneo-databas
docker compose exec eneo-db pg_dump -U eneo eneo > backup-eneo-$(date +%Y%m%d).sql
```

#### Backup av filer

```bash
# Nextcloud-filer
docker compose exec nextcloud tar czf /tmp/nextcloud-data.tar.gz /var/www/html/data
docker compose cp nextcloud:/tmp/nextcloud-data.tar.gz ./backup-nextcloud-data-$(date +%Y%m%d).tar.gz
```

#### Automatisk backup med cron

Skapa ett backup-skript:

```bash
nano /home/ubuntu/backup-eneo.sh
```

Innehåll:

```bash
#!/bin/bash
BACKUP_DIR="/backups/eneo"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

cd /home/ubuntu/eneo-nextcloud-integration

# Backup databaser
docker compose exec -T nextcloud-db pg_dump -U nextcloud nextcloud > $BACKUP_DIR/nextcloud-$DATE.sql
docker compose exec -T eneo-db pg_dump -U eneo eneo > $BACKUP_DIR/eneo-$DATE.sql

# Ta bort backups äldre än 30 dagar
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Gör skriptet körbart:

```bash
chmod +x /home/ubuntu/backup-eneo.sh
```

Lägg till i crontab (kör varje natt kl 02:00):

```bash
crontab -e
```

Lägg till:

```
0 2 * * * /home/ubuntu/backup-eneo.sh >> /var/log/eneo-backup.log 2>&1
```

### Återställa från backup

```bash
# Återställ Nextcloud-databas
cat backup-nextcloud-20240101.sql | docker compose exec -T nextcloud-db psql -U nextcloud nextcloud

# Återställ Eneo-databas
cat backup-eneo-20240101.sql | docker compose exec -T eneo-db psql -U eneo eneo
```

### Uppdatera tjänster

```bash
# Hämta senaste koden
git pull origin master

# Bygg om images
docker compose build

# Starta om tjänster
docker compose up -d
```

### Övervaka resurser

```bash
# Visa resursanvändning
docker stats

# Visa diskutrymme
docker system df

# Rensa oanvända images och containers
docker system prune -a
```

---

## Sammanfattning

Du har nu:
- ✅ Installerat Docker och Docker Compose
- ✅ Klonat och konfigurerat projektet
- ✅ Startat alla tjänster
- ✅ Konfigurerat Nextcloud
- ✅ Satt upp OAuth2-integration
- ✅ Testat att allt fungerar
- ✅ Lärt dig felsöka vanliga problem
- ✅ Konfigurerat backup och underhåll

Eneo och Nextcloud körs nu som fristående men integrerade tjänster!

## Nästa steg

- Utforska [Architecture Documentation](architecture.md) för att förstå systemet djupare
- Läs [OAuth Setup Guide](oauth-setup.md) för avancerad OAuth-konfiguration
- Implementera filindexering och semantisk sökning
- Konfigurera AI-modeller för faktisk textgenerering
- Utveckla Smart Picker-integration

## Support

För hjälp:
- GitHub Issues: https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration/issues
- Dokumentation: `/docs` i repositoryt
- Nextcloud Community: https://help.nextcloud.com

