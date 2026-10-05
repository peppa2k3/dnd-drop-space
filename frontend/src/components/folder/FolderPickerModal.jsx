import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useFolders } from '../../hooks/useFolders';
import { buildFolderTree, flattenForSelect } from '../../utils/folderTree';

export default function FolderPickerModal({ open, onClose, currentFolderId = null, onConfirm, loading }) {
  const { data: folders = [] } = useFolders();
  const [selected, setSelected] = useState(currentFolderId || '');
  const options = flattenForSelect(buildFolderTree(folders));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Di chuyển đến thư mục"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={() => onConfirm(selected || null)} loading={loading}>
            Di chuyển
          </Button>
        </>
      }
    >
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-card border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
      >
        <option value="">— Không có thư mục (gốc) —</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </Modal>
  );
}
