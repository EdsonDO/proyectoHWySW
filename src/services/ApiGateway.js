import { APP_CONFIG } from '../core/config.js';

export class ApiGateway {
  constructor(eventBus, auditService, authService) {
    this.eventBus = eventBus;
    this.auditService = auditService;
    this.authService = authService;
    this.activeRequests = 0;
    this.sequence = 1000;
  }

  computeLatency() {
    const span = APP_CONFIG.apiLatencyMaxMs - APP_CONFIG.apiLatencyMinMs;
    return APP_CONFIG.apiLatencyMinMs + Math.floor(Math.random() * span);
  }

  async execute({ endpoint, method = 'GET', summary = '', handler }) {
    this.activeRequests += 1;
    const requestId = `REQ-${++this.sequence}`;
    this.eventBus.emit('api:state', { busy: true, active: this.activeRequests, endpoint, method });

    try {
      await new Promise(resolve => setTimeout(resolve, this.computeLatency()));
      const data = await handler();

      if (method !== 'GET' && summary) {
        const user = this.authService.getCurrentUser();
        this.auditService.record({
          method,
          endpoint,
          user: user ? user.name : 'Sistema',
          summary
        });
      }

      if (method !== 'GET') {
        this.eventBus.emit('data:changed', { endpoint, method, requestId });
      }

      return {
        ok: true,
        status: method === 'POST' ? 201 : 200,
        requestId,
        timestamp: new Date().toISOString(),
        data
      };
    } catch (error) {
      return {
        ok: false,
        status: error.status || 400,
        requestId,
        timestamp: new Date().toISOString(),
        error: error.message || 'Operación no completada'
      };
    } finally {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      this.eventBus.emit('api:state', { busy: this.activeRequests > 0, active: this.activeRequests, endpoint, method });
    }
  }
}
