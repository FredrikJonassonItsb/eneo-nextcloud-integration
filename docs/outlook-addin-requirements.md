# Kravspecifikation: Outlook-tillägg för Nextcloud Talk

Detta dokument sammanfattar kraven för utveckling av ett Microsoft Outlook-tillägg som integrerar Nextcloud Talk och kalender med Outlook.

## Översikt

Tillägget ska göra det möjligt att boka videomöten i Nextcloud Talk direkt från Outlook, med automatisk synkronisering till Nextcloud Kalender. Detta ersätter behovet av Teams eller Zoom för videomöten inom organisationen.

## Funktionella krav

### 1. Skapa Nextcloud Talk-möte i Outlook

**Krav**: Användaren ska kunna skapa ett Nextcloud Talk-möte med en enkel funktion (knapp/alternativ) i Outlook.

**Beskrivning**: När användaren skapar eller redigerar ett kalendermöte i Outlook ska det finnas en knapp eller toggle "Lägg till Nextcloud Talk-möte" som genererar ett Talk-rum och infogar möteslänken.

**Implementering**:
- Knapp i Outlook ribbon eller mötesalternativ
- Generera unikt Talk-rum via Nextcloud API
- Infoga möteslänk i kalenderbeskrivning

### 2. Automatisk infogning av mötesinformation

**Krav**: Efter att Talk-rummet skapats ska tillägget automatiskt infoga relevant mötesinformation i kalenderinbjudan.

**Detaljer**:
- URL till Nextcloud Talk-mötet
- Kort instruktion för hur mottagare ansluter
- "Plats"-fältet kan sättas till "Nextcloud Talk (online)"
- All information ska vara lättillgänglig utan manuell kopiering

### 3. Skapa händelse i Nextcloud Kalender

**Krav**: När ett Nextcloud Talk-möte bokas via tillägget ska en motsvarande kalenderhändelse skapas i användarens Nextcloud-kalender.

**Detaljer**:
- Synkronisera mötets titel, start-/sluttid och deltagare
- Videomötet ska vara synligt i Nextcloud kalendervy
- Endast nödvändigt när ett Nextcloud Talk-möte skapas
- Vanliga Outlook-möten utan Talk-integration behöver inte synkroniseras

### 4. Automatisk borttagning av Teams-länkar

**Krav**: Om Outlook automatiskt har lagt till en Teams-möteslänk ska tillägget upptäcka och ta bort/inaktivera denna när Nextcloud Talk-mötet bokas.

**Detaljer**:
- Identifiera och ta bort "Join Teams"-länkar, Teams-konferens-ID etc.
- Endast Nextcloud Talk-länken ska kvarstå
- Kan kontrolleras via standardinställning i Teams

### 5. Inloggning och autentisering

**Krav**: Tillägget ska autentisera användaren mot Nextcloud-servern med moderna autentiseringsmetoder.

**Detaljer**:
- Stödja OpenID Connect (OIDC) eller OAuth2
- Användaren ska kunna logga in via organisationens SSO-lösning eller Nextclouds inloggningsflöde
- Vid första användning: säker inloggningsruta där användaren anger Nextcloud-uppgifter eller genomför OIDC-baserad SSO
- Hantera OAuth2/OIDC-token och lagra autentiseringstoken säkert (ingen lösenordslagring i klartext)
- Sessionen ska kunna återanvändas för framtida mötsbokningar utan att behöva logga in varje gång

### 6. Konfiguration av Nextcloud-server

**Krav**: Tillägget ska ha en inställning där användaren kan ange vilken Nextcloud-server det ska kopplas mot.

**Detaljer**:
- Standard: förinställd URL (t.ex. en demomiljö)
- Administratören eller användaren ska kunna ändra till organisationens faktiska Nextcloud-server-URL
- Kan exponeras via inställningssida i tillägget eller sättas av administratörer i manifestet
- Validera den angivna URL:en (kontrollera att det är en giltig Nextcloud Talk-server med tillhörande API)

### 7. Plattformsoberoende funktionalitet

**Krav**: Lösningen ska fungera i Outlook på Windows, Outlook på Mac **samt** Outlook Web.

