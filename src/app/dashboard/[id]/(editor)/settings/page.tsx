import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { Card, Field, inputClass } from "@/components/ui";
import { requireWedding } from "@/lib/auth";
import { CURRENCIES, siteUrl } from "@/lib/format";
import { deleteWedding, saveSettings, saveSlug } from "../../../actions";

export default function SettingsPage({ params }: PageProps<"/dashboard/[id]/settings">) {
  return (
    <Suspense fallback={<p className="text-zinc-600">Loading…</p>}>
      <Settings params={params} />
    </Suspense>
  );
}

const radioCard =
  "flex cursor-pointer flex-col gap-3 rounded-xl border-2 border-zinc-200 p-4 has-[:checked]:border-zinc-900";

async function Settings({ params }: Pick<PageProps<"/dashboard/[id]/settings">, "params">) {
  const { id } = await params;
  const { wedding: w } = await requireWedding(id);

  return (
    <div className="flex flex-col gap-6">
      <Card
        title="Payments, currency and privacy"
        description="Guests pay you directly. This app never handles money; it only records what guests tell you they sent."
      >
        <ActionForm action={saveSettings.bind(null, id)}>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-medium text-zinc-800">How should guests pay you?</legend>

            <label className={radioCard}>
              <span className="flex items-center gap-2 font-medium">
                <input type="radio" name="payment_method" value="upi" defaultChecked={w.payment_method === "upi"} />
                UPI (India)
              </span>
              <span className="text-sm text-zinc-600">
                Guests get a pay button on their phone and a QR code. UPI only supports INR.
              </span>
              <input name="upi_id" defaultValue={w.upi_id ?? ""} placeholder="yourname@okhdfcbank" className={inputClass} />
            </label>

            <label className={radioCard}>
              <span className="flex items-center gap-2 font-medium">
                <input type="radio" name="payment_method" value="link" defaultChecked={w.payment_method === "link"} />
                Payment link
              </span>
              <span className="text-sm text-zinc-600">PayPal.me, Wise, Revolut, Stripe or any link that takes payments.</span>
              <input
                name="payment_link"
                type="url"
                defaultValue={w.payment_link ?? ""}
                placeholder="https://paypal.me/yourname"
                className={inputClass}
              />
            </label>

            <label className={radioCard}>
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="payment_method"
                  value="instructions"
                  defaultChecked={w.payment_method === "instructions"}
                />
                Instructions
              </span>
              <span className="text-sm text-zinc-600">For bank transfers or anything else. Shown to guests as written.</span>
              <textarea
                name="payment_instructions"
                defaultValue={w.payment_instructions ?? ""}
                rows={3}
                maxLength={1000}
                placeholder="Bank: … Account: … IFSC: …"
                className={inputClass}
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input type="radio" name="payment_method" value="" defaultChecked={!w.payment_method} />
              No payment details yet
            </label>
          </fieldset>

          <Field label="Currency" hint="Used for every goal and contribution amount.">
            <select name="currency" defaultValue={w.currency} className={`${inputClass} sm:max-w-xs`}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-medium text-zinc-800">What can guests see?</legend>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="show_contributor_names" defaultChecked={w.show_contributor_names} className="mt-1" />
              <span>
                <span className="block text-sm font-medium">Contributor names</span>
                <span className="block text-sm text-zinc-600">
                  Guests who choose to stay anonymous are always hidden.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="show_amounts" defaultChecked={w.show_amounts} className="mt-1" />
              <span>
                <span className="block text-sm font-medium">Amounts and progress bars</span>
                <span className="block text-sm text-zinc-600">
                  When off, amounts never leave the database, so no guest can see them.
                </span>
              </span>
            </label>
          </fieldset>
        </ActionForm>
      </Card>

      <Card
        title="Invite link"
        description={
          w.status === "published"
            ? "Your invite is live. Changing the link breaks any link you've already shared."
            : "Choose a short, readable address."
        }
      >
        <ActionForm action={saveSlug.bind(null, id)} submitLabel="Save link">
          <Field label="Address">
            <div className="flex items-center rounded-lg border border-zinc-300 bg-white focus-within:border-zinc-900">
              <span className="hidden pl-3 text-sm text-zinc-500 sm:inline">{siteUrl().replace(/^https?:\/\//, "")}/w/</span>
              <input
                name="slug"
                defaultValue={w.slug}
                required
                minLength={3}
                maxLength={60}
                pattern="[a-zA-Z0-9\- ]+"
                className="w-full rounded-lg bg-transparent px-3 py-2 focus:outline-none sm:pl-1"
              />
            </div>
          </Field>
        </ActionForm>
      </Card>

      <Card title="Delete this invite" description="Permanently deletes the invite, its photos, RSVPs and contributions.">
        <ActionForm action={deleteWedding.bind(null, id)} submitLabel="Delete permanently">
          <Field label={`Type ${w.slug} to confirm`}>
            <input name="confirm" autoComplete="off" className={`${inputClass} sm:max-w-sm`} />
          </Field>
        </ActionForm>
      </Card>
    </div>
  );
}
