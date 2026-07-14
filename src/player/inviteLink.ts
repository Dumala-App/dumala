export const buildPlayerInviteLink = (joinCode: string, locationLike: Pick<Location, 'origin' | 'pathname'> = window.location) => {
  const code = joinCode.trim().toUpperCase();
  const basePath = `${locationLike.origin}${locationLike.pathname}`;
  return code ? `${basePath}#/player?join=${encodeURIComponent(code)}` : `${basePath}#/player`;
};

export const readPlayerInviteCodeFromHash = (hash = window.location.hash) => {
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return '';

  const params = new URLSearchParams(hash.slice(queryStart + 1));
  return params.get('join')?.trim().toUpperCase() ?? '';
};
