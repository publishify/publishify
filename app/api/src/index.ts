import { WorkerEntrypoint } from "cloudflare:workers";
import type { HealthRpc } from "@publishify/contracts";
import { app } from "./app";
import type { Env } from "./env";

/** Public HTTP API of the writing editor. */
export default class AppWorker
  extends WorkerEntrypoint<Env>
  implements HealthRpc
{
  override fetch(request: Request): Response | Promise<Response> {
    return app.fetch(request, this.env, this.ctx);
  }

  async ping(): Promise<{ worker: "app" }> {
    return { worker: "app" };
  }

}
export { BookDO } from "./book-do";
