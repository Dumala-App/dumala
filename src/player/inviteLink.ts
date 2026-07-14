export const buildPlayerInviteLink = (joinCode: string, locationLike: Pick<Location, 'origin' | 'pathname'> = window.location) => {
  const code = joinCode.trim().toUpperCase();
  const basePath = `${locationLike.origin}${locationLike.pathname}`;
  return code ? `${basePath}#/player?join=${encodeURIComponent(code)}` : `${basePath}#/player`;
};

export const readPlayerInviteCodeFromHash = (
  hash = typeof window === 'undefined' ? '' : window.location.hash
) => {
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return '';

  const params = new URLSearchParams(hash.slice(queryStart + 1));
  return params.get('join')?.trim().toUpperCase() ?? '';
};

const PLAYER_INVITE_STORAGE_KEY = 'dumala_pending_player_invite';
const PLAYER_INVITE_TTL_MS = 24 * 60 * 60 * 1000;
type PlayerInviteStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

interface StoredPlayerInvite {
  code: string;
  storedAt: number;
}

const normalizeInviteCode = (code: string) => code.trim().toUpperCase();

export const rememberPlayerInviteCode = (
  code: string,
  storage: PlayerInviteStorage | null = typeof window === 'undefined' ? null : window.localStorage
) => {
  const normalized = normalizeInviteCode(code);
  if (!storage || !normalized) return '';
  const payload: StoredPlayerInvite = { code: normalized, storedAt: Date.now() };
  storage.setItem(PLAYER_INVITE_STORAGE_KEY, JSON.stringify(payload));
  return normalized;
};

export const rememberPlayerInviteCodeFromHash = (
  hash = typeof window === 'undefined' ? '' : window.location.hash
) => {
  const code = readPlayerInviteCodeFromHash(hash);
  return code ? rememberPlayerInviteCode(code) : '';
};

export const readRememberedPlayerInviteCode = (
  storage: PlayerInviteStorage | null = typeof window === 'undefined' ? null : window.localStorage
) => {
  if (!storage) return '';
  const raw = storage.getItem(PLAYER_INVITE_STORAGE_KEY);
  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPlayerInvite>;
    const code = typeof parsed.code === 'string' ? normalizeInviteCode(parsed.code) : '';
    const storedAt = typeof parsed.storedAt === 'number' ? parsed.storedAt : 0;
    if (!code || !storedAt || Date.now() - storedAt > PLAYER_INVITE_TTL_MS) {
      storage.removeItem(PLAYER_INVITE_STORAGE_KEY);
      return '';
    }
    return code;
  } catch {
    storage.removeItem(PLAYER_INVITE_STORAGE_KEY);
    return '';
  }
};

export const clearRememberedPlayerInviteCode = (
  storage: Pick<Storage, 'removeItem'> | null = typeof window === 'undefined' ? null : window.localStorage
) => {
  storage?.removeItem(PLAYER_INVITE_STORAGE_KEY);
};

export const readInitialPlayerInviteCode = () =>
  readPlayerInviteCodeFromHash() || readRememberedPlayerInviteCode();
