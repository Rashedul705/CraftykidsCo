# CraftyKidsCo — Production Deployment Guide

This guide covers deployment instructions for the **CraftyKidsCo** e-commerce platform and admin portal.

---

## 1. Architecture Overview

- **Frontend:** Next.js 16 (App Router with Turbopack), React 19, Tailwind CSS v4, Hind Siliguri typography.
- **Backend Services:** Next.js Serverless API routes + Express helper service.
- **Database:** MongoDB Atlas (Mongoose ODM) with resilient in-memory fallback.
- **Couriers:** Steadfast Courier Live Gateway (`Packzy API v1`) with automatic 1-click dispatch.
- **SMS Gateway:** BulkSMSBD API with automatic Bangla Unicode character counting and GSM fallback.
- **CDN Media:** ImgBB Cloud storage.

---

## 2. Environment Variables Checklist

Ensure the following variables are set in your production environment (`.env.production` or Hosting Environment Variables):

```bash
# App Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_BRAND_NAME_EN="CraftyKidsCo"
NEXT_PUBLIC_BRAND_NAME_BN="ক্রাফটিকিডস কো"

# Database (MongoDB Atlas)
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.bjsv7px.mongodb.net/craftykidsco?retryWrites=true&w=majority"
MONGODB_DB_NAME="craftykidsco"

# Media Storage (ImgBB)
IMGBB_API_KEY="your_imgbb_api_key"
NEXT_PUBLIC_IMGBB_API_KEY="your_imgbb_api_key"

# Admin Authentication
JWT_SECRET="your_secure_random_jwt_secret_key"
ADMIN_EMAIL="admin@craftykidsco.com"
ADMIN_PASSWORD="your_strong_admin_password"

# Courier Integration (Steadfast Courier API)
STEADFAST_API_KEY="your_steadfast_api_key"
STEADFAST_SECRET_KEY="your_steadfast_secret_key"
STEADFAST_BASE_URL="https://portal.packzy.com/api/v1"
USE_MOCK_COURIER="false"
USE_MOCK_PAYMENTS="false"

# SMS Gateway (BulkSMSBD)
BULKSMSBD_API_KEY="your_bulksmsbd_api_key"
SMS_SENDER_ID="CraftyKids"

# Mobile Financial Services (bKash & Nagad)
BKASH_MERCHANT_NUMBER="01XXXXXXXXX"
NAGAD_MERCHANT_NUMBER="01XXXXXXXXX"
```

---

## 3. Option A: Deploy to Vercel (Recommended for Next.js)

1. **Push to GitHub / GitLab:**
   ```bash
   git push origin main
   ```
2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your Git repository.
   - Set **Root Directory** to `frontend`.
   - In **Environment Variables**, paste the keys from Section 2.
3. **Deploy:**
   - Click **Deploy**. Vercel will run `npm run build` with Turbopack and deploy to a global CDN.

---

## 4. Option B: Deploy to VPS / Cloud Server (Ubuntu + PM2 + Nginx)

### Step 1: Install Node.js 20+ & PM2
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### Step 2: Clone and Build
```bash
git clone <your-repo-url> /var/www/craftykidsco
cd /var/www/craftykidsco/frontend
npm ci
npm run build
```

### Step 3: Run with PM2
```bash
pm2 start npm --name "craftykidsco-web" -- start -- -p 3000
pm2 save
pm2 startup
```

### Step 4: Configure Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable SSL using Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 5. Post-Deployment Verification Checklist

- [ ] Visit `https://yourdomain.com/` — check homepage banners and category navigation.
- [ ] Visit `https://yourdomain.com/product/...` — verify variation selector, live total calculation, and sticky mobile buying bar.
- [ ] Visit `https://yourdomain.com/bundles` — test bundle builder and add to cart.
- [ ] Complete a test checkout at `/checkout` — verify delivery charge calculation and confirmation page.
- [ ] Log in to Admin at `/admin/login` using `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- [ ] In Admin, test:
  - **Orders:** Confirm order and test 1-click Steadfast dispatch.
  - **Incomplete Orders:** Test WhatsApp reminder link and Convert button.
  - **SMS Campaigns:** Send test SMS with live balance check.
  - **Stock:** Inline stock adjustments.
