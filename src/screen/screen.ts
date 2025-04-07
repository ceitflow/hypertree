import { dia } from '@joint/core';
import { Store, StoreType } from './store.ts';
import { Inertia, Touch, Translate, Zoom } from './transformers';

export type ScreenType = ReturnType<typeof Screen>;

export function Screen(paper: dia.Paper, container: HTMLElement) {
  let _loopId = 0;
  const store: StoreType = Store();
  const paperStyle = paper.el.style;

  const translate = Translate(store);
  const inertia = Inertia(store);
  const zoom = Zoom(store);
  const touch = Touch(store);
  const transformers = [translate.next, touch.next, inertia.next, zoom.next];

  const addContainerListener = <Evt extends Event>(type: string, callback: (e: Evt) => void) => {
    document.addEventListener(type, e => {
      if (container.contains(e.target as Element)) {
        callback(e as Evt);
      }
    });
  };

  // listeners
  addContainerListener('mousedown', (e: MouseEvent) => {
    container.setPointerCapture(1);
    const view = paper.findView(e.target);
    if (view) {
      inertia.stop();
    } else {
      translate.start(e.clientX, e.clientY);
    }
  });
  addContainerListener('mousemove', (e: MouseEvent) => {
    if (store.state.translate.active) {
      if (e.buttons === 0)
        // edge case if mouse goes outside window and back
        container.dispatchEvent(new MouseEvent('mouseup', { clientX: e.clientX, clientY: e.clientY }));
      else translate.move(e.clientX, e.clientY);
    }
  });
  addContainerListener('mouseup', (e: MouseEvent) => {
    container.releasePointerCapture(1);
    if (store.state.translate.active) {
      translate.stop();
      inertia.start();
    }
  });
  addContainerListener('dblclick', (e: MouseEvent) => {
    const { x, y } = paper.clientToLocalPoint(e.clientX, e.clientY);
    zoom.zoomByStep(1, x, y);
  });
  addContainerListener('wheel', (e: WheelEvent) => {
    const { x, y } = paper.clientToLocalPoint(e.clientX, e.clientY);
    zoom.zoomByStep(-e.deltaY, x, y);
  });

  // touch support
  addContainerListener('touchstart', (e: TouchEvent) => {
    const view = paper.findView(e.target);
    if (view) {
      // todo if not multitouch
      inertia.stop();
    } else {
      touch.start((e as TouchEvent).touches);
    }
  });
  addContainerListener('touchmove', (e: TouchEvent) => {
    if (store.state.touch.active) {
      e.preventDefault();
      e.stopPropagation();
      touch.move((e as TouchEvent).changedTouches);
    }
  });
  addContainerListener('touchend', (e: TouchEvent) => {
    if (store.state.touch.active) {
      const { dblTap, multiReleased } = touch.up(e.changedTouches);
      if (dblTap) {
        const { x, y } = paper.clientToLocalPoint(dblTap[0], dblTap[1]);
        zoom.zoomByStep(1, x, y);
        inertia.stop();
      }
      if (!store.state.touch.active && !multiReleased) {
        inertia.start();
      }
    }
  });

  paper.on({
    // all: (...args) => console.log(args),
    resize: (width, height) => store.updateContentArea({ width, height }),
  });

  // resize browser callback
  new ResizeObserver(entries => {
    store.updateViewport(entries[0].contentRect);
  }).observe(container);

  const loop = (currentTime: number): void => {
    const { frameStart, transform: t, currentTransform: ct } = store.state;
    _loopId = requestAnimationFrame(loop);

    frameStart.deltaTime = currentTime - frameStart.time;
    frameStart.time = currentTime;

    transformers.forEach(filter => filter());

    if (ct[0] !== t[0] || ct[1] !== t[1] || ct[2] !== t[2]) {
      paperStyle.transform = `matrix(${t[2]}, 0, 0, ${t[2]}, ${t[0]}, ${t[1]})`;
      ct[0] = t[0];
      ct[1] = t[1];
      ct[2] = t[2];
    }
  };

  store.updateViewport(container.getBoundingClientRect());
  store.updateContentArea(paper.getComputedSize());
  _loopId = requestAnimationFrame(loop);

  return {
    state: store.state,
    zoom,
    onDestroy: (): void => {
      cancelAnimationFrame(_loopId);
    },
  };
}
