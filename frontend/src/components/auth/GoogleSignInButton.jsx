import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { authApi } from '../../api/auth.api';

let googleScriptPromise;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.dataset.googleSignin = 'true';
      script.onload = () => window.google?.accounts?.id
        ? resolve() : reject(new Error('Google Identity Services unavailable'));
      script.onerror = () => reject(new Error('Google Identity Services failed to load'));
      document.head.appendChild(script);
    }).catch((error) => {
      document.querySelector('script[data-google-signin]')?.remove();
      googleScriptPromise = null;
      throw error;
    });
  }
  return googleScriptPromise;
}

export default function GoogleSignInButton({ onCredential }) {
  useTranslation();
  const container = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const [error, setError] = useState('');
  useEffect(() => { onCredentialRef.current = onCredential; }, [onCredential]);
  useEffect(() => {
    let active = true;
    async function setup() {
      try {
        const { clientId } = await authApi.googleConfig();
        if (!active) return;
        if (!clientId) { setError(i18n.t('auth:googleSignInIsNotConfigured')); return; }
        await loadGoogleScript();
        if (!active || !container.current) return;
        window.google.accounts.id.initialize({ client_id: clientId,
          callback: (response) => onCredentialRef.current(response.credential) });
        container.current.replaceChildren();
        window.google.accounts.id.renderButton(container.current,
          { theme: 'outline', size: 'large', width: 320, text: 'continue_with' });
      } catch { if (active) setError(i18n.t('auth:unableToLoadGoogleSignIn')); }
    }
    setup();
    return () => { active = false; };
  }, []);
  return <div className="flex flex-col items-center gap-2">
    <div ref={container} />{error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </div>;
}
