import { InputController } from '../screen';

export function Mouse({ drag, zoom, inertia, invert }: InputController) {
  let isDragging = false;
  const wheelStrength = 0.005;
  const dblClickStrength = 1;

  return {
    // todo viewport(events: { mousedown, mousemove, mouseup, wheel, touchstart, touchmove, touchend })
    //  viewport.on({ pointerdown })

    // and any custom logic will viewport.input.drag.start(...)
    mousedown: (e: MouseEvent) => {
      if (e.buttons !== 1) return;
      // if (paper.findView(e.target)) {
      // todo Graph.findAtPoint()
      // selection.select()
      //   inertia.stop();
      // } else {
      isDragging = true;
      inertia.stop();
      drag.start(e.clientX, e.clientY);
      // }
    },
    mousemove: (e: MouseEvent) => {
      if (isDragging)
        drag.move(e.clientX, e.clientY);
      // todo if isCellDragging: autoscroll
      /*
        if cell dragging near Viewport border (screen.isViewportBorder(point))
        screen.scroll()
       */
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
