import { esc, escAttr } from '../../core/sanitize.js';
import { EVALUATION_CRITERIA, RECOMMENDATIONS } from '../../services/EvaluationService.js';
import { badge, dataTable, meterBar, selectOptions } from '../../ui/components.js';
import { closeModal, openModal } from '../../ui/modal.js';

export function createEvaluationView({ evaluationService, assetService, transferService, onScheduleMaintenance, onRegisterModification, onRerender }) {
  const filters = { area: '', rec: '' };

  function tagRec(key) {
    const [label, tone] = RECOMMENDATIONS[key];
    return `<span class="tag ${tone}">${esc(label)}</span>`;
  }

  function renderDetail(asset) {
    const v = evaluationService.evaluate(asset);
    const rows = [
      ['Antigüedad', `${v.edad} años`, 'Reemplazo desde 8 años', v.edad >= 8],
      ['Memoria RAM', `${asset.ram} GB`, 'Ampliar con 4 GB o menos', asset.ram <= 4],
      ['Almacenamiento', esc(asset.disco), 'HDD: considerar SSD', String(asset.disco).startsWith('HDD')],
      ['Rendimiento estimado', `${v.perf} de 100`, 'Alerta bajo 50', v.perf < 50],
      ['Incidencias registradas', `${v.inc} (${v.abiertas} abiertas)`, 'Atender incidencias abiertas', v.abiertas > 0],
      ['Mantenimientos en 12 meses', String(v.mant12), 'Último hace más de 180 días', v.dSin !== null && v.dSin > 180],
      ['Costos acumulados', `S/ ${v.costo}`, 'Informativo', false]
    ];

    return `
      ${dataTable(['Indicador', 'Valor', 'Criterio', 'Resultado'], rows.map(r => [r[0], r[1], r[2], r[3] ? badge('Atención') : badge('Adecuado')]), '')}
      <h4>Recomendaciones</h4>
      <ul class="reasons">
        ${v.recs.map(k => `<li>${tagRec(k)}<span>${esc(v.razones[k] || 'No se cumple ningún criterio de alerta.')}</span></li>`).join('')}
      </ul>`;
  }

  function render() {
    const evaluated = assetService.getAll().map(e => ({ e, v: evaluationService.evaluate(e) }));
    const list = evaluated.filter(({ e, v }) => (!filters.area || e.area === filters.area) && (!filters.rec || v.recs.includes(filters.rec)));

    const recKeys = ['reemplazo', 'disco', 'ram', 'software', 'mant', 'ok'];
    const chips = `
      <button type="button" class="${!filters.rec ? 'sel' : ''}" data-rec="">Todos <b>${evaluated.length}</b></button>
      ${recKeys
        .map(k => `<button type="button" class="${filters.rec === k ? 'sel' : ''}" data-rec="${escAttr(k)}">${esc(RECOMMENDATIONS[k][0])} <b>${evaluated.filter(t => t.v.recs.includes(k)).length}</b></button>`)
        .join('')}`;

    const rows = list.map(({ e, v }) => [
      `<button type="button" class="lnk mono" data-go="fichas/${escAttr(e.codigo)}">${esc(e.codigo)}</button>`,
      `${v.edad} años`,
      `${e.ram} GB`,
      esc(e.disco),
      `${meterBar(v.perf, v.perf < 50)}${v.perf}`,
      `${v.inc} (${v.abiertas})`,
      v.mant12,
      `S/ ${v.costo}`,
      v.recs.map(tagRec).join(' '),
      `<button type="button" class="lnk" data-eval-detail="${escAttr(e.codigo)}">Detalle</button>`
    ]);

    const areas = transferService.getAreas().map(a => [a.id, a.nombre]);

    return `
      <div class="head">
        <div>
          <h2 class="page-title">Evaluación y repotenciación</h2>
          <p class="page-sub">Indicadores técnicos, ciclo de vida y recomendaciones priorizadas por activo.</p>
        </div>
      </div>
      <details class="panel crit">
        <summary>Criterios institucionales de evaluación</summary>
        <ul class="reasons">
          ${EVALUATION_CRITERIA.map(c => `<li><b>${esc(c[0])}</b><span>${esc(c[1])}</span></li>`).join('')}
        </ul>
      </details>
      <div class="chips" style="margin-top:14px">${chips}</div>
      <div class="filters">
        <select id="ev-area"><option value="">Todas las áreas</option>${selectOptions(areas, filters.area)}</select>
      </div>
      <div class="panel tbl">
        ${dataTable(['Equipo', 'Antigüedad', 'RAM', 'Almacenamiento', 'Rendimiento', 'Incidencias (abiertas)', 'Mant. 12 meses', 'Costo acumulado', 'Recomendaciones', 'Acciones'], rows, 'Ningún equipo coincide con los filtros.')}
      </div>`;
  }

  function openDetailModal(code) {
    const asset = assetService.getByCode(code);
    if (!asset) return;
    openModal(`Evaluación técnica de ${code}`, renderDetail(asset), [
      { t: 'Cerrar', fn: closeModal },
      { t: 'Programar mantenimiento', fn: () => onScheduleMaintenance(code) },
      { t: 'Registrar modificación', cls: 'pri', fn: () => onRegisterModification(code) }
    ]);
  }

  function bind(root) {
    root.querySelectorAll('[data-rec]').forEach(btn => {
      btn.addEventListener('click', () => {
        filters.rec = btn.dataset.rec;
        onRerender();
      });
    });

    root.querySelector('#ev-area').addEventListener('change', ev => {
      filters.area = ev.target.value;
      onRerender();
    });

    root.querySelectorAll('[data-eval-detail]').forEach(btn => {
      btn.addEventListener('click', () => openDetailModal(btn.dataset.evalDetail));
    });
  }

  return { render, bind };
}
