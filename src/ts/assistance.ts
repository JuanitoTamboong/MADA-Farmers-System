import { supabase } from '../supabase/supabase-client';

// ============================================================
// Types
// ============================================================

export type AssistanceCategory =
  | 'Seeds'
  | 'Fertilizer'
  | 'Technical Assistance'
  | 'Pest Inspection'
  | 'Financial Subsidy';

export type AssistanceStatus =
  | 'Pending'
  | 'Approved'
  | 'In Progress'
  | 'Completed'
  | 'Rejected';

export interface AssistanceRequestRecord {
  id: string;
  farmerId: string;
  category: AssistanceCategory;
  notes: string | null;
  status: AssistanceStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

// Minimal profile used to build the formal request letter
export interface FarmerProfileLite {
  id: string;
  fullName: string;
  barangay: string;
  contact: string;
}

// ============================================================
// Row shape (snake_case)
// ============================================================

interface AssistanceRequestRow {
  id: string;
  farmer_id: string;
  category: AssistanceCategory;
  notes: string | null;
  status: AssistanceStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

const rowToRequest = (row: AssistanceRequestRow): AssistanceRequestRecord => ({
  id: row.id,
  farmerId: row.farmer_id,
  category: row.category,
  notes: row.notes,
  status: row.status,
  adminNote: row.admin_note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ============================================================
// Farmer-side queries
// ============================================================

export async function fetchMyAssistanceRequests(
  farmerId: string,
): Promise<AssistanceRequestRecord[]> {
  const { data, error } = await supabase
    .from('assistance_requests')
    .select(
      'id, farmer_id, category, notes, status, admin_note, created_at, updated_at',
    )
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToRequest(row as AssistanceRequestRow));
}

export async function createAssistanceRequest(payload: {
  farmerId: string;
  category: AssistanceCategory;
  notes: string;
}): Promise<AssistanceRequestRecord> {
  const { data, error } = await supabase
    .from('assistance_requests')
    .insert({
      farmer_id: payload.farmerId,
      category: payload.category,
      notes: payload.notes.trim() || null,
    })
    .select(
      'id, farmer_id, category, notes, status, admin_note, created_at, updated_at',
    )
    .single();

  if (error) throw new Error(error.message);
  return rowToRequest(data as AssistanceRequestRow);
}

// NEW — update a request (RLS limits this to the farmer's own Pending rows)
export async function updateAssistanceRequest(
  id: string,
  payload: { category: AssistanceCategory; notes: string },
): Promise<AssistanceRequestRecord> {
  const { data, error } = await supabase
    .from('assistance_requests')
    .update({
      category: payload.category,
      notes: payload.notes.trim() || null,
    })
    .eq('id', id)
    .select(
      'id, farmer_id, category, notes, status, admin_note, created_at, updated_at',
    )
    .single();

  if (error) throw new Error(error.message);
  return rowToRequest(data as AssistanceRequestRow);
}

export async function deleteAssistanceRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('assistance_requests')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// Farmer profile (used to fill in the request letter)
// ============================================================

export async function fetchFarmerProfileLite(
  farmerId: string,
): Promise<FarmerProfileLite | null> {
  // First try with contact
  const primary = await supabase
    .from('farmers')
    .select('id, full_name, address, contact')
    .eq('id', farmerId)
    .maybeSingle();

  // If 'contact' column doesn't exist, retry without it
  if (primary.error && /contact/i.test(primary.error.message)) {
    const retry = await supabase
      .from('farmers')
      .select('id, full_name, address')
      .eq('id', farmerId)
      .maybeSingle();

    if (retry.error) throw new Error(retry.error.message);
    if (!retry.data) return null;

    return {
      id: retry.data.id,
      fullName: retry.data.full_name ?? '',
      barangay: retry.data.address ?? '',
      contact: '',
    };
  }

  if (primary.error) throw new Error(primary.error.message);
  if (!primary.data) return null;

  return {
    id: primary.data.id,
    fullName: primary.data.full_name ?? '',
    barangay: primary.data.address ?? '',
    contact: primary.data.contact ?? '',
  };
}

// ============================================================
// Admin-side queries
// ============================================================

export interface AdminAssistanceRequest extends AssistanceRequestRecord {
  farmerName: string;
}

export async function fetchAllAssistanceRequests(): Promise<
  AdminAssistanceRequest[]
> {
  const { data, error } = await supabase
    .from('assistance_requests')
    .select(
      'id, farmer_id, category, notes, status, admin_note, created_at, updated_at',
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as AssistanceRequestRow[];

  // Join farmer names in one shot
  const farmerIds = Array.from(new Set(rows.map((r) => r.farmer_id)));
  const nameById = new Map<string, string>();

  if (farmerIds.length > 0) {
    const { data: farmers, error: farmersErr } = await supabase
      .from('farmers')
      .select('id, full_name')
      .in('id', farmerIds);

    if (farmersErr) throw new Error(farmersErr.message);
    (farmers ?? []).forEach((f) =>
      nameById.set(f.id, f.full_name ?? 'Unknown farmer'),
    );
  }

  return rows.map((row) => ({
    ...rowToRequest(row),
    farmerName: nameById.get(row.farmer_id) ?? 'Unknown farmer',
  }));
}

export async function setAssistanceRequestStatus(
  id: string,
  status: AssistanceStatus,
  adminNote?: string,
): Promise<void> {
  const { error } = await supabase
    .from('assistance_requests')
    .update({
      status,
      admin_note: adminNote ?? null,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}