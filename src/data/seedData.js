import { offsetDay, offsetFromDate } from '../core/date.js';

export const ASSET_TYPES = [
  'Computadora de escritorio',
  'Laptop',
  'All-in-One',
  'Impresora',
  'Otro periférico'
];

export const ASSET_STATUSES = [
  'Operativo',
  'En mantenimiento',
  'Inoperativo',
  'Dado de baja'
];

export const SOFTWARE_CATEGORIES = [
  'Sistemas operativos',
  'Ofimática',
  'Antivirus',
  'Navegadores',
  'Aplicaciones institucionales',
  'Herramientas técnicas',
  'Otros programas'
];

export const LICENSE_TYPES = [
  'OEM',
  'Volumen',
  'Suscripción',
  'Educativa',
  'Institucional',
  'Libre',
  'Ninguna'
];

export const LICENSE_STATUSES = [
  'Vigente',
  'Por vencer',
  'Vencida',
  'No requiere',
  'No autorizado'
];

export const MAINTENANCE_TYPES = ['Preventivo', 'Predictivo', 'Correctivo'];

export const CHECKLIST_STATUSES = [
  'Realizado',
  'No realizado',
  'No aplica',
  'Requiere atención'
];

export const MAINTENANCE_RESULTS = [
  'Satisfactorio',
  'Con observaciones',
  'Requiere seguimiento'
];

export const MAINTENANCE_LEVELS = [
  'Comprobación diaria del funcionamiento',
  'Observación semanal, incluyendo el nivel 1',
  'Pruebas de rendimiento de todos los componentes',
  'Inspección general, limpieza y optimización',
  'Inspección de control de calidad por personal especializado'
];

export const SOFTWARE_CORRECTIVE_ACTIONS = [
  'Reparación de aplicaciones',
  'Reinstalación de programas',
  'Corrección de errores del sistema',
  'Eliminación de malware',
  'Recuperación de archivos',
  'Restauración del sistema',
  'Corrección de controladores'
];

export const HARDWARE_CHECKLIST = [
  'Limpieza interna del gabinete',
  'Limpieza de ventiladores',
  'Limpieza de disipadores',
  'Verificación de temperatura',
  'Inspección de memoria RAM',
  'Revisión del estado del disco mediante SMART',
  'Verificación de la fuente de alimentación',
  'Revisión de cables y conexiones',
  'Verificación de puertos',
  'Inspección de periféricos',
  'Prueba de encendido',
  'Verificación del funcionamiento general'
];

export const SOFTWARE_CHECKLIST = [
  'Verificar el sistema operativo',
  'Comprobar actualizaciones pendientes',
  'Revisar controladores',
  'Verificar el antivirus',
  'Ejecutar análisis de seguridad',
  'Revisar programas instalados',
  'Identificar aplicaciones no autorizadas',
  'Limpiar archivos temporales',
  'Verificar el espacio disponible',
  'Revisar registros de errores',
  'Comprobar aplicaciones institucionales',
  'Verificar copias de seguridad',
  'Comprobar licencias'
];

export const TICKET_STATUSES = [
  'Pendiente',
  'Asignada',
  'En proceso',
  'Resuelta',
  'Cerrada'
];

export const INSTITUTIONAL_USERS = [
  {
    id: 'USR-01',
    email: 'admin@sigai.edu.pe',
    password: 'sigai2026',
    name: 'Marco Ledesma',
    initials: 'ML',
    role: 'Administrador TI',
    area: 'Soporte TI'
  },
  {
    id: 'USR-02',
    email: 'soporte@sigai.edu.pe',
    password: 'sigai2026',
    name: 'Ana Rojas',
    initials: 'AR',
    role: 'Especialista de Soporte',
    area: 'Soporte TI'
  },
  {
    id: 'USR-03',
    email: 'auditor@sigai.edu.pe',
    password: 'sigai2026',
    name: 'Patricia Vega',
    initials: 'PV',
    role: 'Auditoría y Control',
    area: 'Administración'
  }
];

