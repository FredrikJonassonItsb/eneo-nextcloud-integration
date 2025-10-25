# Återställningsguide - Eneo + Nextcloud Integration

Denna guide beskriver hur du återställer projektet till specifika versioner och återställningspunkter.

## Tillgängliga återställningspunkter

### v1.0.0-sandbox-demo (2025-10-25)

**Beskrivning**: Första fullständiga versionen med komplett Eneo + Nextcloud-integration, testad i Manus sandbox.

**Innehåll**:
- Komplett Docker Compose-setup
- Eneo backend med FastAPI
- Eneo frontend med SvelteKit
- OAuth2-integration
- WebDAV-filåtkomst
- Omfattande dokumentation (4 guider)
- Sandbox-demo
- Testdata

**Status**: ✅ Testad och verifierad i Manus sandbox

**GitHub Release**: https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration/releases/tag/v1.0.0-sandbox-demo

## Hur man återställer till en version

### Metod 1: Checkout av tag (Rekommenderad)

Detta är det enklaste sättet att återställa till en specifik version:

```bash
# Gå till projektets katalog
cd eneo-nextcloud-integration

# Se alla tillgängliga versioner
git tag -l

# Återställ till v1.0.0-sandbox-demo
git checkout v1.0.0-sandbox-demo

# Verifiera vilken version du är på
cat VERSION
```

**OBS**: Detta sätter dig i "detached HEAD"-läge. För att göra ändringar, skapa en ny branch:

```bash
git checkout -b my-branch-from-v1.0.0
```

### Metod 2: Skapa en ny branch från tag

Om du vill arbeta vidare från en specifik version:

```bash
# Skapa en ny branch från v1.0.0-sandbox-demo
git checkout -b feature-branch v1.0.0-sandbox-demo

# Nu kan du göra ändringar och commits
git add .
git commit -m "My changes"
```

### Metod 3: Återställ master till en tag

Om du vill återställa master-branchen till en tidigare version:

```bash
# VARNING: Detta skriver över din nuvarande master
git checkout master
git reset --hard v1.0.0-sandbox-demo
git push origin master --force
```

**OBS**: Använd `--force` med försiktighet i team-miljöer!

### Metod 4: Ladda ner release från GitHub

Du kan också ladda ner en specifik version direkt från GitHub:

1. Gå till: https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration/releases
2. Välj version (t.ex. v1.0.0-sandbox-demo)
3. Klicka på "Source code (zip)" eller "Source code (tar.gz)"
4. Packa upp och använd

## Verifiera återställning

Efter återställning, verifiera att du är på rätt version:

```bash
# Kontrollera VERSION-fil
cat VERSION

# Kontrollera Git-tag
git describe --tags

# Kontrollera commit-meddelande
git log -1 --oneline

# Lista alla filer
ls -la
```

## Jämföra versioner

### Se skillnader mellan versioner

```bash
# Jämför nuvarande version med v1.0.0-sandbox-demo
git diff v1.0.0-sandbox-demo

# Jämför två specifika versioner
git diff v1.0.0-sandbox-demo..v1.1.0

# Se vilka filer som ändrats
git diff --name-only v1.0.0-sandbox-demo
```

### Se ändringshistorik

```bash
# Se alla commits sedan v1.0.0-sandbox-demo
git log v1.0.0-sandbox-demo..HEAD

# Se commits med ändringar
git log --oneline --graph v1.0.0-sandbox-demo..HEAD

# Se CHANGELOG
cat CHANGELOG.md
```

## Återställ specifika filer

Om du bara vill återställa specifika filer från en version:

```bash
# Återställ en specifik fil från v1.0.0-sandbox-demo
git checkout v1.0.0-sandbox-demo -- path/to/file

# Återställ flera filer
git checkout v1.0.0-sandbox-demo -- docs/ eneo/backend/

# Återställ .env.example
git checkout v1.0.0-sandbox-demo -- .env.example
```

## Återställ efter ändringar

### Ångra lokala ändringar

```bash
# Ångra alla ändringar (inte committade)
git reset --hard HEAD

# Ångra ändringar i en specifik fil
git checkout -- path/to/file

# Ta bort alla nya filer
git clean -fd
```

### Ångra commits

```bash
# Ångra senaste commit (behåll ändringar)
git reset --soft HEAD~1

# Ångra senaste commit (ta bort ändringar)
git reset --hard HEAD~1

# Ångra flera commits
git reset --hard HEAD~3
```

## Skapa egna återställningspunkter

### Skapa en tag

```bash
# Skapa en enkel tag
git tag v1.1.0

# Skapa en annoterad tag (rekommenderad)
git tag -a v1.1.0 -m "Version 1.1.0 - Beskrivning av ändringar"

# Pusha tag till GitHub
git push origin v1.1.0

# Pusha alla tags
git push origin --tags
```

