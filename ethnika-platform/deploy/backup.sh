#!/bin/sh
# Sauvegarde chiffrée de la base de production (à lancer chaque nuit par cron sur le VPS) :
#   0 3 * * * BACKUP_PASSPHRASE_FILE=/etc/ethnika/backup.pass /opt/ethnika/deploy/backup.sh >> /var/log/ethnika-backup.log 2>&1
#
# - pg_dump au format custom (restauration sélective possible), compressé puis chiffré (AES-256, gpg symétrique).
# - Conserve 14 sauvegardes locales ; COPIER AUSSI hors du VPS (stockage objet, autre serveur).
# - Restauration (à tester réellement, docs/SECURITY.md § 6) :
#     gpg --batch --passphrase-file /etc/ethnika/backup.pass -d FICHIER.dump.gpg > ethnika.dump
#     docker compose -f deploy/docker-compose.prod.yml exec -T postgres pg_restore -U ethnika -d ethnika --clean < ethnika.dump
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="${BACKUP_DIR:-$DIR/backups}"
KEEP="${BACKUP_KEEP:-14}"
: "${BACKUP_PASSPHRASE_FILE:?BACKUP_PASSPHRASE_FILE requis (fichier contenant la phrase secrète, chmod 600)}"

mkdir -p "$OUT"
chmod 700 "$OUT"
FILE="$OUT/ethnika-$(date -u +%Y%m%dT%H%M%SZ).dump.gpg"

docker compose -f "$DIR/docker-compose.prod.yml" exec -T postgres pg_dump -U ethnika -d ethnika -Fc \
  | gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-file "$BACKUP_PASSPHRASE_FILE" -o "$FILE"

chmod 600 "$FILE"
echo "$(date -u +%FT%TZ) sauvegarde : $(basename "$FILE") ($(wc -c < "$FILE") octets)"

# Rotation : on garde les $KEEP plus récentes.
ls -1t "$OUT"/ethnika-*.dump.gpg | tail -n +"$((KEEP + 1))" | xargs -r rm -f
