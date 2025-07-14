"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { BookOpen, PlusCircle, LogOut } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (!session) return null;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Library",
      icon: BookOpen,
      active: pathname === "/dashboard" || pathname.startsWith("/dashboard/")
    },
    {
      href: "/create",
      label: "Create",
      icon: PlusCircle,
      active: pathname === "/create"
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => router.push("/dashboard")}
          >
            <span className="text-xl font-bold text-gray-900">Onceies</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant={item.active ? "default" : "ghost"}
                  className={`flex items-center gap-2 ${
                    item.active 
                      ? "bg-purple-600 text-white hover:bg-purple-700" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {session.user?.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
} 