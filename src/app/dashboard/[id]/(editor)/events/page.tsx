import { Suspense } from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, Field, dangerButtonClass, inputClass } from "@/components/ui";
import { requireWedding } from "@/lib/auth";
import { formatDate, formatTime, utcToZonedLocal } from "@/lib/format";
import type { Database } from "@/types/database";
import { deleteEvent, saveEvent } from "../../../actions";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

const TIME_ZONES: string[] = Intl.supportedValuesOf("timeZone");
const DEFAULT_TZ = "Asia/Kolkata";

export default function EventsPage({ params }: PageProps<"/dashboard/[id]/events">) {
  return (
    <Suspense fallback={<p className="text-zinc-600">Loading…</p>}>
      <Events params={params} />
    </Suspense>
  );
}

async function Events({ params }: Pick<PageProps<"/dashboard/[id]/events">, "params">) {
  const { id } = await params;
  const { supabase } = await requireWedding(id);
  const { data: events } = await supabase.from("events").select("*").eq("wedding_id", id).order("starts_at");
  const list = events ?? [];
  const lastTz = list.at(-1)?.timezone ?? DEFAULT_TZ;

  return (
    <div className="flex flex-col gap-6">
      {list.length === 0 && (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          Add at least one event before publishing. The first event&apos;s date is shown as your wedding date.
        </p>
      )}

      {list.map((e) => (
        <Card key={e.id}>
          <details>
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
              <span>
                <span className="block text-lg font-semibold">{e.name}</span>
                <span className="text-sm text-zinc-600">
                  {formatDate(e.starts_at, e.timezone)} · {formatTime(e.starts_at, e.timezone)}
                  {e.venue_name && ` · ${e.venue_name}`}
                </span>
              </span>
              <span className="text-sm text-zinc-500 underline">Edit</span>
            </summary>
            <div className="mt-5 flex flex-col gap-4">
              <EventFields action={saveEvent.bind(null, id, e.id)} event={e} defaultTz={lastTz} />
              <form action={deleteEvent.bind(null, id, e.id)}>
                <SubmitButton className={dangerButtonClass} pendingLabel="Deleting…">
                  Delete event
                </SubmitButton>
              </form>
            </div>
          </details>
        </Card>
      ))}

      <Card title="Add an event" description="Haldi, mehendi, ceremony, reception… add as many as you need.">
        <EventFields action={saveEvent.bind(null, id, null)} defaultTz={lastTz} reset />
      </Card>
    </div>
  );
}

function EventFields({
  action,
  event,
  defaultTz,
  reset,
}: {
  action: Parameters<typeof ActionForm>[0]["action"];
  event?: EventRow;
  defaultTz: string;
  reset?: boolean;
}) {
  const tz = event?.timezone ?? defaultTz;
  return (
    <ActionForm action={action} submitLabel={event ? "Save event" : "Add event"} resetOnSuccess={reset}>
      <Field label="Event name">
        <input
          name="name"
          defaultValue={event?.name}
          required
          maxLength={120}
          placeholder="Wedding ceremony"
          className={inputClass}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts">
          <input
            type="datetime-local"
            name="starts_at"
            required
            defaultValue={event ? utcToZonedLocal(event.starts_at, event.timezone) : undefined}
            className={inputClass}
          />
        </Field>
        <Field label="Ends" hint="Optional">
          <input
            type="datetime-local"
            name="ends_at"
            defaultValue={event?.ends_at ? utcToZonedLocal(event.ends_at, event.timezone) : undefined}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Venue time zone" hint="Guests see times in this zone, wherever they are.">
        <select name="timezone" defaultValue={tz} className={inputClass}>
          {TIME_ZONES.map((z) => (
            <option key={z} value={z}>
              {z.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Venue">
          <input
            name="venue_name"
            defaultValue={event?.venue_name ?? ""}
            maxLength={200}
            placeholder="The Leela Palace"
            className={inputClass}
          />
        </Field>
        <Field label="Map link" hint="Paste a Google Maps link">
          <input
            name="map_url"
            type="url"
            defaultValue={event?.map_url ?? ""}
            placeholder="https://maps.app.goo.gl/…"
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Address">
        <textarea name="address" defaultValue={event?.address ?? ""} rows={2} maxLength={500} className={inputClass} />
      </Field>
    </ActionForm>
  );
}
