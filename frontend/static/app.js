/* =============================================
   LLM Text Summarizer — App Logic (with JWT Auth)
   ============================================= */

const API_BASE = 'http://127.0.0.1:8000';
const API = `${API_BASE}/summarize`;
const AUTH_BASE = `${API_BASE}/auth`;

// ── Token helpers ─────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('jwt_token'); }
function setToken(t) { localStorage.setItem('jwt_token', t); }
function clearToken() { localStorage.removeItem('jwt_token'); }
function getUsername() { return localStorage.getItem('jwt_user'); }
function setUsername(u) { localStorage.setItem('jwt_user', u); }
function clearUsername() { localStorage.removeItem('jwt_user'); }

// ── DOM references — main app ─────────────────────────────────────────────────
const inputText = document.getElementById('inputText');
const summarizeBtn = document.getElementById('summarizeBtn');
const errorMsg = document.getElementById('errorMsg');
const errorText = document.getElementById('errorText');
const outputPlaceholder = document.getElementById('outputPlaceholder');
const spinner = document.getElementById('spinner');
const summaryText = document.getElementById('summaryText');
const copyBtn = document.getElementById('copyBtn');
const wordBadge = document.getElementById('wordBadge');
const charBadge = document.getElementById('charBadge');
const remaining = document.getElementById('remaining');
const summaryMeta = document.getElementById('summaryMeta');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const userPill = document.getElementById('userPill');
const userPillName = document.getElementById('userPillName');
const logoutBtn = document.getElementById('logoutBtn');

// ── DOM references — auth modal ───────────────────────────────────────────────
const authOverlay = document.getElementById('authOverlay');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const panelLogin = document.getElementById('panelLogin');
const panelRegister = document.getElementById('panelRegister');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');
const regUsername = document.getElementById('regUsername');
const regPassword = document.getElementById('regPassword');
const registerError = document.getElementById('registerError');
const registerBtn = document.getElementById('registerBtn');

// ═════════════════════════════════════════════════════════════════════════════
// AUTH MODAL
// ═════════════════════════════════════════════════════════════════════════════

function showAuthModal() {
  authOverlay.classList.remove('hidden');
  authOverlay.classList.add('visible');
  loginUsername.focus();
}

function hideAuthModal() {
  authOverlay.classList.remove('visible');
  // Delay removal so the fade-out animation can play
  setTimeout(() => authOverlay.classList.add('hidden'), 300);
}

// Tab switching
tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  tabLogin.setAttribute('aria-selected', 'true');
  tabRegister.setAttribute('aria-selected', 'false');
  panelLogin.classList.remove('hidden');
  panelRegister.classList.add('hidden');
  loginError.textContent = '';
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  tabRegister.setAttribute('aria-selected', 'true');
  tabLogin.setAttribute('aria-selected', 'false');
  panelRegister.classList.remove('hidden');
  panelLogin.classList.add('hidden');
  registerError.textContent = '';
});

// Allow Enter key to submit in auth inputs
[loginUsername, loginPassword].forEach(el =>
  el.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); })
);
[regUsername, regPassword].forEach(el =>
  el.addEventListener('keydown', e => { if (e.key === 'Enter') registerBtn.click(); })
);

// Login
loginBtn.addEventListener('click', async () => {
  const user = loginUsername.value.trim();
  const pass = loginPassword.value;

  if (!user || !pass) {
    loginError.textContent = 'Please enter your username and password.';
    return;
  }

  setAuthLoading(loginBtn, true, 'Logging in...');
  loginError.textContent = '';

  try {
    const formData = new URLSearchParams({ username: user, password: pass });
    const res = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Server error ${res.status}. Check the terminal for details.`);

    setToken(data.access_token);
    setUsername(user);
    onAuthSuccess(user);
  } catch (e) {
    loginError.textContent = e.message;
  } finally {
    setAuthLoading(loginBtn, false, 'Login →');
  }
});

// Register
registerBtn.addEventListener('click', async () => {
  const user = regUsername.value.trim();
  const pass = regPassword.value;

  if (!user || !pass) {
    registerError.textContent = 'Please fill in both fields.';
    return;
  }
  if (pass.length < 6) {
    registerError.textContent = 'Password must be at least 6 characters.';
    return;
  }

  setAuthLoading(registerBtn, true, 'Creating account...');
  registerError.textContent = '';

  try {
    const res = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Server error ${res.status}. Check the terminal for details.`);

    // Auto-login after successful registration
    const loginRes = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: user, password: pass }),
    });
    const loginData = await loginRes.json().catch(() => ({}));
    if (!loginRes.ok) throw new Error(loginData.detail || `Auto-login failed (${loginRes.status}).`);

    setToken(loginData.access_token);
    setUsername(user);
    onAuthSuccess(user);
  } catch (e) {
    registerError.textContent = e.message;
  } finally {
    setAuthLoading(registerBtn, false, 'Create Account →');
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  clearToken();
  clearUsername();
  loginUsername.value = '';
  loginPassword.value = '';
  loginError.textContent = '';
  // Switch to login tab
  tabLogin.click();
  userPill.style.display = 'none';
  showAuthModal();
});

function setAuthLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.textContent = label;
}

function onAuthSuccess(username) {
  hideAuthModal();
  userPillName.textContent = username;
  userPill.style.display = 'flex';
  pingStatus();
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═════════════════════════════════════════════════════════════════════════════

// Update word/char counters as the user types
inputText.addEventListener('input', updateCounts);

// Allow Ctrl+Enter / Cmd+Enter as a keyboard shortcut to trigger summarization
inputText.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') summarize();
});

summarizeBtn.addEventListener('click', summarize);
copyBtn.addEventListener('click', copySummary);

// Recompute word count, character count, and remaining-chars counter
function updateCounts() {
  const text = inputText.value;
  const chars = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  wordBadge.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  charBadge.textContent = `${chars} char${chars !== 1 ? 's' : ''}`;

  charBadge.classList.toggle('active', chars > 0);
  wordBadge.classList.toggle('active', words > 0);

  remaining.innerHTML = `<span>${4096 - chars}</span> remaining`;
  hideError();
}

function showError(msg) {
  errorText.textContent = msg;
  errorMsg.style.display = 'flex';
}

function hideError() {
  errorMsg.style.display = 'none';
}

function setLoading(loading) {
  summarizeBtn.disabled = loading;
  summarizeBtn.textContent = loading ? '⏳ Processing...' : '✦ Summarize Text';
  spinner.style.display = loading ? 'flex' : 'none';

  if (loading) {
    outputPlaceholder.style.display = 'none';
    summaryText.style.display = 'none';
    copyBtn.style.display = 'none';
    summaryMeta.textContent = '—';
  }
}

function showSummary(text) {
  outputPlaceholder.style.display = 'none';
  spinner.style.display = 'none';
  summaryText.textContent = text;
  summaryText.style.display = 'block';
  copyBtn.style.display = 'flex';

  const words = text.trim().split(/\s+/).length;
  summaryMeta.innerHTML = `summary: <span>${words} words</span>`;
}

// Send the input text to the FastAPI backend and display the result
async function summarize() {
  const text = inputText.value.trim();

  if (!text) {
    showError('Input is empty. Please paste some text to summarize.');
    return;
  }

  const token = getToken();
  if (!token) {
    showAuthModal();
    return;
  }

  hideError();
  setLoading(true);

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    // Token expired or invalid → force re-login
    if (res.status === 401) {
      clearToken();
      clearUsername();
      setLoading(false);
      showAuthModal();
      showError('Session expired. Please log in again.');
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server error: ${res.status}`);
    }

    const data = await res.json();
    if (!data.summary) throw new Error('No summary returned from the server.');

    setLoading(false);
    showSummary(data.summary);
    setStatus(true);

  } catch (e) {
    setLoading(false);
    outputPlaceholder.style.display = summaryText.style.display === 'block' ? 'none' : 'flex';

    if (e.name === 'TypeError') {
      showError('Cannot reach the server. Make sure FastAPI is running at 127.0.0.1:8000.');
      setStatus(false);
    } else {
      showError(e.message);
    }
  }
}

async function copySummary() {
  const text = summaryText.textContent;

  try {
    await navigator.clipboard.writeText(text);

    copyBtn.classList.add('copied');
    copyBtn.innerHTML = `
      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg> Copied!`;

    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = `
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg> Copy`;
    }, 2000);

  } catch {
    showError('Clipboard access denied.');
  }
}

function setStatus(online) {
  statusDot.className = 'status-dot ' + (online ? 'online' : 'offline');
  statusText.textContent = online ? 'API online' : 'API offline';
}

async function pingStatus() {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${API_BASE}/`, { signal: ctrl.signal });
    setStatus(res.ok || res.status < 500);
  } catch {
    setStatus(false);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// INIT — show modal or restore session
// ═════════════════════════════════════════════════════════════════════════════
(function init() {
  const token = getToken();
  const user = getUsername();

  if (token && user) {
    // Restore previous session
    userPillName.textContent = user;
    userPill.style.display = 'flex';
    authOverlay.classList.add('hidden');
    pingStatus();
  } else {
    userPill.style.display = 'none';
    showAuthModal();
    // Still ping so the status pill updates when the server is reachable
    pingStatus();
  }
})();