/**
 * Sanitize a user-supplied search term before interpolating it into a
 * PostgREST `.or(...ilike...)` filter string. Commas, parens, and quotes are
 * structural in the filter grammar; `%`/`_` are ilike wildcards.
 */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()"'\\%_]/g, " ").replace(/\s+/g, " ").trim();
}
