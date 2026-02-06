import { Paper } from './paper/paper';
import type { Graph } from '../graph';
import styles from './TreeMap.module.css';
import { useEffect, useRef } from 'react';
import { createEngine } from '../shared/engine';

type Props = {
  graph: Graph;
};

export const TreeMap = ({ graph }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!mapRef.current || initialized.current) return;

    initialized.current = true;

    createEngine(mapRef.current).then((engine) => {
      new Paper(engine, graph);
    });
  }, []);

  return <div ref={mapRef} className={styles.treemapContainer} />;
};
/* @refresh reset */
