import { Graph } from './graph';
import { Directory } from '@lib/ast';
import { Paper } from './paper/paper';
import styles from './TreeMap.module.css';
import { Engine } from '../shared/engine';
import { Inspector } from './inspector/Inspector';
import { useEffect, useRef, useState } from 'react';

type Props = {
  data: Directory;
};

export const TreeMap = ({ data }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<Graph | null>(null);

  useEffect(() => {
    const engine = new Engine(mapRef.current!);
    const graphInstance = new Graph(data);
    setGraph(graphInstance);

    console.log(graphInstance.model.root);

    engine.init().then(() => {
      new Paper(engine.app, graphInstance);
    });

    return () => {
      engine.destroy()
    };
  }, [data]);

  return (
    <div className={styles.treemapContainer}>
      {graph && <Inspector graph={graph} />}
      <div ref={mapRef} className={styles.diagram} />
    </div>
  );
};
/* @refresh reset */
