import { offsetDay, todayIso } from '../core/date.js';
import { RECOMMENDATIONS } from './EvaluationService.js';

export class ReportService {
  constructor({ assetService, softwareService, maintenanceService, incidentService, historyService, transferService, evaluationService }) {
    this.assetService = assetService;
    this.softwareService = softwareService;
    this.maintenanceService = maintenanceService;
    this.incidentService = incidentService;
    this.historyService = historyService;
    this.transferService = transferService;
    this.evaluationService = evaluationService;
    this.definitions = this.buildDefinitions();
  }

  countBy(list, getter) {
    return list.reduce((acc, item) => {
      const key = getter(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  sumBy(list, field) {
    return list.reduce((acc, item) => acc + Number(item[field] || 0), 0);
  }

  matchesRange(dateStr, filters) {
    return (!filters.desde || dateStr >= filters.desde) && (!filters.hasta || dateStr <= filters.hasta);
  }

  matchesAsset(code, filters) {
    const asset = this.assetService.getByCode(code);
    const areaId = asset ? asset.area : '';
    return (!filters.area || areaId === filters.area) && (!filters.equipo || code === filters.equipo);
  }

  createMaintenanceReport(id, title, fixedType, category, chartKey) {
    return {
      id,
      t: title,
      usa: fixedType ? ['fecha', 'area', 'equipo'] : ['fecha', 'area', 'equipo', 'tipo'],
      gtitulo: 'Registros por ' + (chartKey === 'tipo' ? 'tipo' : 'estado'),
      gen: filters => {
        const list = this.maintenanceService
          .getAll()
          .filter(
            m =>
              (!category || m.categoria === category) &&
              (fixedType ? m.tipo === fixedType : !filters.tipo || m.tipo === filters.tipo) &&
              this.matchesRange(m.fecha, filters) &&
              this.matchesAsset(m.equipo, filters)
          )
          .sort((a, b) => b.fecha.localeCompare(a.fecha));

        return {
          cols: ['ID', 'Equipo', 'Fecha', 'Tipo', 'Categoría', 'Técnico', 'Costo (S/)', 'Resultado', 'Estado'],
          badge: [8],
          filas: list.map(m => [m.id, m.equipo, m.fecha, m.tipo, m.categoria, m.tecnico, m.costo, m.resultado, m.estado]),
          grafico: {
            tipo: 'barras',
            datos: this.countBy(list, m => (chartKey === 'tipo' ? m.tipo : m.estado))
          },
          resumen: `Costo total acumulado: S/ ${this.sumBy(list, 'costo')}`
        };
      }
    };
  }

  buildDefinitions() {
    return [
      {
        id: 'inventario',
        t: 'Inventario general de equipos',
        usa: ['area', 'equipo'],
        gtitulo: 'Equipos por estado',
        gen: filters => {
          const list = this.assetService.getAll().filter(e => this.matchesAsset(e.codigo, filters));
          return {
            cols: ['Código', 'Nombre', 'Marca', 'Modelo', 'Serie', 'Procesador', 'RAM', 'Almacenamiento', 'Área', 'Responsable', 'Estado'],
            badge: [10],
            filas: list.map(e => [
              e.codigo, e.nombre, e.marca, e.modelo, e.serie, e.cpu, `${e.ram} GB`, e.disco,
              this.assetService.getAreaName(e.area), e.responsable, e.estado
            ]),
            grafico: { tipo: 'donut', datos: this.countBy(list, e => e.estado) }
          };
        }
      },
      {
        id: 'areas',
        t: 'Equipos por área',
        usa: ['area'],
        gtitulo: 'Total de equipos por área',
        gen: filters => {
          const areas = this.transferService.getAreas().filter(a => !filters.area || a.id === filters.area);
          return {
            cols: ['Área', 'Responsable', 'Total', 'Operativos', 'En mantenimiento', 'Inoperativos', 'De baja'],
            filas: areas.map(a => {
              const s = this.transferService.getAreaStats(a.id);
              return [a.nombre, a.responsable, s.total, s.op, s.man, s.ino, s.baja];
            }),
            grafico: {
              tipo: 'barras',
              datos: Object.fromEntries(areas.map(a => [a.nombre, this.transferService.getAreaStats(a.id).total]))
            }
          };
        }
      },
      {
        id: 'ficha',
        t: 'Ficha técnica detallada por computadora',
        usa: ['equipo'],
        gen: filters => {
          const e = this.assetService.getByCode(filters.equipo);
          if (!e) {
            return {
              cols: ['Campo', 'Valor'],
              filas: [],
              mensaje: 'Selecciona un equipo en el filtro "Equipo" para emitir su ficha detallada.'
            };
          }
          const sw = this.softwareService.getByAsset(e.codigo).map(s => `${s.nombre} ${s.version}`).join(', ') || '—';
          return {
            cols: ['Campo', 'Valor'],
            filas: [
              ['Código interno', e.codigo],
              ['Código patrimonial', e.patrimonial],
              ['Tipo de equipo', e.tipo],
              ['Marca y modelo', `${e.marca} ${e.modelo}`],
              ['Número de serie', e.serie],
              ['Fecha de adquisición', e.fechaAdq],
              ['Garantía hasta', e.garantia],
              ['Antigüedad', `${this.assetService.getAgeYears(e)} años`],
              ['Procesador', e.cpu],
              ['Placa madre', e.placa],
              ['Memoria RAM', `${e.ram} GB ${e.tipoRam}`],
              ['Almacenamiento', e.disco],
              ['Tarjeta gráfica', e.gpu],
              ['Fuente de alimentación', e.fuente],
              ['Monitor', e.monitor],
              ['Teclado', e.teclado],
              ['Mouse', e.mouse],
              ['Área y oficina', `${this.assetService.getAreaName(e.area)}, ${e.oficina}`],
              ['Responsable', e.responsable],
              ['Estado operativo', e.estado],
              ['Estado físico', this.assetService.getPhysicalCondition(e)],
              ['Software instalado', sw],
              ['Mantenimientos registrados', this.maintenanceService.getByAsset(e.codigo).length],
              ['Incidencias registradas', this.incidentService.getByAsset(e.codigo).length],
              ['Modificaciones de hardware', this.historyService.getByAsset(e.codigo).length]
            ]
          };
        }
      },
      {
        id: 'repotenciados',
        t: 'Equipos repotenciados',
        usa: ['fecha', 'area', 'equipo'],
        gtitulo: 'Inversión por equipo (S/)',
        gen: filters => {
          const allMods = this.historyService.getAll().filter(m => this.matchesRange(m.fecha, filters) && this.matchesAsset(m.equipo, filters));
          const codes = [...new Set(allMods.map(m => m.equipo))];
          const filas = codes.map(c => {
            const ms = this.historyService.getByAsset(c).filter(m => this.matchesRange(m.fecha, filters));
            const e = this.assetService.getByCode(c);
            return [
              c,
              this.assetService.getAreaName(e.area),
              ms.length,
              ms[0].fecha,
              ms[ms.length - 1].fecha,
              this.sumBy(ms, 'costo'),
              `${e.cpu}, ${e.ram} GB, ${e.disco}`
            ];
          });
          return {
            cols: ['Equipo', 'Área', 'Modificaciones', 'Primera', 'Última', 'Inversión (S/)', 'Configuración actual'],
            filas,
            grafico: { tipo: 'barras', datos: Object.fromEntries(filas.map(f => [f[0], f[5]])) },
            resumen: `Inversión total: S/ ${filas.reduce((s, f) => s + f[5], 0)}`
          };
        }
      },
      {
        id: 'cambios',
        t: 'Historial de cambios de hardware',
        usa: ['fecha', 'area', 'equipo'],
        gtitulo: 'Cambios por componente',
        gen: filters => {
          const list = this.historyService.getAll().filter(m => this.matchesRange(m.fecha, filters) && this.matchesAsset(m.equipo, filters));
          return {
            cols: ['Equipo', 'Fecha', 'Componente anterior', 'Componente nuevo', 'Motivo', 'Técnico', 'Costo (S/)'],
            filas: list.map(m => [m.equipo, m.fecha, m.anterior, m.nuevo, m.motivo, m.tecnico, m.costo]),
            grafico: {
              tipo: 'barras',
              datos: this.countBy(list, m => (m.tipoComponente === 'RAM' || String(m.anterior).startsWith('RAM') ? 'Memoria RAM' : 'Almacenamiento'))
            },
            resumen: `Costo total: S/ ${this.sumBy(list, 'costo')}`
          };
        }
      },
      this.createMaintenanceReport('preventivos', 'Mantenimientos preventivos', 'Preventivo', '', 'estado'),
      this.createMaintenanceReport('predictivos', 'Mantenimientos predictivos', 'Predictivo', '', 'estado'),
      this.createMaintenanceReport('correctivos', 'Mantenimientos correctivos', 'Correctivo', '', 'estado'),
      this.createMaintenanceReport('mant-sw', 'Mantenimiento de software', null, 'Software', 'tipo'),
      {
        id: 'sw-equipo',
        t: 'Software instalado por computadora',
        usa: ['area', 'equipo'],
        gtitulo: 'Programas por categoría',
        gen: filters => {
          const list = this.softwareService
            .getAll()
            .filter(s => this.matchesAsset(s.equipo, filters))
            .sort((a, b) => a.equipo.localeCompare(b.equipo));
          return {
            cols: ['Equipo', 'Software', 'Categoría', 'Versión', 'Instalado', 'Licencia', 'Estado de licencia', 'Actualización'],
            badge: [6, 7],
            filas: list.map(s => [s.equipo, s.nombre, s.categoria, s.version, s.instalado, s.licencia, s.estadoLicencia, s.actualizacion]),
            grafico: { tipo: 'barras', datos: this.countBy(list, s => s.categoria) }
          };
        }
      },
      {
        id: 'licencias',
        t: 'Estado de licencias',
        usa: [],
        gtitulo: 'Puestos en uso por producto',
        gen: () => {
          const list = this.softwareService.getLicensesWithUsage();
          return {
            cols: ['ID', 'Producto', 'Tipo', 'Puestos', 'En uso', 'Disponibles', 'Vencimiento', 'Días restantes', 'Estado'],
            badge: [8],
            filas: list.map(l => [l.id, l.producto, l.tipo, l.puestos, l.enUso, l.disponibles, offsetDay(l.dias), l.dias, l.estado]),
            grafico: { tipo: 'barras', datos: Object.fromEntries(list.map(l => [l.producto, l.enUso])) }
          };
        }
      },
      {
        id: 'incidencias',
        t: 'Incidencias técnicas',
        usa: ['fecha', 'area', 'equipo'],
        gtitulo: 'Incidencias por estado',
        gen: filters => {
          const list = this.incidentService
            .getAll()
            .filter(i => this.matchesRange(i.fecha, filters) && this.matchesAsset(i.equipo, filters))
            .sort((a, b) => b.fecha.localeCompare(a.fecha));
          return {
            cols: ['ID', 'Fecha', 'Equipo', 'Área', 'Categoría', 'Descripción', 'Prioridad', 'Técnico', 'Estado'],
            badge: [6, 8],
            filas: list.map(i => [
              i.id, i.fecha, i.equipo, this.assetService.getAreaName(i.area), i.categoria,
              i.descripcion, i.prioridad, i.tecnico || 'Sin asignar', i.estado
            ]),
            grafico: { tipo: 'barras', datos: this.countBy(list, i => i.estado) }
          };
        }
      },
      {
        id: 'inoperativos',
        t: 'Equipos inoperativos',
        usa: ['area', 'equipo'],
        gtitulo: 'Inoperativos por área',
        gen: filters => {
          const list = this.assetService.getAll().filter(e => e.estado === 'Inoperativo' && this.matchesAsset(e.codigo, filters));
          return {
            cols: ['Equipo', 'Marca y modelo', 'Área', 'Responsable', 'Antigüedad', 'Incidencias abiertas'],
            filas: list.map(e => [
              e.codigo,
              `${e.marca} ${e.modelo}`,
              this.assetService.getAreaName(e.area),
              e.responsable,
              `${this.assetService.getAgeYears(e)} años`,
              this.incidentService.getByAsset(e.codigo).filter(i => this.incidentService.isOpen(i)).length
            ]),
            grafico: { tipo: 'barras', datos: this.countBy(list, e => this.assetService.getAreaName(e.area)) }
          };
        }
      },
      {
        id: 'costos',
        t: 'Costos de mantenimiento',
        usa: ['fecha', 'area', 'equipo', 'tipo'],
        gtitulo: 'Costo total por equipo (S/)',
        gen: filters => {
          const filas = this.assetService
            .getAll()
            .filter(e => this.matchesAsset(e.codigo, filters))
            .map(e => {
              const ms = this.maintenanceService
                .getByAsset(e.codigo)
                .filter(m => this.matchesRange(m.fecha, filters) && (!filters.tipo || m.tipo === filters.tipo));
              const md = this.historyService.getByAsset(e.codigo).filter(m => this.matchesRange(m.fecha, filters));
              const costM = this.sumBy(ms, 'costo');
              const costMod = this.sumBy(md, 'costo');
              return [e.codigo, this.assetService.getAreaName(e.area), ms.length, costM, costMod, costM + costMod];
            })
            .filter(f => f[2] || f[4]);
          const top = [...filas].sort((a, b) => b[5] - a[5]).slice(0, 8);
          return {
            cols: ['Equipo', 'Área', 'Mantenimientos', 'Costo mantenimientos (S/)', 'Costo modificaciones (S/)', 'Total (S/)'],
            filas,
            grafico: { tipo: 'barras', datos: Object.fromEntries(top.map(f => [f[0], f[5]])) },
            resumen: `Total general: S/ ${filas.reduce((s, f) => s + f[5], 0)}`,
            nota: 'El filtro de tipo aplica a los mantenimientos; las modificaciones de hardware se contabilizan dentro del rango de fechas.'
          };
        }
      },
      {
        id: 'actualizacion',
        t: 'Equipos que requieren actualización o reemplazo',
        usa: ['area', 'equipo'],
        gtitulo: 'Equipos por recomendación',
        gen: filters => {
          const targetKeys = ['reemplazo', 'disco', 'ram', 'software'];
          const list = this.assetService
            .getAll()
            .map(e => ({ e, v: this.evaluationService.evaluate(e) }))
            .filter(({ e, v }) => this.matchesAsset(e.codigo, filters) && v.recs.some(r => targetKeys.includes(r)));

          const datos = {};
          list.forEach(({ v }) => {
            v.recs
              .filter(r => targetKeys.includes(r))
              .forEach(r => {
                const label = RECOMMENDATIONS[r][0];
                datos[label] = (datos[label] || 0) + 1;
              });
          });

          return {
            cols: ['Equipo', 'Área', 'Antigüedad', 'RAM', 'Almacenamiento', 'Recomendaciones', 'Motivos'],
            filas: list.map(({ e, v }) => [
              e.codigo,
              this.assetService.getAreaName(e.area),
              `${v.edad} años`,
              `${e.ram} GB`,
              e.disco,
              v.recs.filter(r => targetKeys.includes(r)).map(r => RECOMMENDATIONS[r][0]).join('; '),
              v.recs.filter(r => targetKeys.includes(r)).map(r => v.razones[r]).join(' ')
            ]),
            grafico: { tipo: 'barras', datos },
            nota: 'Criterios calculados según las políticas del módulo de Evaluación técnica.'
          };
        }
      }
    ];
  }

  getDefinitions() {
    return this.definitions;
  }

  getDefinition(id) {
    return this.definitions.find(r => r.id === id) || this.definitions[0];
  }

  generate(id, filters) {
    const def = this.getDefinition(id);
    return { def, result: def.gen(filters) };
  }

  exportCsv(id, filters) {
    const { def, result } = this.generate(id, filters);
    if (!result.filas.length) return { ok: false };
    const csv = [result.cols, ...result.filas]
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const filename = `reporte-${def.id}-${todayIso()}.csv`;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, filename };
  }
}
