import './main.css';
import { useMemo } from 'react';
import { Graph } from './graph';
import { Directory } from '@lib/ast';
import { TreeMap } from './treemap/TreeMap';
import { Inspector } from './inspector/Inspector';
import { Layout } from './treemap/layout/layout';
import outputData from '../../resources/output.json';

function App() {
  const graph = useMemo(() => {
    const g = new Graph(outputData as Directory);
    Layout(g.model.root);
    return g;
  }, []);

  return (
    <div className='rootContainer'>
      <Inspector graph={graph} />
      <TreeMap graph={graph} />
    </div>
  );
}

export default App;
