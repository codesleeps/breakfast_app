export function buildQueryParams(params: Record<string, unknown>): string | null {
  if (!params) return null;
  const query: string[] = [];

  for (const key in params) {
    const value = params[key];

    if (value === undefined || value === null) continue;

    if (!Array.isArray(value) && typeof value === "object" && value !== null) {
      Object.keys(value).forEach((subKey) => {
        const subVal = value[subKey as keyof typeof value];
        if (subVal !== undefined && subVal !== null) {
          query.push(`${key}[${encodeURIComponent(subKey)}]=${encodeURIComponent(String(subVal))}`);
        }
      });
    } else if (Array.isArray(value)) {
      for (const item of value) {
        query.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(item))}`);
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      query.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  return query.length ? `${query.join("&")}` : null;
}
