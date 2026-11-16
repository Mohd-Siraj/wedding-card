// UPI deep links. Opening upi://pay on a phone lists the installed UPI apps
// (GPay, PhonePe, Paytm...). The same URL in a QR code works when scanned.

export const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;

export function buildUpiUrl(opts: {
  upiId: string;
  payeeName: string;
  amount?: number | null;
  note?: string;
}) {
  const params = new URLSearchParams({ pa: opts.upiId, pn: opts.payeeName.slice(0, 50), cu: "INR" });
  if (opts.amount && opts.amount > 0) params.set("am", opts.amount.toFixed(2));
  if (opts.note) params.set("tn", opts.note.slice(0, 50));
  // UPI apps expect %20 rather than + for spaces.
  return `upi://pay?${params.toString().replace(/\+/g, "%20")}`;
}
