export class Router {
  constructor(defaultRoute = 'dashboard') {
    this.defaultRoute = defaultRoute;
    this.handlers = new Set();
    this.boundOnHashChange = () => this.notify();
  }

  start() {
    window.addEventListener('hashchange', this.boundOnHashChange);
    this.notify();
  }

  stop() {
    window.removeEventListener('hashchange', this.boundOnHashChange);
  }

  parse() {
    const raw = (window.location.hash || '').replace(/^#/, '').trim();
    if (!raw) return { id: this.defaultRoute, param: '' };
    const slashIdx = raw.indexOf('/');
    if (slashIdx === -1) return { id: raw, param: '' };
    return {
      id: raw.slice(0, slashIdx),
      param: decodeURIComponent(raw.slice(slashIdx + 1))
    };
  }

  navigate(target) {
    const clean = String(target || this.defaultRoute).replace(/^#/, '');
    const current = (window.location.hash || '').replace(/^#/, '');
    if (current === clean) {
      this.notify();
      return;
    }
    window.location.hash = clean;
  }

  subscribe(fn) {
    this.handlers.add(fn);
    return () => this.handlers.delete(fn);
  }

  notify() {
    const route = this.parse();
    this.handlers.forEach(fn => fn(route));
  }
}
