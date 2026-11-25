import { todayIso } from '../core/date.js';

export class MaintenanceService {
  constructor({ maintenanceRepo, assetRepo, incidentRepo, softwareRepo, gateway }) {
    this.maintenanceRepo = maintenanceRepo;
    this.assetRepo = assetRepo;
    this.incidentRepo = incidentRepo;
    this.softwareRepo = softwareRepo;
    this.gateway = gateway;
  }

  getAll() {
    return this.maintenanceRepo.getAll();
  }

  getById(id) {
    return this.maintenanceRepo.findById(id);
  }

  getByAsset(code) {
    return this.maintenanceRepo.filter(m => m.equipo === code);
  }

  getByCategory(category, type = '') {
    return this.maintenanceRepo
      .filter(m => m.categoria === category && (!type || m.tipo === type))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  getPlanStatus(record) {
    if (record.estado === 'Programado' && record.fecha < todayIso()) return 'Atrasado';
    if (record.estado === 'En proceso') return 'Pendiente';
    return record.estado;
  }

  filterPlan({ area = '', equipo = '', tipo = '', tecnico = '' } = {}) {
    return this.maintenanceRepo.filter(m => {
      const asset = this.assetRepo.findById(m.equipo);
      const assetArea = asset ? asset.area : '';
      return (
        (!area || assetArea === area) &&
        (!equipo || m.equipo === equipo) &&
        (!tipo || m.tipo === tipo) &&
        (!tecnico || m.tecnico === tecnico)
      );
    });
  }

  getPredictiveTelemetry() {
    const activeAssets = this.assetRepo.filter(e => e.estado !== 'Dado de baja');
    const incidents = this.incidentRepo.getAll();
    const software = this.softwareRepo.getAll();

    return activeAssets.map((e, i) => {
      const cpu = 25 + (i * 17) % 55;
      const ram = 30 + (i * 23) % 60;
      const disco = 35 + (i * 29) % 55;
      const err = incidents.filter(x => x.equipo === e.codigo && x.categoria === 'Software').length;
      const act = software.filter(s => s.equipo === e.codigo && s.actualizacion === 'Desactualizado').length;
      const lic = software.filter(s => s.equipo === e.codigo && (s.estadoLicencia === 'Por vencer' || s.estadoLicencia === 'Vencida')).length;
      const score = Number(cpu >= 80) + Number(ram >= 80) + Number(disco >= 80) + Number(err >= 2) + Number(act >= 2) + Number(lic >= 1);
      const seguimiento = score >= 2 ? 'Atención' : score === 1 ? 'Vigilar' : 'Normal';
      return { equipo: e.codigo, cpu, ram, disco, err, act, lic, seguimiento };
    });
  }

  hasScheduleConflict(tecnico, fecha) {
    return this.maintenanceRepo.getAll().some(
      m => m.tecnico === tecnico && m.fecha === fecha && m.estado !== 'Realizado'
    );
  }

  async create(payload) {
    return this.gateway.execute({
      endpoint: '/api/v2/maintenances',
      method: 'POST',
      summary: `Mantenimiento ${payload.tipo} (${payload.categoria}) en ${payload.equipo}`,
      handler: () => {
        const record = {
          id: this.maintenanceRepo.nextSequentialId('MT'),
          ...payload,
          estado: payload.estado || (payload.fecha > todayIso() ? 'Programado' : 'Realizado')
        };
        return this.maintenanceRepo.insert(record);
      }
    });
  }
}
