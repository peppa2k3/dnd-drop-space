import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import BrandMark from '../common/BrandMark';
import ThemeQuickSwitch from '../theme/ThemeQuickSwitch';

export default function AuthLayout({ title, subtitle, children }) {
  useTranslation();
  return (
    <div className="flex min-h-screen bg-background transition-colors duration-200">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden border-r border-border/40 bg-background-secondary p-10 text-text-primary lg:flex">
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-semibold">DND Drop Space</span>
          </div>
          <ThemeQuickSwitch />
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">{i18n.t('navigation:yourCloudYourSpace')}</p>
          <p className="font-display text-3xl font-medium leading-snug">
            {i18n.t('navigation:allYourNotesLinksPhotosAndFilesInOnePlaceFoundInSeconds')}
          </p>
          <p className="mt-4 text-sm text-text-secondary">{i18n.t('navigation:centralizedPersonalDataRepositoryAccessibleFromAnyDevice')}</p>
        </div>

        <p className="relative z-10 text-xs text-text-muted">DND Drop Space</p>

        <div className="auth-orbit pointer-events-none absolute inset-0" />
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[58%]">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between gap-2 lg:hidden">
            <div className="flex items-center gap-2">
              <BrandMark />
              <span className="font-display text-lg font-semibold text-text-primary">DND Drop Space</span>
            </div>
            <ThemeQuickSwitch />
          </div>

          <h1 className="font-display text-2xl font-semibold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>}

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
