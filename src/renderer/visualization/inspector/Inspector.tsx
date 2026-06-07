import styles from './Inspector.module.css';
import { EditorState } from '@codemirror/state';
import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { Graph, GraphNode, GraphNodeEnum } from '../graph';
import { getChildName, getLabel, lineHighlighter, loadFile, setDoc } from './inspector.utils';

type Props = {
  graph: Graph;
};

export const Inspector = ({ graph }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [inspectorVisible, setInspectorVisible] = useState(true);
  const [label, setLabel] = useState<string | null>(null);
  const [children, setChildren] = useState<GraphNode[] | null>(null);

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
        EditorView.lineWrapping,
        lineHighlighter
      ]
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onSelect = async (node: GraphNode | null) => {
      setInspectorVisible(true);
      const view = viewRef.current!;
      const rootId = graph.model.root.ast.id;

      if (!node) {
        setLabel(null);
        setChildren(null);
        setDoc(view, '');
        return;
      }

      setLabel(getLabel(node));

      switch (node.type) {
        case GraphNodeEnum.Directory:
        case GraphNodeEnum.Virtual:
          setChildren(node.children as GraphNode[]);
          setDoc(view, '');
          break;

        case GraphNodeEnum.Code:
        case GraphNodeEnum.Other:
          setChildren(null);
          await loadFile(view, rootId, node.ast.id);
          break;

        case GraphNodeEnum.Declaration:
          setChildren(null);
          await loadFile(view, rootId, node.parent.ast.id, { start: node.ast.startLine, end: node.ast.endLine });
          break;
      }
    };
    graph.emit.on('select', onSelect);
    return () => graph.emit.off('select', onSelect);
  }, []);

  return (
    <div className={styles.inspectorContainer} style={{ opacity: inspectorVisible ? 1 : 0 }}>
      <button
        type="button"
        className={styles.closeButton}
        aria-label="Close inspector"
        onClick={() => setInspectorVisible(false)}
      >
        ×
      </button>
      <span className={styles.selectedId}>{label || '—'}</span>
      {children && (
        <div className={styles.childrenList}>
          {children.map((child) => (
            <span key={child.id} className={styles.childItem}>
              {getChildName(child)} <em className={styles.childType}>({child.type})</em>
            </span>
          ))}
          {children.length === 0 && <span className={styles.childItem}>(empty)</span>}
        </div>
      )}
      <div ref={containerRef} className={styles.editorWrapper} />
    </div>
  );
};
