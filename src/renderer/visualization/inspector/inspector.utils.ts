import { EditorView } from 'codemirror';
import { ApiService } from '../../api.service';
import { GraphNode, GraphNodeEnum } from '../graph';
import { Decoration, DecorationSet } from '@codemirror/view';
import { Range, StateEffect, StateField } from '@codemirror/state';

const setHighlightLines = StateEffect.define<{ start: number; end: number } | null>();

const highlightDecoration = Decoration.line({ class: 'cm-highlight-line' });

export const lineHighlighter: [StateField<DecorationSet>, ReturnType<typeof EditorView.baseTheme>] = [
  StateField.define<DecorationSet>({
    create() {
      return Decoration.none;
    },
    update(decorations, tr) {
      decorations = decorations.map(tr.changes);
      for (const effect of tr.effects) {
        if (!effect.is(setHighlightLines)) continue;
        if (effect.value === null) {
          decorations = Decoration.none;
        } else {
          const lastLine = tr.state.doc.lines;
          const start = Math.min(Math.max(effect.value.start, 1), lastLine);
          const end = Math.min(Math.max(effect.value.end, start), lastLine);
          const lines: Range<Decoration>[] = [];
          for (let lineNumber = start; lineNumber <= end; lineNumber++) {
            lines.push(highlightDecoration.range(tr.state.doc.line(lineNumber).from));
          }
          decorations = Decoration.set(lines);
        }
      }
      return decorations;
    },
    provide: (field) => EditorView.decorations.from(field)
  }),
  EditorView.baseTheme({
    '.cm-highlight-line': {
      backgroundColor: 'rgba(255, 213, 128, 0.4)'
    }
  })
];

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
  scrollToLine?: { start: number; end: number }
): Promise<void> {
  let content: string;
  try {
    content = await ApiService.readFile(rootId, filePath);
  } catch {
    content = `/* Failed to load ${filePath} */`;
  }

  setDoc(view, content);

  if (!scrollToLine) {
    view.dispatch({
      effects: [setHighlightLines.of(null), EditorView.scrollIntoView(0, { y: 'start' })]
    });
    return;
  }

  // TypeScript line numbers are 0-based, CodeMirror's doc.line() is 1-based.
  const lastLine = view.state.doc.lines;
  const start = Math.min(Math.max(scrollToLine.start + 1, 1), lastLine);
  const end = Math.min(Math.max(scrollToLine.end + 1, start), lastLine);
  const line = view.state.doc.line(start);
  view.dispatch({
    effects: [setHighlightLines.of({ start, end }), EditorView.scrollIntoView(line.from, { y: 'start' })]
  });
}
