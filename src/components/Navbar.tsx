"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { BookOpen, PlusCircle, LogOut, LogIn } from "lucide-react";
import { checkStoryLimit, UsageStatus } from "@/lib/usage-tracking";
import PlanStatus from "./PlanStatus";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);

  useEffect(() => {
    const fetchUsageStatus = async () => {
      if (!session?.supabaseAccessToken || !session?.user?.id) return;

      try {
        const status = await checkStoryLimit(
          session.user.id,
          session.supabaseAccessToken
        );
        setUsageStatus(status);
      } catch (error) {
        console.error("Error fetching usage status:", error);
      }
    };

    fetchUsageStatus();
  }, [session]);

  if (!session) return null;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Library",
      icon: BookOpen,
      active: pathname === "/dashboard" || pathname.startsWith("/dashboard/"),
    },
    {
      href: "/create",
      label: "Create",
      icon: PlusCircle,
      active: pathname === "/create",
    },
  ];

  return (
    <nav className="bg-white w-full px-8 shadow-sm border-b flex justify-between items-center h-16">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => router.push("/dashboard")}
      >
        <span className="text-xl font-bold text-gray-900">Onceies</span>
      </div>

      {session ? (
        <div className="flex items-center gap-4">
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
          {usageStatus && (
            <div className="hidden md:block">
              <PlanStatus usage={usageStatus} variant="badge" />
            </div>
          )}

          <Avatar>
            <AvatarImage src={session.user?.image || ""} />
            <AvatarFallback>{session.user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
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
      ) : (
        <div>
          <Button
            variant="default"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 font-comic-neue"
            onClick={() => router.push("/login")}
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </div>
      )}
    </nav>
  );
}
