import { APP_CONFIG } from './core/config.js';
import { formatLongHeaderDate } from './core/date.js';
import { Router } from './core/router.js';
import { esc, escAttr } from './core/sanitize.js';
import { createServiceContainer } from './services/ServiceContainer.js';
import { icon, ICONS } from './ui/icons.js';
import { showToast } from './ui/toast.js';
import { createLoginView } from './modules/login/LoginView.js';
import { createDashboardView } from './modules/dashboard/DashboardView.js';
import { createHardwareView } from './modules/hardware/HardwareView.js';
import { createFichaView } from './modules/ficha/FichaView.js';
import { createSoftwareView } from './modules/software/SoftwareView.js';
import { createMaintenanceView } from './modules/maintenance/MaintenanceView.js';
import { createIncidentsView } from './modules/incidents/IncidentsView.js';
import { createHistoryView } from './modules/history/HistoryView.js';
import { createPlanningView } from './modules/planning/PlanningView.js';
import { createEvaluationView } from './modules/evaluation/EvaluationView.js';
import { createAreasView } from './modules/areas/AreasView.js';
import { createReportsView } from './modules/reports/ReportsView.js';
import { createSettingsView } from './modules/settings/SettingsView.js';

const services = createServiceContainer();
const router = new Router('dashboard');

const el = id => document.getElementById(id);

let currentRoute = { id: 'dashboard', param: '' };

const rerenderCurrent = () => renderRoute(currentRoute);

const loginView = createLoginView({ authService: services.authService });

const dashboardView = createDashboardView({
  assetService: services.assetService,
  softwareService: services.softwareService,
  maintenanceService: services.maintenanceService,
  incidentService: services.incidentService,
  transferService: services.transferService,
  evaluationService: services.evaluationService
});

const fichaView = createFichaView({
  assetService: services.assetService,
  softwareService: services.softwareService,
  maintenanceService: services.maintenanceService,
  incidentService: services.incidentService,
  historyService: services.historyService,
  evaluationService: services.evaluationService,
  onEditAsset: code => hardwareView.openAssetModal(code)
});

const hardwareView = createHardwareView({
  assetService: services.assetService,
  transferService: services.transferService,
  authService: services.authService,
  router,
  onOpenFichaTab: (code, tab) => fichaView.setActiveTab(code, tab)
});

const softwareView = createSoftwareView({
  softwareService: services.softwareService,
  assetService: services.assetService,
  onRerender: rerenderCurrent
});

const maintenanceView = createMaintenanceView({
  maintenanceService: services.maintenanceService,
  assetService: services.assetService,
  systemService: services.systemService,
  onRerender: rerenderCurrent
});

const incidentsView = createIncidentsView({
  incidentService: services.incidentService,
  assetService: services.assetService,
  systemService: services.systemService,
  onRerender: rerenderCurrent
});

const historyView = createHistoryView({
  historyService: services.historyService,
  assetService: services.assetService,
  systemService: services.systemService,
  onRerender: rerenderCurrent
});

const planningView = createPlanningView({
  maintenanceService: services.maintenanceService,
  assetService: services.assetService,
  transferService: services.transferService,
  systemService: services.systemService,
  onViewMaintenance: id => maintenanceView.openDetailModal(id),
  onRerender: rerenderCurrent
});

const evaluationView = createEvaluationView({
  evaluationService: services.evaluationService,
  assetService: services.assetService,
  transferService: services.transferService,
  onScheduleMaintenance: code => planningView.openScheduleModal(code),
  onRegisterModification: code => historyView.openModificationModal(code),
  onRerender: rerenderCurrent
});

const areasView = createAreasView({
  transferService: services.transferService,
  assetService: services.assetService,
  onRerender: rerenderCurrent
});

const reportsView = createReportsView({
  reportService: services.reportService,
  assetService: services.assetService,
  transferService: services.transferService,
  onRerender: rerenderCurrent
});

const settingsView = createSettingsView({
  assetService: services.assetService,
  softwareService: services.softwareService,
  maintenanceService: services.maintenanceService,
  incidentService: services.incidentService,
  historyService: services.historyService,
  transferService: services.transferService,
  auditService: services.auditService,
  systemService: services.systemService
});

