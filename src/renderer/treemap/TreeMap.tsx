import { Graph } from '../graph';
import { Paper } from './paper/paper';
import { Layout } from './layout/layout';
import styles from './TreeMap.module.css';
import { useEffect, useRef } from 'react';
import { createEngine } from '../shared/engine';
import { Directory } from '@lib/ast';
import outputData from '../../../resources/output.json';
import { MockAstData } from './mocks/mock-ast-data';

export const TreeMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    createEngine(mapRef.current!).then((engine) => {
      const graph = new Graph(outputData as Directory);
      console.log(graph.model.root);
      Layout(graph.model.root);
      new Paper(engine, graph);
    });
  }, []);

  return <div ref={mapRef} className={styles.treemapContainer}></div>;
};
/* @refresh reset */
