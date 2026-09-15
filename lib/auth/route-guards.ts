export type RouteRole = "member" | "admin" | "guest";

export function resolveRouteFromRole(
  role: string | null | undefined,
): RouteRole {
  if (role === "admin") return "admin";
  if (role === "member") return "member";
  return "guest";
}
