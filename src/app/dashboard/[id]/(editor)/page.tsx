import { Suspense } from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { PhotoUpload } from "@/components/photo-upload";
import { Card, Field, dangerButtonClass, inputClass } from "@/components/ui";
import { requireWedding } from "@/lib/auth";
import { MAX_GALLERY_PHOTOS, photoUrl } from "@/lib/photos";
import { THEMES, TEMPLATE_IDS } from "@/templates/themes";
import {
  addGalleryPhoto,
  removeCoverPhoto,
  removeGalleryPhoto,
  setCoverPhoto,
  updateDetails,
} from "../../actions";

export default function DetailsPage({ params }: PageProps<"/dashboard/[id]">) {
  return (
    <Suspense fallback={<p className="text-zinc-600">Loading…</p>}>
      <Details params={params} />
    </Suspense>
  );
}

async function Details({ params }: Pick<PageProps<"/dashboard/[id]">, "params">) {
  const { id } = await params;
  const { wedding } = await requireWedding(id);
  const cover = photoUrl(wedding.cover_photo_path);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card title="Invite details" description="Names and story appear on your invite exactly as you type them.">
        <ActionForm action={updateDetails.bind(null, id)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Partner one">
              <input name="partner_one" defaultValue={wedding.partner_one} required maxLength={80} className={inputClass} />
            </Field>
            <Field label="Partner two">
              <input name="partner_two" defaultValue={wedding.partner_two} required maxLength={80} className={inputClass} />
            </Field>
          </div>
          <Field label="Your story" hint="Optional. How you met, a message to your guests, anything you like.">
            <textarea
              name="story"
              defaultValue={wedding.story ?? ""}
              rows={6}
              maxLength={3000}
              className={inputClass}
            />
          </Field>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-800">Template</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {TEMPLATE_IDS.map((tid) => {
                const t = THEMES[tid];
                return (
                  <label key={tid} className="cursor-pointer">
                    <input
                      type="radio"
                      name="template"
                      value={tid}
                      defaultChecked={wedding.template === tid}
                      className="peer sr-only"
                    />
                    <span className="flex h-full flex-col overflow-hidden rounded-xl border-2 border-zinc-200 peer-checked:border-zinc-900 peer-focus-visible:ring-2">
                      <span
                        className="flex h-24 items-center justify-center text-3xl"
                        style={{ background: t.colors.bg, color: t.colors.text, fontFamily: t.fonts.names }}
                      >
                        <span className={t.namesUppercase ? "text-lg font-semibold uppercase tracking-[0.2em]" : ""}>
                          A <span style={{ color: t.colors.accent }}>&amp;</span> R
                        </span>
                      </span>
                      <span className="p-3">
                        <span className="block text-sm font-medium">{t.name}</span>
                        <span className="block text-xs text-zinc-500">{t.description}</span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </ActionForm>
      </Card>

      <div className="flex flex-col gap-6">
        <Card title="Cover photo" description="Shown at the top of your invite, in link previews and on the card.">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Cover" className="mb-3 aspect-[4/5] w-full rounded-lg object-cover" />
          ) : (
            <div className="mb-3 flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-500">
              No cover photo
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <PhotoUpload
              weddingId={id}
              onUploaded={setCoverPhoto.bind(null, id)}
              label={cover ? "Replace" : "Upload cover"}
            />
            {cover && (
              <form action={removeCoverPhoto.bind(null, id)}>
                <SubmitButton className={dangerButtonClass}>Remove</SubmitButton>
              </form>
            )}
          </div>
        </Card>

        <Card
          title="Gallery"
          description={`Up to ${MAX_GALLERY_PHOTOS} more photos (${wedding.photo_paths.length}/${MAX_GALLERY_PHOTOS}).`}
        >
          {wedding.photo_paths.length > 0 && (
            <ul className="mb-3 grid grid-cols-3 gap-2">
              {wedding.photo_paths.map((p) => (
                <li key={p} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(p)!} alt="" className="aspect-square w-full rounded-md object-cover" />
                  <form action={removeGalleryPhoto.bind(null, id, p)} className="absolute right-1 top-1">
                    <SubmitButton className="rounded-full bg-white/90 px-2 text-sm shadow" pendingLabel="…">
                      ✕
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <PhotoUpload
            weddingId={id}
            onUploaded={addGalleryPhoto.bind(null, id)}
            label="Add photo"
            disabled={wedding.photo_paths.length >= MAX_GALLERY_PHOTOS}
          />
        </Card>
      </div>
    </div>
  );
}
