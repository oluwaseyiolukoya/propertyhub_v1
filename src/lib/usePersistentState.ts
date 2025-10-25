import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * Custom hook for persisting state in localStorage across page refreshes
 * @param key - The localStorage key to use
 * @param defaultValue - The default value if no stored value exists
 * @returns [state, setState] tuple just like useState
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Initialize state from localStorage or use default
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        return JSON.parse(storedValue) as T;
      }
    } catch (error) {
      console.warn(`Failed to parse localStorage key "${key}":`, error);
    }
    return defaultValue;
  });

  // Update localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to save to localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}

