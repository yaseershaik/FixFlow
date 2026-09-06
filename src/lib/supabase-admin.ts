import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Server-side Supabase Admin Client.
 * Uses the service_role key to bypass RLS for administrative tasks
 * such as uploading complaint evidence to private storage buckets.
 * NEVER expose this client to frontend components.
 */
export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

export const isSupabaseStorageEnabled = Boolean(supabaseAdmin);
export const EVIDENCE_BUCKET = "fixflow-evidence";

let bucketEnsured = false;

export async function ensureEvidenceBucket(): Promise<boolean> {
  if (!supabaseAdmin) return false;
  if (bucketEnsured) return true;

  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === EVIDENCE_BUCKET);
    if (!exists) {
      const { error } = await supabaseAdmin.storage.createBucket(EVIDENCE_BUCKET, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
      });
      if (error) {
        console.warn("Could not auto-create Supabase evidence bucket:", error.message);
        return false;
      }
    }
    bucketEnsured = true;
    return true;
  } catch (err) {
    console.warn("ensureEvidenceBucket error:", err);
    return false;
  }
}

