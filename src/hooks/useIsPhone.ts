import { useEffect, useState } from 'react';

const PHONE_QUERY = '(max-width: 767px)';

const getMatch = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(PHONE_QUERY).matches
    : false;

/**
 * Returns true when the viewport is a phone-sized screen (below 768px).
 * Tablets (768px and up) are treated as supported and report false.
 */
export const useIsPhone = () => {
  const [isPhone, setIsPhone] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(PHONE_QUERY);
    const handleChange = () => setIsPhone(query.matches);
    handleChange();
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return isPhone;
};
