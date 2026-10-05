import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = i18n.t('common:confirm'),
  message,
  confirmLabel = i18n.t('common:confirm'),
  cancelLabel = i18n.t('common:cancel'),
  variant = 'danger',
  loading = false,
}) {
  useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant === 'danger' ? 'dangerSolid' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">{message}</p>
    </Modal>
  );
}
