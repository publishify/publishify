/** Serial writes keep an older save from completing after a newer one. */
export function createWriter<T>(
  write: (key: string, value: T) => Promise<void>,
) {
  let tail = Promise.resolve();
  return {
    save(key: string, value: T) {
      const task = tail.catch(() => {}).then(() => write(key, value));
      tail = task;
      return task;
    },
    flush() {
      return tail;
    },
  };
}
export const workspaceKey = (owner: string | null) =>
  `publishify:platform:v1:${owner ?? "guest"}`;

/**
 * Runs `run` at most once per `delay` while requests keep coming, so typing does not
 * rewrite the whole library on every keystroke. `flush` runs a pending request now.
 */
export function createCoalescer(run: () => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    request() {
      if (timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        run();
      }, delay);
    },
    flush() {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      run();
    },
  };
}
