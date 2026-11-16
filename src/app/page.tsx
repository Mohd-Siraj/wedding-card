import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        Your wedding invite, RSVPs and goals in one link
      </h1>
      <p className="max-w-xl text-lg text-zinc-600">
        Create a digital invitation, share it on WhatsApp, and let guests
        contribute to the future you&apos;re planning instead of buying gifts.
      </p>
      <Link
        href="/dashboard"
        className="rounded-full bg-black px-6 py-3 font-medium text-white"
      >
        Create your invite
      </Link>
    </main>
  );
}
