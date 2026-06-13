"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Upload,
  History,
  FileSearch,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";

interface NavbarProps {
  userName?: string;
  userRole?: string;
}

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload CV", icon: Upload },
  { href: "/history", label: "History", icon: History },
  { href: "/analysis", label: "Analysis", icon: FileSearch },
];

const adminNavItems = [
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: FileSearch },
  { href: "/admin/logs", label: "Logs", icon: History },
  { href: "/admin/monitoring", label: "Monitoring", icon: FileSearch },
];

export default function Navbar({ userName, userRole }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = userRole === "admin";
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <nav className="sticky top-0 z-50 border-b-4 border-black bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border-3 border-black bg-yellow-300 shadow-[2px_2px_0px_0px_#000000]">
              <FileSearch className="h-5 w-5" strokeWidth={3} />
            </div>
            <span className="text-xl font-black tracking-tight text-black">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition-all ${
                    isActive
                      ? "border-black bg-yellow-300 text-black shadow-[2px_2px_0px_0px_#000000]"
                      : "border-transparent text-gray-600 hover:border-black hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <item.icon className="h-4 w-4" strokeWidth={2.5} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden items-center gap-3 md:flex">
            {userName && (
              <span className="rounded-lg border-2 border-black bg-gray-50 px-3 py-1 text-sm font-bold text-gray-700">
                {userName}
              </span>
            )}
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-red-100 px-3 py-1.5 text-sm font-bold text-red-700 shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-red-200 hover:shadow-[1px_1px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                <LogOut className="h-4 w-4" strokeWidth={2.5} />
                Logout
              </Button>
            </form>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-3 border-black bg-yellow-300 shadow-[2px_2px_0px_0px_#000000] transition-all hover:shadow-[1px_1px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] md:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" strokeWidth={3} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={3} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t-4 border-black bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition-all ${
                    isActive
                      ? "border-black bg-yellow-300 text-black shadow-[2px_2px_0px_0px_#000000]"
                      : "border-transparent text-gray-600 hover:border-black hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="h-4 w-4" strokeWidth={2.5} />
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t-2 border-dashed border-gray-300 pt-2">
              {userName && (
                <div className="mb-2 rounded-lg border-2 border-black bg-gray-50 px-3 py-2 text-sm font-bold text-gray-700">
                  {userName}
                  {isAdmin && (
                    <span className="ml-2 rounded bg-purple-200 px-1.5 py-0.5 text-xs font-black text-purple-800">
                      ADMIN
                    </span>
                  )}
                </div>
              )}
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-black bg-red-100 px-3 py-2.5 text-sm font-bold text-red-700 shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-red-200"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2.5} />
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
