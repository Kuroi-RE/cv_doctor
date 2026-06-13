import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";

export default async function AdminLayout({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("auth_user_id", user.id)
    .single();

  // Only admins allowed
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fef9ef]">
      <Navbar
        userName={profile.full_name || user.email?.split("@")[0] || "Admin"}
        userRole={profile.role}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