### Skapa en release på GitHub

```bash
# Med GitHub CLI
gh release create v1.1.0 \
  --title "Version 1.1.0" \
  --notes "Beskrivning av denna version"

# Eller manuellt via webbgränssnittet:
# 1. Gå till https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration/releases
# 2. Klicka "Draft a new release"
# 3. Välj tag och fyll i information
```

## Backup och återställning av data

### Backup av konfiguration

```bash
# Backup av .env
cp .env .env.backup-$(date +%Y%m%d)

# Backup av hela projektet
tar czf eneo-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  eneo-nextcloud-integration/
```

### Backup av Docker-data

```bash
# Backup av Docker volumes
docker compose down
sudo tar czf volumes-backup-$(date +%Y%m%d).tar.gz \
  -C /var/lib/docker/volumes \
  eneo-nextcloud_nextcloud-data \
  eneo-nextcloud_eneo-db-data

# Återställ volumes
sudo tar xzf volumes-backup-20241025.tar.gz \
  -C /var/lib/docker/volumes
```

### Backup av databaser

```bash
# Backup av Nextcloud-databas
docker compose exec nextcloud-db pg_dump -U nextcloud nextcloud \
  > backup-nextcloud-$(date +%Y%m%d).sql

# Backup av Eneo-databas
docker compose exec eneo-db pg_dump -U eneo eneo \
  > backup-eneo-$(date +%Y%m%d).sql

# Återställ databas
cat backup-nextcloud-20241025.sql | \
  docker compose exec -T nextcloud-db psql -U nextcloud nextcloud
```

## Felsökning

### Problem: "Detached HEAD state"

**Lösning**: Detta är normalt när du checkar ut en tag. För att fortsätta arbeta:

```bash
git checkout -b new-branch-name
```

### Problem: "Conflicts" vid återställning

**Lösning**: Om du har lokala ändringar som konfliktar:

```bash
# Spara dina ändringar
git stash

# Återställ till version
git checkout v1.0.0-sandbox-demo

# Applicera dina ändringar igen
git stash pop
```

### Problem: Tag finns inte

**Lösning**: Hämta alla tags från remote:

```bash
git fetch --all --tags
git tag -l
```

### Problem: Kan inte pusha efter reset

**Lösning**: Om du har gjort `git reset --hard`, behöver du force-pusha:

```bash
git push origin master --force
```

**VARNING**: Detta skriver över remote history. Använd med försiktighet!

## Best practices

### Innan du återställer

1. **Commit alla ändringar**:
   ```bash
   git add .
   git commit -m "Save work before restore"
   ```

2. **Skapa en backup-branch**:
   ```bash
   git branch backup-$(date +%Y%m%d)
   ```

3. **Dokumentera varför**:
   ```bash
   echo "Restored to v1.0.0-sandbox-demo because..." >> restore-log.txt
   ```

### Efter återställning

1. **Verifiera version**:
   ```bash
   cat VERSION
   git describe --tags
   ```

2. **Testa att allt fungerar**:
   ```bash
   ./scripts/setup.sh
   ./scripts/start.sh
   ```

3. **Uppdatera dokumentation**:
   ```bash
   # Uppdatera CHANGELOG.md om du gör ändringar
   ```

## Automatisk backup

### Cron-jobb för daglig backup

```bash
# Skapa backup-skript
cat > /home/ubuntu/backup-eneo.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/eneo"
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR

# Backup Git
cd /home/ubuntu/eneo-nextcloud-integration
git bundle create $BACKUP_DIR/repo-$DATE.bundle --all

# Backup databaser
docker compose exec -T nextcloud-db pg_dump -U nextcloud nextcloud \
  > $BACKUP_DIR/nextcloud-$DATE.sql
docker compose exec -T eneo-db pg_dump -U eneo eneo \
  > $BACKUP_DIR/eneo-$DATE.sql

# Ta bort gamla backups (äldre än 30 dagar)
find $BACKUP_DIR -mtime +30 -delete
EOF

chmod +x /home/ubuntu/backup-eneo.sh

# Lägg till i crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup-eneo.sh") | crontab -
```

## Resurser

- **GitHub Releases**: https://github.com/FredrikJonassonItsb/eneo-nextcloud-integration/releases
- **Git Documentation**: https://git-scm.com/doc
- **CHANGELOG**: [CHANGELOG.md](../CHANGELOG.md)

## Support

Om du behöver hjälp med återställning:

1. Kontrollera denna guide
2. Se [Felsökning](#felsökning)-sektionen
3. Skapa ett issue på GitHub
4. Kontakta projektägare

---

**Tips**: Skapa alltid en backup innan du återställer till en tidigare version!

