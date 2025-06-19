/**
 * @file This file contains a custom React hook for debouncing a value.
 * This is useful for delaying an action until a certain amount of time
 * has passed without the value changing (e.g., auto-saving a form).
 */
import { useEffect, useState } from 'react';

/**
 * A custom React hook that debounces a value.
 * @template T The type of the value to debounce.
 * @param value The value to debounce.
 * @param delay The debounce delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
} 