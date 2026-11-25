import { todayIso } from '../../core/date.js';
import { esc, escAttr } from '../../core/sanitize.js';
import { badge, dataTable, kvList } from '../../ui/components.js';
import { RECOMMENDATIONS } from '../../services/EvaluationService.js';

const TABS = [
  'Información general',
  'Hardware',
  'Software instalado',
  'Mantenimientos',
  'Historial de modificaciones',
  'Incidencias',
  'Evaluación'
];

export function createFichaView({ assetService, softwareService, maintenanceService, incidentService, historyService, evaluationService, onEditAsset }) {
  let activeTab = 0;
  let activeCode = null;

  function setActiveTab(code, tabIndex) {
    activeCode = code;
    activeTab = tabIndex;
  }

  function renderEvaluationSummary(asset) {
    const v = evaluationService.evaluate(asset);
    const rows = [
      ['Antigüedad', `${v.edad} años`, 'Reemplazo desde 8 años', v.edad >= 8],
      ['Memoria RAM', `${asset.ram} GB`, 'Ampliar con 4 GB o menos', asset.ram <= 4],
      ['Almacenamiento', esc(asset.disco), 'HDD: migrar a SSD', String(asset.disco).startsWith('HDD')],
      ['Índice de rendimiento', `${v.perf} de 100`, 'Alerta por debajo de 50', v.perf < 50],
      ['Incidencias registradas', `${v.inc} (${v.abiertas} abiertas)`, 'Atender órdenes abiertas', v.abiertas > 0],
      ['Mantenimientos en 12 meses', String(v.mant12), 'Último hace más de 180 días', v.dSin !== null && v.dSin > 180],
      ['Costos acumulados', `S/ ${v.costo}`, 'Informativo', false]
    ];

    const tableHtml = dataTable(
      ['Indicador', 'Valor', 'Criterio', 'Resultado'],
      rows.map(r => [r[0], r[1], r[2], r[3] ? badge('Atención') : badge('Adecuado')]),
      ''
    );

    const reasonsHtml = v.recs
      .map(k => {
        const [label, tone] = RECOMMENDATIONS[k];
        return `<li><span class="tag ${tone}">${esc(label)}</span><span>${esc(v.razones[k] || 'No presenta criterios de alerta.')}</span></li>`;
      })
      .join('');

    return `${tableHtml}<h4>Recomendaciones técnicas</h4><ul class="reasons">${reasonsHtml}</ul>`;
  }

  function renderSelector() {
    const cards = assetService
      .getAll()
      .map(
        e => `
        <button type="button" class="card-eq" data-go="fichas/${escAttr(e.codigo)}">
          <b class="mono">${esc(e.codigo)}</b>
          <span>${esc(e.marca)} ${esc(e.modelo)}</span>
          <small>${esc(assetService.getAreaName(e.area))}</small>
          ${badge(e.estado)}
        </button>`
      )
      .join('');

    return `
      <div class="head">
        <div>
          <h2 class="page-title">Fichas técnicas</h2>
          <p class="page-sub">Selecciona un equipo para consultar su expediente técnico integral.</p>
        </div>
      </div>
      <div class="cards">${cards}</div>`;
  }

  function render(code) {
    if (!code) return renderSelector();
    const e = assetService.getByCode(code);
    if (!e) {
      return `
        <h2 class="page-title">Ficha técnica</h2>
        <section class="panel empty">
          <p class="muted">No existe un equipo registrado con el código <b class="mono">${esc(code)}</b>.</p>
          <div style="margin-top:12px"><button type="button" class="btn" data-go="fichas">Volver a las fichas</button></div>
        </section>`;
    }

    if (activeCode !== code) {
      activeTab = 0;
      activeCode = code;
    }

    const sw = softwareService.getByAsset(code);
    const mt = maintenanceService.getByAsset(code);
    const mods = historyService.getByAsset(code);
    const inc = incidentService.getByAsset(code);
    const today = todayIso();

    const panes = [
      kvList([
        ['Código interno', `<span class="mono">${esc(e.codigo)}</span>`],
        ['Código patrimonial', `<span class="mono">${esc(e.patrimonial)}</span>`],
        ['Tipo de equipo', esc(e.tipo)],
        ['Marca y modelo', `${esc(e.marca)} ${esc(e.modelo)}`],
        ['Número de serie', `<span class="mono">${esc(e.serie)}</span>`],
        ['Fecha de adquisición', esc(e.fechaAdq)],
        ['Garantía hasta', `${esc(e.garantia)} ${badge(e.garantia < today ? 'Vencida' : 'Vigente')}`],
        ['Antigüedad', `${assetService.getAgeYears(e)} años`],
        ['Estado físico', badge(assetService.getPhysicalCondition(e))],
        ['Estado operativo', badge(e.estado)],
        ['Ubicación', `${esc(assetService.getAreaName(e.area))}, ${esc(e.oficina)}`],
        ['Responsable', esc(e.responsable)],
        ['Asignado desde', esc(e.fechaAsig)]
      ]),
      kvList([
        ['Procesador', esc(e.cpu)],
        ['Placa madre', esc(e.placa)],
        ['Memoria RAM', `${e.ram} GB ${esc(e.tipoRam)}`],
        ['Almacenamiento', esc(e.disco)],
        ['Tarjeta gráfica', esc(e.gpu)],
        ['Fuente de alimentación', esc(e.fuente)],
        ['Monitor', esc(e.monitor)],
        ['Teclado', esc(e.teclado)],
        ['Mouse', esc(e.mouse)],
        ['Otros periféricos', esc(e.otros)]
      ]),
      dataTable(
        ['Software', 'Categoría', 'Versión', 'Instalado', 'Licencia', 'Estado de licencia', 'Actualización'],
        sw.map(s => [esc(s.nombre), esc(s.categoria), esc(s.version), esc(s.instalado), esc(s.licencia), badge(s.estadoLicencia), badge(s.actualizacion)]),
        'Este equipo no tiene software registrado.'
      ),
      dataTable(
        ['ID', 'Fecha', 'Tipo', 'Categoría', 'Técnico', 'Costo (S/)', 'Estado'],
        mt.map(m => [`<b class="mono">${esc(m.id)}</b>`, esc(m.fecha), esc(m.tipo), esc(m.categoria), esc(m.tecnico), m.costo, badge(m.estado)]),
        'Este equipo no tiene mantenimientos registrados.'
      ),
      mods.length
        ? `<ol class="tl">${mods
            .map(
              m => `<li class="mod"><time>${esc(m.fecha)}</time><b>${esc(m.anterior)} → ${esc(m.nuevo)}</b><span>${esc(m.motivo)}. Técnico: ${esc(m.tecnico)}. Costo: S/ ${m.costo}</span></li>`
            )
            .join('')}</ol><p class="note">Configuración actual: ${esc(e.cpu)}, ${e.ram} GB de RAM, ${esc(e.disco)}.</p>`
        : '<p class="muted">Este equipo conserva su configuración original de fábrica.</p>',
      dataTable(
        ['ID', 'Fecha', 'Categoría', 'Descripción', 'Prioridad', 'Estado'],
        inc.map(i => [`<b class="mono">${esc(i.id)}</b>`, esc(i.fecha), esc(i.categoria), esc(i.descripcion), badge(i.prioridad), badge(i.estado)]),
        'Este equipo no registra incidencias técnicas.'
      ),
      renderEvaluationSummary(e)
    ];

    return `
      <div class="solo-print">
        <h2>SIGAI · Ficha Técnica de Activo Informático</h2>
        <p>Emitido el ${esc(today)} · Activo ${esc(e.codigo)}</p>
      </div>
      <div class="head">
        <div>
          <button type="button" class="lnk" data-go="fichas">← Todas las fichas</button>
          <h2 class="page-title"><span class="mono">${esc(e.codigo)}</span> · ${esc(e.marca)} ${esc(e.modelo)}</h2>
          <p class="page-sub">${esc(assetService.getAreaName(e.area))}, ${esc(e.oficina)} ${badge(e.estado)}</p>
        </div>
        <div class="btns">
          <button type="button" class="btn" id="btn-edit-ficha" data-code="${escAttr(code)}">Editar activo</button>
          <button type="button" class="btn pri" id="btn-print-ficha">Imprimir ficha</button>
        </div>
      </div>
      <div class="tabs" role="tablist">
        ${TABS.map((t, i) => `<button type="button" role="tab" class="${i === activeTab ? 'on' : ''}" data-tab="${i}">${esc(t)}</button>`).join('')}
      </div>
      <div class="panel">
        ${panes.map((p, i) => `<section class="pane ${i === activeTab ? 'on' : ''}"><h3 class="ptitle">${esc(TABS[i])}</h3>${p}</section>`).join('')}
      </div>`;
  }

  function bind(root, code) {
    if (!code) return;
    const editBtn = root.querySelector('#btn-edit-ficha');
    if (editBtn) {
      editBtn.addEventListener('click', () => onEditAsset(code));
    }
    const printBtn = root.querySelector('#btn-print-ficha');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    const tabBtns = root.querySelectorAll('.tabs [data-tab]');
    const panes = root.querySelectorAll('.pane');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = Number(btn.dataset.tab);
        tabBtns.forEach((b, idx) => b.classList.toggle('on', idx === activeTab));
        panes.forEach((p, idx) => p.classList.toggle('on', idx === activeTab));
      });
    });
  }

  return { render, bind, setActiveTab };
}
