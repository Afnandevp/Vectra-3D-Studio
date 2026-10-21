import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if component has mounted on the client.
 * Prevents SSR / Hydration mismatch errors in Web3 components.
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

export default useIsMounted;
