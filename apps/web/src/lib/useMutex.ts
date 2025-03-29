import { useRef, useState } from "react";

export const useMutex = (): [boolean, (acquirer: string) => () => void] => {
  const [locked, setLocked] = useState(false);
  const lockKey = useRef<string | null>(null);
  const currentAcquirer = useRef<string | null>(null);

  const acquireLock = (acquirer: string) => {
    console.debug("Mutex: Acquiring lock", acquirer);
    currentAcquirer.current = acquirer;
    const newLockKey = Math.random().toString(36).substring(2, 15);

    if (locked) {
      throw new Error("Mutex: Lock already acquired");
    }

    setLocked(true);
    lockKey.current = newLockKey;

    return () => {
      console.debug("Mutex: Releasing lock", currentAcquirer.current);

      if (lockKey.current === newLockKey) {
        setLocked(false);
        lockKey.current = null;
        currentAcquirer.current = null;
      } else {
        console.warn("Mutex: Lock key mismatch", lockKey.current, newLockKey);
      }
    };
  };

  return [locked, acquireLock];
};
