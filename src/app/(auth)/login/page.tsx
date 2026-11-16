import { Suspense } from "react";
import { signInWithEmail, signInWithGoogle } from "./actions";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Sign in to create your invite</h1>
      <Suspense>
        <LoginForms searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginForms({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next, sent, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/dashboard";

  return (
    <>
      {sent && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Check your email for a sign-in link.
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          Sign-in failed. Please try again.
        </p>
      )}

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={nextPath} />
        <button className="w-full rounded-md border px-4 py-2 font-medium">
          Continue with Google
        </button>
      </form>

      <form action={signInWithEmail} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={nextPath} />
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="rounded-md border px-3 py-2"
        />
        <button className="rounded-md bg-black px-4 py-2 font-medium text-white">
          Email me a sign-in link
        </button>
      </form>
    </>
  );
}
