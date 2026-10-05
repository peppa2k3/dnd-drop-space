import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export default function NotePreview({ content }) {
  useTranslation();
  if (!content?.trim()) {
    return <p className="text-sm italic text-text-muted">{i18n.t('files:thereIsNoContentToPreviewYetPlaceholder')}</p>;
  }

  return (
    <div className="note-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
