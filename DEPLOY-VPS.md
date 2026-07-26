# Deploy to your Hostinger KVM 2 VPS (portal.esportscounty.com)

The portal runs as a Node app behind Nginx, kept alive by PM2, with free HTTPS.
It uses the built-in SQLite database (a file on the server) — nothing else to set up.

You'll run these in the **VPS terminal** (Hostinger hPanel → VPS → `srv1470934` → **Browser terminal**,
or SSH). Assumes **Ubuntu**. Copy-paste one block at a time.

---

## Step 1 — Point the domain at the VPS

1. In hPanel → VPS → `srv1470934`, note the **IP address** (e.g. `72.60.x.x`).
2. Wherever `esportscounty.com`'s DNS is managed (your domain registrar / Google), add a record:
   - **Type:** A  ·  **Name/Host:** `portal`  ·  **Value:** the VPS IP  ·  **TTL:** default
3. This makes `portal.esportscounty.com` point to the server (can take a few minutes to hours).

---

## Step 2 — Install what the server needs

```bash
sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx unzip
sudo npm install -g pm2
node --version    # should print v20.x
```

---

## Step 3 — Upload the code

1. In hPanel → VPS → **Files** (or via the browser terminal's file upload), upload
   **`ec-portal-deploy.zip`** to the server (e.g. into `/root` or `/home`).
2. In the terminal:

```bash
mkdir -p /var/www/portal
unzip -o ~/ec-portal-deploy.zip -d /var/www/portal
cd /var/www/portal
ls    # you should see app/ components/ prisma/ package.json etc.
```

---

## Step 4 — Create the production settings file

```bash
cd /var/www/portal
cat > .env <<'ENV'
DATABASE_URL="file:./prod.db"
SESSION_SECRET="PASTE_A_LONG_RANDOM_STRING"
APP_URL="https://portal.esportscounty.com"

# Email (Google Workspace) — from notifications@esportscounty.com
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="notifications@esportscounty.com"
SMTP_PASS="PASTE_YOUR_16_CHAR_APP_PASSWORD"
EMAIL_FROM="Esports County <notifications@esportscounty.com>"
ENV
```

Generate a strong `SESSION_SECRET` and paste it into the file (edit with `nano .env`):

```bash
openssl rand -hex 32
```

---

## Step 5 — Install, set up the database, build

```bash
cd /var/www/portal
npm install
npx prisma generate
npx prisma db push        # creates the SQLite tables
npm run db:seed           # 9 departments + admin (abhiv@esportscounty.com / esports123)
npm run build
```

---

## Step 6 — Keep it running with PM2

```bash
cd /var/www/portal
pm2 start npm --name portal -- start
pm2 save
pm2 startup     # copy–paste the command it prints, then run it
```

The app is now running on `http://localhost:3000` on the server.

---

## Step 7 — Put Nginx in front (portal.esportscounty.com)

```bash
sudo tee /etc/nginx/sites-available/portal >/dev/null <<'NGINX'
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
sudo ln -sf /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/portal
sudo nginx -t && sudo systemctl reload nginx
```

Visit **http://portal.esportscounty.com** — you should see the login page.

---

## Step 8 — Turn on HTTPS (free)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d portal.esportscounty.com
```

Follow the prompts (enter your email, agree). Certbot adds HTTPS and auto-renews.
Now **https://portal.esportscounty.com** is live and secure. 🎉

---

## Step 9 — First login

1. Open **https://portal.esportscounty.com** → log in as `abhiv@esportscounty.com` / `esports123`.
2. Change your password.
3. **Team → Add employee** to onboard everyone.

---

## Updating later (when the portal changes)

Upload the new ZIP, then:

```bash
cd /var/www/portal
unzip -o ~/ec-portal-deploy.zip -d /var/www/portal
npm install
npx prisma db push     # only if the database structure changed
npm run build
pm2 restart portal
```

> The `prod.db` file holds all your data — updating the code does **not** touch it.
> Back it up occasionally: `cp /var/www/portal/prisma/prod.db ~/portal-backup-$(date +%F).db`
