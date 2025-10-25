# Arkitekturdokumentation

Detta dokument beskriver den tekniska arkitekturen för Eneo + Nextcloud-integrationen.

## Översikt

Projektet implementerar **"Eneo som fristående webbtjänst i samma miljö"** enligt Sundsvalls kommuns kravspecifikation. Båda tjänsterna körs som separata applikationer men delar samma infrastruktur och integreras via OAuth2 SSO och API-anrop.

## Systemarkitektur

### Högnivådiagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet/Användare                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │     Traefik    │
                    │ Reverse Proxy  │
                    └────────┬───────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
        ┌────────────────┐      ┌────────────────┐
        │   Nextcloud    │◄────►│      Eneo      │
        │   (PHP/Hub)    │OAuth2│  (SvelteKit +  │
        │                │ SSO  │    FastAPI)    │
        └────────┬───────┘      └────────┬───────┘
                 │                       │
                 │                       │
        ┌────────┴───────┐      ┌───────┴────────┐
        │                │      │                 │
        ▼                ▼      ▼                 ▼
   ┌─────────┐    ┌─────────┐ ┌──────────┐  ┌────────┐
   │PostgreSQL│    │  Redis  │ │PostgreSQL│  │ Redis  │
   │(Nextcloud)│    │(Cache)  │ │+pgvector │  │(Queue) │
   └──────────┘    └─────────┘ └──────────┘  └────────┘
```

## Komponentbeskrivning

### 1. Traefik (Reverse Proxy)

**Syfte**: Routing av HTTP-trafik till rätt tjänst baserat på URL-path.

**Funktioner**:
- Routar `/` till Nextcloud
- Routar `/eneo/` till Eneo frontend
- Routar `/eneo/api/` till Eneo backend
- Load balancing (vid skalning)
- SSL/TLS-terminering (i produktion)

**Konfiguration**:
```yaml
# docker-compose.yml
traefik:
  command:
    - "--providers.docker=true"
    - "--entrypoints.web.address=:80"
  ports:
    - "80:80"
    - "8080:8080"  # Dashboard
```

**Routing-regler**:
- Nextcloud: `Host(localhost) && PathPrefix(/)`
- Eneo Frontend: `Host(localhost) && PathPrefix(/eneo)`
- Eneo Backend: `Host(localhost) && PathPrefix(/eneo/api)`

### 2. Nextcloud

**Syfte**: Samarbetsplattform och Identity Provider.

**Komponenter**:
- **Nextcloud Core**: PHP-baserad webbapplikation
- **PostgreSQL**: Relationsdatabas för metadata
- **Redis**: Cache och session storage

**Funktioner**:
- Filhantering och delning
- OAuth2 Identity Provider
- WebDAV API för filåtkomst
- Användarhantering
- Grupper och behörigheter

**Exponerade API:er**:
- OAuth2: `/index.php/apps/oauth2/`
- WebDAV: `/remote.php/webdav/`
- OCS: `/ocs/v2.php/`

### 3. Eneo Backend (FastAPI)

**Syfte**: AI-funktionalitet och business logic.

**Teknisk stack**:
- **Framework**: FastAPI (Python 3.11)
- **Server**: Uvicorn med async workers
- **Databas**: PostgreSQL 15 med pgvector
- **Cache/Queue**: Redis 7

**Moduler**:

#### 3.1 API-endpoints

```
/health/              - Health checks
/auth/                - OAuth2 authentication
  /login              - Initiate OAuth flow
  /callback           - OAuth callback
  /logout             - Logout
  /me                 - Current user info
/chat/                - Chat with AI
  /                   - Send message
  /conversations      - List conversations
  /conversations/{id} - Get conversation
/documents/           - Document management
  /                   - List documents
  /index              - Index document
  /search             - Semantic search
  /nextcloud/files    - List Nextcloud files
```

#### 3.2 Services

- **AuthService**: OAuth2-hantering, session management
- **DocumentService**: Filhämtning från Nextcloud, textextraktion
- **EmbeddingService**: Generera vektorrepresentationer av text
- **SearchService**: Semantisk sökning i dokument
- **ChatService**: AI-konversationer, kontexthantering

#### 3.3 Database Schema

```sql
-- Användare
users (id, nextcloud_user_id, email, display_name)

-- Dokument
documents (id, user_id, nextcloud_file_id, title, content)

-- Vektorembeddings
embeddings (id, document_id, chunk_text, embedding[384])