const MODULES = [
  { id: 'dashboard', title: 'Dashboard', icon: ICONS.dashboard, render: () => dashboardView.render() },
  { id: 'hardware', title: 'Inventario de hardware', icon: ICONS.hardware, render: () => hardwareView.render(), bind: root => hardwareView.bind(root) },
  { id: 'software', title: 'Inventario de software', icon: ICONS.software, render: () => softwareView.render(), bind: root => softwareView.bind(root) },
  { id: 'fichas', title: 'Fichas técnicas', icon: ICONS.fichas, render: p => fichaView.render(p), bind: (root, p) => fichaView.bind(root, p) },
  { id: 'mant-hw', title: 'Mantenimiento de hardware', icon: ICONS.mantHw, render: () => maintenanceView.render('Hardware'), bind: root => maintenanceView.bind(root, 'Hardware') },
  { id: 'mant-sw', title: 'Mantenimiento de software', icon: ICONS.mantSw, render: () => maintenanceView.render('Software'), bind: root => maintenanceView.bind(root, 'Software') },
  { id: 'ordenes', title: 'Órdenes de trabajo', icon: ICONS.ordenes, render: () => incidentsView.render(), bind: root => incidentsView.bind(root) },
  { id: 'historial', title: 'Historial técnico', icon: ICONS.historial, render: () => historyView.render(), bind: root => historyView.bind(root) },
  { id: 'planificacion', title: 'Planificación', icon: ICONS.planificacion, render: () => planningView.render(), bind: root => planningView.bind(root) },
  { id: 'evaluacion', title: 'Evaluación y repotenciación', icon: ICONS.evaluacion, render: () => evaluationView.render(), bind: root => evaluationView.bind(root) },
  { id: 'reportes', title: 'Reportes', icon: ICONS.reportes, render: () => reportsView.render(), bind: root => reportsView.bind(root) },
  { id: 'areas', title: 'Áreas y asignaciones', icon: ICONS.areas, render: () => areasView.render(), bind: root => areasView.bind(root) },
  { id: 'config', title: 'Configuración', icon: ICONS.config, render: () => settingsView.render(), bind: root => settingsView.bind(root) }
];

function toggleSidebar(open) {
  el('sidebar').classList.toggle('open', open);
  el('sidebar-backdrop').hidden = !open;
}

function renderNotifications() {
  const alerts = services.evaluationService.getAlerts();
  el('bell').innerHTML = `${icon(ICONS.bell)}${alerts.length ? `<i class="badge">${alerts.length}</i>` : ''}`;
  el('notif').innerHTML =
    `<h4>Notificaciones (${alerts.length})</h4>` +
    (alerts.length
      ? alerts.map(a => `<a class="alert ${escAttr(a.nivel)}" data-go="${escAttr(a.ir)}">${esc(a.texto)}</a>`).join('')
      : '<p class="muted empty-msg">Sin alertas pendientes.</p>');
}

function renderUserControl() {
  const user = services.authService.getCurrentUser();
  if (!user) return;
  el('user-menu-btn').innerHTML = `
    <span class="user-avatar">${esc(user.initials)}</span>
    <span class="user-meta"><b>${esc(user.name)}</b><small>${esc(user.role)}</small></span>`;

  const accounts = services.authService.getAvailableAccounts();
  el('user-drop').innerHTML = `
    <h4>Sesión institucional</h4>
    ${accounts
      .map(
        acc => `<button type="button" class="drop-item" data-switch-email="${escAttr(acc.email)}">
          <span><b>${esc(acc.name)}</b><br><small>${esc(acc.role)}</small></span>
          ${acc.email === user.email ? '<span class="tag ok">Activa</span>' : ''}
        </button>`
      )
      .join('')}
    <div class="drop-sep"></div>
    <button type="button" class="drop-item danger" id="btn-logout">
      <span>Cerrar sesión</span>
      ${icon(ICONS.logout)}
    </button>`;

  el('user-drop').querySelectorAll('[data-switch-email]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetEmail = btn.dataset.switchEmail;
      el('user-drop').hidden = true;
      if (targetEmail === user.email) return;
      const res = await services.authService.switchAccount(targetEmail);
      if (res.ok) showToast(`Perfil activo: ${res.user.name} (${res.user.role})`);
    });
  });

  el('btn-logout').addEventListener('click', () => {
    el('user-drop').hidden = true;
    services.authService.logout();
  });
}

