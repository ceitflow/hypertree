import { InputControllerType } from '../transformers';
import { dia } from '@joint/core';

export function Mouse(input: InputControllerType, paper: dia.Paper, container: HTMLElement) {
  let isDragging = false;
  const pointerCaptureId = 1;

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

    zoom: (delta: number, ox: number, oy: number) => {
      if (delta !== 0) {
        input.zoom(input.invert(ox, oy), Math.sign(delta) as 1 | -1);
      }
    },

    isDragging: () => isDragging,
  };
}
