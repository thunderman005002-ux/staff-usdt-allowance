# Staff USDT Allowance Manager

A small, static, non-custodial dApp for a business owner to grant a **limited USDT (Tether) spending
allowance** on Ethereum Mainnet to **one pre-configured staff wallet**, instead of manually sending
payment every time. Works in any EIP-1193 wallet, including Trust Wallet's in-app browser, MetaMask,
and Trust Wallet's browser extension.

There is no backend, no database, and no server code — it is three static files
([index.html](./index.html), [app.js](./app.js), [style.css](./style.css)) plus a config file
([config.js](./config.js)), talking directly to the official USDT smart contract.

## ⚠️ Before you deploy: set the staff address

Open [config.js](./config.js) and replace the placeholder with the **real staff wallet address**:

```js
const STAFF_ADDRESS = "0xREPLACE_WITH_STAFF_WALLET_ADDRESS";
```

This is **the only place** the staff address exists. It is intentionally hardcoded in source code,
not a text field on the page — so nobody who simply visits the deployed site can type in a different
address and redirect an approval to themselves. Until you set a valid address here, the page shows a
"not configured" banner and disables all approvals.

If you need a different staff member later, edit `config.js` and redeploy. If you need **multiple**
staff members, you'll need multiple separate deployments (e.g. different folders/subdomains), each
with its own `config.js` — see "Multiple staff members" below.

## How it works

1. **Owner connects their wallet** (the wallet that holds the business's USDT).
2. The page checks they're on Ethereum Mainnet (offers a one-click switch if not).
3. Owner picks an amount (quick buttons for 10/20/30/50 USDT, or any custom amount) and reads the
   on-page disclosures.
4. Owner clicks **Approve Allowance** → the page calls the official USDT contract's
   `approve(staffAddress, amount)` function directly from the owner's wallet. No funds move yet —
   this only grants permission.
5. Whenever the staff member needs to get paid, they call `transferFrom(owner, destination, amount)`
   on the USDT contract themselves (instructions are built into the page, "Step 3"), paying their own
   gas. They can never withdraw more than the remaining approved allowance.
6. Owner can **Revoke** at any time, instantly setting the allowance back to 0.

### A quirk of the real USDT contract that this page handles for you

The official Tether USDT contract does not allow changing a **non-zero** allowance directly to a
different **non-zero** value (an anti-race-condition rule). If the owner already has an active
allowance for the staff address and changes the amount, the page automatically sends two transactions:
first `approve(staff, 0)`, then `approve(staff, newAmount)`. The UI shows this as "Step 1/2" / "Step 2/2".

## Deploying

This is a static site — host it anywhere that serves plain HTML/JS/CSS over HTTPS, for example:

- **GitHub Pages**: push this folder to a repo, enable Pages on the branch/folder.
- **Netlify / Vercel**: drag-and-drop the folder or connect the repo; no build command needed.
- **Any static web host / S3 + CloudFront / Cloudflare Pages**: upload the 4 files as-is.

HTTPS is required for Trust Wallet's in-app browser and most wallets to treat the page as reliable;
don't rely on `file://` for anything beyond local testing. Open the deployed URL directly in Trust
Wallet's **Discover/DApp browser** (or MetaMask) to use it.

## Security notes / disclosures (also shown in-app)

- This page never holds funds or private keys. All transactions are signed locally in the user's
  own wallet and sent straight to the official Tether USDT contract
  (`0xdAC17F958D2ee523a2206206994597C13D831ec`, Ethereum Mainnet).
- Approving only authorizes the **USDT** token, up to the amount set — nothing else in the wallet
  (ETH, NFTs, other tokens) is affected.
- The staff member can pull the approved amount at any time, in one or multiple transactions, until
  it's used up or revoked.
- Everything happens on a public, irreversible blockchain. Always double-check `config.js` is set to
  the correct staff address before trusting a deployment, especially if you didn't configure it
  yourself.
- Not affiliated with Tether Ltd. or Trust Wallet. Provided as-is, use at your own risk.

## Multiple staff members (optional, future extension)

This build intentionally supports exactly **one** hardcoded staff address per deployment, per your
request. If later you want to manage several staff members from a single page (with per-staff caps,
expiry, a shared revoke-all button, on-chain audit logging, etc.), that requires a small custom Solidity
contract rather than raw ERC20 `approve` — happy to build that as a follow-up if needed.
