(() => {
  'use strict';

  const PUBLIC_KEY = 'symbioPublicAccess';

  function publicUser() {
    return {
      id: 'public-access-v1',
      email: 'public-access@symbio.local',
      user_metadata: {
        full_name: 'Alumno Invitado',
        public_access: true,
      },
    };
  }

  function unlockEverything() {
    try {
      const ids = courseSeed.map(course => course.id);
      LS.set(userKey('enrollments'), ids);
      LS.set(userKey('plan'), 'Acceso público completo');
      const profile = LS.get(userKey('profile'), null);
      if (!profile) {
        LS.set(userKey('profile'), {
          name: 'Alumno Invitado',
          phone: '',
          level: 'B1',
          goal: 'Conversación',
          bio: 'Acceso público con todos los cursos desbloqueados.',
        });
      }
    } catch (error) {
      console.error('No fue posible preparar el contenido público', error);
    }
  }

  function forcePublicSession() {
    localStorage.setItem(PUBLIC_KEY, '1');
    user = publicUser();
    session = { user, public_access: true };
    unlockEverything();
    syncUI();

    const login = document.getElementById('loginBtn');
    const start = document.getElementById('startBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const gate = document.getElementById('authGate');
    const shell = document.getElementById('appShell');
    const admin = document.getElementById('adminNav');
    const label = document.getElementById('sessionLabel');

    if (login) login.classList.add('hidden');
    if (start) start.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (gate) gate.classList.add('hidden');
    if (shell) shell.classList.remove('hidden');
    if (admin) admin.classList.add('hidden');
    if (label) label.textContent = 'Acceso público completo';

    const dashboard = document.getElementById('view-dashboard');
    if (dashboard && !dashboard.querySelector('[data-public-banner]')) {
      const banner = document.createElement('div');
      banner.className = 'success';
      banner.dataset.publicBanner = 'true';
      banner.style.marginBottom = '16px';
      banner.innerHTML = '<strong>Acceso abierto:</strong> todos los cursos, exámenes y herramientas están desbloqueados sin registro.';
      dashboard.prepend(banner);
    }
  }

  function patchApp() {
    if (typeof syncUI !== 'function' || typeof courseSeed === 'undefined') {
      setTimeout(patchApp, 120);
      return;
    }

    const originalSyncUI = syncUI;
    syncUI = function publicSyncUI() {
      originalSyncUI();
      if (localStorage.getItem(PUBLIC_KEY) === '1') {
        const admin = document.getElementById('adminNav');
        if (admin) admin.classList.add('hidden');
        const gate = document.getElementById('authGate');
        const shell = document.getElementById('appShell');
        if (gate) gate.classList.add('hidden');
        if (shell) shell.classList.remove('hidden');
      }
    };

    const originalLogout = logout;
    logout = async function publicLogout() {
      localStorage.removeItem(PUBLIC_KEY);
      return originalLogout();
    };

    forcePublicSession();
    location.hash = 'app';
    if (typeof showView === 'function') showView('dashboard');

    if (typeof sb !== 'undefined' && sb?.auth?.onAuthStateChange) {
      sb.auth.onAuthStateChange((_event, nextSession) => {
        if (!nextSession && localStorage.getItem(PUBLIC_KEY) === '1') {
          setTimeout(forcePublicSession, 0);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', patchApp, { once: true });
  } else {
    patchApp();
  }
})();