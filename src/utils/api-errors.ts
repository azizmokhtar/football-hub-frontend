// Handles DRF error shapes: strings, string[], {field: [...]}, nested dicts
export type ApiErrors = Record<string, string[]>;

export function normalizeApiErrors(data: any): ApiErrors {
  const out: ApiErrors = {};

  const push = (key: string, val: string | string[]) => {
    if (!val) return;
    const arr = Array.isArray(val) ? val : [String(val)];
    out[key] = out[key] ? [...out[key], ...arr] : arr;
  };

  const walk = (prefix: string | null, node: any) => {
    if (node == null) return;
    if (typeof node === "string") {
      push(prefix ?? "non_field_errors", node);
    } else if (Array.isArray(node)) {
      node.forEach((v) => walk(prefix, v));
    } else if (typeof node === "object") {
      Object.entries(node).forEach(([k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k;
        walk(key, v);
      });
    } else {
      push(prefix ?? "non_field_errors", String(node));
    }
  };

  walk(null, data);
  return out;
}
