import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useFolders } from '../../hooks/useFolders';
import { buildFolderTree, flattenForSelect } from '../../utils/folderTree';

export default function FolderPickerModal({ open, onClose, currentFolderId = null, onConfirm, loading }) {
  useTranslation();
  const { data: folders = [] } = useFolders();
  const [selected, setSelected] = useState(currentFolderId || '');
  const options = flattenForSelect(buildFolderTree(folders));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={i18n.t('folders:moveToFolder')}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {i18n.t('common:cancel')}
          </Button>
          <Button onClick={() => onConfirm(selected || null)} loading={loading}>
            {i18n.t('folders:move')}
          </Button>
        </>
      }
    >
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-card border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
      >
        <option value="">{i18n.t('common:noDirectoryRoot')}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </Modal>
  );
}
