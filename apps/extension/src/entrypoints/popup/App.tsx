import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../i18n';

function App() {
  const { t } = useTranslation();
  const { currentLanguage, supportedLanguages, setLanguage, getLanguageName } = useLanguage();

  return (
    <div style={{ padding: '20px', minWidth: '300px' }}>
      <h1>{t('wallet.onboarding.title1')}</h1>
      <p>{t('wallet.onboarding.content1')}</p>

      <div style={{ marginTop: '20px' }}>
        <h3>{t('settings.languages.title')}</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {supportedLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                padding: '8px 16px',
                backgroundColor: currentLanguage === lang ? '#007bff' : '#f0f0f0',
                color: currentLanguage === lang ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {getLanguageName(lang)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>{t('settings.title')}</h3>
        <ul>
          <li>{t('settings.address_book')}</li>
          <li>{t('settings.security')}</li>
          <li>{t('settings.notifications')}</li>
          <li>{t('settings.trusted_apps')}</li>
          <li>{t('settings.help_support')}</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>{t('actions.send')} / {t('actions.receive')}</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ padding: '8px 16px' }}>{t('actions.send')}</button>
          <button style={{ padding: '8px 16px' }}>{t('actions.receive')}</button>
        </div>
      </div>
    </div>
  );
}

export default App;
