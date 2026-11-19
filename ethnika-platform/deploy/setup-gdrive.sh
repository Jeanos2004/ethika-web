#!/bin/sh
# Copie des sauvegardes vers Google Drive (hors du VPS), à configurer une fois :
#
# 1. Sur ton PC (rclone installé : winget install Rclone.Rclone), autoriser l'accès, limité aux fichiers créés par rclone :
#      rclone authorize "drive" "eyJzY29wZSI6ImRyaXZlLmZpbGUifQ=="
#    Le navigateur s'ouvre ; après accord, la console affiche un jeton JSON ({"access_token":…}).
# 2. Sur le VPS :
#      ssh -t root@VPS /opt/ethnika/deploy/setup-gdrive.sh
#    puis coller ce jeton. Il est enregistré dans la configuration rclone de root (chmod 600), jamais dans le dépôt.
#
# Ensuite, backup.sh copie chaque sauvegarde (déjà chiffrée) dans le dossier Drive « ETHNIKA-sauvegardes »
# et y supprime celles de plus de 30 jours.
set -eu

command -v rclone > /dev/null || { echo "rclone absent : apt-get install rclone" >&2; exit 1; }

echo "Colle le jeton JSON affiché par « rclone authorize » sur ton PC, puis Entrée :"
read -r TOKEN
case "$TOKEN" in
  \{*access_token*\}) ;;
  *) echo "Ce n'est pas un jeton rclone ({\"access_token\":…})." >&2; exit 1 ;;
esac

rclone config delete gdrive 2> /dev/null || true
rclone config create gdrive drive scope=drive.file token="$TOKEN" --non-interactive > /dev/null
unset TOKEN
chmod 600 "$(rclone config file | tail -n 1)"

echo "Test d'écriture dans Google Drive…"
TEST="/tmp/ethnika-drive-test.txt"
echo "Test ETHNIKA $(date -u +%FT%TZ)" > "$TEST"
rclone copyto "$TEST" gdrive:ETHNIKA-sauvegardes/test-connexion.txt
rclone deletefile gdrive:ETHNIKA-sauvegardes/test-connexion.txt
rm -f "$TEST"
echo "Google Drive est prêt : les prochaines sauvegardes y seront copiées (dossier ETHNIKA-sauvegardes)."
