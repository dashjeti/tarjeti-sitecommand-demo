import { sheqRecords, sheqDetails, certificates, newId, users } from '../demo/db'
import type { Certificate, Severity, SheqRecord, SheqType } from '../types'

/** Demo implementation of the SHEQ + certificates API over the in-memory store. */

export async function fetchSheqRecords(siteId?: string): Promise<SheqRecord[]> {
  return sheqRecords
    .filter((r) => !siteId || r.siteId === siteId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((r) => ({ ...r }))
}

export interface SheqInput {
  siteId: string
  recordType: SheqType
  severity: Severity
  title: string
  description?: string
  conductedById?: string
  dueDate?: string
  findings?: string
  correctiveAction?: string
}

export async function submitSheqRecord(input: SheqInput): Promise<{ id: string | null; error: string | null }> {
  const author = users.find((u) => u.id === input.conductedById)
  const rec: SheqRecord = {
    id: newId('sh'),
    type: input.recordType,
    siteId: input.siteId,
    title: input.title,
    severity: input.severity,
    status: 'open',
    date: new Date().toISOString().slice(0, 10),
    raisedBy: author?.fullName ?? 'Site staff',
    raisedById: author?.id ?? null,
    attachments: 0,
  }
  sheqRecords.unshift(rec)
  sheqDetails[rec.id] = {
    description: input.description || null,
    findings: input.findings || null,
    correctiveAction: input.correctiveAction || null,
    dueDate: input.dueDate || null,
    closedAt: null,
    attachments: [],
  }
  return { id: rec.id, error: null }
}

export async function uploadSheqAttachments(recordId: string, files: File[]): Promise<void> {
  const rec = sheqRecords.find((r) => r.id === recordId)
  if (!rec) return
  rec.attachments += files.length
  const detail = sheqDetails[recordId]
  if (detail) {
    for (const f of files) {
      detail.attachments.push({ id: newId('att'), fileName: f.name, url: URL.createObjectURL(f) })
    }
  }
}

export async function deleteSheqRecord(id: string): Promise<{ error: string | null }> {
  const i = sheqRecords.findIndex((r) => r.id === id)
  if (i >= 0) sheqRecords.splice(i, 1)
  return { error: null }
}

export async function updateSheqStatus(
  id: string,
  status: 'open' | 'in_progress' | 'closed' | 'overdue',
): Promise<{ error: string | null }> {
  const rec = sheqRecords.find((r) => r.id === id)
  if (rec) rec.status = status
  return { error: null }
}

// ── Certificates ───────────────────────────────────────────────────────────────

export async function fetchCertificates(siteId?: string): Promise<Certificate[]> {
  return certificates
    .filter((c) => !siteId || c.siteId === siteId)
    .sort((a, b) => (a.expiryDate < b.expiryDate ? -1 : 1))
    .map((c) => ({ ...c }))
}

export interface CertInput {
  siteId?: string
  certificateType: string
  certificateNumber?: string
  issuedBy?: string
  issueDate?: string
  expiryDate: string
  reminderDays?: number
  notes?: string
}

export async function submitCertificate(input: CertInput): Promise<{ error: string | null }> {
  const reminderDays = input.reminderDays ?? 30
  const days = daysUntilExpiry(input.expiryDate)
  certificates.push({
    id: newId('crt'),
    siteId: input.siteId ?? null,
    assetId: null,
    certificateType: input.certificateType,
    certificateNumber: input.certificateNumber ?? null,
    issuedBy: input.issuedBy ?? null,
    issueDate: input.issueDate ?? null,
    expiryDate: input.expiryDate,
    status: days < 0 ? 'expired' : days <= reminderDays ? 'expiring_soon' : 'valid',
    reminderDays,
    notes: input.notes ?? null,
  })
  return { error: null }
}

export async function deleteCertificate(id: string): Promise<{ error: string | null }> {
  const i = certificates.findIndex((c) => c.id === id)
  if (i >= 0) certificates.splice(i, 1)
  return { error: null }
}

export function daysUntilExpiry(expiryDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Full record detail, for the SHEQ manager reviewing what an officer wrote ──

export interface SheqAttachment {
  id: string
  fileName: string
  storagePath: string
}

export interface SheqRecordDetail {
  id: string
  type: SheqType
  siteId: string
  title: string
  severity: Severity
  status: SheqRecord['status']
  date: string
  dueDate: string | null
  closedAt: string | null
  raisedBy: string
  description: string | null
  findings: string | null
  correctiveAction: string | null
  attachments: SheqAttachment[]
}

/** One SHEQ record in full, including everything the officer typed and any
 *  files they attached. The register only carries the summary fields. */
export async function fetchSheqRecordDetail(id: string): Promise<SheqRecordDetail | null> {
  const rec = sheqRecords.find((r) => r.id === id)
  if (!rec) return null
  const detail = sheqDetails[id]
  return {
    id: rec.id,
    type: rec.type,
    siteId: rec.siteId,
    title: rec.title,
    severity: rec.severity,
    status: rec.status,
    date: rec.date,
    dueDate: detail?.dueDate ?? null,
    closedAt: detail?.closedAt ?? null,
    raisedBy: rec.raisedBy || 'Not recorded',
    description: detail?.description ?? null,
    findings: detail?.findings ?? null,
    correctiveAction: detail?.correctiveAction ?? null,
    attachments: (detail?.attachments ?? []).map((a) => ({
      id: a.id,
      fileName: a.fileName,
      // In the demo the "storage path" is the file's object/data URL itself.
      storagePath: a.url,
    })),
  }
}

/** Link to an attachment, so a manager can open what was uploaded. */
export async function sheqAttachmentUrl(storagePath: string): Promise<string | null> {
  return storagePath || null
}
