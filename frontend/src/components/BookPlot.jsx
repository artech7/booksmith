import { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';

export default function BookPlot({ book, onSave, setSaveStatus }) {
  const [title, setTitle] = useState(book.title ?? '');
  const [plot,  setPlot]  = useState(book.plot  ?? '');
  const save = useDebounce((d) => onSave(d), 1100);

  const onTitle = (e) => { setTitle(e.target.value); setSaveStatus('saving'); save({ title: e.target.value }); };
  const onPlot  = (e) => { setPlot(e.target.value);  setSaveStatus('saving'); save({ plot:  e.target.value }); };

  return (
    <div className="plot-panel">
      <div>
        <div className="panel-eyebrow">Book</div>
        <input className="plot-input" value={title} onChange={onTitle} placeholder="Book title…" />
      </div>
      <div className="panel-heading">Story Overview</div>
      <textarea
        className="plot-textarea"
        value={plot}
        onChange={onPlot}
        placeholder="Describe the overarching story — the central conflict, the world, the themes, what changes by the end, and why it matters. This is your north star."
        style={{ flex: 1 }}
      />
    </div>
  );
}
