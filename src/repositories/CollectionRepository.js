export class CollectionRepository {
  constructor(name, storage, initialItems = [], idField = 'id') {
    this.name = name;
    this.storage = storage;
    this.idField = idField;
    this.items = this.load(initialItems);
  }

  load(initialItems) {
    const persisted = this.storage.get(`col_${this.name}`);
    if (Array.isArray(persisted)) {
      return persisted;
    }
    const seedCopy = structuredClone(initialItems);
    this.storage.set(`col_${this.name}`, seedCopy);
    return seedCopy;
  }

  persist() {
    this.storage.set(`col_${this.name}`, this.items);
  }

  getAll() {
    return this.items;
  }

  find(predicate) {
    return this.items.find(predicate);
  }

  findById(id) {
    return this.items.find(item => item[this.idField] === id);
  }

  filter(predicate) {
    return this.items.filter(predicate);
  }

  insert(record) {
    this.items.push(record);
    this.persist();
    return record;
  }

  update(id, patch) {
    const target = this.findById(id);
    if (!target) return null;
    Object.assign(target, patch);
    this.persist();
    return target;
  }

  remove(id) {
    const idx = this.items.findIndex(item => item[this.idField] === id);
    if (idx === -1) return null;
    const [removed] = this.items.splice(idx, 1);
    this.persist();
    return removed;
  }

  replaceAll(records) {
    this.items.length = 0;
    this.items.push(...structuredClone(records));
    this.persist();
    return this.items;
  }

  nextSequentialId(prefix, pad = 3) {
    const maxNum = this.items.reduce((max, item) => {
      const raw = String(item[this.idField] || '');
      const match = raw.match(/(\d+)$/);
      const num = match ? Number(match[1]) : 0;
      return num > max ? num : max;
    }, 0);
    return `${prefix}-${String(maxNum + 1).padStart(pad, '0')}`;
  }
}
