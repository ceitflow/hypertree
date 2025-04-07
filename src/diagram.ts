import { Screen, ScreenType } from './screen';
import { dia, shapes, util } from '@joint/core';
import { paperPatch } from './browser-patches';

type DiagramOptions = {
  screen:
    | false // false disables screen
    | {
        padding: number;
        inertia: boolean; // default true
        adaptiveScroll: false | {}; // false = linear zoom
        touchSupport: boolean; // default true; set to false if user wants to handle manual
      };
  render: {
    virtualization: boolean;
  };
};

export class Diagram {
  graph: dia.Graph;
  paper: dia.Paper;
  screen: ScreenType;

  constructor(host: HTMLElement, container: HTMLElement) {
    this.graph = new dia.Graph();
    this.paper = new dia.Paper({
      el: host,
      model: this.graph,
      autoFreeze: true,
      width: 2500,
      height: 1700,
      async: true,
      defaultRouter: {
        name: 'manhattan',
      },
    });

    this.screen = Screen(this.paper, container);
    console.log(this.screen);
    paperPatch(this.paper, this.screen.state.transform);

    new shapes.standard.Rectangle({
      position: { x: 2180, y: 1300 },
      size: { width: 280, height: 140 },
      attrs: {
        foreignObject: {
          width: 'calc(w)',
          height: 'calc(h)',
          x: 0,
          y: 0,
        },
      },
      markup: util.svg`
         <foreignObject @selector="foreignObject" style="overflow: visible; transform-style: preserve-3d; perspective: 500px">
            <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; background-color: floralwhite; height: 100%">
               <div style="background-color: indianred; flex:1"></div>
            </div>
         </foreignObject>`,
    }).addTo(this.graph);
  }
}
