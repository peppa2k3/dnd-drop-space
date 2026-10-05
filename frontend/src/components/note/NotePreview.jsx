import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export default function NotePreview({ content }) {
  if (!content?.trim()) {
    return <p className="text-sm italic text-text-muted">Chưa có nội dung để xem trước...</p>;
  }

  return (
    <div className="note-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
