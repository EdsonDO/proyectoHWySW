import { esc, escAttr } from '../core/sanitize.js';

export const STATUS_TONE = Object.freeze({
  Operativo: 'ok',
  Vigente: 'ok',
  Actualizado: 'ok',
  Realizado: 'ok',
  Resuelta: 'ok',
  Cerrada: 'ok',
  Bueno: 'ok',
  Aprobada: 'ok',
  Satisfactorio: 'ok',
  Normal: 'ok',
  Adecuado: 'ok',
  'En mantenimiento': 'warn',
  'Por vencer': 'warn',
  Desactualizado: 'warn',
  'En proceso': 'warn',
  Pendiente: 'warn',
  Regular: 'warn',
  Media: 'warn',
  'Con observaciones': 'warn',
  'Requiere seguimiento': 'warn',
  Incompleta: 'warn',
  Vigilar: 'warn',
  Asignada: 'info',
  Programado: 'info',
  'Requiere atención': 'bad',
  Atención: 'bad',
  Inoperativo: 'bad',
  Vencida: 'bad',
  'No autorizado': 'bad',
  Atrasado: 'bad',
  Deficiente: 'bad',
  Alta: 'bad',
  POST: 'info',
  PUT: 'warn',
  PATCH: 'warn',
  DELETE: 'bad',
  SYSTEM: 'mu'
});

export function badge(label) {
  const tone = STATUS_TONE[label] || 'mu';
  return `<span class="tag ${tone}">${esc(label)}</span>`;
}

export function selectOptions(list, selectedValue) {
  return list
    .map(item => {
      const [value, text] = Array.isArray(item) ? item : [item, item];
      const isSelected = String(value) === String(selectedValue) ? ' selected' : '';
      return `<option value="${escAttr(value)}"${isSelected}>${esc(text)}</option>`;
    })
    .join('');
}

export function formField(key, label, value = '', type = 'text', options = null, readOnly = false) {
  let control;
  if (options) {
    control = `<select id="f_${escAttr(key)}">${selectOptions(options, value)}</select>`;
  } else if (type === 'textarea') {
    control = `<textarea id="f_${escAttr(key)}" rows="2">${esc(value)}</textarea>`;
  } else {
    const roAttr = readOnly ? ' readonly' : '';
    const minAttr = type === 'number' ? ' min="0"' : '';
    control = `<input id="f_${escAttr(key)}" type="${escAttr(type)}" value="${escAttr(value)}"${roAttr}${minAttr}>`;
  }
  return `<label class="fld"><span>${esc(label)}</span>${control}<em id="e_${escAttr(key)}"></em></label>`;
}

export function kvList(pairs, singleCol = false) {
  const cls = singleCol ? 'kv one' : 'kv';
  const items = pairs
    .map(([label, valHtml]) => `<div><dt>${esc(label)}</dt><dd>${valHtml !== undefined && valHtml !== null && valHtml !== '' ? valHtml : '—'}</dd></div>`)
    .join('');
  return `<dl class="${cls}">${items}</dl>`;
}

export function dataTable(columns, rows, emptyMessage = 'Sin registros disponibles.') {
  if (!rows.length) {
    return `<p class="muted empty-msg">${esc(emptyMessage)}</p>`;
  }
  const head = columns.map(c => `<th>${esc(c)}</th>`).join('');
  const body = rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
  return `<div class="tbl"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export function meterBar(percent, isAlert = false, wide = true) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  const cls = `meter${wide ? ' wide' : ''}${isAlert ? ' hi' : ''}`;
  return `<div class="${cls}"><i style="width:${safe}%"></i></div>`;
}
