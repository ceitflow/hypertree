import { Screen } from './screen';
import { dia } from '@joint/core';
import { DeviceController, Mouse, Touch } from './devices';

export function Diagram(graph: dia.Graph, paper: dia.Paper, container: HTMLElement) {
  // graph // <- graph controlled by the consumer
  // let paper; // <- comes with its own graph. It will be used and virtualized
  const screen = Screen(paper, container);
  const devices = DeviceController(screen);
  devices.add(Mouse);
  devices.add(Touch);

  // screen <- svg,webgl render API, paper
  // model? graph listeners? selection wont work that way,

  return {
    screen,
    paper,
    originalGraph: graph,
  };
}
