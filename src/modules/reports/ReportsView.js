import { todayIso } from '../../core/date.js';
import { esc, escAttr } from '../../core/sanitize.js';
import { MAINTENANCE_TYPES } from '../../data/seedData.js';
import { barChart, donutChart, STATUS_COLORS } from '../../ui/charts.js';
import { badge, dataTable, selectOptions } from '../../ui/components.js';
import { showToast } from '../../ui/toast.js';

const FILTER_LABELS = { desde: 'Desde', hasta: 'Hasta', area: 'Área', equipo: 'Equipo', tipo: 'Tipo' };

export function createReportsView({ reportService, assetService, transferService, onRerender }) {
  const filters = { rep: 'inventario', desde: '', hasta: '', area: '', equipo: '', tipo: '' };

  function buildFilterSummary(def) {
    const active = def.usa
      .filter(k => (k === 'fecha' ? filters.desde || filters.hasta : filters[k]))
      .map(k =>
        k === 'fecha'
          ? `Fechas ${filters.desde || '…'} a ${filters.hasta || '…'}`
          : `${FILTER_LABELS[k]}: ${k === 'area' ? assetService.getAreaName(filters.area) : filters[k]}`
      );
    return active.length ? active.join('. ') : 'Sin filtros aplicados';
  }

  function render() {
    const { def, result } = reportService.generate(filters.rep, filters);
    const definitions = reportService.getDefinitions();
    const isEnabled = key =>
      def.usa.includes(key) ||
      (key === 'desde' && def.usa.includes('fecha')) ||
      (key === 'hasta' && def.usa.includes('fecha'));
    const disAttr = key => (isEnabled(key) ? '' : ' disabled title="Este filtro no aplica a este reporte"');

    const navHtml = definitions
      .map((item, i) => `<button type="button" class="${item.id === def.id ? 'on' : ''}" data-rep-id="${escAttr(item.id)}"><span>${i + 1}</span>${esc(item.t)}</button>`)
      .join('');

    const rows = result.filas.map(row =>
      row.map((cell, idx) => ((result.badge || []).includes(idx) ? badge(cell) : esc(cell)))
    );

    const hasChart = result.grafico && Object.keys(result.grafico.datos).length > 0;
    const chartHtml = hasChart
      ? `<div class="panel"><h3>${esc(def.gtitulo)}</h3>${
          result.grafico.tipo === 'donut' ? donutChart(result.grafico.datos, STATUS_COLORS) : barChart(result.grafico.datos)
        }</div>`
      : '';

    const areas = transferService.getAreas().map(a => [a.id, a.nombre]);
    const codes = assetService.getAll().map(e => e.codigo);

    return `
      <div class="head">
        <div>
          <h2 class="page-title">Reportes institucionales</h2>
          <p class="page-sub">${definitions.length} reportes consolidados con filtros dinámicos, gráficos y exportación CSV/PDF.</p>
        </div>
        <div class="btns">
          <button type="button" class="btn" id="btn-rep-csv">Exportar a Excel (CSV)</button>
          <button type="button" class="btn pri" id="btn-rep-pdf">Exportar a PDF (imprimir)</button>
        </div>
      </div>
      <div class="repgrid">
        <nav class="replist" aria-label="Listado de reportes">${navHtml}</nav>
        <div class="repbody">
          <div class="filters">
            <label class="fl">Desde<input id="rep-desde" type="date" value="${escAttr(filters.desde)}"${disAttr('desde')}></label>
            <label class="fl">Hasta<input id="rep-hasta" type="date" value="${escAttr(filters.hasta)}"${disAttr('hasta')}></label>
            <label class="fl">Área<select id="rep-area"${disAttr('area')}><option value="">Todas</option>${selectOptions(areas, filters.area)}</select></label>
            <label class="fl">Equipo<select id="rep-eq"${disAttr('equipo')}><option value="">Todos</option>${selectOptions(codes, filters.equipo)}</select></label>
            <label class="fl">Tipo de intervención<select id="rep-tipo"${disAttr('tipo')}><option value="">Todos</option>${selectOptions(MAINTENANCE_TYPES, filters.tipo)}</select></label>
            <button type="button" class="lnk" id="btn-rep-clear">Limpiar filtros</button>
          </div>
          <div class="solo-print">
            <h2>Sistema Integral de Gestión de Activos Informáticos</h2>
            <p>Generado el ${esc(todayIso())} · ${esc(buildFilterSummary(def))}</p>
          </div>
          <h3 class="reptitle">${esc(def.t)}</h3>
          ${chartHtml}
          <div class="panel" style="margin-top:14px">
            ${result.mensaje ? `<p class="muted">${esc(result.mensaje)}</p>` : dataTable(result.cols, rows, 'No hay registros para los filtros seleccionados.')}
            ${result.resumen ? `<p class="note">${esc(result.resumen)}</p>` : ''}
            ${result.nota ? `<p class="muted" style="margin-top:10px">${esc(result.nota)}</p>` : ''}
            <p class="muted" style="margin-top:10px;font-size:12.5px">${result.filas.length} registro(s) consolidados.</p>
          </div>
        </div>
      </div>`;
  }

  function bind(root) {
    root.querySelectorAll('[data-rep-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        filters.rep = btn.dataset.repId;
        onRerender();
      });
    });

    root.querySelector('#rep-desde').addEventListener('change', ev => {
      filters.desde = ev.target.value;
      onRerender();
    });
    root.querySelector('#rep-hasta').addEventListener('change', ev => {
      filters.hasta = ev.target.value;
      onRerender();
    });
    root.querySelector('#rep-area').addEventListener('change', ev => {
      filters.area = ev.target.value;
      onRerender();
    });
    root.querySelector('#rep-eq').addEventListener('change', ev => {
      filters.equipo = ev.target.value;
      onRerender();
    });
    root.querySelector('#rep-tipo').addEventListener('change', ev => {
      filters.tipo = ev.target.value;
      onRerender();
    });

    root.querySelector('#btn-rep-clear').addEventListener('click', () => {
      Object.assign(filters, { desde: '', hasta: '', area: '', equipo: '', tipo: '' });
      onRerender();
    });

    root.querySelector('#btn-rep-csv').addEventListener('click', () => {
      const res = reportService.exportCsv(filters.rep, filters);
      if (!res.ok) {
        showToast('No hay datos para exportar con los filtros actuales.', 'error');
        return;
      }
      showToast(`Reporte exportado: ${res.filename}`);
    });

    root.querySelector('#btn-rep-pdf').addEventListener('click', () => window.print());
  }

  return { render, bind };
}
