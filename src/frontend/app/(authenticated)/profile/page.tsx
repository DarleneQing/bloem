import Image from "next/image";
import { getUserProfileServer } from "@/lib/auth/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const profile = await getUserProfileServer();

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl py-6 md:py-8 px-4">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <Image
          src="/assets/images/logo-transparent.png"
          alt="Bloem"
          width={100}
          height={30}
          className="h-8 w-auto md:hidden"
          priority
        />
        <h1 className="text-3xl md:text-4xl font-black text-primary">Profile</h1>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-primary mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
              <p className="text-base font-semibold">{profile.first_name} {profile.last_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
              <p className="text-base font-semibold">{profile.email}</p>
            </div>
            {profile.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                <p className="text-base font-semibold">{profile.phone}</p>
              </div>
            )}
            {profile.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                <p className="text-base font-semibold">{profile.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Seller Information */}
        <ProfileForm profile={profile} />

        {/* Account Settings */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-primary mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <p className="text-base text-muted-foreground mb-4">
                Sign out of your account
              </p>
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
