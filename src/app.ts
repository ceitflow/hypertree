import { Diagram } from './diagram/diagram.ts';
import output from '../astgen/dist/output.json';
import { RawData } from './diagram/graph/types.ts';

export async function App(host: HTMLElement) {
  const diagram = await Diagram(host);
  // const controller = ; // some react ui controller (filters etc)

  diagram.load((output as RawData).dirGraph
    .dirs!.find(c => c.name === 'src')!
    .dirs!.find(c => c.name === 'app')!
  );
}
