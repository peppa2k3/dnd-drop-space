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
          addToast('Đã tạo thư mục');
          setCreatingUnder(undefined);
        },
        onError: (err) => addToast(err?.response?.data?.message || 'Tạo thư mục thất bại', 'error'),
      }
    );
  };

  const handleRename = (name) => {
    updateFolder.mutate(
      { id: renaming._id, payload: { name } },
      {
        onSuccess: () => {
          addToast('Đã đổi tên thư mục');
          setRenaming(null);
        },
        onError: (err) => addToast(err?.response?.data?.message || 'Đổi tên thất bại', 'error'),
      }
    );
  };

  const handleDelete = () => {
    deleteFolder.mutate(deleting._id, {
      onSuccess: () => {
        addToast('Đã xóa thư mục, dữ liệu bên trong đã chuyển vào Thùng rác');
        setDeleting(null);
        if (activeFolderId === deleting._id) onSelectFolder(null);
      },
      onError: (err) => addToast(err?.response?.data?.message || 'Xóa thư mục thất bại', 'error'),
    });
  };

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="font-mono text-[11px] uppercase tracking-wider text-paper/50">Thư mục</span>
        <IconButton icon={Plus} label="Thêm thư mục gốc" variant="onDark" onClick={() => setCreatingUnder(null)} />
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
        title="Tạo thư mục mới"
        label="Tên thư mục"
        placeholder="Ví dụ: Công việc"
        submitLabel="Tạo"
        loading={createFolder.isPending}
      />
      <PromptModal
        open={Boolean(renaming)}
        onClose={() => setRenaming(null)}
        onSubmit={handleRename}
        title="Đổi tên thư mục"
        label="Tên thư mục"
        initialValue={renaming?.name}
        submitLabel="Lưu"
        loading={updateFolder.isPending}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Xóa thư mục?"
        message={`Toàn bộ dữ liệu bên trong "${deleting?.name}" (và các thư mục con) sẽ được chuyển vào Thùng rác. Hành động này không thể hoàn tác đối với cấu trúc thư mục.`}
        confirmLabel="Xóa thư mục"
        loading={deleteFolder.isPending}
      />
    </div>
  );
}

function FolderNode({ folder, depth, activeFolderId, onSelectFolder, onAddChild, onRename, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = folder.children.length > 0;
  const isActive = activeFolderId === folder._id;

  return (
    <div>
      <div
        className={clsx(
          'group flex cursor-pointer items-center gap-1 rounded-card py-1.5 pr-1 text-sm transition-colors',
          isActive ? 'bg-white/10 text-paper' : 'text-paper/75 hover:bg-white/5 hover:text-paper'
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => onSelectFolder(folder._id)}
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
        {isActive ? <FolderOpen size={14} className="shrink-0 text-gold" /> : <Folder size={14} className="shrink-0" />}
        <span className="truncate">{folder.name}</span>
        <div className="ml-auto hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <Menu
            align="right"
            trigger={<IconButton icon={MoreHorizontal} label="Tùy chọn thư mục" size={13} variant="onDark" />}
            items={[
              { label: 'Tạo thư mục con', icon: FolderPlus, onClick: () => onAddChild(folder._id) },
              { label: 'Đổi tên', icon: Pencil, onClick: () => onRename(folder) },
              { divider: true },
              { label: 'Xóa thư mục', icon: Trash2, danger: true, onClick: () => onDelete(folder) },
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
