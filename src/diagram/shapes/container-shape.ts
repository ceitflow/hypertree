import { Container, Graphics, Size } from 'pixi.js';

export type ContainerShapeType = ReturnType<typeof ContainerShape>;

export function ContainerShape(addTo?: Container) {
  const bg = new Graphics({ x: 0, y: 0 });

  const container = new Container({ // where nodes are added
    children: [bg],
    interactive: true,
    eventMode: 'static'
  });

  addTo?.addChild(container)

  return {
    container,
    addChild: container.addChild.bind(container),
    position: (x: number, y: number) => container.position.set(x, y),
    scale: (sx: number, sy: number) => {
      container.scale.set(sx, sy);
    },
    resize: (size: Size) => {
      bg.roundRect(0, 0, size.width, size.height, 16).fill('0x262626');
    },
  };
}