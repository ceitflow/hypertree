import { StoreType } from '../store.ts';

export function Zoom({ state: { transform, zoom, frameStart } }: StoreType) {
  const start = (ox: number, oy: number) => {
    const currentZoom = transform[2];
    if (zoom.targetZoom === currentZoom) return;

    zoom.velocity[0] = -ox * (zoom.targetZoom - currentZoom); // += instead of = overwrite?
    zoom.velocity[1] = -oy * (zoom.targetZoom - currentZoom);
    zoom.velocity[2] = zoom.targetZoom - currentZoom;
    zoom.startVelocity[0] = zoom.velocity[0];
    zoom.startVelocity[1] = zoom.velocity[1];
    zoom.startVelocity[2] = zoom.velocity[2];
    zoom.active = true;
  };

  const zoomByStep = (delta: number, ox: number, oy: number) => {
    const step = transform[2] * 0.2;
    zoom.targetZoom = Math.max(zoom.min, Math.min(zoom.max, zoom.targetZoom + step * Math.sign(delta)));
    start(ox, oy);
  };

  const zoomAbsolute = (value: number, ox: number, oy: number) => {
    zoom.targetZoom = Math.max(zoom.min, Math.min(zoom.max, value));
    start(ox, oy);
  };

  const next = () => {
    if (!zoom.active) return;

    const { velocity, startVelocity, durationMs } = zoom;

    if (!velocity[0] && !velocity[1] && !velocity[2]) {
      zoom.active = false;
      return;
    }

    const dt = frameStart.deltaTime / durationMs;
    let dx = startVelocity[0] * dt;
    let dy = startVelocity[1] * dt;
    let dscale = startVelocity[2] * dt;

    if (dx * dx > velocity[0] * velocity[0]) dx = velocity[0];
    if (dy * dy > velocity[1] * velocity[1]) dy = velocity[1];
    if (dscale * dscale > velocity[2] * velocity[2]) dscale = velocity[2];

    velocity[0] -= dx;
    velocity[1] -= dy;
    velocity[2] -= dscale;

    transform[0] += dx;
    transform[1] += dy;
    transform[2] += dscale;
  };

  const stop = () => {
    zoom.active = false;
    zoom.velocity = [0, 0, 0];
  };

  return {
    zoomByStep,
    zoomAbsolute,
    next,
    stop,
  };
}
