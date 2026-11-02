export type MemberProfileCompletion = {
  role: string | null | undefined;
  full_name: string | null | undefined;
  username: string | null | undefined;
  phone: string | null | undefined;
  member_number: string | null | undefined;
};

export function hasCompletedMemberProfile(
  profile: MemberProfileCompletion | null | undefined,
): boolean {
  if (!profile || profile.role !== "member") return false;

  return [
    profile.full_name,
    profile.username,
    profile.phone,
    profile.member_number,
  ].every((value) => typeof value === "string" && value.trim().length > 0);
}