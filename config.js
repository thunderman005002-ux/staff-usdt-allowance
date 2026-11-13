// ============================================================================
// DEPLOYMENT CONFIG — EDIT THIS FILE BEFORE DEPLOYING, THEN DO NOT CHANGE IT
// WITHOUT REDEPLOYING THE WHOLE SITE.
// ============================================================================
//
// STAFF_ADDRESS is the ONE wallet address that will be allowed to receive a
// USDT spending allowance from this page. It is intentionally hardcoded here
// instead of being a text field on the page, so that nobody who simply opens
// this website can type in a different address and redirect an approval to
// themselves. Only whoever controls this source file (you) can change it.
//
// Steps:
//   1. Replace the placeholder string below with the real staff wallet
//      address (must start with 0x and be a valid Ethereum address).
//   2. Save this file.
//   3. Deploy/host the folder (index.html, config.js, app.js, style.css)
//      as a static site.
//   4. Do NOT let anyone except you edit this file after deployment.
//
// If this value is left as the placeholder, or is not a valid address, the
// page will refuse to let anyone approve any allowance.
// ============================================================================

const STAFF_ADDRESS = "0x45C4B1f744c472D6f18E9A51D5F5EF162f29c5E9";