**Detaljer**:
- Utgå från senaste Outlook-versionerna (Office-webbtilläggsmodellen, JavaScript-baserad)
- Stöds i alla dessa miljöer
- Användarupplevelsen och funktionerna ska vara likvärdiga oavsett plattform

### 8. UI-integrering i Outlook

**Krav**: Tillägget ska integreras tydligt i Outlook-gränssnittet.

**Detaljer**:
- Knapp eller toggle "Boka Nextcloud Talk-möte" i kalenderns mötesredigeringsfönster (ribbon) eller mötesalternativen
- Ikonen och texten ska signalera Nextcloud Talk-funktionen
- När knappen klickas: antingen mötet direkt omvandlas till ett Talk-möte (om användaren redan är inloggad), eller visas sidopanel/dialog från tillägget med status
- Om användaren inte är inloggad: initiera inloggningsflödet och sedan fortsätta med skapandet av mötet

### 9. Mötesinställningar (vid behov)

**Krav**: Som utgångspunkt räcker standardbeteendet att skapa ett Talk-rum och generera en länk.

**Valfria inställningar** (kan erbjudas):
- Möjligheten att sätta ett lösenord på Talk-rummet
- Namnge mötet eller ange om gäster (användare utan konto) får delta
- Exponeras i en liten dialog när man skapar mötet
- Standard: mötet skapas med förinställda parametrar (öppet för gäster via länken, inget särskilt lösenord om inte Nextcloud kräver det)

### 10. Automatisk namnsättning av Talk-rum

**Krav**: Tillägget bör namnge det skapade Talk-rummet på ett meningsfullt sätt.

**Detaljer**:
- Baserat på Outlook-mötets ämnesrad
- Om ämnet på kalenderinbjudan är "Projekt X statusmöte" kan Talk-rummet döpas till samma sak
- Användarna känner igen mötet inne i Nextcloud Talk
- Görs genom att skicka `roomName` i API-anropet till Nextcloud Talk

### 11. Hantering av deltagare (avancerat, valfritt)

**Krav**: I den bästa lösningen kan tillägget även hantera mötesdeltagarna i Nextcloud.

**Detaljer**:
- Om personer bjudits in i Outlook-mötet och har konto på Nextcloud-servern: automatiskt lägga till dessa användare som deltagare i Talk-rummet (via Nextclouds API)
- Avancerad funktion och förutsätter att Outlook-kontakternas e-postadresser kan matchas mot Nextcloud-användare
- Standard: generera en offentlig möteslänk som alla inbjudna kan klicka på för att ansluta (gäster kan ansluta via webblänk, utan krav på konto)

### 12. Deltagarspecifika säkerhetsinställningar

**Krav**: Tillägget ska vid skapandet av ett Talk-möte ge möjlighet att för varje inbjuden deltagare ange särskild autentisering och/eller säkrare utsick krävas.

**Autentiseringsnivåer per deltagare**:
- **Ingen**: Ingen extra autentisering utöver möteslänken
- **SMS**: Deltagaren ska verifiera sig via en SMS-kod
- **LOA-3**: Högsta autentiseringsnivå (t.ex. BankID eller motsvarande e-legitimation med LoA3)

**Säkert e-postutskick**:
- Kryssruta "Skicka som säker e-post" som anger om inbjudan till deltagaren ska skickas via en säker, krypterad e-postkanal
- Standardläge är vanligt e-postutskick (avmarkerad)

**Personnummer**:
- Textfält för personnummer (deltagarens svenska personnummer) som endast är aktivt om LOA-3 har valts som autentiseringsnivå **eller** om "Skicka som säker e-post" är ikryssad
- Gör det möjligt att ange deltagarens personnummer för användning vid t.ex. BankID-verifiering eller identifiering i samband med säker e-post
- Om fältet är inaktivt (gråt) behöver ingen personnummer anges för den deltagaren

**SMS-nummer**:
- Fält för att ange mobiltelefonnummer (för SMS) som endast visas eller är aktivt om SMS valts som autentiseringsmetod **eller** om deltagarens notifiering ska ske via SMS
- Mötesorganisatören kan fylla i deltagarens telefonnummer som ska användas för SMS-verifiering eller SMS-avisering

