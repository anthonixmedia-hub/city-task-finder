export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatBudget(min?: number | null, max?: number | null) {
  if (!min && !max) return "Budget: Negotiable";
  if (min && max && min !== max) return `₹${min.toLocaleString()} – ₹${max.toLocaleString()}`;
  return `₹${(max ?? min)!.toLocaleString()}`;
}

export const WHATSAPP_NUMBER = "916287585752";
export const CONTACT_EMAIL = "mycityrozgar@gmail.com";
export const CONTACT_PHONE = "+91 6287 585752";
export const CONTACT_ADDRESS =
  "Near Central Bank, Rashikpur, Sonwadangal, SP College Road, Dumka 814101";

// Columns safe to expose without the protected `phone` field.
export const JOB_PUBLIC_COLUMNS =
  "id,customer_id,title,category_slug,description,budget_min,budget_max,city,area,preferred_time,urgent,status,responses_count,created_at,updated_at";
