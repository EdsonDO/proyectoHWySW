import { esc, escAttr } from '../../core/sanitize.js';
import { createValidator, STORAGE_PATTERN } from '../../core/validators.js';
import { dataTable, formField, selectOptions } from '../../ui/components.js';
import { closeModal, openModal } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';

const TIMELINE_FILTERS = ['Todo', 'Modificaciones', 'Mantenimientos', 'Incidencias'];
const TIMELINE_CLASS = { Modificaciones: 'mod', Mantenimientos: 'man', Incidencias: 'inc' };

export function createHistoryView({ historyService, assetService, systemService, onRerender }) {
  const state = { equipo: 'PC-ADM-001', filtro: 'Todo', tab: 0 };

  function renderAssetView(asset) {
    const orig = historyService.getOriginalConfig(asset);
    const curr = historyService.getCurrentConfig(asset);
    const mods = historyService.getByAsset(asset.codigo);

    const cfgCard = (cfg, ref) => `
      <dl class="kv one">
        <div><dt>Procesador</dt><dd>${esc(asset.cpu)}</dd></div>
        <div><dt>Memoria</dt><dd class="${ref && ref.ram !== cfg.ram ? 'chg' : ''}">${esc(cfg.ram)}</dd></div>
        <div><dt>Almacenamiento</dt><dd class="${ref && ref.disco !== cfg.disco ? 'chg' : ''}">${esc(cfg.disco)}</dd></div>
      </dl>`;

    const events = historyService
      .getTimelineForAsset(asset)
      .filter(ev => state.filtro === 'Todo' || ev.k === state.filtro);

    const options = assetService.getAll().map(x => [x.codigo, `${x.codigo}: ${x.marca} ${x.modelo}`]);

    return `
      <div class="filters">
        <select id="hs-eq">${selectOptions(options, asset.codigo)}</select>
        <button type="button" class="lnk" data-go="fichas/${escAttr(asset.codigo)}">Abrir ficha técnica</button>
      </div>
      <div class="trio">
        <div class="panel"><h3>Configuración original</h3>${cfgCard(orig, null)}</div>
        <div class="panel">
          <h3>Modificaciones realizadas (${mods.length})</h3>
          ${
            mods.length
              ? `<ol class="niv">${mods.map(m => `<li><b>${esc(m.fecha)}</b><br>${esc(m.anterior)} → ${esc(m.nuevo)}</li>`).join('')}</ol>`
              : '<p class="muted">Sin modificaciones. Conserva su configuración original.</p>'
          }
        </div>
        <div class="panel"><h3>Configuración actual</h3>${cfgCard(curr, orig)}</div>
      </div>
      <div class="panel">
        <h3>Línea de tiempo de intervenciones</h3>
        <div class="chips">
          ${TIMELINE_FILTERS.map(f => `<button type="button" class="${state.filtro === f ? 'sel' : ''}" data-hs-filter="${escAttr(f)}">${esc(f)}</button>`).join('')}
        </div>
        <ol class="tl">
          ${events
            .map(
              ev => `<li class="${TIMELINE_CLASS[ev.k] || 'mod'}"><time>${esc(ev.f)}</time><b>${esc(ev.t)}</b><span>${esc(ev.d)}</span></li>`
            )
            .join('')}
        </ol>
      </div>`;
  }

  function render() {
    const assets = assetService.getAll();
    const asset = assetService.getByCode(state.equipo) || assets[0];
    if (asset) state.equipo = asset.codigo;

    const allMods = historyService.getAll();
    const uniqueAssets = new Set(allMods.map(m => m.equipo)).size;
    const investment = allMods.reduce((sum, m) => sum + Number(m.costo || 0), 0);

    const body =
      state.tab === 0 && asset
        ? renderAssetView(asset)
        : `<div class="panel">${dataTable(
            ['Equipo', 'Fecha', 'Componente anterior', 'Componente nuevo', 'Motivo', 'Técnico', 'Costo (S/)', 'Observaciones'],
            allMods.map(m => [
              `<button type="button" class="lnk mono" data-go="fichas/${escAttr(m.equipo)}">${esc(m.equipo)}</button>`,
              esc(m.fecha),
              esc(m.anterior),
              esc(m.nuevo),
              esc(m.motivo),
              esc(m.tecnico),
              m.costo,
              esc(m.obs)
            ]),
            'No hay modificaciones registradas.'
          )}</div>`;

    return `
      <div class="head">
        <div>
          <h2 class="page-title">Historial técnico y repotenciación</h2>
          <p class="page-sub">${allMods.length} modificaciones en ${uniqueAssets} equipos. Inversión acumulada: S/ ${investment}.</p>
        </div>
        <button type="button" class="btn pri" id="btn-new-mod">Registrar modificación</button>
      </div>
      <div class="tabs">
        <button type="button" class="${state.tab === 0 ? 'on' : ''}" data-hs-tab="0">Por equipo</button>
        <button type="button" class="${state.tab === 1 ? 'on' : ''}" data-hs-tab="1">Todas las modificaciones</button>
      </div>
      ${body}`;
  }

  function openModificationModal(preselectedCode = null) {
    const activeCodes = assetService.getActive().map(e => e.codigo);
    const techs = systemService.getTechnicians();
    if (!activeCodes.length) {
      showToast('No hay equipos activos disponibles.', 'error');
      return;
    }

    const defaultCode = preselectedCode && activeCodes.includes(preselectedCode) ? preselectedCode : activeCodes.includes(state.equipo) ? state.equipo : activeCodes[0];

    const html = `
      <form class="form">
        <div class="fgrid">
          ${formField('equipo', 'Equipo', defaultCode, 'text', activeCodes)}
          ${formField('comp', 'Componente', 'Memoria RAM', 'text', ['Memoria RAM', 'Almacenamiento'])}
          ${formField('nuevo', 'Nuevo valor (RAM: GB ej. 16 | Disco: ej. SSD 480 GB)')}
          ${formField('costo', 'Costo (S/)', 0, 'number')}
          ${formField('tecnico', 'Técnico responsable', techs[0], 'text', techs)}
          ${formField('motivo', 'Motivo de la mejora')}
          ${formField('obs', 'Observaciones', '', 'textarea')}
        </div>
        <p class="note">El componente anterior se registra automáticamente desde la configuración actual del equipo sin sobrescribir el historial previo.</p>
      </form>`;

    openModal('Registrar modificación de hardware', html, [
      { t: 'Cancelar', fn: closeModal },
      {
        t: 'Registrar modificación',
        cls: 'pri',
        fn: async overlay => {
          const v = createValidator(overlay);
          const code = v.valueOf('equipo');
          const asset = assetService.getByCode(code);
          const comp = v.valueOf('comp');
          const isRam = comp === 'Memoria RAM';
          const rawVal = v.valueOf('nuevo');

          if (isRam) {
            v.check('nuevo', !(Number(rawVal) > 0), 'Ingresa la capacidad en GB como número mayor que 0.');
          } else {
            v.check('nuevo', !STORAGE_PATTERN.test(rawVal), 'Usa el formato SSD 480 GB, NVMe 1 TB o HDD 1 TB.');
          }

          if (v.isValid() && asset) {
            const normalized = isRam ? `RAM ${Number(rawVal)} GB` : rawVal.replace(/^(hdd|ssd|nvme)/i, s => s.toUpperCase());
            const current = isRam ? `RAM ${asset.ram} GB` : asset.disco;
            v.check('nuevo', normalized === current, 'El nuevo valor coincide con el componente actual.');
          }

          v.check('motivo', !v.valueOf('motivo'), 'Indica el motivo.');
          const costRaw = v.valueOf('costo');
          v.check('costo', costRaw === '' || Number(costRaw) < 0, 'Ingresa un costo de 0 o más.');

          if (!v.isValid()) {
            showToast('Revisa los campos marcados en rojo.', 'error');
            return;
          }

          const res = await historyService.registerModification({
            equipo: code,
            component: comp,
            newValue: rawVal,
            costo: Number(costRaw),
            tecnico: v.valueOf('tecnico'),
            motivo: v.valueOf('motivo'),
            obs: v.valueOf('obs')
          });

          if (res.ok) {
            state.equipo = code;
            state.tab = 0;
            closeModal();
            showToast(`Modificación agregada al historial de ${code}`);
          }
        }
      }
    ]);
  }

  function bind(root) {
    root.querySelector('#btn-new-mod').addEventListener('click', () => openModificationModal());

    root.querySelectorAll('[data-hs-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.tab = Number(btn.dataset.hsTab);
        onRerender();
      });
    });

    const eqSelect = root.querySelector('#hs-eq');
    if (eqSelect) {
      eqSelect.addEventListener('change', ev => {
        state.equipo = ev.target.value;
        onRerender();
      });
    }

    root.querySelectorAll('[data-hs-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.filtro = btn.dataset.hsFilter;
        onRerender();
      });
    });
  }

  return { render, bind, openModificationModal };
}