**Notifieringsval**:
- Val för hur varje deltagare ska notifieras om mötet: antingen **E-post** eller **E-post + SMS**
- Standard för varje deltagare kan vara enbart e-post, men organisatören kan välja att även skicka ut en SMS-påminnelse/inbjudan
- Om "E-post + SMS" väljs bör fältet för SMS-nummer aktiveras (om det inte redan är ifyllt) eftersom ett telefonnummer då krävs för att skicka SMS-notifiering

**Gränssnitt**:
- Inställningarna ska utformas på ett tydligt och användarvänligt sätt, med dynamisk aktivering/inaktivering av fält beroende på val
- Till exempel ska personnummer-fältet endast gå att fylla i när LOA-3 är vald som autentisering eller när "säker e-post" har valts
- SMS-nummer-fältet endast går att fylla i när SMS är valt som autentiseringsnivå eller när "E-post + SMS" valts som notifieringsalternativ för deltagaren

**Förslag på presentation**:
- Presentera inställningarna i en tabell eller lista där varje rad motsvarar en inbjuden deltagare med tillhörande fält
- Eller i ett dialogfönster där man först väljer en deltagare och anger inställningarna
- Standardvärden bör vara: **Ingen** extra autentisering, **säker e-post av** samt notifiering **endast E-post**

**Minimal friktion**:
- Om organisatören inte behöver några särskilda inställningar så kan mötet skapas utan extra åtgärder (minimal friktion)
- Möjligheten finns att konfigurera ökad säkerhet per person vid behov

### 13. Ingen lagring av känsliga deltagarinställningar i Outlook

**Krav**: De deltagarspecifika säkerhetsinställningarna ska **inte** sparas permanent i Outlooks kalenderhändelse eller synas för mötesdeltagare i den vanliga inbjudan.

**Detaljer**:
- Uppgifter används endast av tillägget för att vid mötesskapandet kontakta Nextclouds API och skapa händelsen i Nextcloud med motsvarande metadata
- All sådan information ska lagras i Nextclouds system och **inte** i Outlook
- Säkerställer att känsliga personuppgifter (som personnummer och telefonnummer) inte sprids via Exchange/Outlook
- Endast finns i Nextclouds miljö som organisationen kontrollerar
- Outlook-inbjudan som skickas ut ska alltså inte innehålla dessa extra säkerhetsuppgifter
- För deltagare som kräver särskild autentisering eller säker utsick får detaljer hanteras via Nextcloud (t.ex. att Nextcloud eller en kopplad tjänst skickar ut separat säker information eller att deltagaren behöver verifiera sig vid mötesstillfället)

### 14. Språkstöd

**Krav**: Tillägget ska vara användarvänligt för olika språk. Minst svenska och engelska bör stödjas i gränssnitt och meddelanden.

**Detaljer**:
- Knapptexter och instruktioner visas på användarens språk (baserat på Outlooks språk)
- Kan uppnås genom lokalisering av UI-strängar

## Icke-funktionella krav

### 1. Kompatibilitet och förutsättningar

**Krav**: Tillägget förutsätter en modern Outlook-miljö kopplad till Microsoft 365/Exchange.

**Detaljer**:
- Outlook-klienten måste vara ansluten till Exchange Online / Microsoft 365 eller Outlook.com för att webbtillägg ska fungera fullt ut
- En fristående Outlook med endast IMAP/POP3 ger begränsat stöd för kalender-tillägg enligt Microsofts nuvarande begränsningar
- På Nextcloud-sidan krävs att Nextcloud Hub med Nextcloud Talk **och Nextcloud Kalender** är installerat och aktiverat på servern
- Utgå från en Nextcloud-version som stöder Talk-API:er för att skapa rum (t.ex. Nextcloud Talk 12 eller senare)
- Kalendern har API-stöd/CalDAV aktivt för att skapa händelser
- Eftersom vi har kontroll över Nextcloud-installationen kan vi också säkerställa att nödvändiga Nextcloud-appar och insticksprogram är installerade för att tillägget ska fungera

### 2. Prestanda

**Krav**: Skapandet av ett Talk-möte (och tillhörande kalenderhändelse) ska ske snabbt och inte märkbart försena processen att boka mötet.

**Detaljer**:
- Idealt är att det på ett par sekunder genereras en Talk-länk och en bekräftelse efter att användaren klickat på knappen
- Tillägget bör använda asynkrona API-anrop effektivt och ge användarfeedback (t.ex. en loader eller statusmeddelande) under tiden

