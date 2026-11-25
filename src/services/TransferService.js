export class TransferService {
  constructor({ transferRepo, areaRepo, assetRepo, incidentRepo, gateway }) {
    this.transferRepo = transferRepo;
    this.areaRepo = areaRepo;
    this.assetRepo = assetRepo;
    this.incidentRepo = incidentRepo;
    this.gateway = gateway;
  }

  getAreas() {
    return this.areaRepo.getAll();
  }

  getAreaStats(areaId) {
    const lista = this.assetRepo.filter(e => e.area === areaId);
    const count = status => lista.filter(e => e.estado === status).length;
    return {
      total: lista.length,
      op: count('Operativo'),
      man: count('En mantenimiento'),
      ino: count('Inoperativo'),
      baja: count('Dado de baja'),
      lista
    };
  }

  getTransfers() {
    return [...this.transferRepo.getAll()].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  async transferAsset({ equipo, fecha, area, oficina, responsable, motivo }) {
    return this.gateway.execute({
      endpoint: '/api/v2/transfers',
      method: 'POST',
      summary: `Traslado de ${equipo} hacia área ${area} (${responsable})`,
      handler: () => {
        const asset = this.assetRepo.findById(equipo);
        if (!asset) throw new Error('Equipo no encontrado.');

        const record = {
          id: this.transferRepo.nextSequentialId('TR'),
          equipo: asset.codigo,
          fecha,
          origen: asset.area,
          destino: area,
          de: asset.responsable,
          a: responsable,
          motivo
        };

        this.transferRepo.insert(record);
        this.assetRepo.update(asset.codigo, {
          area,
          oficina,
          responsable,
          fechaAsig: fecha
        });

        this.incidentRepo
          .filter(i => i.equipo === asset.codigo)
          .forEach(i => { i.area = area; });
        this.incidentRepo.persist();

        return record;
      }
    });
  }
}
