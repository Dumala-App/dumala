import React, { lazy, Suspense, useEffect, useState } from 'react';

const LandingPage = lazy(() => import('./components/LandingPage'));
const WorkspaceApp = lazy(() => import('./App'));
const PublicTeamView = lazy(() => import('./components/team/PublicTeamView'));
const DevlogPage = lazy(() => import('./components/DevlogPage'));

const APP_AUTH_PENDING_KEY = 'dumala_pending_app_auth_redirect';
const APP_AUTH_PENDING_TTL_MS = 10 * 60 * 1000;
const DEFAULT_PWA_METADATA = {
  manifest: '/manifest.webmanifest',
  appleIcon: '/dumala-pwa-192.png',
  appName: 'Dumala',
  themeColor: '#07111f'
};
const PLAYER_PWA_METADATA = {
  manifest: '/player-manifest.webmanifest',
  appleIcon: '/dumala-player-pwa-192.png',
  appName: 'Dumala Player',
  themeColor: '#081425'
};

export const getRootRoute = (hash = typeof window === 'undefined' ? '' : window.location.hash) =>
  hash.replace(/^#\/?/, '');

export const isPlayerRootRoute = (route: string) =>
  route === 'player' || route.startsWith('player/') || route.startsWith('player?');

// Public team page (#/t/<slug>): a login-free showcase page served from its own
// small chunk so visitors never download the workspace app. Feature-flagged so
// it stays dark until an operator flips VITE_DUMALA_TEAM_PAGE_ENABLED.
export const isPublicTeamRootRoute = (route: string) =>
  route === 't' || route.startsWith('t/') || route.startsWith('t?');

// Public devlog (#/devlog): the workspace's Updates tab on the marketing site,
// no login. Its own chunk, so the landing page does not carry the changelog.
export const isDevlogRootRoute = (route: string) => route === 'devlog';

// The landing page also answers on #/landing/<section>, which is how the devlog
// links back to a marketing section: there is nothing to scroll to until the
// landing page has mounted, so the target rides along in the route.
export const isLandingRootRoute = (route: string) =>
  route === '' || route === 'landing' || route.startsWith('landing/');

export const isTeamPageEnabled = (
  env: Record<string, string | boolean | undefined> = import.meta.env
) => env.VITE_DUMALA_TEAM_PAGE_ENABLED === 'true';

export const getPwaMetadataForRoute = (route: string) =>
  isPlayerRootRoute(route) ? PLAYER_PWA_METADATA : DEFAULT_PWA_METADATA;

export const applyPwaMetadataForRoute = (route: string, doc: Document = document) => {
  const metadata = getPwaMetadataForRoute(route);
  const manifestLink = doc.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  const appleIconLink = doc.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  const appNameMeta = doc.querySelector<HTMLMetaElement>('meta[name="application-name"]');
  const appleTitleMeta = doc.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
  const themeColorMeta = doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  manifestLink?.setAttribute('href', metadata.manifest);
  appleIconLink?.setAttribute('href', metadata.appleIcon);
  appNameMeta?.setAttribute('content', metadata.appName);
  appleTitleMeta?.setAttribute('content', metadata.appName);
  themeColorMeta?.setAttribute('content', metadata.themeColor);
  doc.title = metadata.appName;
};

export const shouldLoadWorkspace = (
  route: string,
  search = typeof window === 'undefined' ? '' : window.location.search,
  pendingStartedAt = typeof window === 'undefined'
    ? null
    : window.localStorage.getItem(APP_AUTH_PENDING_KEY)
) => {
  if (isPublicTeamRootRoute(route)) return false;
  if (isDevlogRootRoute(route)) return false;
  if (!isLandingRootRoute(route)) return true;
  const authTarget = new URLSearchParams(search).get('dumalaAuth');
  if (authTarget === 'app' || authTarget === 'player' || authTarget === 'league') return true;

  const startedAt = Number(pendingStartedAt);
  if (!Number.isFinite(startedAt) || startedAt <= 0) return false;
  if (Date.now() - startedAt <= APP_AUTH_PENDING_TTL_MS) return true;

  if (typeof window !== 'undefined') window.localStorage.removeItem(APP_AUTH_PENDING_KEY);
  return false;
};

const RouteLoadingFallback = ({ label }: { label: string }) => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-screen items-center justify-center bg-[#020713] px-6 text-center text-sm font-semibold text-slate-300"
  >
    Loading {label}...
  </div>
);

export default function RootRouter() {
  const [route, setRoute] = useState(getRootRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getRootRoute());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    applyPwaMetadataForRoute(route);
  }, [route]);

  if (isPublicTeamRootRoute(route) && isTeamPageEnabled()) {
    return (
      <Suspense fallback={<RouteLoadingFallback label="team page" />}>
        <PublicTeamView />
      </Suspense>
    );
  }

  if (isDevlogRootRoute(route)) {
    return (
      <Suspense fallback={<RouteLoadingFallback label="the devlog" />}>
        <DevlogPage />
      </Suspense>
    );
  }

  if (!shouldLoadWorkspace(route)) {
    return (
      <Suspense fallback={<RouteLoadingFallback label="Dumala" />}>
        <LandingPage />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<RouteLoadingFallback label="your workspace" />}>
      <WorkspaceApp />
    </Suspense>
  );
}
