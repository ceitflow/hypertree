export class ApiService {
  static async readFile(filePath: string): Promise<string> {
    return window.electron.ipcRenderer.invoke('api:readFile', filePath) as Promise<string>
  }

  static async readGraph(): Promise<Record<string, unknown>> {
    return window.electron.ipcRenderer.invoke('api:readGraph') as Promise<Record<string, unknown>>
  }
}