### 3. Tillförlitlighet och felhantering

**Krav**: Tillägget ska hantera fel på ett tydligt sätt.

**Detaljer**:
- Om Nextcloud-servern inte kan nås, om inloggning misslyckas eller om något steg i mötesskapandet går fel, måste användaren informeras via ett begripligt felmeddelande (gärna på sitt språk) istället för att inget händer
- Exempel: "Kunde inte skapa Talk-möte – kontrollera anslutningen eller dina inloggningsuppgifter"
- Inga kraschade skript eller oklarheter får uppstå
- Loggning av fel (t.ex. i webbläsar-konsolen eller via en diagnostikfunktion) kan implementeras för att underlätta support och felsökning

### 4. Säkerhet och integritet

**Krav**: All kommunikation mellan tillägget och Nextcloud-servern ska ske över HTTPS (krypterat).

**Detaljer**:
- Inga känsliga data (som access tokens eller möteslänkar) ska lagras oskyddat
- Tillägget ska följa säker kodningspraxis för Office-tillägg
- Vid användning av OIDC för inloggning ska tillägget hantera användarens lösenord av den betrodda identitetsleverantören (t.ex. Azure AD eller Nextclouds inloggningssida), inte av tillägget självt
- Nextcloud Talk-länkar som genereras innehåller slumpmässiga tokens och är svåra att gissa
- Endast inbjudna med länken kan ansluta till mötet (om inte mötet skyddas ytterligare med lösenord)
- Ingen mötesinformation eller fil delas med Microsofts servrar (förutom själva kalenderinbjudan som går via Exchange i vanlig ordning)
- Videomötet körs helt på den egna Nextcloud-servern för maximal dataintegritet

**Observera**: Personnummer, telefonnummer och andra känsliga uppgifter som samlas in för autentiseringsmål måste behandlas som känslig information – de ska endast överföras krypterat (via HTTPS) till Nextcloud och lagras där i säkert förvar, och aldrig exponeras i klartext i Outlook-miljön.

### 5. Skalbarhet

**Krav**: Lösningen ska fungera för många användare inom organisationen.

**Detaljer**:
- Om många samtidigt bokar möten ska Nextcloud-servern klara belastningen av att skapa flera Talk-rum (och kalenderhändelser)
- Att skapa ett Talk-rum är i regel en lätt operation för servern, likaså att skapa en kalenderhändelse
- Noterar detta för fullständighet
- Tillägget i Outlook körs hos varje användare klient-side (i deras Outlook), så det skalas automatiskt med antal användare

### 6. Underhåll och uppdateringar

**Krav**: Eftersom vi kontrollerar både klient- och servermiljön kan vi planera för smidiga uppdateringar.

**Detaljer**:
- Tillägget bör byggas på ett sätt som möjliggör enkel uppdatering av manifestet och webb-koden (t.ex. hostad centralt) utan att varje klient manuellt behöver uppgraderas
- Alla förändringar i Nextclouds API:er (t.ex. i framtida versioner av Talk eller Kalender) måste bevakas och tillägget uppdateras vid behov för kompatibilitet

### 7. Efterlevnad av Microsofts riktlinjer

**Krav**: Office-tillägget ska följa Microsofts riktlinjer för design och prestanda.

**Detaljer**:
- Inte stör Outlooks stabilitet
- Microsoft har indikerat att de planerar fasa ut äldre tilläggsmodeller
- Fokus på den nya webb-baserade add-in-modellen är framtidssäkert
- Tillägget ska inte kräva installation av någon binär komponent på klienterna, utan bara distribueras via manifest (förutom eventuella serverkomponenter på Nextcloud-sidan)

## Användarupplevelse (scenario)

För att illustrera flödet: en användare skapar ett nytt kalendermöte i Outlook och lägger till deltagare som vanligt. I mötesfönstret klickar användaren på **"Lägg till Nextcloud Talk-möte"** (en knapp från vårt tillägg).

### Inloggning vid första användning

