import { Graph } from './graph';
import { Directory } from '@lib/ast';
import { Paper } from './paper/paper';
import styles from './Visualization.module.css';
import { Engine } from '../shared/engine';
import { Inspector } from './inspector/Inspector';
import { useEffect, useRef, useState } from 'react';
import { ApiService } from '../api.service';

type Props = {
  data: Directory;
  onGraphDataChange?: (data: Directory) => void;
};

export const Visualization = ({ data, onGraphDataChange }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleOpenFolder = async () => {
    setAnalyzing(true);
    try {
      const result = await ApiService.selectFolderAndAnalyze();
      if (result.canceled) return;
      if ('error' in result) {
        console.error(result.error);
        return;
      }
      onGraphDataChange?.(result.data as Directory);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    const engine = new Engine(mapRef.current!);
    const graphInstance = new Graph(data);
    setGraph(graphInstance);

    console.log(graphInstance.model);

    engine.init().then(() => {
      new Paper(engine.app, graphInstance);
    });

    return () => {
      engine.destroy()
    };
  }, [data]);

  return (
    <div className={styles.visualizationContainer}>
      <button
        type="button"
        className={styles.openFolderButton}
        disabled={analyzing}
        onClick={handleOpenFolder}
      >
        Open folder…
      </button>
      {graph && <Inspector graph={graph} />}
      <div ref={mapRef} className={styles.diagram} />
    </div>
  );
};

