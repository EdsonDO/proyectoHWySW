export const ICONS = Object.freeze({
  menu: 'M4 6h16M4 12h16M4 18h16',
  bell: 'M6 17v-6a6 6 0 0 1 12 0v6l2 2H4zM10 21h4',
  dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
  hardware: 'M3 4h18v12H3zM8 20h8M12 16v4',
  software: 'M8 7l-5 5 5 5M16 7l5 5-5 5',
  fichas: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6',
  mantHw: 'M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 0-2-2z',
  mantSw: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  ordenes: 'M9 4h6v3H9zM9 5H6v16h12V5h-3M9 12h6M9 16h4',
  historial: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  planificacion: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  evaluacion: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3',
  reportes: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h3',
  areas: 'M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2',
  config: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'
});

export function icon(pathData, className = 'ic') {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="${pathData}"/></svg>`;
}
