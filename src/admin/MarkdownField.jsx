import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default function MarkdownField({ label, value, onChange }) {
  return (
    <div className="md-field">
      <label className="md-field__label">
        {label}
        <textarea
          className="md-field__input"
          rows={10}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <div className="md-field__preview md" data-testid="md-preview" aria-label="미리보기">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{value || ''}</ReactMarkdown>
      </div>
    </div>
  );
}
