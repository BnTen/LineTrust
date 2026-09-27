/**
 * Pure watermark decision — second run with same hash = noop (no partition rewrite).
 */

export interface WatermarkRow {
  sourceId: string;
  partitionKey: string;
  contentHash: string;
  rowCount: number;
  status: "loaded" | "noop" | "failed";
}

export type LoadDecision =
  | { action: "noop"; reason: "hash_unchanged" }
  | { action: "replace"; reason: "new_partition" | "hash_changed" };

export function decidePartitionLoad(
  existing: WatermarkRow | null,
  nextHash: string,
): LoadDecision {
  if (existing && existing.contentHash === nextHash && existing.status === "loaded") {
    return { action: "noop", reason: "hash_unchanged" };
  }
  if (!existing) return { action: "replace", reason: "new_partition" };
  return { action: "replace", reason: "hash_changed" };
}
