import { APP_CONFIG } from '../../core/config.js';
import { formatTimestamp, todayIso } from '../../core/date.js';
import { esc } from '../../core/sanitize.js';
import { badge, dataTable, kvList } from '../../ui/components.js';
import { confirmDialog } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';

export function createSettingsView({
  assetService,
  softwareService,
  maintenanceService,
  incidentService,
  historyService,
  transferService,
  auditService,
  systemService
}) {
  function render() {
    const techs = systemService.getTechnicians();
    const maint = maintenanceService.getAll();
    const incidents = incidentService.getAll();
    const logs = auditService.getAll().slice(0, 12);

    const summaryRows = [
      ['Equipos informáticos', assetService.getAll().length, badge('Vigente')],
      ['Áreas institucionales', transferService.getAreas().length, badge('Vigente')],
      ['Especialistas de soporte', techs.length, badge('Vigente')],
      ['Registros de mantenimiento', maint.length, badge('Vigente')],
      ['Órdenes de trabajo', incidents.length, badge('Vigente')],
      ['Modificaciones de hardware', historyService.getAll().length, badge('Vigente')],
      ['Paquetes de software', softwareService.getAll().length, badge('Vigente')],
      ['Licencias administradas', softwareService.getLicensesWithUsage().length, badge('Vigente')]
    ];

    const techRows = techs.map(t => [
      esc(t),
      maint.filter(m => m.tecnico === t).length,
      incidents.filter(i => i.tecnico === t).length
    ]);

    const auditRows = logs.map(entry => [
      `<span class="mono">${esc(entry.id)}</span>`,
      `<span class="mono">${esc(formatTimestamp(entry.timestamp))}</span>`,
      badge(entry.method),
      `<span class="mono">${esc(entry.endpoint)}</span>`,
      esc(entry.user),
      esc(entry.summary)
    ]);

    return `
      <div class="head">
        <div>
          <h2 class="page-title">Configuración y administración</h2>
          <p class="page-sub">Estado de los registros institucionales, respaldos de datos y bitácora de auditoría.</p>
        </div>
      </div>
      <div class="grid">
        <article class="panel wide">
          <h3>Estado de colecciones del sistema</h3>
          ${dataTable(['Colección', 'Registros activos', 'Estado'], summaryRows, '')}
        </article>
        <article class="panel">
          <h3>Respaldo y mantenimiento</h3>
          <p class="muted">Sincronización persistente: ${badge(systemService.isPersistent() ? 'Vigente' : 'Atención')}</p>
          <p class="muted" style="margin-top:8px;font-size:13px">Exporta o restaura el estado completo del inventario en formato JSON institucional.</p>
          <div class="cfg-actions">
            <button type="button" class="btn pri" id="btn-export-json">Exportar respaldo JSON</button>
            <button type="button" class="btn" id="btn-import-json">Importar respaldo</button>
            <button type="button" class="btn danger" id="btn-reset-data">Restablecer datos base</button>
          </div>
          <input type="file" id="import-json-file" class="file-input-hidden" accept="application/json">
          <h3 style="margin-top:20px">Información de la plataforma</h3>
          ${kvList(
            [
              ['Sistema', `${esc(APP_CONFIG.appName)} · v${esc(APP_CONFIG.version)}`],
              ['Arquitectura', 'Modular ES6 · Capas de Servicios y Repositorios'],
              ['Persistencia', 'Almacenamiento transaccional automático']
            ],
            true
          )}
        </article>
        <article class="panel wide">
          <h3>Carga operativa por técnico</h3>
          ${dataTable(['Especialista', 'Mantenimientos asignados', 'Órdenes de trabajo'], techRows, '')}
        </article>
        <article class="panel" style="grid-column:1 / -1">
          <h3>Bitácora de auditoría reciente</h3>
          ${dataTable(['ID', 'Fecha y hora', 'Operación', 'Recurso', 'Usuario', 'Detalle'], auditRows, 'Sin eventos registrados.')}
        </article>
      </div>`;
  }

  function bind(root) {
    root.querySelector('#btn-export-json').addEventListener('click', () => {
      const snapshot = systemService.exportSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sigai-respaldo-${todayIso()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Respaldo descargado: ${a.download}`);
    });

    const fileInput = root.querySelector('#import-json-file');
    root.querySelector('#btn-import-json').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const res = await systemService.importSnapshot(parsed);
        if (!res.ok) {
          showToast(res.error, 'error');
          return;
        }
        showToast('Respaldo institucional restaurado correctamente');
      } catch {
        showToast('No se pudo leer el archivo JSON seleccionado.', 'error');
      } finally {
        fileInput.value = '';
      }
    });

    root.querySelector('#btn-reset-data').addEventListener('click', () => {
      confirmDialog(
        'Restablecer datos base',
        'Se reemplazarán las colecciones actuales por los registros institucionales iniciales. Esta acción queda registrada en auditoría.',
        'Restablecer',
        async () => {
          const res = await systemService.resetAll();
          if (res.ok) showToast('Registros base restablecidos correctamente');
        },
        true
      );
    });
  }

  return { render, bind };
}
