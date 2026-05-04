"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/tickets", label: "Tickets" },
    { href: "/tickets/new", label: "New Ticket" },
  ];
  if (user.role === "ADMIN") {
    navItems.push({ href: "/admin/users", label: "Admin" });
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold text-brand-700 text-lg"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white text-sm">
                LS
              </span>
              Ticketing
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-700">
                {user.fullName}
              </span>
              <span className="text-xs text-slate-500">
                {user.role.replace("_", " ")}
              </span>
            </div>
            <button onClick={logout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
