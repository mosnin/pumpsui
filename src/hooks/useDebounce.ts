'use client'

import { useState, useEffect } from 'react'

/**
 * Debounce a value — returns the latest value only after `delay` ms of
 * inactivity.  Useful for preventing excessive API calls while the user
 * is still typing.
 *
 * @param value - The value to debounce (any type T)
 * @param delay - Debounce delay in milliseconds
 * @returns The debounced value (lags `value` by up to `delay` ms)
 *
 * @example
 * const debouncedQuery = useDebounce(searchQuery, 400)
 * // fires a fetch only when the user pauses typing for 400ms
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
