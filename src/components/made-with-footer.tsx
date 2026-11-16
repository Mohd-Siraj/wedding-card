import Link from "next/link";
import { appName } from "@/lib/format";

// Required on every public page and card (PRD: Branding). Inherits the
// surrounding text colour so it sits naturally inside every template.
export function MadeWithFooter() {
  return (
    <footer className="mt-auto pt-12 pb-6 text-center text-sm opacity-70">
      <Link href="/" className="underline underline-offset-4">
        Made with {appName()}
      </Link>
      <span className="block pt-1 text-xs">Create your own wedding invite, free</span>
    </footer>
  );
}
