const PLAYER_PLACEHOLDERS: Record<string, string> = {
  Forward: '/placeholders/forward-placeholder.png',
  Midfielder: '/placeholders/midfielder-placeholder.png',
  Defender: '/placeholders/defender-placeholder.png',
  Goalkeeper: '/placeholders/goalkeeper-placeholder.png',
};

export const STAFF_PLACEHOLDER = '/placeholders/staff-placeholder.png';

export const getPlayerPlaceholder = (position: string): string => {
  return PLAYER_PLACEHOLDERS[position] || PLAYER_PLACEHOLDERS.Forward;
};
