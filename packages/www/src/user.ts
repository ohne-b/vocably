import type { ResourcesConfig } from '@aws-amplify/core';
import type { Result } from '@vocably/model';

/**
 * Amplify and `@vocably/api` are the heaviest dependencies of the website, and
 * most visitors never need them: they are only used once a page actually asks
 * about the session or talks to the deck endpoints. Both are therefore pulled
 * in with dynamic `import()`, which webpack splits into chunks of their own,
 * loaded on the first call rather than with the entry bundle.
 *
 * Only the types are imported statically, as those are erased at compile time.
 */
type AuthModule = typeof import('aws-amplify/auth');

/**
 * Mirrors `packages/app/src/auth-config.ts`, without the `@vocably/pontis`
 * storage: the website only reads the session, it is not a bridge between the
 * extension and Cognito. The app is served from the same origin as the website
 * (`vocably.pro/app` and `vocably.pro`), and `AppAuthStorage` keeps its items
 * in `localStorage`, so Amplify's default storage already sees the tokens the
 * app has written.
 *
 * The OAuth part of the app config is left out as well: signing in happens in
 * the app, the website never starts a redirect flow.
 */
const authConfig = (
  userPoolId: string,
  userPoolClientId: string
): ResourcesConfig['Auth'] => ({
  Cognito: {
    userPoolId,
    userPoolClientId,
  },
});

let authPromise: Promise<AuthModule> | null = null;

/**
 * Loads Amplify, configures it, and resolves with the auth module.
 *
 * The Cognito pool is injected per page by `layout.handlebars`, so every entry
 * point that touches the session has to check it is actually there. A page
 * without it resolves to `null` and nothing is downloaded.
 */
const getAuth = (): Promise<AuthModule | null> => {
  const userPoolId = window['authUserPoolId'];
  const userPoolClientId = window['authUserPoolWebClientId'];

  if (!userPoolId || !userPoolClientId) {
    return Promise.resolve(null);
  }

  if (authPromise === null) {
    authPromise = Promise.all([
      import('aws-amplify'),
      import('aws-amplify/auth'),
    ])
      .then(([{ Amplify }, auth]) => {
        Amplify.configure({ Auth: authConfig(userPoolId, userPoolClientId) });

        return auth;
      })
      .catch((e) => {
        // A chunk that failed to load, most likely a hiccup on the way, must
        // not keep every later call from trying again.
        authPromise = null;

        throw e;
      });
  }

  return authPromise;
};

/**
 * Whether the visitor is signed in to Vocably.
 *
 * A signed out visitor is a regular `false` answer. Only a missing Cognito
 * configuration or an unexpected Amplify failure comes back as an error.
 */
export const isLoggedIn = async (): Promise<Result<boolean>> => {
  try {
    const auth = await getAuth();

    if (auth === null) {
      return {
        success: false,
        errorCode: 'AUTH_UNABLE_TO_GET_USER_SESSION',
        reason: 'The Cognito user pool is not configured on this page.',
      };
    }

    await auth.getCurrentUser();

    return {
      success: true,
      value: true,
    };
  } catch (e) {
    // Amplify reports a missing session by throwing, which is not an error
    // here: it is the answer.
    if (e instanceof Error && e.name === 'UserUnAuthenticatedException') {
      return {
        success: true,
        value: false,
      };
    }

    return {
      success: false,
      errorCode: 'AUTH_UNABLE_TO_GET_USER_SESSION',
      reason: 'Unable to find out whether the user is signed in.',
      extra: e,
    };
  }
};

/**
 * The session of the current visitor, or `null` when this page has no Cognito
 * configuration, Amplify could not be loaded, or the lookup failed.
 */
const getSession = async () => {
  const auth = await getAuth().catch(() => null);

  if (auth === null) {
    return null;
  }

  return auth.fetchAuthSession().catch(() => null);
};

/**
 * The following three mirror `packages/extension-service-worker/src/session.ts`.
 * Amplify v6 resolves `fetchAuthSession()` with an empty session when the user
 * is signed out rather than rejecting, so the tokens are checked explicitly.
 */
export const getIdToken = async (): Promise<string> => {
  const session = await getSession();

  return session?.tokens?.idToken?.toString() ?? '';
};

export const isSignedIn = async (): Promise<boolean> => {
  const session = await getSession();

  return !!session?.tokens?.accessToken;
};

export const isInPaidGroup = async (): Promise<boolean> => {
  const session = await getSession();
  const groups = session?.tokens?.accessToken?.payload['cognito:groups'];

  return Array.isArray(groups) && groups.includes('paid');
};

let apiPromise: Promise<void> | null = null;

/**
 * Points `@vocably/api` at the same endpoints the rest of the site uses, with
 * the visitor's Cognito ID token, so the authenticated deck endpoints can be
 * called from here.
 *
 * Resolves once the library is loaded and configured: an endpoint called
 * before that would have no base url to call.
 */
export const configureDeckApi = (): Promise<void> => {
  if (apiPromise === null) {
    apiPromise = import('@vocably/api')
      .then(({ configureApi }) => {
        configureApi({
          baseUrl: window['apiBaseUrl'],
          publicBaseUrl: window['publicApiBaseUrl'],
          // Both are declared by `ApiOptions` but never read by `@vocably/api`.
          region: '',
          cardsBucket: '',
          getJwtToken: getIdToken,
        });
      })
      .catch((e) => {
        apiPromise = null;

        throw e;
      });
  }

  return apiPromise;
};

/**
 * Signing in happens in the app, in a separate tab. There is no message back to
 * this page, so the session is re-checked whenever the visitor returns to it.
 *
 * Only useful while the visitor is signed out: it fires on the first focus that
 * finds a session, and never again.
 */
export const onSignedIn = (callback: () => void): void => {
  let alreadySignedIn = false;

  window.addEventListener('focus', async () => {
    if (alreadySignedIn) {
      return;
    }

    const result = await isLoggedIn();

    if (result.success && result.value) {
      alreadySignedIn = true;
      callback();
    }
  });
};
