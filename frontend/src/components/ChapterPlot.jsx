import { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';

export default function ChapterPlot({ chapter, onSave, setSaveStatus }) {
  const [plot, setPlot] = useState(chapter.plot ?? '');

  const debouncedSave = useDebounce((data) => { onSave(chapter.id, data); }, 1100);

  const handlePlot = (e) => {
    setPlot(e.target.value);
    setSaveStatus('saving');
    debouncedSave({ plot: e.target.value });
  };

  return (
    <div className="plot-panel">
      <div>
        <div className="panel-eyebrow">Chapter Plot</div>
        <div className="panel-title">{chapter.title || 'Untitled Chapter'}</div>
      </div>

      <textarea
        className="plot-textarea"
        value={plot}
        onChange={handlePlot}
        placeholder={
          "What happens in this chapter? Outline the key beats, character decisions, " +
          "tension, revelations, and how it moves the story forward. Treat this as " +
          "your private director's notes."
        }
        style={{ flex: 1 }}
      />
    </div>
  );
}
