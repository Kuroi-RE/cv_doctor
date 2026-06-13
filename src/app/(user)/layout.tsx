import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/auth";
import Navbar from "@/components/layout/navbar";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Auto-create profile if it doesn't exist
  const { profile } = await getOrCreateProfile(supabase);

  return (
    <div className="flex min-h-screen flex-col bg-[#fef9ef]">
      <Navbar
        userName={profile?.full_name || user.email?.split("@")[0] || "User"}
        userRole={profile?.role || "user"}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
