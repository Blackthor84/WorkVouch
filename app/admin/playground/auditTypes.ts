/** Single entry in the lab audit log. Simulations never mutate real employee records. */
export interface LabAuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  universeId: string | null;
  beforeSnapshotId?: string;
  afterSnapshotId?: string;
  notes?: string;
}
