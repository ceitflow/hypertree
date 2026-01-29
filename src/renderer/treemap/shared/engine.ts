import { Application } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';

export async function createEngine(host: HTMLElement) {
  const engine = new Application();
  await engine.init({
    resizeTo: host,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true, // Scales the CSS of the canvas back down
  });
  await initDevtools({ app: engine });
  host.prepend(engine.canvas);
  return engine;
}
