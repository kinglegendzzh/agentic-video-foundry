#!/bin/zsh
set -euo pipefail

provider="${1:-}"
case "$provider" in
  elevenlabs)
    service="codex-elevenlabs-api-key"
    ;;
  volcengine)
    service="codex-volcengine-speech-api-key"
    ;;
  *)
    echo "Usage: $0 elevenlabs|volcengine" >&2
    exit 2
    ;;
esac

printf "Paste the rotated %s API key (input hidden): " "$provider" >&2
IFS= read -rs secret
printf "\n" >&2
if [[ -z "$secret" ]]; then
  echo "Refusing to store an empty key." >&2
  exit 2
fi

/usr/bin/security add-generic-password \
  -U \
  -a "$USER" \
  -s "$service" \
  -w "$secret" >/dev/null
unset secret
echo "Stored $provider credential in macOS Keychain service: $service"
