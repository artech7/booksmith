import { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';

export default function ChapterPlot({ chapter, onSave, setSaveStatus }) {
  const [plot, setPlot] = useState(chapter.plot ?? '');
  const save = useDebounce((d) => onSave(chapter.id, d), 1100);

  const onPlot = (e) => { setPlot(e.target.value); setSaveStatus('saving'); save({ plot: e.target.value }); };

  return (
    <div className="plot-panel">
      <div>
        <div className="panel-eyebrow">Chapter Plot</div>
        <div className="panel-heading">{chapter.title || 'Untitled Chapter'}</div>
      </div>
      <textarea
        className="plot-textarea"
        value={plot}
        onChange={onPlot}
        placeholder="What happens in this chapter? Outline the key beats, character decisions, tension, revelations, and how it moves the story forward."
        style={{ flex: 1 }}
      />
    </div>
  );
}
