import { useEffect, useRef, useState } from 'react';
import { authApi } from '../../api/auth.api';

export default function GoogleSignInButton({ onCredential }) {
  const container = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function setup() {
      try {
        const { clientId } = await authApi.googleConfig();
        if (!active || !clientId) return;
        if (!window.google?.accounts?.id) {
          await new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-google-signin]');
            if (existing) {
              existing.addEventListener('load', resolve, { once: true });
              existing.addEventListener('error', reject, { once: true });
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.dataset.googleSignin = 'true';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        if (!active || !container.current) return;
        window.google.accounts.id.initialize({ client_id: clientId,
          callback: (response) => onCredential(response.credential) });
        container.current.replaceChildren();
        window.google.accounts.id.renderButton(container.current,
          { theme: 'outline', size: 'large', width: 320, text: 'continue_with' });
      } catch { if (active) setError('Không thể tải đăng nhập Google.'); }
    }
    setup();
    return () => { active = false; };
  }, [onCredential]);
  return <div className="flex flex-col items-center gap-2">
    <div ref={container} /><p role="alert" className="text-sm text-brick">{error}</p>
  </div>;
}
