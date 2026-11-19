import type { BookDO } from "./book-do";

export interface Env {
  ENVIRONMENT: "local" | "staging" | "production";
  DB: D1Database;
  SNAPSHOTS: R2Bucket;
  ALLOWED_HOSTS?: string;
  /** Passkey relying party: the host itself, or a parent domain shared by its subdomains. */
  RP_ID?: string;
  /** OAuth client used for Sign in with Google (public, not a secret). */
  GOOGLE_CLIENT_ID?: string;
  PUBLIC_PAGES_ENABLED?: string;
  BOOKS: DurableObjectNamespace<BookDO>;
  ASSETS: Fetcher;
}

export type User = { id: string; name: string };
export type AppEnv = { Bindings: Env; Variables: { user: User } };

export interface SyncItem {
  id: string;
  kind: "part" | "chapter" | "scene";
  title: string;
  body: string;
  /** The server sequence number at which the client last synced this chapter (0 = new). */
  baseSeq: number;
  deleted?: boolean | undefined;
}
export interface SyncIn {
  cursor: number;
  meta?:
    | {
        title: string;
        author: string;
        genre?: string | undefined;
        lang?: string | undefined;
      }
    | undefined;
  order?: string[] | undefined;
  items: SyncItem[];
}
export interface OutItem {
  id: string;
  kind: "part" | "chapter" | "scene";
  title: string;
  body: string;
  deleted: boolean;
  seq: number;
}
export interface SyncOut {
  metadataConflicts?: string[];
  cursor: number;
  items: OutItem[];
  order: string[] | null;
  meta: {
    title: string;
    author: string;
    genre?: string | undefined;
    lang?: string | undefined;
  } | null;
  accepted: Record<string, number>;
  conflicts: { id: string; copyId: string }[];
}
