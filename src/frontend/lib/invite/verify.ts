import { createServiceClient } from "@/lib/supabase/service";
import { signInvitePayload } from "@/lib/invite/cookie";
import { inviteCodeSchema } from "@/features/invite/validations";

export async function verifyInviteCodeForCookie(code: string) {
  const parsed = inviteCodeSchema.safeParse({ code });
  if (!parsed.success) {
    return { error: "Invite code is required" } as const;
  }

  const supabase = createServiceClient();
  const { data: invite, error } = await supabase
    .from("invite_codes")
    .select("code, revoked_at")
    .eq("code", parsed.data.code)
    .maybeSingle();

  if (error) {
    return { error: "Could not verify invite code. Please try again." } as const;
  }
  if (!invite || invite.revoked_at !== null) {
    return { error: "That invite code isn't valid." } as const;
  }

  const cookieValue = await signInvitePayload(invite.code);
  return { cookieValue } as const;
}
