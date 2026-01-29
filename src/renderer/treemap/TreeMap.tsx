import { Store } from './store';
import { Paper } from './paper/paper';
import { Treemap } from './graph/layout';
import { useEffect, useRef } from 'react';
import { createEngine } from '../shared/engine';
import { MockData } from './mocks/mock-data';

export const TreeMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createEngine(mapRef.current!).then((engine) => {
      const mock = MockData;
      const store = new Store(mock);
      Treemap(store.model.program.root);
      new Paper(engine, store);
    });
  }, []);

  return <div ref={mapRef}>Map works</div>;
};
