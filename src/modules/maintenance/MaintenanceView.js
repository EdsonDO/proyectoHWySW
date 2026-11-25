import { todayIso } from '../../core/date.js';
import { esc, escAttr } from '../../core/sanitize.js';
import { createValidator } from '../../core/validators.js';
import {
  CHECKLIST_STATUSES,
  HARDWARE_CHECKLIST,
  MAINTENANCE_LEVELS,
  MAINTENANCE_RESULTS,
  MAINTENANCE_TYPES,
  SOFTWARE_CHECKLIST,
  SOFTWARE_CORRECTIVE_ACTIONS
} from '../../data/seedData.js';
import { badge, dataTable, formField, kvList, meterBar, selectOptions } from '../../ui/components.js';
import { closeModal, openModal } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';

const CHECKLISTS = { Hardware: HARDWARE_CHECKLIST, Software: SOFTWARE_CHECKLIST };

export function createMaintenanceView({ maintenanceService, assetService, systemService, onRerender }) {
  const state = {
    Hardware: { tipo: '' },
    Software: { tipo: '', tab: 0 }
  };

  function renderPredictivePanel() {
    const rows = maintenanceService.getPredictiveTelemetry().map(r => [
      `<button type="button" class="lnk mono" data-go="fichas/${escAttr(r.equipo)}">${esc(r.equipo)}</button>`,
      `${meterBar(r.cpu, r.cpu >= 80)}${r.cpu}%`,
      `${meterBar(r.ram, r.ram >= 80)}${r.ram}%`,
      `${meterBar(r.disco, r.disco >= 80)}${r.disco}%`,
      r.err,
      r.act,
      r.lic,
      badge(r.seguimiento)
    ]);

    return `
      <div class="panel">
        ${dataTable(['Equipo', 'CPU', 'RAM', 'Almacenamiento', 'Errores recurrentes', 'Actualizaciones pendientes', 'Licencias por vencer', 'Seguimiento'], rows, 'Sin equipos activos.')}
        <p class="note">Los indicadores consolidan el monitoreo de recursos junto con incidencias, parches pendientes y licencias registradas.</p>
      </div>`;
  }

  function render(category) {
    const isHw = category === 'Hardware';
    const filterState = state[category];
    const allCat = maintenanceService.getByCategory(category, '');
    const list = maintenanceService.getByCategory(category, filterState.tipo);

    const chips = `
      <button type="button" class="${!filterState.tipo ? 'sel' : ''}" data-mtype="">Todos <b>${allCat.length}</b></button>
      ${MAINTENANCE_TYPES.map(
        t => `<button type="button" class="${filterState.tipo === t ? 'sel' : ''}" data-mtype="${escAttr(t)}">${esc(t)} <b>${allCat.filter(m => m.tipo === t).length}</b></button>`
      ).join('')}`;

    const rows = list.map(m => [
      `<b class="mono">${esc(m.id)}</b>`,
      `<button type="button" class="lnk mono" data-go="fichas/${escAttr(m.equipo)}">${esc(m.equipo)}</button>`,
      esc(m.fecha),
      esc(m.tipo),
      ...(isHw ? [`Nivel ${m.nivel}`] : []),
      esc(m.tecnico),
      m.costo,
      badge(m.resultado),
      badge(m.estado),
      `<button type="button" class="lnk" data-view-mant="${escAttr(m.id)}">Ver detalle</button>`
    ]);

    const cols = ['ID', 'Equipo', 'Fecha', 'Tipo', ...(isHw ? ['Nivel'] : []), 'Técnico', 'Costo (S/)', 'Resultado', 'Estado', 'Acciones'];
    const levelsPanel = isHw
      ? `<div class="panel"><h3>Niveles de mantenimiento</h3><ol class="niv">${MAINTENANCE_LEVELS.map((n, i) => `<li><b>Nivel ${i + 1}:</b> ${esc(n)}.</li>`).join('')}</ol></div>`
      : '';

    const tabs = isHw
      ? ''
      : `<div class="tabs">
          <button type="button" class="${filterState.tab === 0 ? 'on' : ''}" data-mtab="0">Intervenciones</button>
          <button type="button" class="${filterState.tab === 1 ? 'on' : ''}" data-mtab="1">Seguimiento predictivo</button>
        </div>`;

    const body =
      !isHw && filterState.tab === 1
        ? renderPredictivePanel()
        : `<div class="chips">${chips}</div>${levelsPanel}<div class="panel tbl">${dataTable(cols, rows, 'No hay mantenimientos registrados en esta categoría.')}</div>`;

    return `
      <div class="head">
        <div>
          <h2 class="page-title">Mantenimiento de ${isHw ? 'hardware' : 'software'}</h2>
          <p class="page-sub">Registro y control de intervenciones preventivas, predictivas y correctivas.</p>
        </div>
        <button type="button" class="btn pri" id="btn-new-mant">Registrar mantenimiento</button>
      </div>
      ${tabs}
      ${body}`;
  }

  function openDetailModal(id, isNew = false) {
    const m = maintenanceService.getById(id);
    if (!m) return;

    const items = m.checklist || [];
    const countChk = status => items.filter(x => x[1] === status).length;
    const inspStatus = countChk('Requiere atención') ? 'Requiere atención' : countChk('No realizado') ? 'Incompleta' : 'Aprobada';

    const pairs = [
      ['Equipo', `<span class="mono">${esc(m.equipo)}</span>`],
      ['Fecha', esc(m.fecha)],
      ['Tipo', esc(m.tipo)],
      ...(m.nivel ? [['Nivel', `Nivel ${m.nivel}`]] : []),
      ['Técnico', esc(m.tecnico)],
      ['Estado', badge(m.estado)],
      ['Resultado', badge(m.resultado)],
      ['Diagnóstico', esc(m.diagnostico)],
      [m.categoria === 'Hardware' ? 'Actividades' : 'Procedimiento', esc(m.actividades)],
      ['Componentes', esc(m.componentes)],
      ['Repuestos', esc(m.repuestos)],
      ['Intervención', esc(m.corr)],
      ['Costo', `S/ ${m.costo}`],
      ['Observaciones', esc(m.observaciones)]
    ];

    const predHtml = m.pred ? `<h4>Seguimiento predictivo</h4>${kvList(m.pred.map(([k, v]) => [k, esc(v)]))}` : '';
    const attentionList = items.filter(x => x[1] === 'Requiere atención').map(x => x[0].toLowerCase()).join(', ');
    const chkHtml = items.length
      ? `<h4>Resumen de la inspección</h4>${dataTable(['Estado', 'Actividades'], CHECKLIST_STATUSES.map(s => [badge(s), countChk(s)]), '')}
         <p class="note">Resultado de la inspección: ${badge(inspStatus)}${attentionList ? `. Requieren atención: ${esc(attentionList)}` : ''}.</p>`
      : '';

    openModal(`${isNew ? 'Mantenimiento registrado: ' : 'Detalle de '}${m.id}`, kvList(pairs) + predHtml + chkHtml, [
      { t: 'Cerrar', cls: 'pri', fn: closeModal }
    ]);
  }

  function openCreateModal(category) {
    const isHw = category === 'Hardware';
    const activeCodes = assetService.getActive().map(e => e.codigo);
    const techs = systemService.getTechnicians();
    if (!activeCodes.length) {
      showToast('No hay equipos activos disponibles.', 'error');
      return;
    }

    const chkListHtml = CHECKLISTS[category]
      .map((item, idx) => `<div class="chk"><span>${idx + 1}. ${esc(item)}</span><select id="c_${idx}">${selectOptions(CHECKLIST_STATUSES, 'No realizado')}</select></div>`)
      .join('');

    const html = `
      <form class="form">
        <div class="fgrid">
          ${formField('equipo', 'Código del equipo', activeCodes[0], 'text', activeCodes)}
          ${formField('fecha', 'Fecha', todayIso(), 'date')}
          ${formField('tipo', 'Tipo de mantenimiento', 'Preventivo', 'text', MAINTENANCE_TYPES)}
          ${isHw ? formField('nivel', 'Nivel de mantenimiento', 1, 'text', MAINTENANCE_LEVELS.map((n, i) => [i + 1, `Nivel ${i + 1}: ${n}`])) : ''}
          ${formField('tecnico', 'Técnico responsable', techs[0], 'text', techs)}
          ${formField('diagnostico', 'Diagnóstico', '', 'textarea')}
          ${formField('actividades', isHw ? 'Actividades realizadas' : 'Procedimiento realizado', '', 'textarea')}
          ${isHw ? formField('componentes', 'Componentes intervenidos') + formField('repuestos', 'Repuestos utilizados') : ''}
          ${formField('costo', 'Costo (S/)', 0, 'number')}
          ${formField('resultado', 'Resultado', MAINTENANCE_RESULTS[0], 'text', MAINTENANCE_RESULTS)}
          ${formField('observaciones', 'Observaciones', '', 'textarea')}
        </div>
        <div id="sec-chk">
          <h4>Checklist preventivo de ${isHw ? 'hardware' : 'software'}</h4>
          <button type="button" class="lnk" id="btn-chk-all">Marcar todo como realizado</button>
          ${chkListHtml}
        </div>
        <div id="sec-pred" hidden>
          <h4>Seguimiento predictivo</h4>
          <div class="fgrid">
            ${formField('pcpu', 'Consumo de CPU (%)', '', 'number')}
            ${formField('pram', 'Consumo de RAM (%)', '', 'number')}
            ${formField('pdisco', 'Almacenamiento usado (%)', '', 'number')}
            ${formField('perr', 'Errores recurrentes')}
            ${formField('ppend', 'Actualizaciones pendientes')}
          </div>
        </div>
        <div id="sec-cor" hidden>
          <h4>Intervención correctiva</h4>
          ${isHw ? '<p class="muted">Registra los componentes y repuestos en los campos superiores.</p>' : formField('corr', 'Tipo de intervención', SOFTWARE_CORRECTIVE_ACTIONS[0], 'text', SOFTWARE_CORRECTIVE_ACTIONS)}
        </div>
      </form>`;

    const overlay = openModal(`Registrar mantenimiento de ${isHw ? 'hardware' : 'software'}`, html, [
      { t: 'Cancelar', fn: closeModal },
      {
        t: 'Guardar mantenimiento',
        cls: 'pri',
        fn: async modalRoot => {
          const v = createValidator(modalRoot);
          v.check('fecha', !v.valueOf('fecha'), 'Indica la fecha.');
          v.check('diagnostico', !v.valueOf('diagnostico'), 'Describe el diagnóstico.');
          v.check('actividades', !v.valueOf('actividades'), isHw ? 'Indica las actividades realizadas.' : 'Describe el procedimiento.');
          const costRaw = v.valueOf('costo');
          v.check('costo', costRaw === '' || Number.isNaN(Number(costRaw)) || Number(costRaw) < 0, 'Ingresa un costo de 0 o más.');
          if (!v.isValid()) {
            showToast('Revisa los campos marcados en rojo.', 'error');
            return;
          }

          const tipo = v.valueOf('tipo');
          const payload = {
            equipo: v.valueOf('equipo'),
            fecha: v.valueOf('fecha'),
            tipo,
            categoria: category,
            tecnico: v.valueOf('tecnico'),
            costo: Number(costRaw),
            nivel: isHw ? Number(v.valueOf('nivel')) : null,
            diagnostico: v.valueOf('diagnostico'),
            actividades: v.valueOf('actividades'),
            componentes: isHw ? v.valueOf('componentes') : '',
            repuestos: isHw ? v.valueOf('repuestos') : '',
            observaciones: v.valueOf('observaciones'),
            resultado: v.valueOf('resultado')
          };

          if (tipo === 'Preventivo') {
            payload.checklist = CHECKLISTS[category].map((label, idx) => [label, modalRoot.querySelector(`#c_${idx}`).value]);
          }
          if (!isHw && tipo === 'Predictivo') {
            payload.pred = [
              ['CPU', `${v.valueOf('pcpu') || 0}%`],
              ['RAM', `${v.valueOf('pram') || 0}%`],
              ['Almacenamiento', `${v.valueOf('pdisco') || 0}%`],
              ['Errores recurrentes', v.valueOf('perr') || '0'],
              ['Actualizaciones pendientes', v.valueOf('ppend') || '0']
            ];
          }
          if (!isHw && tipo === 'Correctivo') {
            payload.corr = v.valueOf('corr');
          }

          const res = await maintenanceService.create(payload);
          if (res.ok) {
            closeModal();
            showToast(`Mantenimiento ${res.data.id} registrado`);
            openDetailModal(res.data.id, true);
          }
        }
      }
    ]);

    const tipoSelect = overlay.querySelector('#f_tipo');
    const secChk = overlay.querySelector('#sec-chk');
    const secPred = overlay.querySelector('#sec-pred');
    const secCor = overlay.querySelector('#sec-cor');

    tipoSelect.addEventListener('change', () => {
      const val = tipoSelect.value;
      secChk.hidden = val !== 'Preventivo';
      secPred.hidden = val !== 'Predictivo' || isHw;
      secCor.hidden = val !== 'Correctivo';
    });

    overlay.querySelector('#btn-chk-all').addEventListener('click', () => {
      overlay.querySelectorAll('#sec-chk select').forEach(sel => {
        sel.value = 'Realizado';
      });
    });
  }

  function bind(root, category) {
    root.querySelector('#btn-new-mant').addEventListener('click', () => openCreateModal(category));

    root.querySelectorAll('[data-mtype]').forEach(btn => {
      btn.addEventListener('click', () => {
        state[category].tipo = btn.dataset.mtype;
        onRerender();
      });
    });

    root.querySelectorAll('[data-mtab]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.Software.tab = Number(btn.dataset.mtab);
        onRerender();
      });
    });

    root.querySelectorAll('[data-view-mant]').forEach(btn => {
      btn.addEventListener('click', () => openDetailModal(btn.dataset.viewMant));
    });
  }

  return { render, bind, openDetailModal };
}
