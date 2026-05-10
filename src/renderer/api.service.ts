export type SelectFolderAnalyzeResult =
  | { canceled: true }
  | { canceled: false; data: Record<string, unknown> }
  | { canceled: false; error: string };

export class ApiService {
  static async readFile(rootPath: string, filePath: string): Promise<string> {
    return window.electron.ipcRenderer.invoke('api:readFile', [rootPath, filePath]) as Promise<string>
  }

  static async readGraph(): Promise<Record<string, unknown>> {
    return window.electron.ipcRenderer.invoke('api:readGraph') as Promise<Record<string, unknown>>
  }

  static async selectFolderAndAnalyze(): Promise<SelectFolderAnalyzeResult> {
    return window.electron.ipcRenderer.invoke('api:selectFolderAndAnalyze') as Promise<SelectFolderAnalyzeResult>
  }
}
