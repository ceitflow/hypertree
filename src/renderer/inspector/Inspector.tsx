import { useEffect, useRef, useState } from 'react';
import styles from './Inspector.module.css';
import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';
import { Graph, GraphNode, GraphNodeEnum } from '../graph';
import { ApiService } from '../api.service';

function getLabel(node: GraphNode): string {
  if (node.type === GraphNodeEnum.Virtual) return node.parent!['ast'].name + ' virtual';
  return `${node.ast.id} ${node.ast['loc'] ? node.ast['loc'] : ''} loc`
}

function getFilePath(node: GraphNode): string | null {
  switch (node.type) {
    case GraphNodeEnum.Code:
    case GraphNodeEnum.Other:
      return node.ast.id;
    case GraphNodeEnum.Declaration:
      return node.parent.ast.id;
    default:
      return null;
  }
}

type Props = {
  graph: Graph;
}

export const Inspector = ({ graph }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const onSelect = async (node: GraphNode | null) => {
      setLabel(node ? getLabel(node) : null);

      const view = viewRef.current;
      if (!view) return;

      const filePath = node ? getFilePath(node) : null;
      if (!filePath) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: '' } });
        return;
      }

      try {
        const content = await ApiService.readFile(graph.model.root.ast.id, filePath);
        console.log(node, content)
        if (viewRef.current === view) {
          view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: content } });
        }
      } catch {
        if (viewRef.current === view) {
          view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: `// Failed to load ${filePath}` } });
        }
      }
    };
    graph.emit.on('select', onSelect);
    return () => graph.emit.off('select', onSelect);
  }, []);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const view = new EditorView({
      parent,
      doc: '',
      extensions: [
        basicSetup,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
      ],
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  return (
    <div className={styles.inspectorContainer}>
      <span className={styles.selectedId}>{label || '—'}</span>
      <div ref={containerRef} className={styles.editorWrapper} />
    </div>
  );
};
