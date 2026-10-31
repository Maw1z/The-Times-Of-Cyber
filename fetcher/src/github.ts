import { GITHUB_API, KEYS } from "./config.ts";
import { fetchJson, fetchText } from "./http.ts";

/** GitHub REST call; uses GITHUB_TOKEN when present (provided automatically in Actions). */
export function gh<T>(path: string): Promise<T> {
  return fetchJson<T>(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(KEYS.github ? { Authorization: `Bearer ${KEYS.github}` } : {}),
    },
  });
}

export function ghRaw(url: string): Promise<string> {
  return fetchText(url, { headers: KEYS.github ? { Authorization: `Bearer ${KEYS.github}` } : {} });
}
