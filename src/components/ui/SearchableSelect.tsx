import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";

type Option = { value: number | string; label: string; sub?: string };

export function SearchableSelect({
  value,
  onChange,
  fetchOptions,     // (q: string) => Promise<Option[]>
  placeholder,
  headLabel,
}: {
  value: number | string | null | undefined;
  onChange: (v: number | string | null) => void;
  fetchOptions: (q: string) => Promise<Option[]>;
  placeholder?: string;
  headLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // close on click outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // fetch with debounce
  useEffect(() => {
    let dead = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchOptions(q.trim());
        if (!dead) setOpts(res);
      } finally {
        if (!dead) setLoading(false);
      }
    }, 200);
    return () => { dead = true; clearTimeout(t); };
  }, [q, fetchOptions]);

  const selected = useMemo(
    () => opts.find(o => String(o.value) === String(value)) ?? null,
    [opts, value]
  );

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        className="mt-1 w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-left text-sm"
        onClick={() => setOpen(o => !o)}
      >
        {selected ? selected.label : (placeholder ?? "Select…")}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-300 bg-white shadow">
          {headLabel && <div className="px-3 pt-2 text-xs text-gray-600">{headLabel}</div>}
          <div className="p-2">
            <Input
              autoFocus
              placeholder="Search…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-auto text-sm">
            {loading ? (
              <div className="px-3 py-2 text-gray-500">Loading…</div>
            ) : opts.length ? (
              opts.map(o => (
                <div
                  key={o.value}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                >
                  <div className="font-medium">{o.label}</div>
                  {o.sub && <div className="text-xs text-gray-500">{o.sub}</div>}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
