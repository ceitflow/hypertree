import './main.css';
import { useState } from 'react';
import { Directory } from '@lib/ast';
import { Visualization } from './visualization/Visualization';

const outputModules = import.meta.glob<Directory>('../../resources/output.json', {
  eager: true,
  import: 'default'
});
const outputData = Object.values(outputModules)[0];

function App() {
  const [graphData, setGraphData] = useState<Directory | undefined>(() => outputData);

  return (
    <div className="rootContainer">
      <Visualization data={graphData} onGraphDataChange={setGraphData} />
    </div>
  );
}

export default App;
