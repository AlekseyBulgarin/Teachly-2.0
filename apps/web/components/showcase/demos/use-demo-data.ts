"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useDemoData<T>(loader: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = ++requestRef.current;
    controllerRef.current = controller;
    setLoading(true);
    setFailed(false);
    void loader(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted && requestId === requestRef.current) setData(value);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && requestId === requestRef.current && !(error instanceof DOMException && error.name === "AbortError")) {
          setFailed(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId === requestRef.current) setLoading(false);
      });
  }, [loader]);

  useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  return { data, loading, failed, retry: load };
}

