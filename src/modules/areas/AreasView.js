import { todayIso } from '../../core/date.js';
import { esc, escAttr } from '../../core/sanitize.js';
import { createValidator } from '../../core/validators.js';
import { badge, dataTable, formField } from '../../ui/components.js';
import { closeModal, openModal } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';

export function createAreasView({ transferService, assetService, onRerender }) {
  const state = { area: 'ADM' };

  function render() {
    const areas = transferService.getAreas();
    const activeArea = areas.find(x => x.id === state.area) || areas[0];
    state.area = activeArea.id;
    const stats = transferService.getAreaStats(activeArea.id);

    const cards = areas
      .map(x => {
        const t = transferService.getAreaStats(x.id);
        return `
          <button type="button" class="area${x.id === state.area ? ' on' : ''}" data-select-area="${escAttr(x.id)}">
            <b>${esc(x.nombre)}</b>
            <small>Responsable: ${esc(x.responsable)}</small>
            <div class="nums">
              <span><b>${t.total}</b>equipos</span>
              <span class="ok"><b>${t.op}</b>operativos</span>
              <span class="warn"><b>${t.man}</b>en mant.</span>
              <span class="bad"><b>${t.ino}</b>inoperativos</span>
            </div>
          </button>`;
      })
      .join('');

    const assetRows = stats.lista.map(e => [
      `<b class="mono">${esc(e.codigo)}</b>`,
      `${esc(e.marca)} ${esc(e.modelo)}`,
      esc(e.responsable),
      esc(e.oficina),
      badge(e.estado),
      `<button type="button" class="lnk" data-go="fichas/${escAttr(e.codigo)}">Ficha</button>
       <button type="button" class="lnk" data-transfer-code="${escAttr(e.codigo)}"${e.estado === 'Dado de baja' ? ' disabled' : ''}>Reasignar</button>`
    ]);

    const transferRows = transferService.getTransfers().map(t => [
      esc(t.fecha),
      `<button type="button" class="lnk mono" data-go="fichas/${escAttr(t.equipo)}">${esc(t.equipo)}</button>`,
      `${esc(assetService.getAreaName(t.origen))} → ${esc(assetService.getAreaName(t.destino))}`,
      `${esc(t.de)} → ${esc(t.a)}`,
      esc(t.motivo)
    ]);

    return `
      <div class="head">
        <div>
          <h2 class="page-title">Áreas y asignaciones</h2>
          <p class="page-sub">${areas.length} áreas institucionales y ${assetService.getAll().length} activos registrados.</p>
        </div>
        <button type="button" class="btn pri" id="btn-new-transfer">Reasignar equipo</button>
      </div>
      <div class="areas">${cards}</div>
      <div class="panel">
        <h3>${esc(activeArea.nombre)}: ${stats.total} equipos${stats.baja ? ` (${stats.baja} dados de baja)` : ''}</h3>
        ${dataTable(['Código', 'Equipo', 'Responsable', 'Oficina', 'Estado', 'Acciones'], assetRows, 'Esta área no tiene equipos asignados.')}
      </div>
      <div class="panel">
        <h3>Historial de traslados y reasignaciones</h3>
        ${dataTable(['Fecha', 'Equipo', 'Área', 'Responsable', 'Motivo'], transferRows, 'Sin traslados registrados.')}
      </div>`;
  }

  function openTransferModal(code = null) {
    const activeAssets = assetService.getActive();
    if (!activeAssets.length) {
      showToast('No hay equipos activos disponibles para reasignar.', 'error');
      return;
    }

    const areaList = transferService.getAreaStats(state.area).lista.filter(e => e.estado !== 'Dado de baja');
    const initialCode = code || (areaList[0] ? areaList[0].codigo : activeAssets[0].codigo);
    const asset = assetService.getByCode(initialCode) || activeAssets[0];
    const areas = transferService.getAreas().map(a => [a.id, a.nombre]);

    const html = `
      <form class="form">
        <div class="fgrid">
          ${formField('equipo', 'Equipo', asset.codigo, 'text', activeAssets.map(e => e.codigo))}
          ${formField('fecha', 'Fecha del traslado', todayIso(), 'date')}
          ${formField('area', 'Área de destino', asset.area, 'text', areas)}
          ${formField('oficina', 'Oficina de destino', asset.oficina)}
          ${formField('responsable', 'Nuevo responsable', asset.responsable)}
          ${formField('motivo', 'Motivo del traslado')}
        </div>
        <p class="note">El traslado se agrega de forma permanente al historial y actualiza el área en el inventario e incidencias activas.</p>
      </form>`;

    const overlay = openModal('Reasignar o trasladar equipo', html, [
      { t: 'Cancelar', fn: closeModal },
      {
        t: 'Registrar traslado',
        cls: 'pri',
        fn: async modalRoot => {
          const v = createValidator(modalRoot);
          const selectedCode = v.valueOf('equipo');
          const target = assetService.getByCode(selectedCode);
          if (!target) return;

          v.check('oficina', !v.valueOf('oficina'), 'Indica la oficina de destino.');
          v.check('responsable', !v.valueOf('responsable'), 'Indica el nuevo responsable.');
          v.check('motivo', !v.valueOf('motivo'), 'Indica el motivo del traslado.');
          v.check('fecha', !v.valueOf('fecha') || v.valueOf('fecha') > todayIso(), 'La fecha no puede ser futura.');
          if (v.isValid()) {
            const unchanged =
              v.valueOf('area') === target.area &&
              v.valueOf('responsable') === target.responsable &&
              v.valueOf('oficina') === target.oficina;
            v.check('area', unchanged, 'No hay cambios respecto a la asignación actual.');
          }

          if (!v.isValid()) {
            showToast('Revisa los campos marcados en rojo.', 'error');
            return;
          }

          const destArea = v.valueOf('area');
          const res = await transferService.transferAsset({
            equipo: selectedCode,
            fecha: v.valueOf('fecha'),
            area: destArea,
            oficina: v.valueOf('oficina'),
            responsable: v.valueOf('responsable'),
            motivo: v.valueOf('motivo')
          });

          if (res.ok) {
            state.area = destArea;
            closeModal();
            showToast(`${selectedCode} asignado a ${assetService.getAreaName(destArea)}`);
          }
        }
      }
    ]);

    const eqSelect = overlay.querySelector('#f_equipo');
    eqSelect.addEventListener('change', () => {
      const next = assetService.getByCode(eqSelect.value);
      if (!next) return;
      overlay.querySelector('#f_area').value = next.area;
      overlay.querySelector('#f_oficina').value = next.oficina;
      overlay.querySelector('#f_responsable').value = next.responsable;
    });
  }

  function bind(root) {
    root.querySelector('#btn-new-transfer').addEventListener('click', () => openTransferModal(null));

    root.querySelectorAll('[data-select-area]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.area = btn.dataset.selectArea;
        onRerender();
      });
    });

    root.querySelectorAll('[data-transfer-code]').forEach(btn => {
      btn.addEventListener('click', () => openTransferModal(btn.dataset.transferCode));
    });
  }

  return { render, bind };
}
