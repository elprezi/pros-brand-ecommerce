/**
 * PROS Official Google OAuth 2.0 Client Authentication Engine
 * Connects directly to Google OAuth 2.0 Servers (accounts.google.com)
 */

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  emailVerified?: boolean;
}

// 1. Dynamic App URL (Supports http://localhost:5174 in Dev & https://DOMAINE-PROS in Prod)
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return (import.meta as any).env?.VITE_APP_URL || 'http://localhost:5174';
}

// 2. Official Google OAuth Redirect Callback URI
export function getGoogleOAuthRedirectUri(): string {
  return `${getAppBaseUrl()}/auth/callback/google`;
}

// 3. Retrieve Google Client ID from Environment, LocalStorage, or Settings
export function getGoogleClientId(): string {
  const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (envId && envId.trim().length > 10 && !envId.includes('pros-official-brand')) {
    return envId.trim();
  }
  if (typeof localStorage !== 'undefined') {
    const localId = localStorage.getItem('pros_google_client_id');
    if (localId && localId.trim().length > 10) {
      return localId.trim();
    }
  }
  return '';
}

// 4. Check if a valid Google Client ID is configured
export function isGoogleClientIdConfigured(): boolean {
  const id = getGoogleClientId();
  return Boolean(id && id.length > 10);
}

// 5. Persist Google Client ID in Local Storage
export function saveGoogleClientId(clientId: string): void {
  if (typeof localStorage !== 'undefined' && clientId) {
    localStorage.setItem('pros_google_client_id', clientId.trim());
  }
}

// 6. Build Authentic Google OAuth 2.0 Web Authorization URL
export function buildGoogleOAuthUrl(redirectTarget: string = '/account', customClientId?: string): string {
  const clientId = customClientId || getGoogleClientId();

  const redirectUri = getGoogleOAuthRedirectUri();
  
  // Encode state object with destination page and CSRF nonce
  const stateData = {
    redirectTarget: redirectTarget.startsWith('/') ? redirectTarget : '/account',
    nonce: Math.random().toString(36).substring(2, 10),
  };
  const state = encodeURIComponent(btoa(JSON.stringify(stateData)));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token id_token',
    scope: 'openid email profile',
    prompt: 'select_account', // MANDATORY: Forces browser to open standard Google account chooser window
    state: state,
    nonce: stateData.nonce,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// 7. Trigger Real Google OAuth Redirect
export function initiateGoogleOAuthRedirect(redirectTarget: string = '/account', customClientId?: string): void {
  const oauthUrl = buildGoogleOAuthUrl(redirectTarget, customClientId);
  if (typeof window !== 'undefined') {
    window.location.href = oauthUrl;
  }
}

// 8. Parse Google OAuth Token & Profile Response from URL
export async function parseGoogleOAuthCallback(): Promise<{
  success: boolean;
  profile?: GoogleUserProfile;
  redirectTarget?: string;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Environnement invalide.' };
  }

  const hash = window.location.hash.substring(1);
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(hash);

  // Check error parameters from Google OAuth
  const authError = searchParams.get('error') || hashParams.get('error');
  if (authError) {
    if (authError === 'access_denied') {
      return { success: false, error: 'Connexion Google annulée.' };
    }
    return { success: false, error: 'Impossible de se connecter avec Google. Veuillez réessayer.' };
  }

  // Retrieve Access Token or ID Token
  const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
  const idToken = hashParams.get('id_token') || searchParams.get('id_token');
  const stateRaw = searchParams.get('state') || hashParams.get('state');

  let redirectTarget = '/account';
  if (stateRaw) {
    try {
      const decodedState = JSON.parse(atob(decodeURIComponent(stateRaw)));
      if (decodedState.redirectTarget) {
        redirectTarget = decodedState.redirectTarget;
      }
    } catch (e) {
      // fallback
    }
  }

  // Case A: Access Token provided -> Fetch Google UserInfo Endpoint
  if (accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          redirectTarget,
          profile: {
            googleId: data.sub || `google-${Date.now()}`,
            email: data.email,
            firstName: data.given_name || data.name?.split(' ')[0] || 'Membre',
            lastName: data.family_name || data.name?.split(' ').slice(1).join(' ') || 'PROS',
            avatar: data.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            emailVerified: data.email_verified,
          },
        };
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du profil Google:', err);
    }
  }

  // Case B: Decode JWT ID Token
  if (idToken) {
    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const data = JSON.parse(jsonPayload);
      if (data.email) {
        return {
          success: true,
          redirectTarget,
          profile: {
            googleId: data.sub || `google-${Date.now()}`,
            email: data.email,
            firstName: data.given_name || data.name?.split(' ')[0] || 'Membre',
            lastName: data.family_name || data.name?.split(' ').slice(1).join(' ') || 'PROS',
            avatar: data.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            emailVerified: data.email_verified,
          },
        };
      }
    } catch (err) {
      console.error('Erreur décodage JWT Google:', err);
    }
  }

  return { success: false, error: 'Échec de l\'authentification Google. Jeton d\'accès manquant.' };
}
