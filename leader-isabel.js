(() => {
  'use strict';

  const LEADER_NAME = 'Isabel Varosa';
  const LEADER_ROLE = 'Directora Académica y Líder de Comunidad';

  function createLeaderSection(doc) {
    if (!doc || doc.getElementById('isabelLeadership')) return;

    const section = doc.createElement('section');
    section.id = 'isabelLeadership';
    section.innerHTML = `
      <div class="container">
        <div class="card" style="display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center;padding:26px;border-color:rgba(248,204,114,.38);background:linear-gradient(135deg,rgba(248,204,114,.09),rgba(154,125,255,.08));">
          <div aria-hidden="true" style="width:92px;height:92px;border-radius:24px;display:grid;place-items:center;background:linear-gradient(135deg,#f8cc72,#9a7dff);color:#07111f;font-weight:950;font-size:2rem;box-shadow:0 16px 38px rgba(0,0,0,.2)">IV</div>
          <div>
            <span class="badge">Dirección académica</span>
            <h2 style="margin:10px 0 6px">${LEADER_NAME}</h2>
            <h3 style="margin:0 0 10px;color:#f8cc72">${LEADER_ROLE}</h3>
            <p style="margin:0;color:var(--muted);line-height:1.65">Responsable de orientar la experiencia educativa, coordinar la comunidad de alumnos y fortalecer la calidad de los cursos, acompañamientos y actividades de Symbio English Pro+.</p>
          </div>
        </div>
      </div>`;

    const appSection = doc.getElementById('app');
    const pricingSection = doc.getElementById('pricing');
    const parent = appSection?.parentNode || doc.querySelector('main');
    if (!parent) return;
    parent.insertBefore(section, appSection || pricingSection || null);
  }

  function addDashboardLeadership(doc) {
    const dashboard = doc.getElementById('view-dashboard');
    if (!dashboard || dashboard.querySelector('[data-isabel-leader]')) return;
    const card = doc.createElement('div');
    card.className = 'card';
    card.dataset.isabelLeader = 'true';
    card.style.marginTop = '16px';
    card.innerHTML = `
      <div class="row">
        <div>
          <span class="badge">Liderazgo académico</span>
          <h3 style="margin:10px 0 4px">${LEADER_NAME}</h3>
          <p style="margin:0">${LEADER_ROLE}</p>
        </div>
        <div aria-hidden="true" style="width:58px;height:58px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,#f8cc72,#9a7dff);color:#07111f;font-weight:950">IV</div>
      </div>`;
    dashboard.appendChild(card);
  }

  function patchDashboard(doc) {
    if (typeof doc.defaultView?.renderDashboard === 'function') {
      const original = doc.defaultView.renderDashboard;
      doc.defaultView.renderDashboard = function patchedRenderDashboard(...args) {
        const result = original.apply(this, args);
        addDashboardLeadership(doc);
        return result;
      };
    }
    addDashboardLeadership(doc);
  }

  function boot(doc = document) {
    createLeaderSection(doc);
    patchDashboard(doc);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => boot(document), 250), { once: true });
  } else {
    setTimeout(() => boot(document), 250);
  }
})();
