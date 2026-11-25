import { offsetDay, todayIso } from '../../core/date.js';
import { esc, escAttr } from '../../core/sanitize.js';
import { createValidator } from '../../core/validators.js';
import { LICENSE_STATUSES, LICENSE_TYPES, SOFTWARE_CATEGORIES } from '../../data/seedData.js';
import { badge, dataTable, formField, meterBar, selectOptions } from '../../ui/components.js';
import { closeModal, confirmDialog, openModal } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';

export function createSoftwareView({ softwareService, assetService, onRerender }) {
  const filters = { q: '', cat: '', equipo: '', lic: '', upd: '', tab: 0 };

  function renderRows() {
    const list = softwareService.filter(filters);
    if (!list.length) {
      return '<tr><td colspan="9" class="muted empty-msg">Ningún programa coincide con los filtros.</td></tr>';
    }
    return list
      .map(
        s => `
        <tr${s.estadoLicencia === 'No autorizado' ? ' class="alerta"' : ''}>
          <td><b>${esc(s.nombre)}</b></td>
          <td><button type="button" class="lnk mono" data-go="fichas/${escAttr(s.equipo)}">${esc(s.equipo)}</button></td>
          <td>${esc(s.categoria)}</td>
          <td class="mono">${esc(s.version)}</td>
          <td class="mono">${esc(s.instalado)}</td>
          <td>${esc(s.licencia)}</td>
          <td>${badge(s.estadoLicencia)}</td>
          <td>${badge(s.actualizacion)}</td>
          <td class="acc">
            <button type="button" class="lnk" data-action="update" data-id="${escAttr(s.id)}"${s.actualizacion === 'Actualizado' ? ' disabled' : ''}>Actualizar</button>
            <button type="button" class="lnk bad" data-action="remove" data-id="${escAttr(s.id)}">Desinstalar</button>
          </td>
        </tr>`
      )
      .join('');
  }

  function countText() {
    return `${softwareService.filter(filters).length} de ${softwareService.getAll().length} programas`;
  }

  function render() {
    const all = softwareService.getAll();
    const count = fn => all.filter(fn).length;
    const licenses = softwareService.getLicensesWithUsage().map(l => {
      const pct = l.puestos > 0 ? (l.enUso / l.puestos) * 100 : 0;
      return [
        `<b class="mono">${esc(l.id)}</b>`,
        esc(l.producto),
        esc(l.tipo),
        l.puestos,
        `${meterBar(pct, pct >= 90, false)}${l.enUso} en uso`,
        `${esc(offsetDay(l.dias))} (${l.dias} días)`,
        badge(l.estado)
      ];
    });

    const assetCodes = assetService.getAll().map(e => e.codigo);
    const body =
      filters.tab === 0
        ? `
          <div class="filters">
            <input id="sw-q" type="search" placeholder="Buscar por software o equipo" value="${escAttr(filters.q)}">
            <select id="sw-cat"><option value="">Todas las categorías</option>${selectOptions(SOFTWARE_CATEGORIES, filters.cat)}</select>
            <select id="sw-eq"><option value="">Todos los equipos</option>${selectOptions(assetCodes, filters.equipo)}</select>
            <select id="sw-lic"><option value="">Toda licencia</option>${selectOptions(LICENSE_STATUSES, filters.lic)}</select>
            <select id="sw-upd"><option value="">Toda actualización</option>${selectOptions(['Actualizado', 'Desactualizado'], filters.upd)}</select>
          </div>
          <div class="panel tbl">
            <table>
              <thead>
                <tr>
                  <th>Software</th><th>Equipo</th><th>Categoría</th><th>Versión</th>
                  <th>Instalado</th><th>Licencia</th><th>Estado de licencia</th><th>Actualización</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody id="sw-body">${renderRows()}</tbody>
            </table>
          </div>`
        : `<div class="panel">${dataTable(['ID', 'Producto', 'Tipo', 'Puestos', 'Uso', 'Vencimiento', 'Estado'], licenses, 'Sin licencias registradas.')}</div>`;

    return `
      <div class="head">
        <div>
          <h2 class="page-title">Inventario de software</h2>
          <p class="page-sub" id="sw-n">${esc(countText())}</p>
        </div>
        <button type="button" class="btn pri" id="btn-new-sw">Registrar software</button>
      </div>
      <div class="chips">
        <button type="button" class="${!filters.upd && !filters.lic ? 'sel' : ''}" data-chip="">Todos <b>${all.length}</b></button>
        <button type="button" class="${filters.upd === 'Desactualizado' ? 'sel' : ''}" data-chip="upd:Desactualizado">Desactualizados <b>${count(s => s.actualizacion === 'Desactualizado')}</b></button>
        <button type="button" class="${filters.lic === 'No autorizado' ? 'sel' : ''}" data-chip="lic:No autorizado">No autorizados <b>${count(s => s.estadoLicencia === 'No autorizado')}</b></button>
        <button type="button" class="${filters.lic === 'Por vencer' ? 'sel' : ''}" data-chip="lic:Por vencer">Licencia por vencer <b>${count(s => s.estadoLicencia === 'Por vencer')}</b></button>
      </div>
      <div class="tabs">
        <button type="button" class="${filters.tab === 0 ? 'on' : ''}" data-sw-tab="0">Programas instalados</button>
        <button type="button" class="${filters.tab === 1 ? 'on' : ''}" data-sw-tab="1">Licencias y vencimientos</button>
      </div>
      ${body}`;
  }

  function openRegisterModal() {
    const activeCodes = assetService.getActive().map(e => e.codigo);
    if (!activeCodes.length) {
      showToast('No hay equipos activos disponibles.', 'error');
      return;
    }

    const html = `
      <form class="form">
        <div class="fgrid">
          ${formField('equipo', 'Equipo asociado', activeCodes[0], 'text', activeCodes)}
          ${formField('nombre', 'Nombre del software')}
          ${formField('categoria', 'Categoría', SOFTWARE_CATEGORIES[0], 'text', SOFTWARE_CATEGORIES)}
          ${formField('version', 'Versión')}
          ${formField('instalado', 'Fecha de instalación', todayIso().slice(0, 7), 'month')}
          ${formField('licencia', 'Tipo de licencia', 'OEM', 'text', LICENSE_TYPES)}
          ${formField('estadoLicencia', 'Estado de licencia', 'Vigente', 'text', LICENSE_STATUSES)}
          ${formField('actualizacion', 'Estado de actualización', 'Actualizado', 'text', ['Actualizado', 'Desactualizado'])}
        </div>
      </form>`;

    openModal('Registrar software', html, [
      { t: 'Cancelar', fn: closeModal },
      {
        t: 'Registrar software',
        cls: 'pri',
        fn: async overlay => {
          const v = createValidator(overlay);
          const equipo = v.valueOf('equipo');
          const nombre = v.valueOf('nombre');
          v.check('nombre', !nombre, 'Ingresa el nombre del software.');
          v.check('version', !v.valueOf('version'), 'Ingresa la versión.');
          v.check('instalado', !v.valueOf('instalado'), 'Indica la fecha de instalación.');
          if (nombre) {
            const exists = softwareService
              .getAll()
              .some(s => s.equipo === equipo && s.nombre.toLowerCase() === nombre.toLowerCase());
            v.check('nombre', exists, 'Ese programa ya está registrado en el equipo.');
          }
          if (!v.isValid()) {
            showToast('Revisa los campos marcados en rojo.', 'error');
            return;
          }

          const res = await softwareService.register({
            equipo,
            nombre,
            categoria: v.valueOf('categoria'),
            version: v.valueOf('version'),
            instalado: v.valueOf('instalado'),
            licencia: v.valueOf('licencia'),
            estadoLicencia: v.valueOf('estadoLicencia'),
            actualizacion: v.valueOf('actualizacion')
          });
          if (res.ok) {
            closeModal();
            showToast(`${nombre} asociado a ${equipo}`);
          }
        }
      }
    ]);
  }

  function bind(root) {
    root.querySelector('#btn-new-sw').addEventListener('click', openRegisterModal);

    root.querySelectorAll('[data-chip]').forEach(btn => {
      btn.addEventListener('click', () => {
        filters.upd = '';
        filters.lic = '';
        const val = btn.dataset.chip;
        if (val) {
          const [k, v] = val.split(':');
          filters[k] = v;
        }
        filters.tab = 0;
        onRerender();
      });
    });

    root.querySelectorAll('[data-sw-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        filters.tab = Number(btn.dataset.swTab);
        onRerender();
      });
    });

    if (filters.tab !== 0) return;

    const tbody = root.querySelector('#sw-body');
    const counter = root.querySelector('#sw-n');
    const repaint = () => {
      tbody.innerHTML = renderRows();
      counter.textContent = countText();
    };

    root.querySelector('#sw-q').addEventListener('input', ev => {
      filters.q = ev.target.value;
      repaint();
    });
    root.querySelector('#sw-cat').addEventListener('change', ev => {
      filters.cat = ev.target.value;
      repaint();
    });
    root.querySelector('#sw-eq').addEventListener('change', ev => {
      filters.equipo = ev.target.value;
      repaint();
    });
    root.querySelector('#sw-lic').addEventListener('change', ev => {
      filters.lic = ev.target.value;
      repaint();
    });
    root.querySelector('#sw-upd').addEventListener('change', ev => {
      filters.upd = ev.target.value;
      repaint();
    });

    tbody.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-action]');
      if (!btn) return;
      const item = softwareService.getAll().find(s => s.id === btn.dataset.id);
      if (!item) return;

      if (btn.dataset.action === 'update') {
        confirmDialog(
          'Actualizar programa',
          `¿Confirmas la actualización de <b>${esc(item.nombre)}</b> en <b class="mono">${esc(item.equipo)}</b>?`,
          'Actualizar',
          async () => {
            const res = await softwareService.markUpdated(item.id);
            if (res.ok) showToast(`${item.nombre} marcado como actualizado`);
          }
        );
      }

      if (btn.dataset.action === 'remove') {
        confirmDialog(
          'Desinstalar programa',
          `¿Retirar <b>${esc(item.nombre)}</b> del inventario de <b class="mono">${esc(item.equipo)}</b>?`,
          'Desinstalar',
          async () => {
            const res = await softwareService.uninstall(item.id);
            if (res.ok) showToast(`${item.nombre} retirado de ${item.equipo}`);
          },
          true
        );
      }
    });
  }

  return { render, bind };
}
