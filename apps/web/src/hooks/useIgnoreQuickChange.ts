import { useEffect, useState } from "react";

export function useIgnoreQuickChange<T>(minMs: number, dependency: T): T {
  const [value, setValue] = useState(dependency);

  useEffect(() => {
    const handleChange = () => {
      setValue(dependency);
    };

    const timeout = setTimeout(handleChange, minMs);

    return () => clearTimeout(timeout);
  }, [dependency, minMs]);

  return value;
}
