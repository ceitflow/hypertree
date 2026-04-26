import './main.css';
import { Directory } from '@lib/ast';
import { Visualization } from './visualization/Visualization';
import outputData from '../../resources/output.json';
import { MockAstData } from './testing/mock-ast-data';

function App() {
  // todo in future
  //  -store holds ast root (Directory)
  //  - pass store to treemap and it creates new graph internally

  // todo pull all comments, hyperlinks

  return (
    <div className="rootContainer">
      {/*<Visualization data={outputData as Directory} />*/}
      <Visualization data={MockAstData} />
    </div>
  );
}

export default App;
