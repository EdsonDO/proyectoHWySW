import { esc, escAttr } from '../../core/sanitize.js';
import { createValidator } from '../../core/validators.js';
import { TICKET_STATUSES } from '../../data/seedData.js';
import { NEXT_TICKET_ACTION } from '../../services/IncidentService.js';
import { badge, formField, kvList, selectOptions } from '../../ui/components.js';
import { closeModal, openModal } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';

export function createIncidentsView({ incidentService, assetService, systemService, onRerender }) {
  const filters = { q: '', estado: '', cat: '', pri: '' };

  function renderRows() {
    const list = incidentService.filter(filters);
    if (!list.length) {
      return '<tr><td colspan="11" class="muted empty-msg">Ninguna orden coincide con los filtros seleccionados.</td></tr>';
    }
    return list
      .map(
        t => `
        <tr>
          <td><b class="mono">${esc(t.id)}</b></td>
          <td class="mono">${esc(t.fecha)}</td>
          <td><button type="button" class="lnk mono" data-go="fichas/${escAttr(t.equipo)}">${esc(t.equipo)}</button></td>
          <td>${esc(assetService.getAreaName(t.area))}</td>
          <td>${esc(t.usuario)}</td>
          <td>${esc(t.categoria)}</td>
          <td>${esc(t.descripcion)}</td>
          <td>${badge(t.prioridad)}</td>
          <td>${esc(t.tecnico || 'Sin asignar')}</td>
          <td>${badge(t.estado)}</td>
          <td class="acc"><button type="button" class="lnk" data-view-ticket="${escAttr(t.id)}">Gestionar</button></td>
        </tr>`
      )
      .join('');
  }

  function render() {
    const all = incidentService.getAll();
    const chips = `
      <button type="button" class="${!filters.estado ? 'sel' : ''}" data-tk-status="">Todas <b>${all.length}</b></button>
      ${TICKET_STATUSES.map(
        st => `<button type="button" class="${filters.estado === st ? 'sel' : ''}" data-tk-status="${escAttr(st)}">${esc(st)} <b>${all.filter(t => t.estado === st).length}</b></button>`
      ).join('')}`;

    return `
      <div class="head">
        <div>
          <h2 class="page-title">Órdenes de trabajo</h2>
          <p class="page-sub">${incidentService.getOpenCount()} incidencias abiertas de ${all.length} registradas.</p>
        </div>
        <button type="button" class="btn pri" id="btn-new-ticket">Nueva orden de trabajo</button>
      </div>
      <div class="chips">${chips}</div>
      <div class="filters">
        <input id="tk-q" type="search" placeholder="Buscar por código, equipo, usuario o descripción" value="${escAttr(filters.q)}">
        <select id="tk-cat"><option value="">Toda categoría</option>${selectOptions(['Hardware', 'Software'], filters.cat)}</select>
        <select id="tk-pri"><option value="">Toda prioridad</option>${selectOptions(['Alta', 'Media', 'Baja'], filters.pri)}</select>
      </div>
      <div class="panel tbl">
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Reporte</th><th>Equipo</th><th>Área</th><th>Usuario</th>
              <th>Categoría</th><th>Descripción</th><th>Prioridad</th><th>Técnico</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody id="tk-body">${renderRows()}</tbody>
        </table>
      </div>`;
  }

  function openCreateModal() {
    const activeCodes = assetService.getActive().map(e => e.codigo);
    if (!activeCodes.length) {
      showToast('No hay equipos activos disponibles.', 'error');
      return;
    }

    const html = `
      <form class="form">
        <div class="fgrid">
          ${formField('equipo', 'Equipo relacionado', activeCodes[0], 'text', activeCodes)}
          ${formField('usuario', 'Usuario que reporta')}
          ${formField('categoria', 'Categoría', 'Hardware', 'text', ['Hardware', 'Software'])}
          ${formField('prioridad', 'Prioridad', 'Media', 'text', ['Alta', 'Media', 'Baja'])}
          ${formField('descripcion', 'Descripción del problema', '', 'textarea')}
        </div>
      </form>`;

    openModal('Nueva orden de trabajo', html, [
      { t: 'Cancelar', fn: closeModal },
      {
        t: 'Crear orden',
        cls: 'pri',
        fn: async overlay => {
          const v = createValidator(overlay);
          v.check('usuario', !v.valueOf('usuario'), 'Indica quién reporta la incidencia.');
          v.check('descripcion', v.valueOf('descripcion').length < 10, 'Describe el problema (mínimo 10 caracteres).');
          if (!v.isValid()) {
            showToast('Revisa los campos marcados en rojo.', 'error');
            return;
          }

          const res = await incidentService.create({
            equipo: v.valueOf('equipo'),
            usuario: v.valueOf('usuario'),
            categoria: v.valueOf('categoria'),
            prioridad: v.valueOf('prioridad'),
            descripcion: v.valueOf('descripcion')
          });
          if (res.ok) {
            closeModal();
            showToast(`Orden ${res.data.id} creada`);
          }
        }
      }
    ]);
  }

  function openTicketModal(id) {
    const t = incidentService.getById(id);
    if (!t) return;

    const techs = systemService.getTechnicians();
    const extraField =
      t.estado === 'Pendiente'
        ? formField('tec', 'Técnico a asignar', techs[0], 'text', techs)
        : t.estado === 'En proceso'
          ? formField('sol', 'Solución aplicada', '', 'textarea')
          : '';

    const html = `
      ${kvList([
        ['Equipo', `<span class="mono">${esc(t.equipo)}</span>`],
        ['Área', esc(assetService.getAreaName(t.area))],
        ['Reportado', esc(t.fecha)],
        ['Usuario', esc(t.usuario)],
        ['Categoría', esc(t.categoria)],
        ['Prioridad', badge(t.prioridad)],
        ['Técnico', esc(t.tecnico || 'Sin asignar')],
        ['Estado', badge(t.estado)]
      ])}
      <h4>Problema reportado</h4>
      <p>${esc(t.descripcion)}</p>
      ${t.solucion ? `<h4>Solución aplicada</h4><p>${esc(t.solucion)}</p>` : ''}
      <h4>Historial de intervenciones</h4>
      <ol class="tl">${t.historial.map(h => `<li class="inc"><time>${esc(h[0])}</time><b>${esc(h[1])}</b></li>`).join('')}</ol>
      ${extraField ? `<form class="form" style="margin-top:14px">${extraField}</form>` : ''}`;

    const actions = [{ t: 'Cerrar', fn: closeModal }];
    if (NEXT_TICKET_ACTION[t.estado]) {
      actions.push({
        t: NEXT_TICKET_ACTION[t.estado],
        cls: 'pri',
        fn: async overlay => {
          const v = createValidator(overlay);
          const payload = {};
          if (t.estado === 'Pendiente') {
            payload.tecnico = v.valueOf('tec');
          }
          if (t.estado === 'En proceso') {
            v.check('sol', !v.valueOf('sol'), 'Describe la solución aplicada.');
            if (!v.isValid()) return;
            payload.solucion = v.valueOf('sol');
          }
          const res = await incidentService.advance(id, payload);
          if (res.ok) {
            closeModal();
            showToast(`${t.id} ahora está ${res.data.estado.toLowerCase()}`);
          }
        }
      });
    }

    openModal(`Orden ${t.id}`, html, actions);
  }

  function bind(root) {
    root.querySelector('#btn-new-ticket').addEventListener('click', openCreateModal);

    root.querySelectorAll('[data-tk-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        filters.estado = btn.dataset.tkStatus;
        onRerender();
      });
    });

    const tbody = root.querySelector('#tk-body');
    const repaint = () => {
      tbody.innerHTML = renderRows();
    };

    root.querySelector('#tk-q').addEventListener('input', ev => {
      filters.q = ev.target.value;
      repaint();
    });
    root.querySelector('#tk-cat').addEventListener('change', ev => {
      filters.cat = ev.target.value;
      repaint();
    });
    root.querySelector('#tk-pri').addEventListener('change', ev => {
      filters.pri = ev.target.value;
      repaint();
    });

    tbody.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-view-ticket]');
      if (btn) openTicketModal(btn.dataset.viewTicket);
    });
  }

  return { render, bind };
}
