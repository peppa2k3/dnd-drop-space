import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from '../common/IconButton';
import { formatNumber } from '../../utils/format';

export default function Pagination({ meta, onPageChange }) {
  useTranslation();
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border pt-4 font-mono text-xs text-text-secondary">
      <span>
        {i18n.t('common:pagination', { count: meta.total, page: formatNumber(meta.page), pages: formatNumber(meta.totalPages), total: formatNumber(meta.total) })}
      </span>
      <div className="flex items-center gap-1">
        <IconButton
          icon={ChevronLeft}
          label={i18n.t('files:previousPage')}
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(meta.page - 1)}
        />
        <IconButton
          icon={ChevronRight}
          label={i18n.t('files:nextPage')}
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        />
      </div>
    </div>
  );
}