-- Konversationer
conversations (id, user_id, title)
messages (id, conversation_id, role, content)

-- Sessions
sessions (id, user_id, access_token, refresh_token)

-- Behörigheter
file_permissions (id, user_id, nextcloud_file_path, permission_type)
```

### 4. Eneo Frontend (SvelteKit)

**Syfte**: Användargränssnitt för Eneo.

**Teknisk stack**:
- **Framework**: SvelteKit (TypeScript)
- **Build tool**: Vite
- **Runtime**: Node.js 20

**Komponenter**:
- **Chat Interface**: Konversationsvy med AI
- **File Browser**: Bläddra och välja filer från Nextcloud
- **Document Viewer**: Visa indexerade dokument
- **Settings**: Användarprofil och inställningar

**State Management**:
- Svelte stores för lokal state
- Fetch API för backend-kommunikation
- Session cookies för autentisering

## Dataflöden

### 1. Inloggningsflöde (OAuth2)

```
1. Användare → Eneo Frontend: Klickar "Logga in"
2. Eneo Frontend → Eneo Backend: GET /auth/login
3. Eneo Backend → Användare: Redirect till Nextcloud OAuth2
4. Användare → Nextcloud: Loggar in och godkänner
5. Nextcloud → Eneo Backend: Redirect med authorization code
6. Eneo Backend → Nextcloud: POST /oauth2/api/v1/token (byt code mot token)
7. Nextcloud → Eneo Backend: Returnerar access_token
8. Eneo Backend → Nextcloud: GET /ocs/v2.php/cloud/user (hämta userinfo)
9. Nextcloud → Eneo Backend: Returnerar användardata
10. Eneo Backend → Database: Skapa/uppdatera user, skapa session
11. Eneo Backend → Användare: Set session cookie, redirect till /eneo/
12. Användare → Eneo Frontend: Visar inloggad vy
```

### 2. Dokumentindexering

```
1. Användare → Eneo Frontend: Väljer fil att indexera
2. Eneo Frontend → Eneo Backend: POST /documents/index {file_path}
3. Eneo Backend → Database: Hämta user session → access_token
4. Eneo Backend → Nextcloud WebDAV: GET /remote.php/webdav/{file_path}
   Headers: Authorization: Bearer {access_token}
5. Nextcloud → Eneo Backend: Returnerar filinnehåll
6. Eneo Backend: Extrahera text från fil (PDF, DOCX, etc.)
7. Eneo Backend: Dela upp text i chunks (~500 tokens)
8. Eneo Backend: Generera embeddings för varje chunk (via sentence-transformers)
9. Eneo Backend → Database: Spara document och embeddings
10. Eneo Backend → Användare: Returnerar success
```

### 3. AI-konversation med kontext

```
1. Användare → Eneo Frontend: Skriver meddelande
2. Eneo Frontend → Eneo Backend: POST /chat/ {message, context_files}
3. Eneo Backend → Database: Hämta conversation history
4. Eneo Backend → Database: Semantisk sökning i embeddings
   SELECT * FROM embeddings 
   ORDER BY embedding <=> query_embedding 
   LIMIT 5
5. Eneo Backend: Bygg prompt med:
   - System prompt
   - Relevant kontext från dokument
   - Conversation history
   - User message
6. Eneo Backend → AI Model: Generera svar
7. AI Model → Eneo Backend: Returnerar svar
8. Eneo Backend → Database: Spara user message och AI response
9. Eneo Backend → Användare: Returnerar svar med källor
```

## Säkerhet

### Autentisering och Auktorisering

**OAuth2 Flow**:
- Nextcloud är Identity Provider
- Eneo är OAuth2-klient
- Access tokens används för API-anrop
- Session cookies för frontend-state

**Token Management**:
- Access tokens lagras krypterade i database
- Tokens har begränsad livslängd (1 timme)
- Refresh tokens för att förnya access
- Tokens raderas vid utloggning

**API-säkerhet**:
- Alla endpoints kräver autentisering (utom /health)
- Session cookies är HttpOnly, Secure, SameSite
- CORS konfigurerat för att endast tillåta kända origins
- Rate limiting på API-endpoints

### Datasäkerhet

**Lokal drift**:
- All data stannar inom kommunens infrastruktur
- Inga externa AI-tjänster används
- Lokala AI-modeller för känslig data

**Databaskryptering**:
- PostgreSQL med TLS för connections
- Känslig data krypterad at-rest
- Regelbundna backups

**Filåtkomst**:
- Användare kan endast komma åt sina egna filer
- OAuth-token respekterar Nextcloud-behörigheter
- Opt-in för filindexering (ingen automatisk indexering)

### Nätverkssäkerhet

**Docker-nätverk**:
- Alla tjänster på isolerat Docker-nätverk
- Endast Traefik exponerar portar externt
- Intern kommunikation över Docker DNS

**Produktion**:
- HTTPS med TLS 1.3
- Let's Encrypt-certifikat via Traefik
- HSTS headers
- CSP headers

## Skalbarhet

### Horisontell skalning

**Eneo Backend**:
```yaml
# docker-compose.yml
eneo-backend:
  deploy:
    replicas: 4
