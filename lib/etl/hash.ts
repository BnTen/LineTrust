import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { finished } from "node:stream/promises";

/** SHA-256 hex of a file — used for ETL watermark noop. */
export async function hashFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  const stream = createReadStream(path);
  stream.on("data", (chunk: Buffer | string) => {
    hash.update(chunk);
  });
  await finished(stream);
  return hash.digest("hex");
}

export function hashBuffer(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}
