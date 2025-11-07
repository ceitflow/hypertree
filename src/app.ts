import { Diagram } from './diagram/diagram.ts';
import output from '../backend/dist/output.json';
import { ProgramGraph } from './diagram/graph/types.ts';

export async function App(host: HTMLElement) {
  const diagram = await Diagram(host);
  // const controller = ; // some react ui controller (filters etc)
  const data = output as unknown as ProgramGraph;
  // let mockData = GraphFactory.createModel({ name: 'root', path: 'root', nestLevel: 0 }, 0, null, 'dir');

  diagram.load(data);
}
