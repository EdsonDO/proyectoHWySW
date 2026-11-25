import { APP_CONFIG } from '../../core/config.js';
import { formatLocalIso, formatShortDate, nowLocal, todayIso } from '../../core/date.js';
import { esc, escAttr } from '../../core/sanitize.js';
import { barChart, columnChart, donutChart, STATUS_COLORS } from '../../ui/charts.js';

export function createDashboardView({ assetService, softwareService, maintenanceService, incidentService, transferService, evaluationService }) {
  function countBy(list, getter) {
    return list.reduce((acc, item) => {
      const k = getter(item);
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }

  function getRecentActivity() {
    const today = todayIso();
    const items = [
      ...maintenanceService
        .getAll()
        .filter(m => m.fecha <= today)
        .map(m => ({ f: m.fecha, t: `${m.tipo} de ${m.categoria.toLowerCase()} en ${m.equipo}: ${m.estado.toLowerCase()}` })),
      ...incidentService
        .getAll()
        .map(i => ({ f: i.fecha, t: `${i.id} · ${i.descripcion} (${i.equipo})` }))
    ];
    return items.sort((a, b) => b.f.localeCompare(a.f)).slice(0, 6);
  }

  function render() {
    const assets = assetService.getAll();
    const maintenances = maintenanceService.getAll();
    const incidents = incidentService.getAll();
    const countStatus = status => assets.filter(e => e.estado === status).length;

    const kpis = [
      ['Equipos registrados', assets.length, 'Parque total por áreas', 'hardware', ''],
      ['Operativos', countStatus('Operativo'), 'Disponibles para operación', 'hardware', 'ok'],
      ['En mantenimiento', countStatus('En mantenimiento'), 'Intervención técnica en curso', 'mant-hw', 'warn'],
      ['Inoperativos', countStatus('Inoperativo'), 'Equipos fuera de servicio', 'hardware', 'bad'],
      ['Mantenimientos pendientes', maintenances.filter(m => m.estado !== 'Realizado').length, 'Programados, en proceso o atrasados', 'planificacion', 'warn'],
      ['Incidencias abiertas', incidentService.getOpenCount(), 'Órdenes sin resolver ni cerrar', 'ordenes', 'bad'],
      ['Licencias por vencer', softwareService.getExpiringLicenses().length, 'Vencen en 60 días o menos', 'software', 'warn'],
      ['Requieren evaluación', assets.filter(e => evaluationService.requiresEvaluation(e)).length, 'Según criterios técnicos activos', 'evaluacion', '']
    ];

    const now = nowLocal();
    const perMonth = {};
    for (let i = 0; i < 6; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const ym = formatLocalIso(d).slice(0, 7);
      const label = d.toLocaleDateString(APP_CONFIG.locale, { month: 'short' });
      perMonth[label] = maintenances.filter(m => m.estado === 'Realizado' && m.fecha.slice(0, 7) === ym).length;
    }

    const perArea = {};
    transferService.getAreas().forEach(a => {
      perArea[a.nombre] = assets.filter(e => e.area === a.id).length;
    });

    const alerts = evaluationService.getAlerts();
    const activity = getRecentActivity();

    return `
      <div class="head">
        <div>
          <h2 class="page-title">Dashboard</h2>
          <p class="page-sub">Resumen operativo del parque informático e indicadores en tiempo real.</p>
        </div>
      </div>
      <section class="kpis">
        ${kpis
          .map(
            k => `<button type="button" class="kpi ${escAttr(k[4])}" data-go="${escAttr(k[3])}"><small>${esc(k[0])}</small><b>${k[1]}</b><span>${esc(k[2])}</span></button>`
          )
          .join('')}
      </section>
      <section class="grid">
        <article class="panel"><h3>Equipos por estado</h3>${donutChart(countBy(assets, e => e.estado), STATUS_COLORS)}</article>
        <article class="panel"><h3>Equipos por área</h3>${barChart(perArea)}</article>
        <article class="panel"><h3>Mantenimientos realizados por tipo</h3>${barChart(countBy(maintenances.filter(m => m.estado === 'Realizado'), m => m.tipo))}</article>
        <article class="panel"><h3>Incidencias por categoría</h3>${barChart(countBy(incidents, i => i.categoria))}</article>
        <article class="panel wide"><h3>Mantenimientos realizados por mes</h3>${columnChart(perMonth)}</article>
        <article class="panel">
          <h3>Alertas activas</h3>
          ${
            alerts.length
              ? `<ul class="feed">${alerts.map(a => `<li class="alert ${escAttr(a.nivel)}" data-go="${escAttr(a.ir)}">${esc(a.texto)}</li>`).join('')}</ul>`
              : '<p class="muted">No se registran alertas críticas.</p>'
          }
        </article>
        <article class="panel wide">
          <h3>Actividad reciente</h3>
          <ul class="feed">${activity.map(x => `<li><time>${esc(formatShortDate(x.f))}</time><span>${esc(x.t)}</span></li>`).join('')}</ul>
        </article>
      </section>`;
  }

  return { render };
}
