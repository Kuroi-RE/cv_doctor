import Link from "next/link";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FileSearch, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#fef9ef]">
      {/* Navbar */}
      <nav className="border-b-4 border-black bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border-3 border-black bg-yellow-300 shadow-[2px_2px_0px_0px_#000000]">
              <FileSearch className="h-5 w-5" strokeWidth={3} />
            </div>
            <span className="text-xl font-black tracking-tight text-black">
              {APP_NAME}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border-2 border-black px-4 py-1.5 text-sm font-bold text-black transition-all hover:bg-gray-50"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg border-3 border-black bg-yellow-300 px-4 py-1.5 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-yellow-400 hover:shadow-[1px_1px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-3 border-black bg-cyan-300 px-4 py-1.5 text-sm font-bold shadow-[3px_3px_0px_0px_#000000]">
            <Sparkles className="h-4 w-4" strokeWidth={3} />
            AI-Powered CV Analysis
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-black sm:text-6xl lg:text-7xl">
            Make Your CV
            <br />
            <span className="inline-block rounded-lg border-4 border-black bg-yellow-300 px-4 shadow-[6px_6px_0px_0px_#000000]">
              Stand Out
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg font-medium text-gray-600 sm:text-xl">
            {APP_DESCRIPTION} — Upload your CV and get instant, actionable
            feedback powered by AI. Perfect for students and fresh graduates.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl border-4 border-black bg-yellow-300 px-8 py-4 text-lg font-black uppercase tracking-wider text-black shadow-[6px_6px_0px_0px_#000000] transition-all hover:bg-yellow-400 hover:shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px]"
            >
              Upload Your CV
              <ArrowRight className="h-5 w-5" strokeWidth={3} />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border-4 border-black bg-white px-8 py-4 text-lg font-black uppercase tracking-wider text-black shadow-[6px_6px_0px_0px_#000000] transition-all hover:bg-gray-50 hover:shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t-4 border-black bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-12 text-center text-3xl font-black tracking-tight text-black sm:text-4xl">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border-4 border-black bg-yellow-50 p-6 shadow-[6px_6px_0px_0px_#000000]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-3 border-black bg-yellow-300 shadow-[3px_3px_0px_0px_#000000]">
                <FileSearch className="h-7 w-7" strokeWidth={3} />
              </div>
              <h3 className="mb-2 text-xl font-black text-black">
                1. Upload CV
              </h3>
              <p className="text-sm font-medium text-gray-600">
                Upload your CV in PDF or DOCX format. Our parser extracts all
                the important text content.
              </p>
            </div>

            <div className="rounded-xl border-4 border-black bg-cyan-50 p-6 shadow-[6px_6px_0px_0px_#000000]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-3 border-black bg-cyan-300 shadow-[3px_3px_0px_0px_#000000]">
                <Zap className="h-7 w-7" strokeWidth={3} />
              </div>
              <h3 className="mb-2 text-xl font-black text-black">
                2. AI Analysis
              </h3>
              <p className="text-sm font-medium text-gray-600">
                OpenAI evaluates your CV structure, content, relevance,
                language, and completeness.
              </p>
            </div>

            <div className="rounded-xl border-4 border-black bg-green-50 p-6 shadow-[6px_6px_0px_0px_#000000]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-3 border-black bg-green-300 shadow-[3px_3px_0px_0px_#000000]">
                <Shield className="h-7 w-7" strokeWidth={3} />
              </div>
              <h3 className="mb-2 text-xl font-black text-black">
                3. Get Results
              </h3>
              <p className="text-sm font-medium text-gray-600">
                Receive a detailed score, highlights, and actionable
                recommendations to improve your CV.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-black py-6 text-center">
        <p className="text-sm font-bold text-white">
          {APP_NAME} &copy; {new Date().getFullYear()} — Built with Next.js,
          Supabase &amp; OpenAI
        </p>
      </footer>
    </div>
  );
}
