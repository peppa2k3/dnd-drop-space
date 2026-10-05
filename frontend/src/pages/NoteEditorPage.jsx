import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Trash2, Eye, Pencil } from 'lucide-react';
import { useItem, useUpdateNoteContent } from '../hooks/useItems';
import { useItemActions } from '../hooks/useItemActions';
import { useFolders } from '../hooks/useFolders';
import NoteEditorToolbar from '../components/note/NoteEditorToolbar';
import NotePreview from '../components/note/NotePreview';
import TagChip from '../components/common/TagChip';
import IconButton from '../components/common/IconButton';
import { FullPageSpinner } from '../components/common/Spinner';
import { buildFolderTree, flattenForSelect } from '../utils/folderTree';

const AUTOSAVE_DELAY_MS = 1200;

export default function NoteEditorPage() {
  useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading } = useItem(id);
  const { data: folders = [] } = useFolders();
  const updateNoteContent = useUpdateNoteContent();
  const actions = useItemActions();
  const textareaRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [folder, setFolder] = useState('');
  const [mobilePane, setMobilePane] = useState('edit');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved

  const initializedRef = useRef(false);
  const skipNextAutosaveRef = useRef(true);

  useEffect(() => {
    if (item && !initializedRef.current) {
      setTitle(item.title || '');
      setContent(item.noteContent?.content || '');
      setTags((item.tags || []).map((t) => t.name));
      setFolder(item.folder?._id || '');
      initializedRef.current = true;
    }
  }, [item]);

  // Autosave note content a short moment after the person stops typing.
  useEffect(() => {
    if (!initializedRef.current) return undefined;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return undefined;
    }
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      updateNoteContent.mutate(
        { id, content },
        {
          onSuccess: () => setSaveStatus('saved'),
          onError: () => setSaveStatus('idle'),
        }
      );
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const saveMeta = (overrides = {}) => {
    actions.updateItem(id, {
      title: 'title' in overrides ? overrides.title : title,
      folder: 'folder' in overrides ? overrides.folder : folder || null,
      tags: 'tags' in overrides ? overrides.tags : tags,
    });
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      const next = [...tags, t];
      setTags(next);
      setTagInput('');
      saveMeta({ tags: next });
    }
  };

  const removeTag = (t) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    saveMeta({ tags: next });
  };

  if (isLoading || !item) return <FullPageSpinner label={i18n.t('files:loadingNotes')} />;

  const folderOptions = flattenForSelect(buildFolderTree(folders));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft size={15} /> {i18n.t('files:comeBack')}
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-text-muted">
            {saveStatus === 'saving' ? i18n.t('files:savingPlaceholder') : saveStatus === 'saved' ? i18n.t('files:saved') : ''}
          </span>
          <IconButton
            icon={Star}
            label={i18n.t('common:favorite')}
            variant={item.favorite ? 'accent' : 'default'}
            onClick={() => actions.toggleFavorite(id)}
          />
          <IconButton
            icon={Trash2}
            label={i18n.t('files:moveToTrash')}
            variant="danger"
            onClick={() => actions.moveToTrash(id, () => navigate('/app/notes'))}
          />
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => saveMeta()}
        placeholder={i18n.t('files:noteTitlePlaceholder')}
        className="w-full bg-transparent font-display text-3xl font-semibold text-text-primary placeholder:text-text-muted focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={folder}
          onChange={(e) => {
            setFolder(e.target.value);
            saveMeta({ folder: e.target.value || null });
          }}
          className="rounded-card border border-border bg-surface px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">{i18n.t('common:noDirectoryRoot')}</option>
          {folderOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <TagChip key={t} name={t} onRemove={() => removeTag(t)} />
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={i18n.t('common:addTagsPlaceholder')}
            className="w-24 rounded-card border border-border bg-surface px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex gap-1 lg:hidden">
        <button
          onClick={() => setMobilePane('edit')}
          className={`flex items-center gap-1.5 rounded-card px-3 py-1.5 text-xs transition-colors duration-200 ${mobilePane === 'edit' ? 'bg-primary/10 text-primary-hover' : 'bg-background-secondary text-text-secondary'}`}
        >
          <Pencil size={13} /> {i18n.t('files:drafting')}
        </button>
        <button
          onClick={() => setMobilePane('preview')}
          className={`flex items-center gap-1.5 rounded-card px-3 py-1.5 text-xs transition-colors duration-200 ${mobilePane === 'preview' ? 'bg-primary/10 text-primary-hover' : 'bg-background-secondary text-text-secondary'}`}
        >
          <Eye size={13} /> {i18n.t('common:preview')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`overflow-hidden rounded-card border border-border ${mobilePane !== 'edit' ? 'hidden lg:block' : ''}`}>
          <NoteEditorToolbar textareaRef={textareaRef} value={content} onChange={setContent} folderId={folder} />
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={i18n.t('files:writeNoteContentUsingMarkdownPlaceholder')}
            className="h-[60vh] w-full resize-none bg-surface p-4 font-sans text-sm text-text-primary focus:outline-none"
          />
        </div>

        <div className={`h-[60vh] overflow-y-auto rounded-card border border-border bg-surface p-4 ${mobilePane !== 'preview' ? 'hidden lg:block' : ''}`}>
          <NotePreview content={content} />
        </div>
      </div>
    </div>
  );
}
