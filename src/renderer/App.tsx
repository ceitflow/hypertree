import './main.css';
import { Directory } from '@lib/ast';
import { Visualization } from './visualization/Visualization';
import outputData from '../../resources/output.json';
import { useState } from 'react';

function App() {
  const [graphData, setGraphData] = useState<Directory>(() => outputData as Directory);

  return (
    <div className="rootContainer">
      <Visualization data={graphData} onGraphDataChange={setGraphData} />
    </div>
  );
}

export default App;
