# Deployment Guide: Netlify (Free, 1-minute setup)

This dApp is now pushed to GitHub at:
👉 **https://github.com/thunderman005002-ux/staff-usdt-allowance**

Follow these steps to deploy it live on Netlify (all free tier, no credit card needed initially):

## Step 1: Connect to Netlify

1. Go to **https://app.netlify.com** (sign up with GitHub if you don't have an account)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** as your Git provider
4. Search for and select **`staff-usdt-allowance`**
5. Click **"Deploy"** — that's it! Netlify will build and host it automatically.

Netlify will give you a live URL like:
```
https://your-site-name.netlify.app
```

## Step 2: (Optional) Use a custom domain

After deployment:
1. Go to your site's **Site Settings** → **Domain Management**
2. Add your own custom domain (e.g., `usdt-allowance.yourcompany.com`)
3. Follow Netlify's DNS instructions

## Step 3: Share the link

Once live, open your deployed URL in **Trust Wallet's in-app browser** (Discover → DApps → paste URL) or any desktop browser with a wallet extension.

### What happens on first visit:

1. **Automatic silent connection** — if you've never used the dApp before, it'll try `eth_accounts` silently. If nothing connects, you'll see a "Connect Wallet" button.
2. **Click Connect Wallet** (if needed) — this pops up **one approval** from your wallet asking "allow this site to see your wallet?" Accept it.
3. **No more wallet popups** — from that point on, only the **Approve Allowance** transaction (which is mandatory for security) will require a signature.

---

## ✅ Environment variables / config changes

⚠️ **Important for future updates:**

If you ever need to change the `STAFF_ADDRESS` or modify the page later:

1. Edit `config.js` locally
2. Commit and push to GitHub:
   ```bash
   git add config.js
   git commit -m "Update staff address to new wallet"
   git push
   ```
3. Netlify automatically redeploys within seconds — you'll see the live site update.

---

## 🧪 Testing before going live

**On localhost** (while developing):
```bash
cd C:\Users\Surender Meena\Documents\TRUSTWALLET\Dapp\ethereum
python -m http.server 8787
# Open http://localhost:8787 in your browser
```

**On Netlify live URL** (after deployment):
- Just open the URL from Netlify in Trust Wallet or MetaMask
- Test the full flow: Connect → Approve 30 USDT → (optional) Revoke

---

## 🔗 Live URL

Your dApp is now at:
👉 **https://github.com/thunderman005002-ux/staff-usdt-allowance**

Click the "Deploy" button in Netlify and you'll get your own live URL in seconds.

---

## 📝 Next steps

1. Go to Netlify and deploy (1 minute)
2. Open the live URL in Trust Wallet
3. Approve the wallet connection (if needed)
4. Test an approval: pick 25 USDT, click "Approve Allowance"
5. Share the link with the business owner to use

Questions? Check [README.md](./README.md) for more details on how it works.
