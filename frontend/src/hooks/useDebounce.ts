import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delayMs = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}

/* This is used to start a new request only when the users stops writing for more than 300 milliseconds
   This way, we don't overload the app with requests (by not doing this we would send a request for each letter)
   and we also have a more visually pleasant search
*/