function renderRoute(route) {
  currentRoute = route;
  if (!services.authService.isAuthenticated()) {
    el('app-shell').hidden = true;
    const authRoot = el('auth-root');
    authRoot.hidden = false;
    authRoot.innerHTML = loginView.render();
    loginView.bind(authRoot);
    document.title = `Acceso · ${APP_CONFIG.appName}`;
    return;
  }

  el('auth-root').hidden = true;
  el('app-shell').hidden = false;

  const mod = MODULES.find(m => m.id === route.id) || MODULES[0];
  document.body.dataset.route = mod.id;
  const viewRoot = el('view');
  viewRoot.innerHTML = mod.render(route.param);
  if (mod.bind) mod.bind(viewRoot, route.param);

  document.title = `${mod.title} · ${APP_CONFIG.appName}`;
  renderNotifications();
  renderUserControl();

  document.querySelectorAll('#menu a').forEach(link => {
    link.classList.toggle('on', link.dataset.go === mod.id);
  });
  toggleSidebar(false);
  window.scrollTo(0, 0);
}

function bootstrapShell() {
  el('menu').innerHTML = MODULES.map(
    m => `<a href="#${escAttr(m.id)}" data-go="${escAttr(m.id)}">${icon(m.icon)}<span>${esc(m.title)}</span></a>`
  ).join('');
  el('burger').innerHTML = icon(ICONS.menu);
  el('fecha').textContent = formatLongHeaderDate();

  el('burger').addEventListener('click', () => {
    const isOpen = el('sidebar').classList.contains('open');
    toggleSidebar(!isOpen);
  });
  el('sidebar-backdrop').addEventListener('click', () => toggleSidebar(false));

  el('bell').addEventListener('click', () => {
    el('user-drop').hidden = true;
    el('notif').hidden = !el('notif').hidden;
  });

  el('user-menu-btn').addEventListener('click', () => {
    el('notif').hidden = true;
    el('user-drop').hidden = !el('user-drop').hidden;
  });

  el('q').addEventListener('input', () => {
    const query = el('q').value.trim();
    if (!query) {
      el('res').hidden = true;
      return;
    }
    const matches = services.assetService.searchQuick(query);
    el('res').innerHTML = matches.length
      ? matches
          .map(
            e => `<a data-go="fichas/${escAttr(e.codigo)}"><span><b class="mono">${esc(e.codigo)}</b> ${esc(e.marca)} ${esc(e.modelo)}</span><small>${esc(e.estado)}</small></a>`
          )
          .join('')
      : '<p class="muted empty-msg">Sin resultados para esa búsqueda.</p>';
    el('res').hidden = false;
  });

  document.addEventListener('click', ev => {
    const goEl = ev.target.closest('[data-go]');
    if (goEl) {
      const target = goEl.dataset.go;
      el('res').hidden = true;
      el('notif').hidden = true;
      if (goEl.tagName !== 'A' || !goEl.getAttribute('href')) {
        ev.preventDefault();
        router.navigate(target);
      }
    }
    if (!ev.target.closest('.search')) el('res').hidden = true;
    if (!ev.target.closest('.rel')) {
      el('notif').hidden = true;
      el('user-drop').hidden = true;
    }
  });

  services.eventBus.on('api:state', ({ busy }) => {
    el('sync-bar').classList.toggle('busy', busy);
    const pill = el('conn-status');
    pill.classList.toggle('syncing', busy);
    pill.querySelector('.conn-text').textContent = busy ? 'Sincronizando...' : 'Servicio activo';
  });

  services.eventBus.on('data:changed', () => {
    renderRoute(currentRoute);
  });

  services.eventBus.on('auth:changed', () => {
    renderRoute(currentRoute);
  });

  router.subscribe(route => renderRoute(route));
  router.start();
}

bootstrapShell();
