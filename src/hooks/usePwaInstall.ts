import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const isStandaloneDisplay = () =>
  window.matchMedia('(display-mode: standalone)').matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

const isAppleMobileDevice = () => {
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent)
    || (platform === 'macintel' && navigator.maxTouchPoints > 1);
};

export const usePwaInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showAppleInstructions, setShowAppleInstructions] = useState(false);
  const [installMessage, setInstallMessage] = useState('');
  const isAppleMobile = typeof window !== 'undefined' && isAppleMobileDevice();

  useEffect(() => {
    setIsInstalled(isStandaloneDisplay());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallMessage('');
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setInstallMessage('Dumala is installed and ready to launch from your device.');
    };
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const handleDisplayMode = () => setIsInstalled(isStandaloneDisplay());

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    displayMode.addEventListener('change', handleDisplayMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      displayMode.removeEventListener('change', handleDisplayMode);
    };
  }, []);

  useEffect(() => {
    if (!installMessage) return;
    const timeoutId = window.setTimeout(() => setInstallMessage(''), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [installMessage]);

  const requestInstall = useCallback(async () => {
    if (isInstalled) return;
    if (isAppleMobile) {
      setShowAppleInstructions(true);
      return;
    }
    if (!installPrompt) {
      setInstallMessage('Installation is not available in this browser yet. Try Chrome or Edge, or use your browser menu.');
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setInstallMessage(
      choice.outcome === 'accepted'
        ? 'Dumala installation started.'
        : 'Installation was cancelled. You can install later.'
    );
  }, [installPrompt, isAppleMobile, isInstalled]);

  return {
    installMessage,
    isAppleMobile,
    isInstalled,
    requestInstall,
    setShowAppleInstructions,
    showAppleInstructions
  };
};
