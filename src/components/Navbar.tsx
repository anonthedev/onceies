"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { BookOpen, PlusCircle, LogOut, LogIn } from "lucide-react";
import { checkStoryLimit, type UsageStatus } from "@/lib/usage-tracking";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
    <nav className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 w-full px-8 shadow-sm border-b flex justify-between items-center h-16">
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
                  variant={item.active ? "default" : "outline"}
                  className={`flex items-center gap-2 ${
                    item.active
                      ? "bg-orange-600 text-white hover:bg-orange-700"
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

          {usageStatus?.plan === "free" && <Link href="/pricing">Upgrade</Link>}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className={cn(usageStatus?.plan === "pro" && "border-2 border-orange-600", "w-10 h-10")}>
                <AvatarImage src={session.user?.image || ""} />
                <AvatarFallback>{session.user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div>
          <Button
            variant="default"
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 font-comic-neue"
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
