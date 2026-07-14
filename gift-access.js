(() => {
  'use strict';

  const SESSION_KEY = 'symbioGiftSession';
  const USER_HASH = 'c7884408b259babb3641151d12172924526692cb3710b7e8318460cf03bf4322';
  const PASS_HASH = 'd02e8868b5b2d454188bff384a48f7bd50b5ba1c7961fc574642348045288e27';

  const isGiftActive = () => localStorage.getItem(SESSION_KEY) === '1';

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function validGiftCredentials(login, password) {
    const normalizedLogin = String(login || '').trim().toUpperCase();
    const normalizedPassword = String(password || '').trim().toUpperCase();
    const [loginHash, passwordHash] = await Promise.all([
      sha256(`${normalizedLogin}|symbio-user-2026`),
      sha256(`${normalizedPassword}|symbio-pass-2026`),
    ]);
    return loginHash === USER_HASH && passwordHash === PASS_HASH;
  }

  function giftUser() {
    return {
      id: 'gift-access-v1',
      email: 'gift-access@symbio.local',
      user_metadata: {
        full_name: 'Invitado Premium',
        gift_access: true,
      },
    };
  }

  function ensureAllUnlocked() {
    const ids = courseSeed.map(course => course.id);
    LS.set(userKey('enrollments'), ids);
    LS.set(userKey('plan'), 'Cortesía · Acceso total');
    const currentProfile = LS.get(userKey('profile'), null);
    if (!currentProfile) {
      LS.set(userKey('profile'), {
        name: 'Invitado Premium',
        phone: '',
        level: 'B1',
        goal: 'Conversación',
        bio: 'Acceso de cortesía con todos los cursos desbloqueados.',
      });
    }
  }

  function addGiftBanner() {
    const dashboard = document.getElementById('view-dashboard');
    if (!dashboard || dashboard.querySelector('[data-gift-banner]')) return;
    const banner = document.createElement('div');
    banner.className = 'success';
    banner.dataset.giftBanner = 'true';
    banner.style.marginTop = '16px';
    banner.innerHTML = '<strong>Acceso de cortesía activo:</strong> todos los cursos, exámenes y herramientas premium están desbloqueados sin cobro.';
    dashboard.prepend(banner);
  }

  function activateGiftAccess() {
    localStorage.setItem(SESSION_KEY, '1');
    user = giftUser();
    session = { user, gift_access: true };
    ensureAllUnlocked();
    syncUI();
    const label = document.getElementById('sessionLabel');
    if (label) label.textContent = 'Invitado Premium';
    const admin = document.getElementById('adminNav');
    if (admin) admin.classList.add('hidden');
    addGiftBanner();
    closeModal('authModal');
    location.hash = 'app';
    showView('dashboard');
  }

  function patchLoginInterface() {
    const loginInput = document.getElementById('authEmail');
    const form = document.getElementById('authForm');
    if (!loginInput || !form) return;

    loginInput.type = authMode === 'login' ? 'text' : 'email';
    loginInput.placeholder = authMode === 'login' ? 'Correo o usuario' : 'Correo electrónico';

    if (!document.getElementById('giftAccessNotice')) {
      const notice = document.createElement('div');
      notice.id = 'giftAccessNotice';
      notice.className = 'notice';
      notice.textContent = 'Los accesos de cortesía se escriben en los mismos campos. Las credenciales no aparecen publicadas en la plataforma.';
      form.insertBefore(notice, document.getElementById('authMsg'));
    }

    const originalSetAuthMode = setAuthMode;
    setAuthMode = function patchedSetAuthMode(mode) {
      originalSetAuthMode(mode);
      loginInput.type = mode === 'login' ? 'text' : 'email';
      loginInput.placeholder = mode === 'login' ? 'Correo o usuario' : 'Correo electrónico';
    };

    form.addEventListener('submit', async event => {
      if (authMode !== 'login') return;
      const login = loginInput.value;
      const password = document.getElementById('authPassword').value;
      if (!(await validGiftCredentials(login, password))) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      activateGiftAccess();
      const message = document.getElementById('authMsg');
      if (message) message.innerHTML = '<div class="success">Acceso de cortesía activado. Todo el contenido está desbloqueado.</div>';
    }, true);
  }

  function patchLogout() {
    const originalLogout = logout;
    logout = async function patchedLogout() {
      if (!isGiftActive()) return originalLogout();
      localStorage.removeItem(SESSION_KEY);
      user = null;
      session = null;
      syncUI();
      const label = document.getElementById('sessionLabel');
      if (label) label.textContent = '';
    };
  }

  function patchDashboard() {
    const originalRenderDashboard = renderDashboard;
    renderDashboard = function patchedRenderDashboard() {
      originalRenderDashboard();
      if (isGiftActive()) addGiftBanner();
    };
  }

  function bootstrap() {
    patchLoginInterface();
    patchLogout();
    patchDashboard();

    if (isGiftActive()) activateGiftAccess();

    if (typeof sb !== 'undefined' && sb?.auth?.onAuthStateChange) {
      sb.auth.onAuthStateChange((_event, nextSession) => {
        if (!nextSession && isGiftActive()) setTimeout(activateGiftAccess, 0);
      });
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => setTimeout(bootstrap, 350), { once: true });
  } else {
    setTimeout(bootstrap, 350);
  }
})();