Om användaren inte tidigare har loggat in på Nextcloud via tillägget visas en inloggningsruta där användaren ombeds autentisera sig (t.ex. genom omdirigering till företagets OIDC-inloggning eller Nextclouds vanliga inloggningssida). Efter framgångsrik inloggning återgår kontrollen till mötesfönstret i Outlook.

### Eventuellt inställningsformulär

När användaren klickat på "Lägg till Nextcloud Talk-möte" (och är inloggad) kan tillägget visa en liten dialog eller sidopanel för mötesinställningar. I detta formulär ser användaren listan över inbjudna deltagare och kan, om nödvändigt, justera säkerhetsinställningar per person. T.ex. kanske vissa externa deltagare kräver BankID-verifiering (LOA-3) eller säker e-post, vilket då anges här. Om användaren inte behöver några specialinställningar kan de flesta fält lämnas som standard (Ingen autentisering, endast e-post).

När användaren bekräftar (klickar "OK" eller "Skapa möte"):

1. **Tillägget skapar Talk-rummet** via Nextclouds API med de angivna parametrarna (namn, deltagare, säkerhetsinställningar per person)
2. **Tillägget skapar kalenderhändelsen** i användarens Nextcloud-kalender med samma grundinformation (titel, tid, deltagare)
3. **Möteslänken infogas** i Outlook-mötets brödtext
4. **Teams-länk tas bort** (om sådan fanns)
5. **Användaren ser bekräftelse** i Outlook att mötet nu innehåller en Nextcloud Talk-länk

Deltagarna får sedan kalenderinbjudan via e-post (som vanligt från Outlook/Exchange) med Nextcloud Talk-länken synlig. När mötet startar klickar deltagarna på länken och ansluter till videomötet i Nextcloud Talk. Om särskilda säkerhetskrav gäller (t.ex. BankID-verifiering) hanteras det av Nextcloud vid anslutning.

## Teknisk arkitektur

### Komponenter

1. **Nextcloud Server** (Manus Sandbox)
   - Nextcloud 28.0.0 eller senare
   - Nextcloud Talk (Spreed) aktiverad
   - Nextcloud Kalender aktiverad
   - OAuth2-app aktiverad
   - PostgreSQL eller MariaDB databas

2. **Outlook Add-in** (GitHub Pages)
   - Statisk webbapplikation (HTML/CSS/JavaScript)
   - Office.js för Outlook-integration
   - OAuth2-klient för Nextcloud-autentisering
   - Nextcloud API-klient

3. **Microsoft 365 Integration**
   - Manifest-fil för deployment till itsl.se M365 tenant
   - Outlook Web, Desktop och Mac-klienter

### Dataflöde

```
1. Användare öppnar Outlook kalendermöte
2. Användare klickar "Nextcloud Talk" knapp
3. Add-in laddas från GitHub Pages
4. Användare autentiserar via OAuth2 till Nextcloud
5. Add-in skapar Talk-rum via Nextcloud API
6. Add-in skapar kalenderhändelse via CalDAV
7. Möteslänk infogas i Outlook-mötet
8. Teams-länk tas bort (om konfigurerat)
```

### API-endpoints som behövs

**Nextcloud Talk API**:
- `POST /ocs/v2.php/apps/spreed/api/v4/room` - Skapa Talk-rum
- `POST /ocs/v2.php/apps/spreed/api/v4/room/{token}/participants` - Lägg till deltagare
- `PUT /ocs/v2.php/apps/spreed/api/v4/room/{token}` - Uppdatera rum-inställningar

**Nextcloud CalDAV API**:
- `PUT /remote.php/dav/calendars/{user}/{calendar}/{event}.ics` - Skapa kalenderhändelse
- `PROPFIND /remote.php/dav/calendars/{user}/` - Lista kalendrar

**Nextcloud OAuth2 API**:
- `GET /apps/oauth2/authorize` - Initiera OAuth2-flöde
- `POST /apps/oauth2/api/v1/token` - Hämta access token
- `GET /ocs/v2.php/cloud/user` - Hämta användarinfo

## Säkerhetskrav

### HTTPS och kryptering

- All kommunikation mellan add-in och Nextcloud måste ske över HTTPS
- Access tokens och refresh tokens ska lagras säkert (HttpOnly cookies eller säker localStorage)
- Inga känsliga data ska loggas i klartext

### CORS-konfiguration

