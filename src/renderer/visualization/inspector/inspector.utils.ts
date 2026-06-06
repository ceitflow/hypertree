import { EditorView } from 'codemirror';
import { ApiService } from '../../api.service';
import { GraphNode, GraphNodeEnum } from '../graph';

export function getLabel(node: GraphNode): string {
  if (node.type === GraphNodeEnum.Virtual) return node.parent!['ast'].name + ' virtual';
  return `${node.ast.id} ${node.ast['loc'] ? node.ast['loc'] : ''} loc`;
}

export function getChildName(child: GraphNode): string {
  return child.type === GraphNodeEnum.Virtual ? 'virtual' : child.ast.name;
}

export function setDoc(view: EditorView, content: string): void {
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: content } });
}

export async function loadFile(
  view: EditorView,
  rootId: string,
  filePath: string,
  scrollToLine: number = 0
): Promise<void> {
  let content: string;
  try {
    content = await ApiService.readFile(rootId, filePath);
  } catch {
    content = `/* Failed to load ${filePath} */`;
  }

  setDoc(view, content);

  // TypeScript line numbers are 0-based, CodeMirror's doc.line() is 1-based.
  const lineNumber = Math.min(Math.max(scrollToLine + 1, 1), view.state.doc.lines);
  const line = view.state.doc.line(lineNumber);
  view.dispatch({ effects: EditorView.scrollIntoView(line.from, { y: 'start' }) });
}
