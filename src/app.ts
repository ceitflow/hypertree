import { Diagram } from './diagram/diagram.ts';
import output from '../backend/dist/output.json';
import { RawData } from './diagram/graph/types.ts';

export async function App(host: HTMLElement) {
  const diagram = await Diagram(host);
  // const controller = ; // some react ui controller (filters etc)

  const data = (output as RawData).dirGraph
  diagram.load(data);
}