export function createSeedDataset() {
  const areas = [
    { id: 'ADM', nombre: 'Administración', responsable: 'Patricia Vega' },
    { id: 'ACA', nombre: 'Dirección Académica', responsable: 'Raúl Mendoza' },
    { id: 'BIB', nombre: 'Biblioteca', responsable: 'Silvia Cárdenas' },
    { id: 'LAB', nombre: 'Laboratorio de Cómputo', responsable: 'Hugo Ríos' },
    { id: 'TI', nombre: 'Soporte TI', responsable: 'Marco Ledesma' }
  ];

  const technicians = [
    'Luis Carrasco',
    'Ana Rojas',
    'Diego Paredes',
    'Carla Meza',
    'Jorge Salinas'
  ];

  const rawAssets = [
    ['PC-ADM-001', 'Dell', 'OptiPlex 3080', 'Core i5-10500', 16, 'SSD 480 GB', 'Operativo', 2021, 'Patricia Vega'],
    ['PC-ADM-002', 'HP', 'ProDesk 400 G6', 'Core i5-9500', 8, 'SSD 256 GB', 'Operativo', 2021, 'Karen Soto'],
    ['PC-ADM-003', 'Lenovo', 'ThinkCentre M70s', 'Core i3-10100', 8, 'HDD 1 TB', 'En mantenimiento', 2022, 'Iván Torres'],
    ['PC-ACA-001', 'Dell', 'OptiPlex 3070', 'Core i5-9500', 8, 'SSD 256 GB', 'Operativo', 2022, 'Raúl Mendoza'],
    ['PC-ACA-002', 'HP', 'EliteDesk 800 G3', 'Core i5-7500', 8, 'HDD 500 GB', 'Operativo', 2017, 'Elena Paz'],
    ['PC-ACA-003', 'Lenovo', 'V530', 'Core i3-8100', 4, 'HDD 500 GB', 'Inoperativo', 2018, 'Mario Cueva'],
    ['PC-BIB-001', 'HP', 'ProDesk 400 G4', 'Core i3-7100', 4, 'HDD 500 GB', 'Operativo', 2017, 'Silvia Cárdenas'],
    ['PC-BIB-002', 'Dell', 'Vostro 3470', 'Core i5-8400', 8, 'SSD 240 GB', 'Operativo', 2021, 'Nora Salas'],
    ['PC-LAB-001', 'Dell', 'OptiPlex 5090', 'Core i7-10700', 32, 'SSD 512 GB', 'Operativo', 2022, 'Hugo Ríos'],
    ['PC-LAB-002', 'Dell', 'OptiPlex 5090', 'Core i7-10700', 32, 'SSD 512 GB', 'Operativo', 2022, 'Hugo Ríos'],
    ['PC-LAB-003', 'HP', 'ProDesk 600 G5', 'Core i5-9500', 16, 'SSD 480 GB', 'En mantenimiento', 2021, 'Hugo Ríos'],
    ['PC-LAB-004', 'Lenovo', 'ThinkCentre M720', 'Core i5-8400', 8, 'HDD 1 TB', 'Operativo', 2021, 'Hugo Ríos'],
    ['PC-TI-001', 'Dell', 'Precision 3450', 'Core i7-11700', 32, 'SSD 1 TB', 'Operativo', 2023, 'Marco Ledesma'],
    ['PC-TI-002', 'HP', 'Z2 G5', 'Core i7-10700', 16, 'SSD 512 GB', 'Operativo', 2022, 'Marco Ledesma'],
    ['PC-TI-003', 'Dell', 'OptiPlex 3040', 'Core i3-6100', 4, 'HDD 500 GB', 'Inoperativo', 2016, 'Marco Ledesma']
  ];

  const assets = rawAssets.map((e, i) => ({
    codigo: e[0],
    nombre: 'PC ' + e[0].slice(3),
    patrimonial: 'PAT-' + (70100 + i),
    tipo: ASSET_TYPES[0],
    area: e[0].split('-')[1],
    marca: e[1],
    modelo: e[2],
    serie: 'SN' + (48200 + i * 173),
    cpu: e[3],
    placa: e[1] + ' OEM',
    ram: e[4],
    tipoRam: e[7] < 2017 ? 'DDR3' : 'DDR4',
    disco: e[5],
    gpu: 'Integrada Intel UHD',
    fuente: '240 W',
    monitor: '22" LED',
    teclado: 'USB estándar',
    mouse: 'Óptico USB',
    otros: '—',
    estado: e[6],
    anio: e[7],
    fechaAdq: `${e[7]}-03-15`,
    garantia: `${e[7] + 3}-03-15`,
    oficina: 'Of. ' + (101 + i),
    responsable: e[8],
    fechaAsig: `${e[7]}-04-01`
  }));

  const rawMaintenances = [
    ['MT-001', 'PC-ADM-001', -150, 'Preventivo', 'Hardware', 'Realizado', 0, 120, 'Inspección periódica programada', 'Limpieza interna, cambio de pasta térmica y prueba de encendido'],
    ['MT-002', 'PC-ACA-002', -120, 'Preventivo', 'Software', 'Realizado', 1, 0, 'Mantenimiento semestral del sistema', 'Depuración de temporales, revisión de antivirus y actualizaciones'],
    ['MT-003', 'PC-LAB-001', -95, 'Predictivo', 'Hardware', 'Realizado', 2, 80, 'Evaluación térmica bajo carga', 'Pruebas de estrés de CPU, RAM y revisión SMART de SSD'],
    ['MT-004', 'PC-BIB-001', -70, 'Correctivo', 'Hardware', 'Realizado', 0, 260, 'Falla intermitente de encendido', 'Reemplazo de fuente de alimentación y verificación de voltajes'],
    ['MT-005', 'PC-TI-001', -50, 'Predictivo', 'Software', 'Realizado', 3, 0, 'Monitoreo de rendimiento en virtualización', 'Optimización de servicios de inicio y verificación de parches'],
    ['MT-006', 'PC-LAB-004', -33, 'Preventivo', 'Software', 'Realizado', 1, 0, 'Revisión previa a ciclo académico', 'Verificación de licencias, navegadores y políticas de seguridad'],
    ['MT-007', 'PC-ACA-001', -12, 'Correctivo', 'Software', 'Realizado', 4, 45, 'Cierre inesperado de SIGA Académico', 'Reparación de librerías del cliente y restauración de perfil'],
    ['MT-008', 'PC-ADM-003', -4, 'Correctivo', 'Hardware', 'En proceso', 2, 310, 'Sobrecalentamiento y reinicios continuos', 'Desmontaje de disipador y reemplazo de ventilador principal'],
    ['MT-009', 'PC-LAB-003', -2, 'Preventivo', 'Hardware', 'En proceso', 3, 60, 'Mantenimiento preventivo programado', 'Limpieza de gabinete y revisión de módulos de memoria'],
    ['MT-010', 'PC-BIB-002', -8, 'Preventivo', 'Hardware', 'Atrasado', 4, 0, 'Inspección trimestral pendiente', 'Pendiente de programación con jefatura de Biblioteca'],
    ['MT-011', 'PC-ACA-001', 12, 'Preventivo', 'Hardware', 'Programado', 0, 0, 'Revisión preventiva programada', 'Checklist integral de hardware']
  ];

  const maintenances = rawMaintenances.map(m => ({
    id: m[0],
    equipo: m[1],
    fecha: offsetDay(m[2]),
    tipo: m[3],
    categoria: m[4],
    estado: m[5],
    tecnico: technicians[m[6]],
    costo: m[7],
    nivel: m[4] === 'Hardware' ? (+m[0].slice(3) % 4) + 1 : null,
    resultado: m[5] === 'Realizado' ? 'Satisfactorio' : '—',
    diagnostico: m[8],
    actividades: m[9],
    componentes: '',
    repuestos: '',
    observaciones: ''
  }));

  const solutions = {
    'IN-005': 'Limpieza de archivos temporales y actualización del sistema operativo.',
    'IN-006': 'Reinstalación de la aplicación institucional y restauración de su configuración.',
    'IN-009': 'Reemplazo del teclado por uno nuevo.'
  };

  const rawIncidents = [
    ['IN-001', 'PC-ACA-003', 'Hardware', 'No enciende; la fuente no responde', 'Alta', 'Asignada', 6],
    ['IN-002', 'PC-TI-003', 'Hardware', 'Falla de disco, el sistema no arranca', 'Alta', 'Pendiente', 10],
    ['IN-003', 'PC-ADM-003', 'Hardware', 'Reinicios por sobrecalentamiento', 'Media', 'En proceso', 5],
    ['IN-004', 'PC-LAB-003', 'Hardware', 'Ventilador con ruido anormal', 'Baja', 'En proceso', 3],
    ['IN-005', 'PC-BIB-001', 'Software', 'Lentitud al abrir aplicaciones', 'Media', 'Resuelta', 40],
    ['IN-006', 'PC-ACA-001', 'Software', 'Error en la aplicación institucional', 'Media', 'Cerrada', 20],
    ['IN-007', 'PC-LAB-002', 'Software', 'Licencia de software técnico por vencer', 'Baja', 'Pendiente', 2],
    ['IN-008', 'PC-ADM-002', 'Software', 'Antivirus desactualizado', 'Media', 'Asignada', 4],
    ['IN-009', 'PC-BIB-002', 'Hardware', 'Teclado con teclas defectuosas', 'Baja', 'Resuelta', 30],
    ['IN-010', 'PC-LAB-004', 'Software', 'Programa no autorizado detectado', 'Media', 'Pendiente', 1]
  ];

  const incidents = rawIncidents.map((item, i) => {
    const fecha = offsetDay(-item[6]);
    const eq = assets.find(a => a.codigo === item[1]);
    const tecnico = item[5] === 'Pendiente' ? '' : technicians[i % technicians.length];
    const solucion = solutions[item[0]] || '';
    const historial = [[fecha, `Incidencia reportada por ${eq.responsable}`]];
    if (item[5] !== 'Pendiente') {
      historial.push([offsetFromDate(fecha, 1), `Asignada a ${tecnico}`]);
    }
    if (['En proceso', 'Resuelta', 'Cerrada'].includes(item[5])) {
      historial.push([offsetFromDate(fecha, 1), 'Intervención iniciada']);
    }
    if (solucion) {
      historial.push([offsetFromDate(fecha, 2), `Solución aplicada: ${solucion}`]);
    }
    if (item[5] === 'Cerrada') {
      historial.push([offsetFromDate(fecha, 3), 'Cerrada con conformidad del usuario']);
    }
    return {
      id: item[0],
      equipo: item[1],
      area: eq.area,
      usuario: eq.responsable,
      categoria: item[2],
      descripcion: item[3],
      prioridad: item[4],
      estado: item[5],
      fecha,
      tecnico,
      solucion,
      historial
    };
  });

  const rawModifications = [
    ['PC-ADM-001', 900, 'RAM', 'RAM 4 GB', 'RAM 8 GB', 'Lentitud con ofimática', 90, 0],
    ['PC-ADM-001', 600, 'Almacenamiento', 'HDD 500 GB', 'SSD 480 GB', 'Arranque lento del sistema', 210, 0],
    ['PC-ADM-001', 200, 'RAM', 'RAM 8 GB', 'RAM 16 GB', 'Uso simultáneo de sistemas internos', 95, 1],
    ['PC-ACA-002', 400, 'RAM', 'RAM 4 GB', 'RAM 8 GB', 'Mejora de rendimiento general', 90, 2],
    ['PC-LAB-001', 300, 'RAM', 'RAM 16 GB', 'RAM 32 GB', 'Carga de simulaciones', 180, 3],
    ['PC-LAB-003', 250, 'Almacenamiento', 'HDD 1 TB', 'SSD 480 GB', 'Tiempos de carga elevados', 210, 2],
    ['PC-LAB-003', 180, 'RAM', 'RAM 8 GB', 'RAM 16 GB', 'Prácticas con máquinas virtuales', 95, 3],
    ['PC-TI-001', 120, 'Almacenamiento', 'SSD 512 GB', 'SSD 1 TB', 'Espacio para máquinas virtuales', 320, 4],
    ['PC-ADM-002', 500, 'Almacenamiento', 'HDD 500 GB', 'SSD 256 GB', 'Arranque lento del sistema', 190, 1],
    ['PC-BIB-002', 350, 'Almacenamiento', 'HDD 500 GB', 'SSD 240 GB', 'Arranque lento del sistema', 170, 4]
  ];

  const modifications = rawModifications.map((m, idx) => ({
    id: `MOD-${String(idx + 1).padStart(3, '0')}`,
    n: idx,
    equipo: m[0],
    fecha: offsetDay(-m[1]),
    tipoComponente: m[2],
    anterior: m[3],
    nuevo: m[4],
    motivo: m[5],
    costo: m[6],
    tecnico: technicians[m[7]],
    obs: '—'
  }));

  const rawSoftware = [
    ['PC-ADM-001', 'Windows 11 Pro', 'Sistemas operativos', '23H2', '2021-03', 'OEM', 'Vigente', 'Actualizado'],
    ['PC-ADM-001', 'Microsoft 365', 'Ofimática', '2408', '2021-03', 'Suscripción', 'Por vencer', 'Actualizado'],
    ['PC-ADM-002', 'Windows 10 Pro', 'Sistemas operativos', '22H2', '2021-05', 'OEM', 'Vigente', 'Desactualizado'],
    ['PC-ADM-002', 'ESET Endpoint', 'Antivirus', '10.1', '2021-05', 'Suscripción', 'Vigente', 'Desactualizado'],
    ['PC-ADM-003', 'Microsoft 365', 'Ofimática', '2302', '2022-02', 'Suscripción', 'Vencida', 'Desactualizado'],
    ['PC-ACA-001', 'Microsoft 365', 'Ofimática', '2408', '2022-06', 'Suscripción', 'Por vencer', 'Actualizado'],
    ['PC-ACA-001', 'SIGA Académico', 'Aplicaciones institucionales', '3.4', '2022-06', 'Institucional', 'Vigente', 'Actualizado'],
    ['PC-ACA-002', 'Windows 10 Pro', 'Sistemas operativos', '22H2', '2017-09', 'OEM', 'Vigente', 'Desactualizado'],
    ['PC-BIB-001', 'Windows 10 Pro', 'Sistemas operativos', '22H2', '2017-10', 'OEM', 'Vigente', 'Desactualizado'],
    ['PC-BIB-001', 'Google Chrome', 'Navegadores', '126', '2023-01', 'Libre', 'No requiere', 'Desactualizado'],
    ['PC-BIB-002', 'Koha (catálogo)', 'Aplicaciones institucionales', '22.11', '2021-08', 'Libre', 'No requiere', 'Actualizado'],
    ['PC-LAB-001', 'Windows 11 Pro', 'Sistemas operativos', '23H2', '2022-04', 'Volumen', 'Vigente', 'Actualizado'],
    ['PC-LAB-002', 'MATLAB', 'Herramientas técnicas', 'R2023b', '2022-04', 'Educativa', 'Por vencer', 'Actualizado'],
    ['PC-LAB-003', 'Windows 11 Pro', 'Sistemas operativos', '23H2', '2021-09', 'Volumen', 'Vigente', 'Actualizado'],
    ['PC-LAB-004', 'uTorrent', 'Otros programas', '3.6', '2024-11', 'Ninguna', 'No autorizado', 'Actualizado'],
    ['PC-LAB-004', 'Mozilla Firefox', 'Navegadores', '128', '2021-09', 'Libre', 'No requiere', 'Actualizado'],
    ['PC-TI-001', 'VMware Workstation', 'Herramientas técnicas', '17.5', '2023-03', 'Suscripción', 'Vigente', 'Actualizado'],
    ['PC-TI-001', 'Wireshark', 'Herramientas técnicas', '4.2', '2023-03', 'Libre', 'No requiere', 'Actualizado'],
    ['PC-TI-002', 'Windows 11 Pro', 'Sistemas operativos', '23H2', '2022-07', 'Volumen', 'Vigente', 'Actualizado'],
    ['PC-TI-003', 'Windows 10 Pro', 'Sistemas operativos', '21H2', '2016-08', 'OEM', 'Vigente', 'Desactualizado']
  ];

  const software = rawSoftware.map((s, idx) => ({
    id: `SW-${String(idx + 1).padStart(3, '0')}`,
    equipo: s[0],
    nombre: s[1],
    categoria: s[2],
    version: s[3],
    instalado: s[4],
    licencia: s[5],
    estadoLicencia: s[6],
    actualizacion: s[7]
  }));

  const rawLicenses = [
    ['LC-001', 'Microsoft 365 Educación', 'Suscripción', 40, 25, 21, 'microsoft 365'],
    ['LC-002', 'ESET Endpoint Security', 'Suscripción', 30, 21, 48, 'eset'],
    ['LC-003', 'MATLAB Académica', 'Educativa', 10, 5, 35, 'matlab'],
    ['LC-004', 'VMware Workstation Pro', 'Suscripción', 5, 1, 210, 'vmware'],
    ['LC-005', 'Windows 11 Pro (volumen)', 'Volumen', 25, 11, 700, 'windows 11']
  ];

  const licenses = rawLicenses.map(l => ({
    id: l[0],
    producto: l[1],
    tipo: l[2],
    puestos: l[3],
    baseEnUso: l[4],
    dias: l[5],
    matchKeyword: l[6]
  }));

  const rawTransfers = [
    ['PC-ACA-001', 400, 'ADM', 'ACA', 'Patricia Vega', 'Raúl Mendoza', 'Reasignación por incorporación de personal'],
    ['PC-LAB-004', 300, 'BIB', 'LAB', 'Silvia Cárdenas', 'Hugo Ríos', 'Equipo requerido para prácticas'],
    ['PC-TI-002', 250, 'LAB', 'TI', 'Hugo Ríos', 'Marco Ledesma', 'Asignado a soporte técnico'],
    ['PC-BIB-002', 180, 'ADM', 'BIB', 'Patricia Vega', 'Nora Salas', 'Apoyo a la atención de usuarios'],
    ['PC-ADM-003', 90, 'ACA', 'ADM', 'Elena Paz', 'Iván Torres', 'Reorganización administrativa']
  ];

  const transfers = rawTransfers.map((t, idx) => ({
    id: `TR-${String(idx + 1).padStart(3, '0')}`,
    equipo: t[0],
    fecha: offsetDay(-t[1]),
    origen: t[2],
    destino: t[3],
    de: t[4],
    a: t[5],
    motivo: t[6]
  }));

  const auditLogs = [
    {
      id: 'AUD-001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      method: 'SYSTEM',
      endpoint: '/api/v2/bootstrap',
      user: 'Marco Ledesma',
      summary: 'Inicialización de inventario institucional y políticas activas'
    }
  ];

  return {
    areas,
    technicians,
    assets,
    maintenances,
    incidents,
    modifications,
    software,
    licenses,
    transfers,
    auditLogs
  };
}
