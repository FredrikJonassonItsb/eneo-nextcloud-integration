# Eneo + Nextcloud Integration

Detta projekt implementerar en integration mellan **Eneo** (Sundsvalls kommuns öppna AI-plattform) och **Nextcloud Hub** enligt arkitekturen "Eneo som fristående webbtjänst i samma miljö".

## Översikt

Projektet sätter upp två fristående men integrerade tjänster:

1. **Eneo** - En AI-plattform med frontend (SvelteKit), backend (FastAPI), PostgreSQL-databas med pgvector, och Redis för caching
2. **Nextcloud** - En samarbetsplattform för filhantering och kommunikation

Båda tjänsterna körs i samma Docker Compose-miljö och integreras via:
- **Single Sign-On (SSO)** med OAuth2
- **API-integration** för filåtkomst och datainhämtning
- **Gemensam nätverksmiljö** för säker kommunikation

## Arkitektur

```
┌─────────────────────────────────────────────────────────┐
│                    Traefik (Reverse Proxy)              │
│  https://localhost/          https://localhost/eneo/    │
└────────────┬────────────────────────────┬───────────────┘
             │                            │
             ▼                            ▼
    ┌────────────────┐          ┌─────────────────┐
    │   Nextcloud    │◄────────►│      Eneo       │
    │   (PHP/Hub)    │  OAuth2  │  (SvelteKit +   │
    │                │   SSO    │    FastAPI)     │
    └────────┬───────┘          └────────┬────────┘
             │                           │
             ▼                           ▼
    ┌────────────────┐          ┌─────────────────┐
    │  PostgreSQL    │          │  PostgreSQL +   │
    │  (Nextcloud)   │          │    pgvector     │
    └────────────────┘          └─────────────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │      Redis      │
                                │   (Cache/Queue) │
                                └─────────────────┘
```

## Projektstruktur

```
eneo-nextcloud-integration/
├── README.md                 # Denna fil
├── docker-compose.yml        # Huvudkonfiguration för alla tjänster
├── .env.example             # Exempel på miljövariabler
├── eneo/                    # Eneo-specifika filer
│   ├── Dockerfile           # Eneo frontend + backend
│   ├── backend/             # FastAPI backend
│   ├── frontend/            # SvelteKit frontend
│   └── config/              # Konfigurationsfiler
├── nextcloud/               # Nextcloud-specifika filer
│   ├── config/              # Nextcloud-konfiguration
│   └── apps/                # Custom Nextcloud-appar
├── docs/                    # Dokumentation
│   ├── installation.md      # Installationsguide
│   ├── oauth-setup.md       # OAuth2-konfiguration
│   └── architecture.md      # Detaljerad arkitektur
└── scripts/                 # Hjälpskript
    ├── setup.sh             # Initial setup
    ├── start.sh             # Starta tjänsterna
    └── stop.sh              # Stoppa tjänsterna
```

## Snabbstart

### Förutsättningar

- Docker och Docker Compose installerat
- Minst 8 GB RAM tillgängligt
- Portar 80, 443, 5432, 6379 tillgängliga

### Installation

1. Klona repositoryt:
```bash
git clone https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration.git
cd eneo-nextcloud-integration
```

2. Kopiera och konfigurera miljövariabler:
```bash
cp .env.example .env
# Redigera .env med dina inställningar
```

3. Kör setup-skriptet:
```bash
./scripts/setup.sh
```

4. Starta tjänsterna:
```bash
./scripts/start.sh
```

5. Öppna i webbläsare:
- Nextcloud: http://localhost
- Eneo: http://localhost/eneo

## Konfiguration

### OAuth2 Setup

För att aktivera Single Sign-On mellan Nextcloud och Eneo:

1. Logga in i Nextcloud som administratör
2. Gå till **Inställningar → Säkerhet → OAuth 2.0**
3. Lägg till ny OAuth2-klient:
   - **Namn**: Eneo
   - **Redirect URI**: `http://localhost/eneo/oauth/callback`
