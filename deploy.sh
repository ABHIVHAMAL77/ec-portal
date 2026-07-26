#!/usr/bin/env bash
# One-shot deploy for the Esports County Employers Portal on Ubuntu (run as root).
# Usage:  bash deploy.sh
set -e

echo "==> [1/6] Installing Node.js, Nginx, PM2, Certbot..."
apt-get update -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx certbot python3-certbot-nginx
npm install -g pm2

echo "==> [2/6] Creating settings (.env) if missing..."
if [ ! -f .env ]; then
  cat > .env <<ENV
DATABASE_URL="file:./prod.db"
SESSION_SECRET="$(openssl rand -hex 32)"
APP_URL="https://portal.esportscounty.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="notifications@esportscounty.com"
SMTP_PASS=""
EMAIL_FROM="Esports County <notifications@esportscounty.com>"
ENV
  echo "    .env created (add your email App Password later with: nano .env)"
fi

echo "==> [3/6] Installing app dependencies (takes a minute)..."
npm install
npx prisma generate
npx prisma db push

echo "==> [4/6] First-time data setup (departments + admin)..."
if [ ! -f .initialized ]; then
  npm run db:seed
  touch .initialized
  echo "    Seeded. Login: abhiv@esportscounty.com / esports123"
else
  echo "    Already initialized — skipping seed (your data is safe)."
fi

echo "==> [5/6] Building the site..."
npm run build

echo "==> [6/6] Starting the app + web server..."
pm2 delete portal >/dev/null 2>&1 || true
pm2 start npm --name portal -- start
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

cat > /etc/nginx/sites-available/portal <<'NGINX'
server {
    listen 80;
    server_name portal.esportscounty.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/portal
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "=================================================================="
echo "  DONE — the portal is running on this server (port 80)."
echo ""
echo "  Next:"
echo "   1) Point portal.esportscounty.com (A record) to this server IP"
echo "   2) Once it points here, turn on HTTPS with:"
echo "        certbot --nginx -d portal.esportscounty.com"
echo ""
echo "  Then open: https://portal.esportscounty.com"
echo "  Login: abhiv@esportscounty.com / esports123  (change it!)"
echo "=================================================================="
