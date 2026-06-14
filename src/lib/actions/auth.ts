"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password }: LoginInput = parsed.data;
  const supabase = await createClient();

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !signInData.user) {
    return { error: error?.message || "Login failed." };
  }

  // Check if user is banned — use the user object returned from signInWithPassword
  // instead of getUser() which relies on cookies that may not be synced yet.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned, banned_reason")
    .eq("auth_user_id", signInData.user.id)
    .single();

  if (profile?.is_banned) {
    // Sign out and reject — this clears the auth cookies before returning.
    await supabase.auth.signOut();
    return {
      error: `Your account has been banned. ${profile.banned_reason || ""}`.trim(),
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { fullName, email, password }: RegisterInput = parsed.data;
  const supabase = await createClient();

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  // If email confirmation is enabled, the user won't have a session yet.
  // The Supabase trigger will create the profile row.
  // If auto-confirm is on (dev), redirect immediately.
  if (authData.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    success: "Account created! Please check your email to confirm your account.",
  };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