4. Kopiera Client ID och Client Secret till `.env`-filen

Se [docs/oauth-setup.md](docs/oauth-setup.md) för detaljerad guide.

### Filåtkomst

Eneo använder Nextclouds WebDAV API för att komma åt användarfiler. Konfiguration:

1. I Eneo-backend, konfigurera Nextcloud WebDAV-endpoint
2. Använd OAuth2 access token som Bearer token för autentisering
3. Användare kan välja vilka filer/mappar Eneo ska ha åtkomst till

## Utveckling

### Eneo Backend (FastAPI)

```bash
cd eneo/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Eneo Frontend (SvelteKit)

```bash
cd eneo/frontend
npm install
npm run dev
```

### Nextcloud

Nextcloud körs i Docker-container. För att utveckla custom apps:

```bash
cd nextcloud/apps
# Skapa ny app enligt Nextcloud developer docs
```

## Säkerhet och GDPR

Detta projekt är designat för att uppfylla kommunala krav på:

- **Datasekretess**: All data stannar inom kommunens egen infrastruktur
- **Offentlighetsprincipen**: Känsliga dokument får inte spridas obehörigt
- **GDPR-compliance**: Användare har full kontroll över sina data
- **Open Source**: Både Eneo och Nextcloud är AGPL-licensierade

Se [docs/security.md](docs/security.md) för mer information.

## Teknisk Stack

### Eneo
- **Frontend**: SvelteKit, TypeScript
- **Backend**: Python 3.11, FastAPI
- **Databas**: PostgreSQL 15 med pgvector
- **Cache**: Redis 7
- **AI-modeller**: Lokala modeller (LLaMA, GPT4All, eller liknande)

### Nextcloud
- **Version**: Nextcloud Hub 27+
- **Runtime**: PHP 8.2
- **Databas**: PostgreSQL 15
- **Cache**: Redis 7

### Infrastruktur
- **Containerisering**: Docker, Docker Compose
- **Reverse Proxy**: Traefik 2.x
- **Orkestrering**: Docker Compose (kan migreras till Kubernetes)

## Bidra

Detta är ett öppet projekt för Sundsvalls kommun. Bidrag välkomnas!

1. Forka repositoryt
2. Skapa en feature branch (`git checkout -b feature/amazing-feature`)
3. Committa dina ändringar (`git commit -m 'Add amazing feature'`)
4. Pusha till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## Licens

Detta projekt är licensierat under AGPL-3.0 för att vara kompatibelt med både Eneo och Nextcloud.

## Support

För frågor och support:
- Skapa ett issue i GitHub
- Kontakta IT-avdelningen på Sundsvalls kommun
- Se dokumentationen i [docs/](docs/)

## Roadmap

### Fas 1: Grundläggande integration (Nuvarande)
- [x] Projektstruktur
- [ ] Docker Compose setup
- [ ] Grundläggande Eneo-implementation
- [ ] Nextcloud-installation
- [ ] OAuth2 SSO

### Fas 2: Filintegration
- [ ] WebDAV API-integration
- [ ] Filväljare i Eneo UI
- [ ] Semantisk indexering av filer
- [ ] Sökfunktionalitet

### Fas 3: Smart Picker
- [ ] Nextcloud Smart Picker-app
- [ ] Integration i Nextcloud Text
- [ ] Integration i Nextcloud Talk
- [ ] Integration i Nextcloud Mail

### Fas 4: Avancerade funktioner
- [ ] Bildgenerering
- [ ] Ljudtranskribering
- [ ] Collaborative Spaces
- [ ] Multi-tenant support

## Författare

- Sundsvalls kommun IT-avdelning
- Utvecklat med stöd av Ånge kommun

## Erkännanden

- Eneo-projektet av Sundsvalls och Ånge kommuner
- Nextcloud GmbH för Nextcloud Hub
- Open source-communityn för alla fantastiska verktyg

