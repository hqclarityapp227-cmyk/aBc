import { useState, useEffect, useCallback } from 'react';
import {
  checkIsProUnlocked,
  revokeLicense,
  STORAGE_KEY_LICENSE,
} from '../engine/licenseValidator';

export function useProLicense() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return checkIsProUnlocked();
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
      const unlocked = checkIsProUnlocked();
      let key = '';
      try {
        key = localStorage.getItem(STORAGE_KEY_LICENSE) || '';
      } catch {
        // ignore
      }
      setIsUnlocked(unlocked);
      setLicenseKey(key);
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
    const unlocked = checkIsProUnlocked();
    let key = '';
    try {
      key = localStorage.getItem(STORAGE_KEY_LICENSE) || '';
    } catch {
      // ignore
    }
    setIsUnlocked(unlocked);
    setLicenseKey(key);

    if (pendingCallback) {
      const cb = pendingCallback;
      setPendingCallback(null);
      cb();
    }
  }, [pendingCallback]);

  const lock = useCallback(() => {
    revokeLicense();
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

