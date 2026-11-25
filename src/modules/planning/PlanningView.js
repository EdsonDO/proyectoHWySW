import { formatMonthTitle, offsetDay, todayIso } from '../../core/date.js';
import { esc, escAttr } from '../../core/sanitize.js';
import { createValidator } from '../../core/validators.js';
import { MAINTENANCE_TYPES } from '../../data/seedData.js';
import { badge, dataTable, formField, selectOptions } from '../../ui/components.js';
import { closeModal, openModal } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';

const PLAN_CLASS = {
  Realizado: 'realizado',
  Programado: 'programado',
  Pendiente: 'pendiente',
  Atrasado: 'atrasado'
};

export function createPlanningView({ maintenanceService, assetService, transferService, systemService, onViewMaintenance, onRerender }) {
  const filters = {
    mes: todayIso().slice(0, 7),
    area: '',
    equipo: '',
    tipo: '',
    tecnico: ''
  };

  function shiftMonth(delta) {
    const [y, m] = filters.mes.split('-').map(Number);
    const dt = new Date(y, m - 1 + delta, 1);
    filters.mes = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    onRerender();
  }

  function renderCalendar(events) {
    const [y, mo] = filters.mes.split('-').map(Number);
    const offset = (new Date(y, mo - 1, 1).getDay() + 6) % 7;
    const totalDays = new Date(y, mo, 0).getDate();
    const today = todayIso();

    const byDate = {};
    events.forEach(m => {
      if (!byDate[m.fecha]) byDate[m.fecha] = [];
      byDate[m.fecha].push(m);
    });

    let cells = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      .map(d => `<div class="dow">${d}</div>`)
      .join('');
    cells += '<div class="day out"></div>'.repeat(offset);

    for (let day = 1; day <= totalDays; day += 1) {
      const iso = `${filters.mes}-${String(day).padStart(2, '0')}`;
      const list = byDate[iso] || [];
      const pills = list
        .slice(0, 2)
        .map(m => {
          const st = maintenanceService.getPlanStatus(m);
          return `<button type="button" class="ev ${PLAN_CLASS[st]}" data-plan-detail="${escAttr(m.id)}" title="${escAttr(`${m.id}: ${m.tipo} de ${m.categoria.toLowerCase()}`)}">${esc(m.equipo.slice(3))} ${esc(m.tipo.slice(0, 4))}.</button>`;
        })
        .join('');
      const more = list.length > 2 ? `<button type="button" class="mas" data-plan-day="${escAttr(iso)}">+${list.length - 2} más</button>` : '';

      cells += `<div class="day${iso === today ? ' hoy' : ''}">
        <button type="button" class="dnum" data-plan-day="${escAttr(iso)}" aria-label="Ver el día ${day}">${day}</button>
        ${pills}${more}
      </div>`;
    }

    return `<div class="calwrap"><div class="cal">${cells}</div></div>`;
  }

  function render() {
    const filtered = maintenanceService.filterPlan(filters);
    const monthEvents = filtered.filter(m => m.fecha.slice(0, 7) === filters.mes);
    const title = formatMonthTitle(filters.mes);
    const countStatus = st => monthEvents.filter(m => maintenanceService.getPlanStatus(m) === st).length;

    const areas = transferService.getAreas().map(a => [a.id, a.nombre]);
    const codes = assetService.getAll().map(e => e.codigo);
    const techs = systemService.getTechnicians();

    const rows = [...monthEvents]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(m => [
        esc(m.fecha),
        `<b class="mono">${esc(m.id)}</b>`,
        `<button type="button" class="lnk mono" data-go="fichas/${escAttr(m.equipo)}">${esc(m.equipo)}</button>`,
        esc(m.tipo),
        esc(m.categoria),
        esc(m.tecnico),
        badge(maintenanceService.getPlanStatus(m)),
        `<button type="button" class="lnk" data-plan-detail="${escAttr(m.id)}">Ver detalle</button>`
      ]);

    return `
      <div class="head">
        <div>
          <h2 class="page-title">Planificación de mantenimientos</h2>
          <p class="page-sub">Calendario operativo de intervenciones programadas, realizadas, pendientes y atrasadas.</p>
        </div>
        <button type="button" class="btn pri" id="btn-new-plan">Programar mantenimiento</button>
      </div>
      <div class="filters">
        <input id="pl-mes" type="month" value="${escAttr(filters.mes)}" aria-label="Mes">
        <select id="pl-area"><option value="">Todas las áreas</option>${selectOptions(areas, filters.area)}</select>
        <select id="pl-eq"><option value="">Todos los equipos</option>${selectOptions(codes, filters.equipo)}</select>
        <select id="pl-tipo"><option value="">Todo tipo</option>${selectOptions(MAINTENANCE_TYPES, filters.tipo)}</select>
        <select id="pl-tec"><option value="">Todo técnico</option>${selectOptions(techs, filters.tecnico)}</select>
      </div>
      <div class="calhead">
        <button type="button" class="btn" id="pl-prev" aria-label="Mes anterior">←</button>
        <h3>${esc(title)}</h3>
        <button type="button" class="btn" id="pl-next" aria-label="Mes siguiente">→</button>
        <button type="button" class="btn" id="pl-today">Hoy</button>
      </div>
      <div class="chips leyenda">
        ${['Programado', 'Realizado', 'Pendiente', 'Atrasado'].map(s => `<span class="ev ${PLAN_CLASS[s]}">${esc(s)} <b>${countStatus(s)}</b></span>`).join('')}
      </div>
      ${renderCalendar(filtered)}
      <div class="panel" style="margin-top:14px">
        <h3>Mantenimientos de ${esc(title)}</h3>
        ${dataTable(['Fecha', 'ID', 'Equipo', 'Tipo', 'Categoría', 'Técnico', 'Estado', 'Acciones'], rows, 'No hay mantenimientos para este mes y filtros.')}
      </div>`;
  }

  function openDayModal(isoDate) {
    const list = maintenanceService.filterPlan(filters).filter(m => m.fecha === isoDate);
    const body = dataTable(
      ['ID', 'Equipo', 'Tipo', 'Técnico', 'Estado', ''],
      list.map(m => [
        `<b class="mono">${esc(m.id)}</b>`,
        esc(m.equipo),
        esc(m.tipo),
        esc(m.tecnico),
        badge(maintenanceService.getPlanStatus(m)),
        `<button type="button" class="lnk" data-modal-mant="${escAttr(m.id)}">Ver</button>`
      ]),
      'No hay mantenimientos registrados en esta fecha.'
    );

    const actions = [{ t: 'Cerrar', fn: closeModal }];
    if (isoDate >= todayIso()) {
      actions.push({
        t: 'Programar en esta fecha',
        cls: 'pri',
        fn: () => openScheduleModal('', isoDate)
      });
    }

    const overlay = openModal(`Mantenimientos del ${isoDate}`, body, actions);
    overlay.querySelectorAll('[data-modal-mant]').forEach(btn => {
      btn.addEventListener('click', () => onViewMaintenance(btn.dataset.modalMant));
    });
  }

  function openScheduleModal(code = '', date = '') {
    const activeCodes = assetService.getActive().map(e => e.codigo);
    const techs = systemService.getTechnicians();
    if (!activeCodes.length) {
      showToast('No hay equipos activos disponibles.', 'error');
      return;
    }

    const html = `
      <form class="form">
        <div class="fgrid">
          ${formField('equipo', 'Equipo', code || activeCodes[0], 'text', activeCodes)}
          ${formField('fecha', 'Fecha programada', date || offsetDay(7), 'date')}
          ${formField('tipo', 'Tipo de mantenimiento', 'Preventivo', 'text', MAINTENANCE_TYPES)}
          ${formField('categoria', 'Categoría', 'Hardware', 'text', ['Hardware', 'Software'])}
          ${formField('tecnico', 'Técnico responsable', techs[0], 'text', techs)}
          ${formField('observaciones', 'Observaciones', '', 'textarea')}
        </div>
      </form>`;

    openModal('Programar mantenimiento', html, [
      { t: 'Cancelar', fn: closeModal },
      {
        t: 'Programar',
        cls: 'pri',
        fn: async overlay => {
          const v = createValidator(overlay);
          const fecha = v.valueOf('fecha');
          const tecnico = v.valueOf('tecnico');
          v.check('fecha', !fecha || fecha < todayIso(), 'Elige una fecha de hoy o posterior.');
          if (v.isValid()) {
            v.check('tecnico', maintenanceService.hasScheduleConflict(tecnico, fecha), 'Ese técnico ya tiene un mantenimiento asignado ese día.');
          }
          if (!v.isValid()) {
            showToast('Revisa los campos marcados en rojo.', 'error');
            return;
          }

          const isHw = v.valueOf('categoria') === 'Hardware';
          const res = await maintenanceService.create({
            equipo: v.valueOf('equipo'),
            fecha,
            tipo: v.valueOf('tipo'),
            categoria: v.valueOf('categoria'),
            estado: 'Programado',
            tecnico,
            costo: 0,
            nivel: isHw ? 1 : null,
            resultado: '—',
            diagnostico: 'Intervención programada desde planificación',
            actividades: 'Pendiente de ejecución',
            componentes: '',
            repuestos: '',
            observaciones: v.valueOf('observaciones')
          });

          if (res.ok) {
            filters.mes = fecha.slice(0, 7);
            closeModal();
            showToast(`${res.data.id} programado para el ${fecha}`);
          }
        }
      }
    ]);
  }

  function bind(root) {
    root.querySelector('#btn-new-plan').addEventListener('click', () => openScheduleModal());
    root.querySelector('#pl-prev').addEventListener('click', () => shiftMonth(-1));
    root.querySelector('#pl-next').addEventListener('click', () => shiftMonth(1));
    root.querySelector('#pl-today').addEventListener('click', () => {
      filters.mes = todayIso().slice(0, 7);
      onRerender();
    });

    root.querySelector('#pl-mes').addEventListener('change', ev => {
      if (ev.target.value) {
        filters.mes = ev.target.value;
        onRerender();
      }
    });
    root.querySelector('#pl-area').addEventListener('change', ev => {
      filters.area = ev.target.value;
      onRerender();
    });
    root.querySelector('#pl-eq').addEventListener('change', ev => {
      filters.equipo = ev.target.value;
      onRerender();
    });
    root.querySelector('#pl-tipo').addEventListener('change', ev => {
      filters.tipo = ev.target.value;
      onRerender();
    });
    root.querySelector('#pl-tec').addEventListener('change', ev => {
      filters.tecnico = ev.target.value;
      onRerender();
    });

    root.querySelectorAll('[data-plan-day]').forEach(btn => {
      btn.addEventListener('click', () => openDayModal(btn.dataset.planDay));
    });
    root.querySelectorAll('[data-plan-detail]').forEach(btn => {
      btn.addEventListener('click', () => onViewMaintenance(btn.dataset.planDetail));
    });
  }

  return { render, bind, openScheduleModal };
}
