import * as v from "valibot";
export const reviewSnapshotSchema = v.object({
  bookId: v.pipe(v.string(), v.uuid()),
  title: v.pipe(v.string(), v.maxLength(300)),
  language: v.pipe(v.string(), v.maxLength(20)),
  units: v.pipe(
    v.array(
      v.object({
        id: v.pipe(v.string(), v.uuid()),
        body: v.pipe(v.string(), v.maxLength(1000000)),
        revision: v.pipe(v.number(), v.integer(), v.minValue(0)),
      }),
    ),
    v.minLength(1),
    v.maxLength(500),
  ),
});
export type ReviewSnapshot = v.InferOutput<typeof reviewSnapshotSchema>;
export type JobState = "queued" | "running" | "done" | "failed" | "cancelled";
export type NoteAction = "open" | "accepted" | "rejected" | "resolved";
export type Evidence = {
  unitId: string;
  quote: string;
  start: number;
  end: number;
};
export type ReviewNote = {
  id: string;
  role: string;
  /** "strength" marks what works; missing means a problem (older reports). */
  kind?: "problem" | "strength";
  priority: "high" | "medium" | "low";
  message: string;
  evidence: Evidence[];
};
export type ReviewReport = {
  jobId: string;
  bookId: string;
  snapshotHash: string;
  notes: ReviewNote[];
  rejected: number;
  words: number;
  createdAt: number;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
};
export type ReviewJob = {
  id: string;
  tenant: string;
  bookId: string;
  status: JobState;
  report?: ReviewReport;
  error?: string;
};
/** App is the only caller. Tenant always comes from its authenticated session. */
export interface BoardService {
  start(input: {
    id: string;
    tenant: string;
    bookId: string;
    snapshotKey: string;
  }): Promise<void>;
  get(tenant: string, id: string): Promise<ReviewJob | null>;
  cancel(tenant: string, id: string): Promise<void>;
  erase(tenant: string, bookId: string): Promise<void>;
}
