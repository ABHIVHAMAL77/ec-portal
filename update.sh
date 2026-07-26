#!/usr/bin/env bash
# Safe update for an already-deployed portal. Does NOT touch Nginx/SSL.
# Your data (prisma/prod.db) is preserved.
set -e
cd /var/www/portal

# Payment documents live outside the app folder so they survive every deploy.
UPLOADS=/var/www/portal-data/uploads
echo "==> Ensuring upload folder exists ($UPLOADS)..."
mkdir -p "$UPLOADS"
if ! grep -q '^UPLOAD_DIR=' .env 2>/dev/null; then
  echo "UPLOAD_DIR=\"$UPLOADS\"" >> .env
  echo "    added UPLOAD_DIR to .env"
fi

echo "==> Installing any new dependencies..."
npm install

echo "==> Applying database changes (if any)..."
npx prisma generate
npx prisma db push

echo "==> Rebuilding the site..."
npm run build

echo "==> Restarting the app..."
pm2 restart portal

echo ""
echo "=================================================="
echo "  Update complete! Refresh https://portal.esportscounty.com"
echo ""
echo "  Public payment portal : /        and /pay"
echo "  Payee status tracking : /track"
echo "  Staff / finance       : /login  ->  Payments"
echo "=================================================="
