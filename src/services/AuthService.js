import { INSTITUTIONAL_USERS } from '../data/seedData.js';

const SESSION_KEY = 'session_user';

export class AuthService {
  constructor(storage, eventBus) {
    this.storage = storage;
    this.eventBus = eventBus;
    this.users = INSTITUTIONAL_USERS;
    this.currentUser = this.restoreSession();
  }

  restoreSession() {
    const stored = this.storage.get(SESSION_KEY);
    if (stored === 'SIGNED_OUT') return null;
    if (stored && stored.email) {
      return this.users.find(u => u.email === stored.email) || this.users[0];
    }
    const defaultUser = this.users[0];
    this.storage.set(SESSION_KEY, this.publicProfile(defaultUser));
    return defaultUser;
  }

  publicProfile(user) {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      initials: user.initials,
      role: user.role,
      area: user.area
    };
  }

  getCurrentUser() {
    return this.publicProfile(this.currentUser);
  }

  getAvailableAccounts() {
    return this.users.map(u => this.publicProfile(u));
  }

  isAuthenticated() {
    return Boolean(this.currentUser);
  }

  async login(email, password) {
    await new Promise(resolve => setTimeout(resolve, 140));
    const normalized = String(email || '').trim().toLowerCase();
    const found = this.users.find(u => u.email === normalized && u.password === password);
    if (!found) {
      return { ok: false, error: 'Credenciales inválidas. Verifica correo y contraseña.' };
    }
    this.currentUser = found;
    this.storage.set(SESSION_KEY, this.publicProfile(found));
    this.eventBus.emit('auth:changed', { user: this.publicProfile(found) });
    return { ok: true, user: this.publicProfile(found) };
  }

  async switchAccount(email) {
    const found = this.users.find(u => u.email === email);
    if (!found) return { ok: false, error: 'Cuenta no encontrada.' };
    this.currentUser = found;
    this.storage.set(SESSION_KEY, this.publicProfile(found));
    this.eventBus.emit('auth:changed', { user: this.publicProfile(found) });
    return { ok: true, user: this.publicProfile(found) };
  }

  logout() {
    this.currentUser = null;
    this.storage.set(SESSION_KEY, 'SIGNED_OUT');
    this.eventBus.emit('auth:changed', { user: null });
  }
}
