import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY_PRO_UNLOCKED, STORAGE_KEY_LICENSE } from '../components/ProUpgradeModal';

export function useProLicense() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PRO_UNLOCKED) === 'true';
    } catch {
      return false;
    }
  });

  const [licenseKey, setLicenseKey] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_LICENSE) || '';
    } catch {
      return '';
    }
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Sync state across browser events or storage changes
  useEffect(() => {
    const checkStorage = () => {
      try {
        const unlocked = localStorage.getItem(STORAGE_KEY_PRO_UNLOCKED) === 'true';
        const key = localStorage.getItem(STORAGE_KEY_LICENSE) || '';
        setIsUnlocked(unlocked);
        setLicenseKey(key);
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', checkStorage);
    return () => window.removeEventListener('storage', checkStorage);
  }, []);

  const openModal = useCallback((onSuccess?: () => void) => {
    if (onSuccess) {
      setPendingCallback(() => onSuccess);
    } else {
      setPendingCallback(null);
    }
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setPendingCallback(null);
  }, []);

  const handleUnlockedSuccess = useCallback(() => {
    try {
      const unlocked = localStorage.getItem(STORAGE_KEY_PRO_UNLOCKED) === 'true';
      const key = localStorage.getItem(STORAGE_KEY_LICENSE) || '';
      setIsUnlocked(unlocked);
      setLicenseKey(key);
    } catch {
      setIsUnlocked(true);
    }

    if (pendingCallback) {
      const cb = pendingCallback;
      setPendingCallback(null);
      cb();
    }
  }, [pendingCallback]);

  const lock = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_PRO_UNLOCKED);
      localStorage.removeItem(STORAGE_KEY_LICENSE);
    } catch {
      // ignore
    }
    setIsUnlocked(false);
    setLicenseKey('');
  }, []);

  return {
    isUnlocked,
    licenseKey,
    isModalOpen,
    openModal,
    closeModal,
    handleUnlockedSuccess,
    lock,
  };
}
