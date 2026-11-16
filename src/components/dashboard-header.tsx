import Link from "next/link";
import { signOut } from "@/app/(auth)/login/actions";
import { appName } from "@/lib/format";

export function DashboardHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard" className="font-semibold">
          {appName()}
        </Link>
        <form action={signOut}>
          <button className="text-sm text-zinc-600 underline-offset-4 hover:underline">Sign out</button>
        </form>
      </div>
    </header>
  );
}
