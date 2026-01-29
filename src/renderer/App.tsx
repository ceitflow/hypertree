import './main.css'
import { TreeMap } from './treemap/TreeMap';

function App() {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');

  return (
    <div className='container'>
      <TreeMap />
    </div>
  )
}

export default App;
