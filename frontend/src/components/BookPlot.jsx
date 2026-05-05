import { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';

export default function BookPlot({ book, onSave, setSaveStatus }) {
  const [title, setTitle] = useState(book.title ?? '');
  const [plot,  setPlot]  = useState(book.plot  ?? '');

  const debouncedSave = useDebounce((data) => { onSave(data); }, 1100);

  const handleTitle = (e) => {
    setTitle(e.target.value);
    setSaveStatus('saving');
    debouncedSave({ title: e.target.value });
  };

  const handlePlot = (e) => {
    setPlot(e.target.value);
    setSaveStatus('saving');
    debouncedSave({ plot: e.target.value });
  };

  return (
    <div className="plot-panel">
      <div>
        <div className="panel-eyebrow">Book</div>
        <input
          className="chapter-title-input"
          style={{ fontSize: '26px' }}
          value={title}
          onChange={handleTitle}
          placeholder="Book title…"
        />
      </div>

      <div>
        <div className="panel-title">Story Overview</div>
      </div>

      <textarea
        className="plot-textarea"
        value={plot}
        onChange={handlePlot}
        placeholder={
          "Describe the overarching story — the central conflict, the world, the themes, " +
          "what changes by the end, and why it matters. This is your north star."
        }
        style={{ flex: 1 }}
      />
    </div>
  );
}
