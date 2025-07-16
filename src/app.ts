import { Diagram } from './diagram/diagram.ts';
import { DataService } from './data/data-service.ts';

export async function App(host: HTMLElement) {
  const diagram = await Diagram(host);
  const dataService = DataService();
  // const controller = ; // some react ui controller (filters etc)

  diagram.load(dataService.sample());
}
