import { dia } from '@joint/core';
import { InputControllerType } from '../transformers';

export function Mouse(input: InputControllerType, paper: dia.Paper, container: HTMLElement) {
  let isDragging = false;
  const pointerCaptureId = 1;
  const wheelStrength = 0.2;
  const dblClickStrength = 1;

  return {
    start: (e: MouseEvent) => {
      container.setPointerCapture(pointerCaptureId);
      if (paper.findView(e.target)) input.stopInertia();
      else {
        isDragging = true;
        input.stopInertia();
        input.dragStart(e.clientX, e.clientY);
      }
    },

    move: (e: MouseEvent) => {
      if (isDragging) input.drag(e.clientX, e.clientY);
    },

    up: (e: MouseEvent) => {
      container.releasePointerCapture(pointerCaptureId);
      if (isDragging) {
        input.dragStop(e.clientX, e.clientY);
        input.startInertia();
      }
      isDragging = false;
    },

    dblClick: (e: MouseEvent) => {
      input.zoom(input.invert(e.clientX, e.clientY), dblClickStrength);
    },

    zoom: (e: WheelEvent) => {
      const delta = -e.deltaY;
      if (delta !== 0) {
        input.zoom(input.invert(e.clientX, e.clientY), wheelStrength * Math.sign(delta));
      }
    },
  };
}
