import { State } from '../types.ts';

export function Zoom({ transform, zoom, frameStart }: State) {
  return {
    start: (delta: number, ox: number, oy: number) => {
      const curr = transform[2];
      const step = curr * 0.2;
      zoom.targetZoom = Math.max(
        zoom.min,
        Math.min(zoom.max, zoom.targetZoom + step * Math.sign(delta))
      );
      if (zoom.targetZoom === curr) return;

      zoom.velocity[0] = -ox * (zoom.targetZoom - curr);
      zoom.velocity[1] = -oy * (zoom.targetZoom - curr);
      zoom.velocity[2] = zoom.targetZoom - curr;
      zoom.startVelocity[0] = zoom.velocity[0];
      zoom.startVelocity[1] = zoom.velocity[1];
      zoom.startVelocity[2] = zoom.velocity[2];
      zoom.active = true;
    },

    next: () => {
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
    },

    stop: () => {
      zoom.active = false;
      zoom.velocity = [0, 0, 0];
    },
  };
}
