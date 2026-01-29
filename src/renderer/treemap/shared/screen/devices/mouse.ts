import { InputController } from '../inputs/input-controller';

export function Mouse({ drag, zoom, inertia, invert }: InputController) {
  let isDragging = false;
  const wheelStrength = 0.005;
  const dblClickStrength = 1;

  return {
    mousedown: (e: MouseEvent) => {
      if (e.buttons !== 1) return;
      isDragging = true;
      inertia.stop();
      drag.start(e.clientX, e.clientY);
    },
    mousemove: (e: MouseEvent) => {
      if (isDragging) drag.move(e.clientX, e.clientY);
    },
    mouseup: (e: MouseEvent) => {
      if (isDragging) {
        drag.stop();
        inertia.start();
      }
      isDragging = false;
    },
    dblclick: (e: MouseEvent) => {
      zoom.zoomStep(invert(e.clientX, e.clientY), dblClickStrength);
    },
    wheel: (e: WheelEvent) => {
      const delta = -e.deltaY;
      if (delta !== 0) {
        zoom.zoomStep(invert(e.clientX, e.clientY), delta * wheelStrength);
      }
    },
  };
}
