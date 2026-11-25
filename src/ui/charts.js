import { esc } from '../core/sanitize.js';

export const STATUS_COLORS = Object.freeze({
  Operativo: '#16A34A',
  'En mantenimiento': '#D97706',
  Inoperativo: '#DC2626',
  'Dado de baja': '#64748B'
});

export function donutChart(data, colors = STATUS_COLORS) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (!total) {
    return '<p class="muted empty-msg">Sin datos disponibles para graficar.</p>';
  }

  let acc = 0;
  const stops = entries.map(([label, value]) => {
    const start = (acc / total) * 100;
    acc += value;
    const end = (acc / total) * 100;
    const color = colors[label] || '#2563EB';
    return `${color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
  });

  const legend = Object.entries(data)
    .map(([label, value]) => {
      const color = colors[label] || '#2563EB';
      return `<li><i style="background:${color}"></i><span>${esc(label)}</span><b>${value}</b></li>`;
    })
    .join('');

  return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops.join(',')})"><span>${total}</span></div><ul class="legend">${legend}</ul></div>`;
}

export function barChart(data) {
  const entries = Object.entries(data);
  if (!entries.length) {
    return '<p class="muted empty-msg">Sin datos disponibles para graficar.</p>';
  }
  const max = Math.max(...entries.map(([, v]) => Number(v) || 0), 1);
  const rows = entries
    .map(([label, value]) => {
      const pct = ((Number(value) || 0) / max) * 100;
      return `<div class="bar"><span title="${esc(label)}">${esc(label)}</span><div><i style="width:${pct.toFixed(2)}%"></i></div><b>${value}</b></div>`;
    })
    .join('');
  return `<div class="bars">${rows}</div>`;
}

export function columnChart(data) {
  const entries = Object.entries(data);
  if (!entries.length) {
    return '<p class="muted empty-msg">Sin datos disponibles para graficar.</p>';
  }
  const max = Math.max(...entries.map(([, v]) => Number(v) || 0), 1);
  const cols = entries
    .map(([label, value]) => {
      const pct = ((Number(value) || 0) / max) * 100;
      return `<div class="col"><b>${value}</b><i style="height:${Math.max(pct, value > 0 ? 8 : 2).toFixed(2)}%"></i><span>${esc(label)}</span></div>`;
    })
    .join('');
  return `<div class="cols">${cols}</div>`;
}
