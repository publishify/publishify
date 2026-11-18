/** Implemented by both Workers so each side can confirm its service binding reaches the other. */
export interface HealthRpc {
  ping(): Promise<{ worker: "app" | "board" }>;
}
