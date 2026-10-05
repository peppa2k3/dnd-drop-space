import { useState } from 'react';
import { Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n/languages';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSelector() {
  const { t } = useTranslation('settings');
  const { language, setLanguage, isSaving } = useLanguage();
  const [search, setSearch] = useState('');
  const visible = LANGUAGES.filter(({ code, name, englishName }) =>
    `${code} ${name} ${englishName}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));

  return <section className="catalog-card p-5" aria-labelledby="language-title">
    <div className="mb-4 flex items-center gap-2">
      <Languages size={19} className="text-primary-hover" aria-hidden="true" />
      <div>
        <h2 id="language-title" className="font-display text-lg font-semibold">{t('language')}</h2>
        <p className="text-sm text-text-secondary">{t('languageDescription')}</p>
      </div>
    </div>
    <label className="mb-3 block text-sm">
      <span className="sr-only">{t('searchLanguage')}</span>
      <input value={search} onChange={(event) => setSearch(event.target.value)}
        placeholder={t('searchLanguage')} className="w-full rounded-card border border-border bg-surface px-3 py-2" />
    </label>
    <div role="radiogroup" aria-label={t('language')} className="grid gap-2 sm:grid-cols-2">
      {visible.map(({ code, name, shortName }) => <label key={code}
        className={`flex cursor-pointer items-center gap-3 rounded-card border px-3 py-2.5 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-primary ${language === code ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-hover'}`}>
        <input type="radio" name="language" value={code} checked={language === code} disabled={isSaving}
          onChange={() => void setLanguage(code)} className="sr-only" />
        <span aria-hidden="true" className="w-9 shrink-0 text-center text-xs font-semibold text-primary-hover">{shortName}</span>
        <span className="min-w-0 grow text-sm">{name}</span>
        {language === code && <Check size={16} className="shrink-0 text-primary-hover" aria-hidden="true" />}
      </label>)}
    </div>
    {visible.length === 0 && <p className="mt-3 text-sm text-text-secondary">{t('noLanguageFound')}</p>}
    <p className="mt-3 text-xs text-text-muted" role="status">
      {isSaving ? t('savingLanguage') : t('currentLanguage', { language: LANGUAGES.find(({ code }) => code === language)?.name })}
    </p>
  </section>;
}
