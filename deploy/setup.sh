#!/usr/bin/env bash
# Run once on the server to set up the deploy directory.
# Usage: bash setup.sh

set -e

DEPLOY_DIR="${1:-/opt/photolib}"

echo "→ Creating deploy directory at $DEPLOY_DIR"
sudo mkdir -p "$DEPLOY_DIR"
sudo chown "$USER":"$USER" "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Copy compose file
if [ ! -f docker-compose.yml ]; then
  echo "→ Paste docker-compose.yml path or URL (or copy it manually to $DEPLOY_DIR)"
fi

# Create .env from prompt
if [ ! -f .env ]; then
  echo ""
  echo "→ Generating .env"
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null \
    || openssl rand -hex 32)

  read -rp "  ADMIN_PASSWORD (the password for /admin): " ADMIN_PASS

  cat > .env <<EOF
SESSION_SECRET=$SECRET
ADMIN_PASSWORD=$ADMIN_PASS
EOF
  echo "  .env written."
fi

# Create volumes dirs (docker compose will use named volumes, but just in case)
echo "→ Done. Run 'docker compose up -d' to start."
echo ""
echo "  DEPLOY_PATH for GitHub secret: $DEPLOY_DIR"
