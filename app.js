// ============================================================================
// Staff USDT Allowance Manager — app logic
// Ethereum Mainnet, official Tether USDT contract only.
// ============================================================================

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec"; // official Tether USDT, Ethereum Mainnet
const USDT_DECIMALS = 6;
const MAINNET_CHAIN_ID_HEX = "0x1";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)"
];

// Recommended staff allowance range, used only for the on-page hint — not enforced.
const RECOMMENDED_MIN = 10;
const RECOMMENDED_MAX = 50;

let provider = null;
let signer = null;
let userAddress = null;
let usdtRead = null;  // contract connected to provider (read-only)
let usdtWrite = null; // contract connected to signer (sends transactions)

// ----- DOM references -----
const el = (id) => document.getElementById(id);
const connectBtn = () => el("connectBtn");
const networkWarning = () => el("networkWarning");
const switchNetworkBtn = () => el("switchNetworkBtn");
const accountInfo = () => el("accountInfo");
const accountAddress = () => el("accountAddress");
const ethBalanceEl = () => el("ethBalance");
const usdtBalanceEl = () => el("usdtBalance");
const approveCard = () => el("approveCard");
const staffAddressDisplay = () => el("staffAddressDisplay");
const amountInput = () => el("amount");
const currentAllowanceBox = () => el("currentAllowanceBox");
const currentAllowanceValue = () => el("currentAllowanceValue");
const ackCheckbox = () => el("ackCheckbox");
const approveBtn = () => el("approveBtn");
const revokeBtn = () => el("revokeBtn");
const txStatus = () => el("txStatus");
const configWarning = () => el("configWarning");

let isConfigValid = false;
let staffAddressChecksummed = null;
let autoConnectAttempted = false;

// ----------------------------------------------------------------------------
// Startup
// ----------------------------------------------------------------------------
function init() {
  validateConfig();
  wireStaticHandlers();

  if (!isConfigValid) {
    configWarning().classList.remove("hidden");
    connectBtn().disabled = true;
    return;
  }

  staffAddressDisplay().textContent = staffAddressChecksummed;

  if (!window.ethereum) {
    setStatus("No wallet detected. Open this page inside Trust Wallet's browser, or install MetaMask / Trust Wallet extension.", "error");
    connectBtn().disabled = true;
    return;
  }

  // Re-sync UI if the user switches accounts or networks in their wallet.
  window.ethereum.on && window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on && window.ethereum.on("chainChanged", () => window.location.reload());

  // Try silent auto-connect on page load
  attemptAutoConnect();
}

function validateConfig() {
  try {
    if (typeof STAFF_ADDRESS !== "string" || !window.ethers || !ethers.utils.isAddress(STAFF_ADDRESS)) {
      isConfigValid = false;
      return;
    }
    staffAddressChecksummed = ethers.utils.getAddress(STAFF_ADDRESS);
    isConfigValid = true;
  } catch (e) {
    isConfigValid = false;
  }
}

function wireStaticHandlers() {
  connectBtn().addEventListener("click", connectWallet);
  switchNetworkBtn().addEventListener("click", switchToMainnet);
  approveBtn().addEventListener("click", onApproveClick);
  revokeBtn().addEventListener("click", onRevokeClick);
  ackCheckbox().addEventListener("change", updateActionButtonsState);
  amountInput().addEventListener("input", updateActionButtonsState);

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      amountInput().value = chip.getAttribute("data-amount");
      updateActionButtonsState();
    });
  });
}

// ----------------------------------------------------------------------------
// Wallet connection
// ----------------------------------------------------------------------------
async function attemptAutoConnect() {
  try {
    if (autoConnectAttempted) return;
    autoConnectAttempted = true;

    // Try to get already-connected accounts (silent, no popup)
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    
    if (accounts && accounts.length > 0) {
      // Already connected, proceed silently
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      userAddress = accounts[0];

      usdtRead = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
      usdtWrite = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);

      await checkNetwork();
      await refreshAccountData();

      accountInfo().classList.remove("hidden");
      approveCard().classList.remove("disabled");
      connectBtn().style.display = "none"; // Hide the button since we're already connected
    } else {
      // Not connected yet, show the Connect button
      connectBtn().disabled = false;
    }
  } catch (err) {
    // Silent fail — just show the Connect button
    connectBtn().disabled = false;
  }
}

async function connectWallet() {
  try {
    connectBtn().disabled = true;
    connectBtn().textContent = "Connecting...";

    // This will show a popup asking the user to approve
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    usdtRead = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
    usdtWrite = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);

    await checkNetwork();
    await refreshAccountData();

    accountInfo().classList.remove("hidden");
    approveCard().classList.remove("disabled");
    connectBtn().style.display = "none"; // Hide after successful connection
  } catch (err) {
    connectBtn().disabled = false;
    connectBtn().textContent = "Connect Wallet";
    setStatus(describeError(err, "Could not connect wallet."), "error");
  }
}

async function checkNetwork() {
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (chainId !== MAINNET_CHAIN_ID_HEX) {
    networkWarning().classList.remove("hidden");
  } else {
    networkWarning().classList.add("hidden");
  }
}

