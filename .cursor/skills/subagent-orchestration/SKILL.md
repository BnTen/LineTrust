---
name: subagent-orchestration
description: >-
  When and how to delegate heavy data profiling, schema mapping, codebase research,
  and verification to subagents so the main feature agent keeps a lean context.
  Use before reading large CSV/GTFS, before Phase E profiling, or when tempted to
  paste raw dumps into the main thread.
---

# Subagent orchestration

## Goal

Main agent = implement features with a **light** context.  
Subagents = noisy exploration; they return **short structured summaries**.

## Roster

| Agent | Definition | Returns |
|-------|-------------|---------|
| explorer-data | `.claude/agents/explorer-data.md` | Inventory, sizes, candidate joins |
| schema-profiler | `.claude/agents/schema-profiler.md` | Columns, types, null%, 3–5 examples, anomalies |
| verifier | `.claude/agents/verifier.md` | lint/test/etl check report (no code edits) |
| codebase-research | Cursor Task `explore` | Files + APIs to touch |

## Hard rules

1. **Forbidden:** paste large files, thousands of rows, or full schema dumps into the main thread.
2. **Mandatory delegate** when file &gt; ~500 lines or &gt; ~1 Mo, or GTFS multi-file zips.
3. Subagent output contract: markdown short — columns + types + 3–5 examples + anomalies + mapping reco. Persist durable notes under `docs/exploration/`.
4. Main agent **does not re-read raw** after delegation; codes from summary/artifact.
5. Max **2–3** parallel subagents per turn.
6. **Forbidden** to subagent under-threshold files or questions already answered in `docs/exploration/`.
7. Refine `.claude/agents/` when a pattern repeats.

## Prompt template (delegate)

```
Goal: <one sentence>
Inputs: <paths>
Constraints: do not implement product features; return summary contract only
Write durable findings to: docs/exploration/<name>.md (if lasting)
```
