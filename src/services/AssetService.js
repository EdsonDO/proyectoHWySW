import { nowLocal, todayIso } from '../core/date.js';

export class AssetService {
  constructor({ assetRepo, areaRepo, incidentRepo, transferRepo, modificationRepo, gateway }) {
    this.assetRepo = assetRepo;
    this.areaRepo = areaRepo;
    this.incidentRepo = incidentRepo;
    this.transferRepo = transferRepo;
    this.modificationRepo = modificationRepo;
    this.gateway = gateway;
  }

  getAll() {
    return this.assetRepo.getAll();
  }

  getActive() {
    return this.assetRepo.filter(a => a.estado !== 'Dado de baja');
  }

  getByCode(code) {
    return this.assetRepo.findById(code);
  }

  getAreaName(areaId) {
    const area = this.areaRepo.findById(areaId);
    return area ? area.nombre : areaId;
  }

  getAgeYears(asset) {
    return Math.max(0, nowLocal().getFullYear() - Number(asset.anio));
  }

  getPhysicalCondition(asset) {
    if (asset.estado === 'Inoperativo') return 'Deficiente';
    return this.getAgeYears(asset) >= 6 ? 'Regular' : 'Bueno';
  }

  searchQuick(query, limit = 6) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    return this.assetRepo
      .filter(e => [e.codigo, `${e.marca} ${e.modelo}`, e.serie, e.nombre].some(s => String(s || '').toLowerCase().includes(q)))
      .slice(0, limit);
  }

  filter({ q = '', area = '', marca = '', estado = '' } = {}) {
    const term = q.trim().toLowerCase();
    return this.assetRepo.filter(e =>
      (!term || [e.codigo, e.nombre, e.serie, `${e.marca} ${e.modelo}`].some(s => String(s || '').toLowerCase().includes(term))) &&
      (!area || e.area === area) &&
      (!marca || e.marca === marca) &&
      (!estado || e.estado === estado)
    );
  }

  getBrands() {
    return [...new Set(this.assetRepo.getAll().map(e => e.marca))].sort();
  }

  async create(payload) {
    return this.gateway.execute({
      endpoint: '/api/v2/assets',
      method: 'POST',
      summary: `Registro de activo ${payload.codigo} (${payload.marca} ${payload.modelo})`,
      handler: () => {
        const record = {
          ...payload,
          nombre: payload.nombre || ('PC ' + payload.codigo.replace(/^PC-/, '')),
          anio: Number(payload.fechaAdq.slice(0, 4))
        };
        return this.assetRepo.insert(record);
      }
    });
  }

  async update(code, payload, actorName = 'Marco Ledesma') {
    return this.gateway.execute({
      endpoint: `/api/v2/assets/${code}`,
      method: 'PUT',
      summary: `Actualización de activo ${code}`,
      handler: () => {
        const prev = this.assetRepo.findById(code);
        if (!prev) throw new Error('Equipo no encontrado.');

        const prevArea = prev.area;
        const prevResp = prev.responsable;
        const prevOficina = prev.oficina;
        const prevRam = prev.ram;
        const prevDisco = prev.disco;

        const updated = this.assetRepo.update(code, {
          ...payload,
          anio: Number(payload.fechaAdq.slice(0, 4))
        });

        if (prevArea !== updated.area || prevResp !== updated.responsable || prevOficina !== updated.oficina) {
          this.transferRepo.insert({
            id: this.transferRepo.nextSequentialId('TR'),
            equipo: code,
            fecha: todayIso(),
            origen: prevArea,
            destino: updated.area,
            de: prevResp,
            a: updated.responsable,
            motivo: 'Actualización de asignación desde inventario'
          });
          this.incidentRepo
            .filter(i => i.equipo === code)
            .forEach(i => { i.area = updated.area; });
          this.incidentRepo.persist();
        }

        if (prevRam !== updated.ram) {
          this.modificationRepo.insert({
            id: this.modificationRepo.nextSequentialId('MOD'),
            n: this.modificationRepo.getAll().length,
            equipo: code,
            fecha: todayIso(),
            tipoComponente: 'RAM',
            anterior: `RAM ${prevRam} GB`,
            nuevo: `RAM ${updated.ram} GB`,
            motivo: 'Actualización registrada desde ficha de inventario',
            costo: 0,
            tecnico: actorName,
            obs: 'Sincronización automática'
          });
        }

        if (prevDisco !== updated.disco) {
          this.modificationRepo.insert({
            id: this.modificationRepo.nextSequentialId('MOD'),
            n: this.modificationRepo.getAll().length,
            equipo: code,
            fecha: todayIso(),
            tipoComponente: 'Almacenamiento',
            anterior: prevDisco,
            nuevo: updated.disco,
            motivo: 'Actualización registrada desde ficha de inventario',
            costo: 0,
            tecnico: actorName,
            obs: 'Sincronización automática'
          });
        }

        return updated;
      }
    });
  }

  async decommission(code) {
    return this.gateway.execute({
      endpoint: `/api/v2/assets/${code}/decommission`,
      method: 'PATCH',
      summary: `Baja patrimonial del activo ${code}`,
      handler: () => {
        const updated = this.assetRepo.update(code, { estado: 'Dado de baja' });
        if (!updated) throw new Error('Equipo no encontrado.');
        return updated;
      }
    });
  }
}
