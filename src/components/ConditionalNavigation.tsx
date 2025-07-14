"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { BookOpen, LogIn } from "lucide-react";
import Navbar from "./Navbar";

export default function ConditionalNavigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Don't show navigation on login page
  if (pathname === "/login") return null;

  // If user is authenticated, show the full navbar
  if (session) {
    return <Navbar />;
  }

  // If user is not authenticated, show minimal header with sign in button
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => router.push("/")}
          >
            <BookOpen className="h-8 w-8 text-purple-600" />
            <span className="text-xl font-bold text-gray-900 font-comic-neue">Story Creator</span>
          </div>

          {/* Sign In Button */}
          <Button
            variant="default"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 font-comic-neue"
            onClick={() => router.push("/login")}
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </div>
      </div>
    </nav>
  );
} 