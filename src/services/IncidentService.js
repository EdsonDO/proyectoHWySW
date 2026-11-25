import { todayIso } from '../core/date.js';

export const NEXT_TICKET_ACTION = Object.freeze({
  Pendiente: 'Asignar técnico',
  Asignada: 'Iniciar intervención',
  'En proceso': 'Registrar solución',
  Resuelta: 'Cerrar orden'
});

export class IncidentService {
  constructor({ incidentRepo, assetRepo, gateway }) {
    this.incidentRepo = incidentRepo;
    this.assetRepo = assetRepo;
    this.gateway = gateway;
  }

  getAll() {
    return this.incidentRepo.getAll();
  }

  getById(id) {
    return this.incidentRepo.findById(id);
  }

  getByAsset(code) {
    return this.incidentRepo.filter(i => i.equipo === code);
  }

  isOpen(ticket) {
    return ticket.estado !== 'Resuelta' && ticket.estado !== 'Cerrada';
  }

  getOpenCount() {
    return this.incidentRepo.filter(t => this.isOpen(t)).length;
  }

  filter({ q = '', estado = '', cat = '', pri = '' } = {}) {
    const term = q.trim().toLowerCase();
    return this.incidentRepo
      .filter(t =>
        (!term || [t.id, t.equipo, t.descripcion, t.usuario].some(s => String(s || '').toLowerCase().includes(term))) &&
        (!estado || t.estado === estado) &&
        (!cat || t.categoria === cat) &&
        (!pri || t.prioridad === pri)
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  async create({ equipo, usuario, categoria, prioridad, descripcion }) {
    return this.gateway.execute({
      endpoint: '/api/v2/work-orders',
      method: 'POST',
      summary: `Nueva orden de trabajo en ${equipo} (${prioridad})`,
      handler: () => {
        const asset = this.assetRepo.findById(equipo);
        if (!asset) throw new Error('Equipo no encontrado.');
        const today = todayIso();
        const record = {
          id: this.incidentRepo.nextSequentialId('IN'),
          equipo: asset.codigo,
          area: asset.area,
          usuario,
          categoria,
          descripcion,
          prioridad,
          estado: 'Pendiente',
          fecha: today,
          tecnico: '',
          solucion: '',
          historial: [[today, `Incidencia reportada por ${usuario}`]]
        };
        return this.incidentRepo.insert(record);
      }
    });
  }

  async advance(id, payload = {}) {
    return this.gateway.execute({
      endpoint: `/api/v2/work-orders/${id}/transition`,
      method: 'PATCH',
      summary: `Actualización de flujo de orden ${id}`,
      handler: () => {
        const ticket = this.incidentRepo.findById(id);
        if (!ticket) throw new Error('Orden de trabajo no encontrada.');
        const today = todayIso();

        if (ticket.estado === 'Pendiente') {
          ticket.tecnico = payload.tecnico;
          ticket.estado = 'Asignada';
          ticket.historial.push([today, `Asignada a ${ticket.tecnico}`]);
        } else if (ticket.estado === 'Asignada') {
          ticket.estado = 'En proceso';
          ticket.historial.push([today, 'Intervención iniciada']);
        } else if (ticket.estado === 'En proceso') {
          ticket.solucion = payload.solucion;
          ticket.estado = 'Resuelta';
          ticket.historial.push([today, `Solución aplicada: ${ticket.solucion}`]);
        } else if (ticket.estado === 'Resuelta') {
          ticket.estado = 'Cerrada';
          ticket.historial.push([today, 'Cerrada con conformidad del usuario']);
        }

        this.incidentRepo.persist();
        return ticket;
      }
    });
  }
}
