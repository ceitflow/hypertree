import './main.css'
import { TreeMap } from './treemap/TreeMap';
import { Inspector } from './inspector/Inspector';

function App() {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');

  return (
    <div className='rootContainer'>
      <Inspector />
      <TreeMap />
    </div>
  )
}

export default App;
