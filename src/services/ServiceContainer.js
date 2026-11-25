import { EventBus } from '../core/eventBus.js';
import { createSeedDataset } from '../data/seedData.js';
import { LocalStorageAdapter } from '../repositories/StorageAdapter.js';
import { CollectionRepository } from '../repositories/CollectionRepository.js';
import { ApiGateway } from './ApiGateway.js';
import { AuditService } from './AuditService.js';
import { AuthService } from './AuthService.js';
import { AssetService } from './AssetService.js';
import { SoftwareService } from './SoftwareService.js';
import { MaintenanceService } from './MaintenanceService.js';
import { IncidentService } from './IncidentService.js';
import { HistoryService } from './HistoryService.js';
import { TransferService } from './TransferService.js';
import { EvaluationService } from './EvaluationService.js';
import { ReportService } from './ReportService.js';

export function createServiceContainer() {
  const eventBus = new EventBus();
  const storage = new LocalStorageAdapter();
  const seed = createSeedDataset();

  const repos = {
    areas: new CollectionRepository('areas', storage, seed.areas, 'id'),
    technicians: new CollectionRepository('technicians', storage, seed.technicians, 'id'),
    assets: new CollectionRepository('assets', storage, seed.assets, 'codigo'),
    maintenances: new CollectionRepository('maintenances', storage, seed.maintenances, 'id'),
    incidents: new CollectionRepository('incidents', storage, seed.incidents, 'id'),
    modifications: new CollectionRepository('modifications', storage, seed.modifications, 'id'),
    software: new CollectionRepository('software', storage, seed.software, 'id'),
    licenses: new CollectionRepository('licenses', storage, seed.licenses, 'id'),
    transfers: new CollectionRepository('transfers', storage, seed.transfers, 'id'),
    auditLogs: new CollectionRepository('auditLogs', storage, seed.auditLogs, 'id')
  };

  const authService = new AuthService(storage, eventBus);
  const auditService = new AuditService(repos.auditLogs);
  const gateway = new ApiGateway(eventBus, auditService, authService);

  const assetService = new AssetService({
    assetRepo: repos.assets,
    areaRepo: repos.areas,
    incidentRepo: repos.incidents,
    transferRepo: repos.transfers,
    modificationRepo: repos.modifications,
    gateway
  });

  const softwareService = new SoftwareService({
    softwareRepo: repos.software,
    licenseRepo: repos.licenses,
    gateway
  });

  const maintenanceService = new MaintenanceService({
    maintenanceRepo: repos.maintenances,
    assetRepo: repos.assets,
    incidentRepo: repos.incidents,
    softwareRepo: repos.software,
    gateway
  });

  const incidentService = new IncidentService({
    incidentRepo: repos.incidents,
    assetRepo: repos.assets,
    gateway
  });

  const historyService = new HistoryService({
    modificationRepo: repos.modifications,
    assetRepo: repos.assets,
    maintenanceRepo: repos.maintenances,
    incidentRepo: repos.incidents,
    gateway
  });

  const transferService = new TransferService({
    transferRepo: repos.transfers,
    areaRepo: repos.areas,
    assetRepo: repos.assets,
    incidentRepo: repos.incidents,
    gateway
  });

  const evaluationService = new EvaluationService({
    assetService,
    softwareService,
    maintenanceService,
    incidentService,
    historyService
  });

  const reportService = new ReportService({
    assetService,
    softwareService,
    maintenanceService,
    incidentService,
    historyService,
    transferService,
    evaluationService
  });

  const systemService = {
    getTechnicians: () => repos.technicians.getAll(),
    isPersistent: () => storage.isPersistent(),
    exportSnapshot() {
      return {
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        data: {
          areas: repos.areas.getAll(),
          technicians: repos.technicians.getAll(),
          assets: repos.assets.getAll(),
          maintenances: repos.maintenances.getAll(),
          incidents: repos.incidents.getAll(),
          modifications: repos.modifications.getAll(),
          software: repos.software.getAll(),
          licenses: repos.licenses.getAll(),
          transfers: repos.transfers.getAll(),
          auditLogs: repos.auditLogs.getAll()
        }
      };
    },
    async importSnapshot(snapshot) {
      return gateway.execute({
        endpoint: '/api/v2/system/restore',
        method: 'POST',
        summary: 'Restauración de respaldo institucional JSON',
        handler: () => {
          const payload = snapshot && snapshot.data ? snapshot.data : snapshot;
          if (!payload || !Array.isArray(payload.assets)) {
            throw new Error('Archivo de respaldo inválido.');
          }
          Object.entries(repos).forEach(([key, repo]) => {
            if (Array.isArray(payload[key])) {
              repo.replaceAll(payload[key]);
            }
          });
          return true;
        }
      });
    },
    async resetAll() {
      return gateway.execute({
        endpoint: '/api/v2/system/reset',
        method: 'POST',
        summary: 'Restablecimiento de datos base del sistema',
        handler: () => {
          const fresh = createSeedDataset();
          Object.entries(repos).forEach(([key, repo]) => {
            if (Array.isArray(fresh[key])) {
              repo.replaceAll(fresh[key]);
            }
          });
          return true;
        }
      });
    }
  };

  return {
    eventBus,
    gateway,
    authService,
    auditService,
    assetService,
    softwareService,
    maintenanceService,
    incidentService,
    historyService,
    transferService,
    evaluationService,
    reportService,
    systemService
  };
}
