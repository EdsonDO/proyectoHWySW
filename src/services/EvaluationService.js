import { APP_CONFIG } from '../core/config.js';
import { daysBetween, offsetDay } from '../core/date.js';

export const RECOMMENDATIONS = Object.freeze({
  reemplazo: ['Evaluar reemplazo del equipo', 'bad'],
  disco: ['Requiere reemplazo de almacenamiento', 'warn'],
  ram: ['Requiere ampliación de RAM', 'warn'],
  software: ['Requiere actualización de software', 'info'],
  mant: ['Requiere mantenimiento', 'warn'],
  ok: ['Equipo en condiciones adecuadas', 'ok'],
  baja: ['Dado de baja', 'mu']
});

export const EVALUATION_CRITERIA = Object.freeze([
  ['Evaluar reemplazo del equipo', 'Antigüedad de 8 años o más, o equipo inoperativo con 6 años o más.'],
  ['Requiere ampliación de RAM', 'Memoria de 4 GB o menos (si no se evalúa el reemplazo).'],
  ['Requiere reemplazo de almacenamiento', 'Disco HDD (si no se evalúa el reemplazo): considerar actualización a SSD.'],
  ['Requiere actualización de software', 'Programas desactualizados, con licencia vencida o no autorizados.'],
  ['Requiere mantenimiento', 'Equipo en mantenimiento, mantenimiento atrasado o último mantenimiento realizado hace más de 180 días.'],
  ['Equipo en condiciones adecuadas', 'No cumple ninguno de los criterios de alerta anteriores.']
]);

export class EvaluationService {
  constructor({ assetService, softwareService, maintenanceService, incidentService, historyService }) {
    this.assetService = assetService;
    this.softwareService = softwareService;
    this.maintenanceService = maintenanceService;
    this.incidentService = incidentService;
    this.historyService = historyService;
  }

  evaluate(asset) {
    const incidents = this.incidentService.getByAsset(asset.codigo);
    const abiertas = incidents.filter(i => this.incidentService.isOpen(i)).length;
    const mts = this.maintenanceService.getByAsset(asset.codigo);
    const hechos = mts.filter(m => m.estado === 'Realizado');
    const ultimo = hechos.map(m => m.fecha).sort().pop();
    const dSin = ultimo ? daysBetween(ultimo) : null;
    const mods = this.historyService.getByAsset(asset.codigo);
    const costo = mts.reduce((s, m) => s + Number(m.costo || 0), 0) + mods.reduce((s, m) => s + Number(m.costo || 0), 0);
    const hdd = String(asset.disco || '').startsWith('HDD');
    const ed = this.assetService.getAgeYears(asset);
    const swProb = this.softwareService
      .getByAsset(asset.codigo)
      .filter(s => s.actualizacion === 'Desactualizado' || s.estadoLicencia === 'Vencida' || s.estadoLicencia === 'No autorizado')
      .length;

    const perf = Math.max(
      5,
      Math.min(
        100,
        100 -
          ed * 5 -
          (asset.ram <= 4 ? 20 : asset.ram <= 8 ? 8 : 0) -
          (hdd ? 10 : 0) -
          abiertas * 5 -
          (asset.estado === 'Inoperativo' ? 30 : 0)
      )
    );

    let razones = {};
    if (ed >= 8 || (asset.estado === 'Inoperativo' && ed >= 6)) {
      razones.reemplazo = `Antigüedad de ${ed} años${asset.estado === 'Inoperativo' ? ' y estado inoperativo' : ''}.`;
    } else {
      if (asset.ram <= 4) razones.ram = `Cuenta con ${asset.ram} GB de RAM (criterio: 4 GB o menos).`;
      if (hdd) razones.disco = `Utiliza ${asset.disco} (criterio: disco mecánico HDD, migrar a SSD).`;
    }

    if (swProb) {
      razones.software = `${swProb} programa(s) desactualizado(s), con licencia vencida o no autorizado(s).`;
    }

    if (asset.estado === 'En mantenimiento') {
      razones.mant = 'El equipo se encuentra actualmente en mantenimiento.';
    } else if (mts.some(m => this.maintenanceService.getPlanStatus(m) === 'Atrasado')) {
      razones.mant = 'Presenta un mantenimiento atrasado.';
    } else if (dSin !== null && dSin > APP_CONFIG.maintenanceOverdueDays) {
      razones.mant = `El último mantenimiento fue hace ${dSin} días.`;
    }

    let recs = Object.keys(razones);
    if (asset.estado === 'Dado de baja') {
      recs = ['baja'];
      razones = { baja: 'El equipo se encuentra dado de baja.' };
    } else if (!recs.length) {
      recs = ['ok'];
    }

    const cutoff12m = offsetDay(-365);
    return {
      edad: ed,
      inc: incidents.length,
      abiertas,
      mant12: hechos.filter(m => m.fecha >= cutoff12m).length,
      dSin,
      costo,
      perf,
      recs,
      razones
    };
  }

  requiresEvaluation(asset) {
    const first = this.evaluate(asset).recs[0];
    return first !== 'ok' && first !== 'baja';
  }

  getAlerts() {
    const alerts = [];
    const assets = this.assetService.getAll();
    const inop = assets.filter(e => e.estado === 'Inoperativo').length;
    const overdue = this.maintenanceService.getAll().filter(m => this.maintenanceService.getPlanStatus(m) === 'Atrasado').length;
    const unauthorized = this.softwareService.getAll().filter(s => s.estadoLicencia === 'No autorizado').length;

    if (inop) alerts.push({ nivel: 'bad', texto: `${inop} equipo(s) inoperativo(s) requieren atención`, ir: 'hardware' });
    if (overdue) alerts.push({ nivel: 'bad', texto: `${overdue} mantenimiento(s) atrasado(s)`, ir: 'planificacion' });
    if (unauthorized) alerts.push({ nivel: 'warn', texto: `${unauthorized} programa(s) no autorizado(s) detectado(s)`, ir: 'software' });

    this.softwareService.getExpiringLicenses().forEach(l => {
      alerts.push({ nivel: 'warn', texto: `${l.producto} vence en ${l.dias} días`, ir: 'software' });
    });

    return alerts;
  }
}
