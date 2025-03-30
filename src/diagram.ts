import { dia } from '@joint/core';
import { Screen } from './screen';

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

  constructor(host: HTMLElement, container: HTMLElement) {
    this.graph = new dia.Graph();
    this.paper = new dia.Paper({
      el: host,
      model: this.graph,
      autoFreeze: true,
      background: { color: 'whitesmoke' },
      width: 2500,
      height: 1700,
      async: true,
      defaultRouter: {
        name: 'manhattan',
      },
    });

    new Screen(this.paper, container);
  }
}
