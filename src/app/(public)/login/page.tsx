"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<
    AuthActionState,
    FormData
  >(loginAction, {});

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fef9ef] px-4">
      {/* Decorative shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-yellow-300 opacity-40" />
        <div className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-cyan-300 opacity-30" />
        <div className="absolute top-1/3 right-1/4 h-24 w-24 rotate-12 bg-purple-300 opacity-25" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="relative rounded-xl border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000000]">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl border-4 border-black bg-yellow-300 shadow-[4px_4px_0px_0px_#000000]">
              <LogIn className="h-8 w-8" strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-black">
              Welcome Back
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-600">
              Sign in to {APP_NAME}
            </p>
          </div>

          {/* Error */}
          {state?.error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border-3 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {state.error}
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-bold uppercase tracking-wide text-black"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="h-12 rounded-lg border-3 border-black pl-11 text-sm font-medium shadow-[3px_3px_0px_0px_#000000] transition-all focus:border-black focus:shadow-[1px_1px_0px_0px_#000000] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-bold uppercase tracking-wide text-black"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-12 rounded-lg border-3 border-black pl-11 text-sm font-medium shadow-[3px_3px_0px_0px_#000000] transition-all focus:border-black focus:shadow-[1px_1px_0px_0px_#000000] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-lg border-3 border-black bg-yellow-300 text-sm font-bold uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-yellow-400 hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 border-t-2 border-dashed border-gray-300 pt-5 text-center">
            <p className="text-sm font-medium text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-black underline decoration-2 decoration-yellow-300 underline-offset-4 transition-colors hover:decoration-cyan-400"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-bold text-gray-500 transition-colors hover:text-black"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
