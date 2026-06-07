export function resolveInviteRedirect(next: string | null | undefined): string {
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/auth/sign-up";
}
