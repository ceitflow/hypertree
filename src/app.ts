import { Diagram } from './diagram/diagram.ts';
import output from '../backend/dist/output.json';
import { RawProgramGraph } from './diagram/graph/types.ts';
import { GraphFactory } from './diagram/graph/graph-factory.ts';

export async function App(host: HTMLElement) {
  const diagram = await Diagram(host);
  // const controller = ; // some react ui controller (filters etc)
  const data = (output as any as RawProgramGraph);
  // let mockData = GraphFactory.createModel({ name: 'root', path: 'root', nestLevel: 0 }, 0, null, 'dir');


  diagram.load(data);
}
