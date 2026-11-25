import { todayIso } from '../core/date.js';

export class HistoryService {
  constructor({ modificationRepo, assetRepo, maintenanceRepo, incidentRepo, gateway }) {
    this.modificationRepo = modificationRepo;
    this.assetRepo = assetRepo;
    this.maintenanceRepo = maintenanceRepo;
    this.incidentRepo = incidentRepo;
    this.gateway = gateway;
  }

  getAll() {
    return [...this.modificationRepo.getAll()].sort(
      (a, b) => b.fecha.localeCompare(a.fecha) || (b.n || 0) - (a.n || 0)
    );
  }

  getByAsset(code) {
    return this.modificationRepo
      .filter(m => m.equipo === code)
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.n || 0) - (b.n || 0));
  }

  getCurrentConfig(asset) {
    return {
      ram: `RAM ${asset.ram} GB`,
      disco: asset.disco
    };
  }

  getOriginalConfig(asset) {
    const config = this.getCurrentConfig(asset);
    const ordered = this.getByAsset(asset.codigo).reverse();
    ordered.forEach(m => {
      const isRam = m.tipoComponente === 'RAM' || String(m.anterior).startsWith('RAM');
      if (isRam) {
        config.ram = m.anterior;
      } else {
        config.disco = m.anterior;
      }
    });
    return config;
  }

  getTimelineForAsset(asset) {
    const orig = this.getOriginalConfig(asset);
    const events = [
      {
        f: asset.fechaAdq,
        k: 'Modificaciones',
        t: 'Configuración inicial',
        d: `${orig.ram}, ${orig.disco}`
      }
    ];

    this.getByAsset(asset.codigo).forEach(m => {
      events.push({
        f: m.fecha,
        k: 'Modificaciones',
        t: `${m.anterior} → ${m.nuevo}`,
        d: `${m.motivo}. Técnico: ${m.tecnico}. Costo: S/ ${m.costo}`
      });
    });

    this.maintenanceRepo
      .filter(m => m.equipo === asset.codigo)
      .forEach(m => {
        events.push({
          f: m.fecha,
          k: 'Mantenimientos',
          t: `${m.tipo} de ${m.categoria.toLowerCase()} (${m.id})`,
          d: `${m.tecnico}. ${m.estado}`
        });
      });

    this.incidentRepo
      .filter(i => i.equipo === asset.codigo)
      .forEach(i => {
        events.push({
          f: i.fecha,
          k: 'Incidencias',
          t: `${i.id}: ${i.descripcion}`,
          d: i.estado
        });
      });

    return events.sort((a, b) => a.f.localeCompare(b.f));
  }

  async registerModification({ equipo, component, newValue, costo, tecnico, motivo, obs }) {
    return this.gateway.execute({
      endpoint: '/api/v2/modifications',
      method: 'POST',
      summary: `Repotenciación de ${component} en ${equipo}`,
      handler: () => {
        const asset = this.assetRepo.findById(equipo);
        if (!asset) throw new Error('Equipo no encontrado.');

        const isRam = component === 'Memoria RAM';
        const anterior = isRam ? `RAM ${asset.ram} GB` : asset.disco;
        const nuevo = isRam
          ? `RAM ${Number(newValue)} GB`
          : newValue.replace(/^(hdd|ssd|nvme)/i, s => s.toUpperCase());

        const record = {
          id: this.modificationRepo.nextSequentialId('MOD'),
          n: this.modificationRepo.getAll().length,
          equipo: asset.codigo,
          fecha: todayIso(),
          tipoComponente: isRam ? 'RAM' : 'Almacenamiento',
          anterior,
          nuevo,
          motivo,
          tecnico,
          costo: Number(costo),
          obs: obs || '—'
        };

        this.modificationRepo.insert(record);
        this.assetRepo.update(asset.codigo, isRam ? { ram: Number(newValue) } : { disco: nuevo });
        return record;
      }
    });
  }
}
