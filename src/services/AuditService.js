export class AuditService {
  constructor(repository) {
    this.repository = repository;
  }

  getAll() {
    return [...this.repository.getAll()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  record({ method, endpoint, user, summary }) {
    const entry = {
      id: this.repository.nextSequentialId('AUD'),
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      user,
      summary
    };
    this.repository.insert(entry);
    if (this.repository.getAll().length > 100) {
      this.repository.getAll().shift();
      this.repository.persist();
    }
    return entry;
  }
}
