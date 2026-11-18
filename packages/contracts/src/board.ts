// The RPC contract between the app Worker and the board Worker (LLD 4).
// It carries no role cards, prompts or raw model output (NFR-2).

export type Genre =
  | "literary-novel"
  | "short-story"
  | "flash-fiction"
  | (string & {});
export type Tier = "standard" | "deep";

/** A unit is one chapter with its scenes. */
export interface UnitRef {
  unitId: string;
  hash: string;
  words: number;
}

/** Stored in R2 at snapshots/<tenant>/<bookId>/<jobId>.json. */
export interface Snapshot {
  bookId: string;
  title: string;
  lang: string;
  units: Array<UnitRef & { title: string; itemIds: string[]; text: string }>;
}

export type ReviewState =
  | "queued"
  | "running"
  | "done"
  | "failed"
  | "cancelled";
export type ReviewStep =
  | "measure"
  | "editor"
  | "auditor"
  | "reader"
  | "stages"
  | "chief";
export type ReviewErrorCode =
  | "cost_cap"
  | "model_unavailable"
  | "snapshot_missing"
  | "internal";

export interface ReviewStatus {
  jobId: string;
  status: ReviewState;
  step: ReviewStep | null;
  unitsTotal: number;
  unitsDone: number;
  /** Quota is charged from this number. */
  wordsRead: number;
  error?: { code: ReviewErrorCode };
}

export interface Note {
  id: string;
  role: "editor" | "auditor" | "reader";
  unitId: string;
  itemId: string | null;
  /** Verbatim in the unit text, at most 25 words. */
  quote: string;
  body: string;
  severity: "low" | "medium" | "high";
}

/** The Seven Stages. "absent" is a valid state, not a defect. */
export type StageState = "explicit" | "implicit" | "absent" | "not_written";

export interface StageEntry {
  stage: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  state: StageState;
  /** Set for explicit and implicit. */
  unitId: string | null;
  /** Verbatim, at most 25 words. Set for explicit and implicit. */
  quote: string | null;
}

/** Always seven entries, in order. */
export interface StagesMap {
  stages: StageEntry[];
}

/** Shape is defined with the dashboard in phase A2. */
export type DashboardData = Record<string, unknown>;

export interface Report {
  jobId: string;
  notes: Note[];
  stages: StagesMap;
  dashboard: DashboardData;
}

export interface BoardRpc {
  estimate(i: {
    tenant: string;
    bookId: string;
    genre: Genre;
    tier: Tier;
    units: UnitRef[];
  }): Promise<{
    unitsToRead: number;
    wordsToRead: number;
  }>;
  /** Idempotent per jobId: the app generates the id. */
  startReview(i: {
    jobId: string;
    tenant: string;
    bookId: string;
    snapshotKey: string;
    genre: Genre;
    tier: Tier;
    lang: string;
    uiLang: string;
  }): Promise<void>;
  getReview(i: { tenant: string; jobId: string }): Promise<ReviewStatus>;
  getReport(i: { tenant: string; jobId: string }): Promise<Report>;
  cancelReview(i: { tenant: string; jobId: string }): Promise<void>;
  /** Idempotent. */
  eraseBook(i: { tenant: string; bookId: string }): Promise<void>;
  /** Idempotent. */
  eraseTenant(i: { tenant: string }): Promise<void>;
}

export interface AppRpc {
  /** Idempotent. Called by the board when a review ends in any state. */
  reviewFinished(i: { tenant: string; jobId: string }): Promise<void>;
}
