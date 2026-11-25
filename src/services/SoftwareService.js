import { APP_CONFIG } from '../core/config.js';

export class SoftwareService {
  constructor({ softwareRepo, licenseRepo, gateway }) {
    this.softwareRepo = softwareRepo;
    this.licenseRepo = licenseRepo;
    this.gateway = gateway;
  }

  getAll() {
    return this.softwareRepo.getAll();
  }

  getByAsset(code) {
    return this.softwareRepo.filter(s => s.equipo === code);
  }

  filter({ q = '', cat = '', equipo = '', lic = '', upd = '' } = {}) {
    const term = q.trim().toLowerCase();
    return this.softwareRepo.filter(s =>
      (!term || s.nombre.toLowerCase().includes(term) || s.equipo.toLowerCase().includes(term)) &&
      (!cat || s.categoria === cat) &&
      (!equipo || s.equipo === equipo) &&
      (!lic || s.estadoLicencia === lic) &&
      (!upd || s.actualizacion === upd)
    );
  }

  getLicensesWithUsage() {
    const installed = this.softwareRepo.getAll();
    return this.licenseRepo.getAll().map(lic => {
      const keyword = String(lic.matchKeyword || '').toLowerCase();
      const matched = keyword
        ? installed.filter(s => s.nombre.toLowerCase().includes(keyword)).length
        : 0;
      const enUso = Math.min(lic.puestos, (lic.baseEnUso || 0) + matched);
      const estado = lic.dias <= 0 ? 'Vencida' : lic.dias <= APP_CONFIG.licenseWarningDays ? 'Por vencer' : 'Vigente';
      return {
        ...lic,
        enUso,
        disponibles: Math.max(0, lic.puestos - enUso),
        estado
      };
    });
  }

  getExpiringLicenses() {
    return this.getLicensesWithUsage().filter(l => l.dias <= APP_CONFIG.licenseWarningDays);
  }

  async register(payload) {
    return this.gateway.execute({
      endpoint: '/api/v2/software',
      method: 'POST',
      summary: `Instalación de ${payload.nombre} ${payload.version} en ${payload.equipo}`,
      handler: () => {
        const record = {
          id: this.softwareRepo.nextSequentialId('SW'),
          ...payload
        };
        return this.softwareRepo.insert(record);
      }
    });
  }

  async markUpdated(id) {
    return this.gateway.execute({
      endpoint: `/api/v2/software/${id}/patch`,
      method: 'PATCH',
      summary: `Actualización de paquete ${id}`,
      handler: () => {
        const updated = this.softwareRepo.update(id, { actualizacion: 'Actualizado' });
        if (!updated) throw new Error('Programa no encontrado.');
        return updated;
      }
    });
  }

  async uninstall(id) {
    return this.gateway.execute({
      endpoint: `/api/v2/software/${id}`,
      method: 'DELETE',
      summary: `Desinstalación de paquete ${id}`,
      handler: () => {
        const removed = this.softwareRepo.remove(id);
        if (!removed) throw new Error('Programa no encontrado.');
        return removed;
      }
    });
  }
}
