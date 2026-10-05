import { apiErrorMessage } from '../../utils/apiErrorMessage';
import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen, Plus, MoreHorizontal, Pencil, Trash2, FolderPlus } from 'lucide-react';
import clsx from 'clsx';
import Menu from '../common/Menu';
import IconButton from '../common/IconButton';
import PromptModal from '../common/PromptModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { buildFolderTree } from '../../utils/folderTree';
import { useCreateFolder, useUpdateFolder, useDeleteFolder } from '../../hooks/useFolders';
import { useToast } from '../../context/ToastContext';

export default function FolderTree({ folders, activeFolderId, onSelectFolder }) {
  useTranslation();
  const tree = buildFolderTree(folders);
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const { addToast } = useToast();

  const [creatingUnder, setCreatingUnder] = useState(undefined); // undefined = closed, null = root
  const [renaming, setRenaming] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const handleCreate = (name) => {
    createFolder.mutate(
      { name, parent: creatingUnder || null },
      {
        onSuccess: () => {
          addToast(i18n.t('folders:folderCreated'));
          setCreatingUnder(undefined);
        },
        onError: (err) => addToast(apiErrorMessage(err, i18n.t('folders:folderCreationFailed')), 'error'),
      }
    );
  };

  const handleRename = (name) => {
    updateFolder.mutate(
      { id: renaming._id, payload: { name } },
      {
        onSuccess: () => {
          addToast(i18n.t('folders:renamedFolder'));
          setRenaming(null);
        },
        onError: (err) => addToast(apiErrorMessage(err, i18n.t('folders:renameFailed')), 'error'),
      }
    );
  };

  const handleDelete = () => {
    deleteFolder.mutate(deleting._id, {
      onSuccess: () => {
        addToast(i18n.t('folders:folderDeletedDataInsideMovedToTrash'));
        setDeleting(null);
        if (activeFolderId === deleting._id) onSelectFolder(null);
      },
      onError: (err) => addToast(apiErrorMessage(err, i18n.t('folders:folderDeletionFailed')), 'error'),
    });
  };

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{i18n.t('common:directory')}</span>
        <IconButton icon={Plus} label={i18n.t('folders:addRootDirectory')} variant="onDark" onClick={() => setCreatingUnder(null)} />
      </div>

      {tree.map((folder) => (
        <FolderNode
          key={folder._id}
          folder={folder}
          depth={0}
          activeFolderId={activeFolderId}
          onSelectFolder={onSelectFolder}
          onAddChild={setCreatingUnder}
          onRename={setRenaming}
          onDelete={setDeleting}
        />
      ))}

      <PromptModal
        open={creatingUnder !== undefined}
        onClose={() => setCreatingUnder(undefined)}
        onSubmit={handleCreate}
        title={i18n.t('folders:createANewFolder')}
        label={i18n.t('folders:directoryName')}
        placeholder={i18n.t('folders:forExampleWork')}
        submitLabel={i18n.t('folders:create')}
        loading={createFolder.isPending}
      />
      <PromptModal
        open={Boolean(renaming)}
        onClose={() => setRenaming(null)}
        onSubmit={handleRename}
        title={i18n.t('folders:renameTheFolder')}
        label={i18n.t('folders:directoryName')}
        initialValue={renaming?.name}
        submitLabel={i18n.t('common:save')}
        loading={updateFolder.isPending}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={i18n.t('folders:confirmDeleteFolder')}
        message={i18n.t('folders:allDataInsideNameAndSubfoldersWillBeMovedToTheTrashThisActionCannotBeUndoneForFolderStructures', { name: deleting?.name })}
        confirmLabel={i18n.t('folders:deleteFolder')}
        loading={deleteFolder.isPending}
      />
    </div>
  );
}

function FolderNode({ folder, depth, activeFolderId, onSelectFolder, onAddChild, onRename, onDelete }) {
  useTranslation();
  const [expanded, setExpanded] = useState(true);
  const hasChildren = folder.children.length > 0;
  const isActive = activeFolderId === folder._id;

  return (
    <div>
      <div
        className={clsx(
          'group flex cursor-pointer items-center gap-1 rounded-card py-1.5 pr-1 text-sm transition-colors',
          isActive ? 'bg-primary/10 text-text-primary' : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => onSelectFolder(folder._id)}
        role="button"
        tabIndex={0}
        aria-label={i18n.t('folders:openFolderName', { name: folder.name })}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onSelectFolder(folder._id);
          }
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((x) => !x);
          }}
          className={clsx('shrink-0 transition-transform', expanded && 'rotate-90', !hasChildren && 'invisible')}
        >
          <ChevronRight size={13} />
        </button>
        {isActive ? <FolderOpen size={14} className="shrink-0 text-primary-hover" /> : <Folder size={14} className="shrink-0" />}
        <span className="truncate">{folder.name}</span>
        <div className="ml-auto hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <Menu
            align="right"
            trigger={<IconButton icon={MoreHorizontal} label={i18n.t('folders:folderOptions')} size={13} variant="onDark" />}
            items={[
              { label: i18n.t('folders:createSubfolders'), icon: FolderPlus, onClick: () => onAddChild(folder._id) },
              { label: i18n.t('common:rename'), icon: Pencil, onClick: () => onRename(folder) },
              { divider: true },
              { label: i18n.t('folders:deleteFolder'), icon: Trash2, danger: true, onClick: () => onDelete(folder) },
            ]}
          />
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderNode
              key={child._id}
              folder={child}
              depth={depth + 1}
              activeFolderId={activeFolderId}
              onSelectFolder={onSelectFolder}
              onAddChild={onAddChild}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
