import './main.css';
import { Directory } from '@lib/ast';
import { TreeMap } from './treemap/TreeMap';
import outputData from '../../resources/output.json';

function App() {
  // todo in future
  //  -store holds ast root (Directory)
  //  - pass store to treemap and it creates new graph internally

  return (
    <div className="rootContainer">
      <TreeMap data={outputData as Directory} />
    </div>
  );
}

export default App;
