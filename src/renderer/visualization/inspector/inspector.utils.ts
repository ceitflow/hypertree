import { EditorView } from 'codemirror';
import { ApiService } from '../../api.service';
import { GraphNode, GraphNodeEnum } from '../graph';
import { DecodeResult, Decoder, FileType } from './decoder';
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

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = 'qwen3.5:2b-mlx';

export async function describeCode(fileName: string, content: string): Promise<string> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      think: false,
      format: 'json',
      options: {
        num_ctx: 16384,
        temperature: 0.2,
        top_p: 0.85,
      },
      messages: [
        {
          role: 'user',
          content: `
  You are a code summarization assistant.

  Summarize the provided code in a single sentence.

  Rules:

  * Return only the summary text.
  * Maximum 40 words.
  * Explain the code's purpose and observable behavior.
  * Do not describe syntax, language features, or implementation details.
  * Do not mention class, function, or variable names unless essential.
  * Prefer high-level intent over low-level mechanics.

  ${fileName} code:
  ${content}
`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Ollama tokens:', { prompt: data.prompt_eval_count, output: data.eval_count });
  return data.message?.content ?? '';
}

export async function describeDirectory(dirName: string, summaries: Map<string, string>): Promise<string> {
  const fileSummaries = [...summaries.entries()].map(([file, summary]) => `${file}: ${summary}`).join('\n');

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      think: false,
      format: 'json',
      options: {
        num_ctx: 16384,
        temperature: 0.2,
        top_p: 0.85,
      },
      messages: [
        {
          role: 'user',
          content: `
  You are a code summarization assistant.

  Summarize the purpose of the directory in a single sentence, based on the summaries of the code files it contains.

  Rules:

  * Return only the summary text.
  * Maximum 40 words.
  * Explain the directory's overall responsibility and observable behavior.
  * Do not list the individual files.
  * Prefer high-level intent over low-level mechanics.

  ${dirName} file summaries:
  ${fileSummaries}
`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Ollama tokens:', { prompt: data.prompt_eval_count, output: data.eval_count });
  return data.message?.content ?? '';
}

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
): Promise<DecodeResult> {
  let decoded: DecodeResult;
  try {
    const raw = await ApiService.readFile(rootId, filePath);
    decoded = Decoder.decode(raw, filePath);
  } catch {
    decoded = { type: FileType.Text, text: `/* Failed to load ${filePath} */` };
  }

  setDoc(view, decoded.text);

  if (!scrollToLine || decoded.type !== FileType.Text) {
    view.dispatch({
      effects: [setHighlightLines.of(null), EditorView.scrollIntoView(0, { y: 'start' })]
    });
    return decoded;
  }

  // TypeScript line numbers are 0-based, CodeMirror's doc.line() is 1-based.
  const lastLine = view.state.doc.lines;
  const start = Math.min(Math.max(scrollToLine.start + 1, 1), lastLine);
  const end = Math.min(Math.max(scrollToLine.end + 1, start), lastLine);
  const line = view.state.doc.line(start);
  view.dispatch({
    effects: [setHighlightLines.of({ start, end }), EditorView.scrollIntoView(line.from, { y: 'start' })]
  });
  return decoded;
}
