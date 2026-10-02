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
  submitLabel = 'Lưu',
  loading = false,
}) {
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
            Hủy
          </Button>
          <Button type="submit" loading={loading} disabled={!value.trim()}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
