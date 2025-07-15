"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  });
  return (
    <div className="h-screen w-screen flex items-center justify-center text-center">
      Go to <Link href="/dashboard">Dashboard</Link>
    </div>
  );
}
