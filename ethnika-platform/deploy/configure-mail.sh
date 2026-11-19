#!/bin/sh
# Branche l'envoi des e-mails de l'API sur une boîte SMTP (Namecheap Private Email par défaut), à lancer sur le VPS :
#   ssh -t root@VPS /opt/ethnika/deploy/configure-mail.sh
# Demande l'adresse d'envoi, son mot de passe (saisie masquée) et l'adresse qui reçoit les nouvelles demandes,
# écrit SMTP_URL, MAIL_FROM et AGENCY_NOTIFY_EMAIL dans deploy/api.env, redémarre l'API puis envoie un e-mail de test.
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$DIR/api.env"
HOST="${SMTP_HOST:-mail.privateemail.com}"
PORT="${SMTP_PORT:-465}"
[ -f "$ENV_FILE" ] || { echo "$ENV_FILE introuvable" >&2; exit 1; }

printf "Adresse d'envoi (ex. contact@ethnika.africa) : "
read -r FROM_ADDR
printf "Mot de passe de cette boîte (non affiché) : "
stty -echo
read -r PASS
stty echo
echo
printf "Adresse qui reçoit les nouvelles demandes [%s] : " "$FROM_ADDR"
read -r NOTIFY
NOTIFY="${NOTIFY:-$FROM_ADDR}"

# Identifiant et mot de passe encodés pour l'URL (caractères spéciaux du mot de passe).
URL=$(FROM_ADDR="$FROM_ADDR" PASS="$PASS" HOST="$HOST" PORT="$PORT" python3 -c '
import os, urllib.parse as u
e = os.environ
user, pwd = u.quote(e["FROM_ADDR"], safe=""), u.quote(e["PASS"], safe="")
print("smtps://" + user + ":" + pwd + "@" + e["HOST"] + ":" + e["PORT"])')
unset PASS

TMP=$(mktemp)
grep -vE '^(SMTP_URL|MAIL_FROM|AGENCY_NOTIFY_EMAIL)=' "$ENV_FILE" > "$TMP" || true
{
  echo "SMTP_URL=$URL"
  echo "MAIL_FROM=ETHNIKA <$FROM_ADDR>"
  echo "AGENCY_NOTIFY_EMAIL=$NOTIFY"
} >> "$TMP"
chmod 600 "$TMP"
mv "$TMP" "$ENV_FILE"
unset URL

cd "$DIR/.."
docker compose -f deploy/docker-compose.prod.yml up -d api > /dev/null
echo "API redémarrée. Envoi d'un e-mail de test à $NOTIFY…"
sleep 8
docker compose -f deploy/docker-compose.prod.yml exec -T api node dist/cli/mail-test.js "$NOTIFY"
