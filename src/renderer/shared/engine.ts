import { Application } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';

export class Engine {
  app: Application;
  toDestroy = false;
  private isInitialized = false;

  constructor(private host: HTMLElement) {
    this.app = new Application();
  }

  async init() {
    await this.app.init({
      resizeTo: this.host,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true // Scales the CSS of the canvas back down
    });
    if (this.toDestroy) {
      this.destroy();
      return;
    }
    this.isInitialized = true;
    await initDevtools({ app: this.app });
    this.host.prepend(this.app.canvas);
  }

  destroy() {
    this.toDestroy = true;
    if (this.isInitialized) this.app.destroy();
  }
}
