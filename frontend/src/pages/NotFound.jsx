import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFound() {
  useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Compass size={40} className="text-text-muted" strokeWidth={1.5} />
      <h1 className="font-display text-3xl font-semibold text-text-primary">{i18n.t('common:pageNotFound')}</h1>
      <p className="max-w-sm text-sm text-text-secondary">{i18n.t('common:thePageYouAreLookingForDoesNotExistOrHasBeenMoved')}</p>
      <Button as={Link} to="/app">
        {i18n.t('common:aboutControlPanel')}
      </Button>
    </div>
  );
}