Nextcloud måste konfigureras för att tillåta CORS-anrop från GitHub Pages:

```apache
Header set Access-Control-Allow-Origin "https://fredrikjonassonitsb.github.io"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
Header set Access-Control-Allow-Headers "Content-Type, Authorization, OCS-APIRequest, Accept"
Header set Access-Control-Allow-Credentials "true"
```

### Personuppgifter

- Personnummer, telefonnummer och andra känsliga uppgifter ska endast överföras krypterat till Nextcloud
- Lagras där i säkert förvar
- Aldrig exponeras i klartext i Outlook-miljön
- Endast överföras krypterat (via HTTPS) till Nextcloud och lagras där i säkert förvar

## Deployment

### Nextcloud (Manus Sandbox)

1. Installera Nextcloud med Docker Compose eller manuellt
2. Aktivera Nextcloud Talk och Kalender-appar
3. Konfigurera OAuth2-klient
4. Konfigurera CORS-headers
5. Exponera via Manus proxy (HTTPS)

### Outlook Add-in (GitHub Pages)

1. Skapa repository: `outlook-nextcloud-talk-addin`
2. Implementera add-in enligt struktur i COMPLETE-REQUIREMENTS-SPECIFICATION.md
3. Konfigurera GitHub Pages
4. Uppdatera manifest.xml med korrekta URL:er
5. Testa i Outlook Web

### Microsoft 365 (itsl.se tenant)

1. Ladda upp manifest.xml till M365 Admin Center
2. Distribuera till användare eller grupper
3. Användare ser tillägget i Outlook

## Testning

### Funktionell testning

- [ ] Skapa Talk-möte från Outlook
- [ ] Autentisering mot Nextcloud fungerar
- [ ] Möteslänk infogas korrekt
- [ ] Kalenderhändelse skapas i Nextcloud
- [ ] Teams-länk tas bort
- [ ] Deltagarspecifika säkerhetsinställningar fungerar
- [ ] Språkstöd (svenska/engelska)

### Kompatibilitetstestning

- [ ] Outlook Web (Chrome, Edge, Firefox)
- [ ] Outlook Desktop (Windows)
- [ ] Outlook Desktop (Mac)
- [ ] Olika Nextcloud-versioner

### Säkerhetstestning

- [ ] HTTPS-kommunikation
- [ ] Token-hantering
- [ ] CORS-konfiguration
- [ ] Personuppgifter hanteras säkert

## Dokumentation som behövs

1. **Installationsguide** - För Nextcloud-setup i Manus Sandbox
2. **Konfigurationsguide** - För OAuth2 och CORS
3. **Användarmanual** - För slutanvändare av Outlook-tillägget
4. **Utvecklardokumentation** - För framtida underhåll
5. **Felsökningsguide** - Vanliga problem och lösningar

## Prioritering

### Must-have (MVP)

1. Skapa Talk-möte från Outlook
2. Infoga möteslänk i kalenderbeskrivning
3. OAuth2-autentisering
4. Fungerar i Outlook Web

### Should-have (Fas 2)

1. Skapa kalenderhändelse i Nextcloud
2. Ta bort Teams-länkar automatiskt
3. Fungerar i Outlook Desktop (Windows/Mac)
4. Språkstöd (svenska/engelska)

### Could-have (Fas 3)

1. Deltagarspecifika säkerhetsinställningar
2. Avancerad mötesinställningar (lösenord, gästbehörighet)
3. Automatisk namnsättning av Talk-rum
4. Hantering av deltagare från Outlook

## Framtida utökningar

- Integration med Nextcloud Deck för mötesagenda
- Automatisk inspelning av möten
- Integration med Nextcloud Files för delning av dokument
- Påminnelser via Nextcloud Notifications
- Statistik och rapportering av mötesanvändning

## Referenser

- [Nextcloud Talk API Documentation](https://nextcloud-talk.readthedocs.io/)
- [Nextcloud CalDAV Documentation](https://docs.nextcloud.com/server/latest/developer_manual/client_apis/WebDAV/)
- [Office Add-ins Documentation](https://learn.microsoft.com/en-us/office/dev/add-ins/)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- COMPLETE-REQUIREMENTS-SPECIFICATION.md (fullständig teknisk specifikation)

