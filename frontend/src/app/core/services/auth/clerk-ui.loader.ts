import type { Clerk } from '@clerk/clerk-js';

type ClerkLoadOptions = NonNullable<Parameters<Clerk['load']>[0]>;
type ClerkUiOptions = NonNullable<ClerkLoadOptions['ui']>;
type ClerkWindow = Window & {
  __internal_ClerkUICtor?: ClerkUiOptions['ClerkUI'];
};

let clerkUiLoading: Promise<ClerkUiOptions> | null = null;

export function loadClerkUi(publishableKey: string): Promise<ClerkUiOptions> {
  const clerkWindow = window as ClerkWindow;

  if (clerkWindow.__internal_ClerkUICtor) {
    return Promise.resolve({ ClerkUI: clerkWindow.__internal_ClerkUICtor });
  }

  if (!clerkUiLoading) {
    clerkUiLoading = createClerkUiLoader(publishableKey).catch((error: unknown) => {
      clerkUiLoading = null;
      throw error;
    });
  }

  return clerkUiLoading;
}

function createClerkUiLoader(publishableKey: string): Promise<ClerkUiOptions> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://${getClerkDomain(publishableKey)}/npm/@clerk/ui@1/dist/ui.browser.js`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      const ClerkUI = (window as ClerkWindow).__internal_ClerkUICtor;

      if (!ClerkUI) {
        reject(new Error('A interface do Clerk nao foi carregada.'));
        return;
      }

      resolve({ ClerkUI });
    };
    script.onerror = () => {
      reject(new Error('Nao foi possivel carregar a interface do Clerk.'));
    };
    document.head.appendChild(script);
  });
}

function getClerkDomain(publishableKey: string): string {
  const clerkDomain = publishableKey.split('_')[2];

  if (!clerkDomain) {
    throw new Error('A chave publica do Clerk e invalida.');
  }

  return atob(clerkDomain).slice(0, -1);
}
