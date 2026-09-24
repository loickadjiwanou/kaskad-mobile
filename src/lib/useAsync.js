import { useCallback, useEffect, useRef, useState } from "react";

/** Petit hook de chargement : { data, error, loading, refreshing, reload, refresh }. */
export function useAsync(fn, deps = []) {
    const [state, setState] = useState({ data: null, error: null, loading: true, refreshing: false });
    const seq = useRef(0);

    const run = useCallback(async (mode = "loading") => {
        const id = ++seq.current;
        setState((s) => ({ ...s, error: null, [mode]: true }));
        try {
            const data = await fn();
            if (id === seq.current) setState({ data, error: null, loading: false, refreshing: false });
        } catch (error) {
            if (id === seq.current) setState((s) => ({ ...s, error, loading: false, refreshing: false }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        run();
    }, [run]);

    return { ...state, reload: () => run("loading"), refresh: () => run("refreshing") };
}