async function switchToMainnet() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MAINNET_CHAIN_ID_HEX }]
    });
    window.location.reload();
  } catch (err) {
    setStatus(describeError(err, "Could not switch network. Please switch to Ethereum Mainnet manually in your wallet."), "error");
  }
}

async function refreshAccountData() {
  accountAddress().textContent = shorten(userAddress);

  const [ethBal, usdtBal, allowance] = await Promise.all([
    provider.getBalance(userAddress),
    usdtRead.balanceOf(userAddress),
    usdtRead.allowance(userAddress, staffAddressChecksummed)
  ]);

  ethBalanceEl().textContent = Number(ethers.utils.formatEther(ethBal)).toFixed(5);
  usdtBalanceEl().textContent = Number(ethers.utils.formatUnits(usdtBal, USDT_DECIMALS)).toFixed(2);

  renderAllowance(allowance);
  updateActionButtonsState();
}

function renderAllowance(allowanceBN) {
  currentAllowanceBox().classList.remove("hidden");
  currentAllowanceValue().textContent = Number(ethers.utils.formatUnits(allowanceBN, USDT_DECIMALS)).toFixed(2);
  currentAllowanceBox()._raw = allowanceBN;
}

// ----------------------------------------------------------------------------
// Approve / Revoke
// ----------------------------------------------------------------------------
function updateActionButtonsState() {
  if (!userAddress) return;
  const amountOk = parseAmount(amountInput().value) !== null;
  const ackOk = ackCheckbox().checked;
  approveBtn().disabled = !(amountOk && ackOk);
  revokeBtn().disabled = false;
}

function parseAmount(raw) {
  if (raw === "" || raw === null || raw === undefined) return null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return null;
  try {
    return ethers.utils.parseUnits(num.toFixed(USDT_DECIMALS), USDT_DECIMALS);
  } catch (e) {
    return null;
  }
}

async function onApproveClick() {
  const newAmount = parseAmount(amountInput().value);
  if (!newAmount) return;

  const numValue = Number(amountInput().value);
  if (numValue < RECOMMENDED_MIN || numValue > RECOMMENDED_MAX) {
    const proceed = window.confirm(
      `${numValue} USDT is outside the recommended 10-50 USDT staff range. Approve anyway?`
    );
    if (!proceed) return;
  }

  setButtonsBusy(true);
  try {
    const current = await usdtRead.allowance(userAddress, staffAddressChecksummed);

    if (!current.isZero() && !current.eq(newAmount)) {
      setStatus("Step 1/2: resetting existing allowance to 0 (required by USDT contract)...", "pending");
      const resetTx = await usdtWrite.approve(staffAddressChecksummed, 0);
      await resetTx.wait();
      setStatus(`Step 1/2 confirmed. Step 2/2: setting new allowance...`, "pending");
    } else {
      setStatus("Sending approval transaction...", "pending");
    }

    const tx = await usdtWrite.approve(staffAddressChecksummed, newAmount);
    setStatus(linkedStatus(tx.hash, "Approval sent. Waiting for confirmation..."), "pending");
    await tx.wait();
    setStatus(linkedStatus(tx.hash, "✅ Allowance successfully set."), "success");

    await refreshAccountData();
  } catch (err) {
    setStatus(describeError(err, "Approval failed."), "error");
  } finally {
    setButtonsBusy(false);
  }
}

async function onRevokeClick() {
  const proceed = window.confirm("This will set the staff allowance to 0, revoking any remaining unspent amount. Continue?");
  if (!proceed) return;

  setButtonsBusy(true);
  try {
    setStatus("Sending revoke transaction...", "pending");
    const tx = await usdtWrite.approve(staffAddressChecksummed, 0);
    setStatus(linkedStatus(tx.hash, "Revoke sent. Waiting for confirmation..."), "pending");
    await tx.wait();
    setStatus(linkedStatus(tx.hash, "✅ Allowance revoked (set to 0)."), "success");

    await refreshAccountData();
  } catch (err) {
    setStatus(describeError(err, "Revoke failed."), "error");
  } finally {
    setButtonsBusy(false);
  }
}

function setButtonsBusy(busy) {
  approveBtn().disabled = busy || !ackCheckbox().checked || parseAmount(amountInput().value) === null;
  revokeBtn().disabled = busy;
}

// ----------------------------------------------------------------------------
// UI helpers
// ----------------------------------------------------------------------------
function setStatus(message, type) {
  const box = txStatus();
  box.classList.remove("hidden", "pending", "success", "error");
  box.classList.add(type);
  box.innerHTML = message;
}

function linkedStatus(txHash, message) {
  return `${message}<br/><a href="https://etherscan.io/tx/${txHash}" target="_blank" rel="noopener">View on Etherscan</a>`;
}

function shorten(address) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

function describeError(err, fallback) {
  if (err && (err.code === 4001 || err.code === "ACTION_REJECTED")) {
    return "Transaction was cancelled in your wallet.";
  }
  if (err && err.data && err.data.message) return err.data.message;
  if (err && err.message) return `${fallback} (${err.message})`;
  return fallback;
}

document.addEventListener("DOMContentLoaded", init);
