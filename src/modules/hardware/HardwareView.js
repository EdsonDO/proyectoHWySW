import { todayIso } from '../../core/date.js';
import { esc, escAttr } from '../../core/sanitize.js';
import { CODE_PATTERN, createValidator } from '../../core/validators.js';
import { ASSET_STATUSES, ASSET_TYPES } from '../../data/seedData.js';
import { badge, formField, selectOptions } from '../../ui/components.js';
import { closeModal, confirmDialog, openModal } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';

const REQUIRED_FIELDS = {
  patrimonial: 'el código patrimonial',
  codigo: 'el código interno',
  marca: 'la marca',
  modelo: 'el modelo',
  serie: 'el número de serie',
  fechaAdq: 'la fecha de adquisición',
  cpu: 'el procesador',
  ram: 'la memoria RAM',
  capDisco: 'la capacidad de almacenamiento',
  oficina: 'la oficina',
  responsable: 'el responsable'
};

export function createHardwareView({ assetService, transferService, authService, router, onOpenFichaTab }) {
  const filters = { q: '', area: '', marca: '', estado: '' };

  function renderRows() {
    const list = assetService.filter(filters);
    if (!list.length) {
      return '<tr><td colspan="12" class="muted empty-msg">Ningún equipo coincide con los filtros seleccionados.</td></tr>';
    }
    return list
      .map(
        e => `
        <tr>
          <td><b class="mono">${esc(e.codigo)}</b></td>
          <td>${esc(e.nombre)}</td>
          <td>${esc(e.marca)}</td>
          <td>${esc(e.modelo)}</td>
          <td class="mono">${esc(e.serie)}</td>
          <td>${esc(e.cpu)}</td>
          <td>${e.ram} GB</td>
          <td>${esc(e.disco)}</td>
          <td>${esc(assetService.getAreaName(e.area))}</td>
          <td>${esc(e.responsable)}</td>
          <td>${badge(e.estado)}</td>
          <td class="acc">
            <button type="button" class="lnk" data-go="fichas/${escAttr(e.codigo)}">Ficha</button>
            <button type="button" class="lnk" data-action="history" data-code="${escAttr(e.codigo)}">Historial</button>
            <button type="button" class="lnk" data-action="edit" data-code="${escAttr(e.codigo)}">Editar</button>
            <button type="button" class="lnk bad" data-action="decommission" data-code="${escAttr(e.codigo)}"${e.estado === 'Dado de baja' ? ' disabled' : ''}>Dar de baja</button>
          </td>
        </tr>`
      )
      .join('');
  }

  function countText() {
    return `${assetService.filter(filters).length} de ${assetService.getAll().length} equipos`;
  }

  function render() {
    const areas = transferService.getAreas().map(a => [a.id, a.nombre]);
    const brands = assetService.getBrands();
    return `
      <div class="head">
        <div>
          <h2 class="page-title">Inventario de hardware</h2>
          <p class="page-sub" id="hw-n">${esc(countText())}</p>
        </div>
        <button type="button" class="btn pri" id="btn-new-asset">Registrar equipo</button>
      </div>
      <div class="filters">
        <input id="hw-q" type="search" placeholder="Buscar por código, nombre, modelo o serie" value="${escAttr(filters.q)}">
        <select id="hw-area"><option value="">Todas las áreas</option>${selectOptions(areas, filters.area)}</select>
        <select id="hw-marca"><option value="">Todas las marcas</option>${selectOptions(brands, filters.marca)}</select>
        <select id="hw-estado"><option value="">Todos los estados</option>${selectOptions(ASSET_STATUSES, filters.estado)}</select>
      </div>
      <div class="panel tbl">
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Nombre</th><th>Marca</th><th>Modelo</th><th>N.º de serie</th>
              <th>Procesador</th><th>RAM</th><th>Almacenamiento</th><th>Área</th><th>Responsable</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody id="hw-body">${renderRows()}</tbody>
        </table>
      </div>`;
  }

  function openAssetModal(code = null) {
    const e = code
      ? assetService.getByCode(code)
      : {
          tipo: ASSET_TYPES[0],
          tipoRam: 'DDR4',
          disco: 'SSD ',
          area: transferService.getAreas()[0].id,
          estado: 'Operativo',
          fechaAsig: todayIso(),
          otros: ''
        };
    if (!e) return;

    const [diskType, ...capParts] = String(e.disco || 'SSD ').split(' ');
    const areas = transferService.getAreas().map(a => [a.id, a.nombre]);
    const html = `
      <form class="form" id="asset-form">
        <h4>Identificación</h4>
        <div class="fgrid">
          ${formField('patrimonial', 'Código patrimonial', e.patrimonial)}
          ${formField('codigo', 'Código interno (ej. PC-ADM-004)', e.codigo, 'text', null, Boolean(code))}
          ${formField('tipo', 'Tipo de equipo', e.tipo, 'text', ASSET_TYPES)}
          ${formField('marca', 'Marca', e.marca)}
          ${formField('modelo', 'Modelo', e.modelo)}
          ${formField('serie', 'Número de serie', e.serie)}
          ${formField('fechaAdq', 'Fecha de adquisición', e.fechaAdq, 'date')}
          ${formField('garantia', 'Fecha de garantía', e.garantia, 'date')}
        </div>
        <h4>Especificaciones de hardware</h4>
        <div class="fgrid">
          ${formField('cpu', 'Procesador', e.cpu)}
          ${formField('placa', 'Placa madre', e.placa)}
          ${formField('ram', 'Memoria RAM (GB)', e.ram, 'number')}
          ${formField('tipoRam', 'Tipo de memoria', e.tipoRam, 'text', ['DDR3', 'DDR4', 'DDR5'])}
          ${formField('tipoDisco', 'Tipo de almacenamiento', diskType, 'text', ['HDD', 'SSD', 'NVMe'])}
          ${formField('capDisco', 'Capacidad (ej. 480 GB)', capParts.join(' '))}
          ${formField('gpu', 'Tarjeta gráfica', e.gpu)}
          ${formField('fuente', 'Fuente de alimentación', e.fuente)}
          ${formField('monitor', 'Monitor', e.monitor)}
          ${formField('teclado', 'Teclado', e.teclado)}
          ${formField('mouse', 'Mouse', e.mouse)}
          ${formField('otros', 'Otros periféricos', e.otros)}
        </div>
        <h4>Asignación y estado</h4>
        <div class="fgrid">
          ${formField('area', 'Área', e.area, 'text', areas)}
          ${formField('oficina', 'Oficina', e.oficina)}
          ${formField('responsable', 'Responsable', e.responsable)}
          ${formField('fechaAsig', 'Fecha de asignación', e.fechaAsig, 'date')}
          ${formField('estado', 'Estado operativo', e.estado, 'text', ASSET_STATUSES)}
        </div>
      </form>`;

    openModal(code ? `Editar ${code}` : 'Registrar equipo', html, [
      { t: 'Cancelar', fn: closeModal },
      {
        t: code ? 'Guardar cambios' : 'Registrar equipo',
        cls: 'pri',
        fn: async overlay => {
          await saveAsset(code, overlay);
        }
      }
    ]);
  }

  async function saveAsset(code, modalRoot) {
    const v = createValidator(modalRoot);
    Object.entries(REQUIRED_FIELDS).forEach(([k, label]) => {
      v.check(k, !v.valueOf(k), `Ingresa ${label}.`);
    });

    const codigo = v.valueOf('codigo').toUpperCase();
    const serie = v.valueOf('serie');
    const allAssets = assetService.getAll();

    if (codigo && !code) {
      if (!CODE_PATTERN.test(codigo)) {
        v.setError('codigo', 'Usa solo letras, números y guiones (ej. PC-TI-004).');
      } else if (allAssets.some(a => a.codigo === codigo)) {
        v.setError('codigo', 'Ese código interno ya está registrado.');
      }
    }
    if (serie) {
      v.check('serie', allAssets.some(a => a.serie === serie && a.codigo !== codigo), 'Ese número de serie ya existe.');
    }
    if (v.valueOf('ram')) {
      v.check('ram', !(Number(v.valueOf('ram')) > 0), 'Debe ser un número mayor que 0.');
    }
    if (v.valueOf('fechaAdq')) {
      v.check('fechaAdq', v.valueOf('fechaAdq') > todayIso(), 'La fecha no puede ser futura.');
    }
    if (v.valueOf('garantia') && v.valueOf('fechaAdq')) {
      v.check('garantia', v.valueOf('garantia') < v.valueOf('fechaAdq'), 'No puede ser anterior a la adquisición.');
    }

    if (!v.isValid()) {
      showToast('Revisa los campos marcados en rojo.', 'error');
      return;
    }

    const keys = [
      'patrimonial', 'tipo', 'marca', 'modelo', 'serie', 'fechaAdq', 'garantia',
      'cpu', 'placa', 'tipoRam', 'gpu', 'fuente', 'monitor', 'teclado', 'mouse',
      'otros', 'area', 'oficina', 'responsable', 'fechaAsig', 'estado'
    ];
    const payload = {};
    keys.forEach(k => {
      payload[k] = v.valueOf(k);
    });
    payload.codigo = codigo;
    payload.ram = Number(v.valueOf('ram'));
    payload.disco = `${v.valueOf('tipoDisco')} ${v.valueOf('capDisco')}`;

    const user = authService.getCurrentUser();
    const res = code
      ? await assetService.update(code, payload, user ? user.name : 'Sistema')
      : await assetService.create(payload);

    if (!res.ok) {
      showToast(res.error, 'error');
      return;
    }
    closeModal();
    showToast(code ? `${codigo} actualizado correctamente` : `${codigo} registrado en el inventario`);
  }

  function confirmDecommission(code) {
    confirmDialog(
      'Dar de baja el equipo',
      `¿Confirmas la baja patrimonial de <b>${esc(code)}</b>? El registro histórico se conservará con estado "Dado de baja".`,
      'Dar de baja',
      async () => {
        const res = await assetService.decommission(code);
        if (res.ok) showToast(`${code} actualizado a Dado de baja`);
      },
      true
    );
  }

  function bind(root) {
    const tbody = root.querySelector('#hw-body');
    const counter = root.querySelector('#hw-n');
    const repaint = () => {
      tbody.innerHTML = renderRows();
      counter.textContent = countText();
    };

    root.querySelector('#btn-new-asset').addEventListener('click', () => openAssetModal(null));
    root.querySelector('#hw-q').addEventListener('input', ev => {
      filters.q = ev.target.value;
      repaint();
    });
    root.querySelector('#hw-area').addEventListener('change', ev => {
      filters.area = ev.target.value;
      repaint();
    });
    root.querySelector('#hw-marca').addEventListener('change', ev => {
      filters.marca = ev.target.value;
      repaint();
    });
    root.querySelector('#hw-estado').addEventListener('change', ev => {
      filters.estado = ev.target.value;
      repaint();
    });

    tbody.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-action]');
      if (!btn) return;
      const code = btn.dataset.code;
      if (btn.dataset.action === 'edit') openAssetModal(code);
      if (btn.dataset.action === 'decommission') confirmDecommission(code);
      if (btn.dataset.action === 'history') {
        onOpenFichaTab(code, 4);
        router.navigate(`fichas/${code}`);
      }
    });
  }

  return { render, bind, openAssetModal };
}
