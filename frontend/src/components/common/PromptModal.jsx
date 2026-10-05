import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

export default function PromptModal({
  open,
  onClose,
  onSubmit,
  title,
  label,
  placeholder,
  initialValue = '',
  submitLabel = i18n.t('common:save'),
  loading = false,
}) {
  useTranslation();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {i18n.t('common:cancel')}
          </Button>
          <Button type="submit" loading={loading} disabled={!value.trim()}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