```

Traefik load-balancerar automatiskt mellan replicas.

**Eneo Frontend**:
```yaml
eneo-frontend:
  deploy:
    replicas: 2
```

Stateless design gör skalning enkel.

### Vertikal skalning

**Databas**:
- PostgreSQL med connection pooling
- pgvector index för snabb vektorsökning
- Read replicas för läsintensiva operationer

**Redis**:
- Redis Cluster för högre throughput
- Separata Redis-instanser för cache och queue

**AI-modeller**:
- GPU-acceleration för snabbare inferens
- Model serving med TorchServe eller vLLM
- Batch processing för embeddings

### Prestandaoptimering

**Caching**:
- Redis för API-responses
- Browser cache för statiska assets
- Embeddings cachas i minnet

**Database**:
- Index på ofta sökta kolumner
- Materialized views för komplexa queries
- Partitionering av stora tabeller

**AI-inferens**:
- Batch processing av embeddings
- Model quantization (int8) för snabbare inferens
- Async processing med ARQ/Redis queue

## Monitoring och Logging

### Logging

**Centraliserad logging**:
```python
# Structured logging med loguru
logger.info("User logged in", user_id=user.id, ip=request.client.host)
```

**Log aggregation**:
- Alla logs till stdout/stderr
- Docker logs till centralt system (ELK, Loki)
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL

### Metrics

**Application metrics**:
- Request latency
- Error rates
- Active users
- API call counts

**Infrastructure metrics**:
- CPU/Memory usage
- Database connections
- Redis queue length
- Disk usage

**Business metrics**:
- Documents indexed
- Chat messages sent
- Average response time
- User engagement

### Health Checks

```python
# Kubernetes-style health checks
/health/live    # Liveness probe
/health/ready   # Readiness probe
/health/detailed # Full system status
```

## Deployment

### Development

```bash
docker compose up -d
```

### Production (Kubernetes)

```yaml
# k8s/eneo-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eneo-backend
spec:
  replicas: 4
  selector:
    matchLabels:
      app: eneo-backend
  template:
    spec:
      containers:
      - name: backend
        image: eneo-backend:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

## Framtida utökningar

### Fas 2: Smart Picker Integration

Utveckla Nextcloud-app som integrerar Eneo i Nextclouds UI:
- Text generation i Nextcloud Text
- AI-assistent i Nextcloud Talk
- Document summarization i Files

### Fas 3: Collaborative Spaces

Team-baserade AI-assistenter:
- Delade kunskapsbaser
- Team-specifika modeller
- Rollbaserad åtkomst

### Fas 4: Advanced AI Features

- Multimodal AI (text + bilder)
- Speech-to-text integration
- Real-time collaboration
- Fine-tuned models på kommundata

## Tekniska beslut och motiveringar

### Varför FastAPI?

- Modern, async Python framework
- Automatisk API-dokumentation (OpenAPI)
- Type hints och validation med Pydantic
- Hög prestanda (jämförbar med Node.js)
- Stort ekosystem för AI/ML

### Varför SvelteKit?

- Mindre bundle size än React/Vue
- Enklare syntax, mindre boilerplate
- Server-side rendering built-in
- Excellent developer experience

### Varför PostgreSQL + pgvector?

- Relationsdatabas + vektorsökning i samma system
- Enklare arkitektur än separata vector databases
- ACID-garantier för transaktioner
- Mogen och vältestad teknologi

### Varför Docker Compose?

- Enkel lokal utveckling
- Reproducerbar miljö
- Lätt att migrera till Kubernetes senare
- Standard i branschen

## Resurser och referenser

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Nextcloud Developer Documentation](https://docs.nextcloud.com/server/latest/developer_manual/)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

