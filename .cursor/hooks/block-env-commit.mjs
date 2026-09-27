#!/usr/bin/env node
/**
 * Block git add/commit/stage when the command references .env* secrets.
 * Cursor beforeShellExecution hook — JSON in stdin, JSON out stdout.
 */
import { createInterface } from "node:readline";

async function readStdin() {
  const chunks = [];
  for await (const chunk of createInterface({ input: process.stdin })) {
    chunks.push(chunk);
  }
  const raw = chunks.join("\n").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { command: raw };
  }
}

function deniesEnvCommit(command) {
  if (!command || typeof command !== "string") return false;
  const isGitWrite =
    /\bgit\s+(add|commit|stage)\b/i.test(command) ||
    /\bgit\s+.*\s--all\b/i.test(command) ||
    /\bgit\s+.*\s-A\b/.test(command);
  if (!isGitWrite) return false;
  // Block .env / .env.local / .env.* but allow mentioning .env.example in commands
  if (/\.env\.example\b/.test(command) && !/\.env\.(local|production|development|test|staging)\b/.test(command)) {
    // still block if other secret env paths appear
    const withoutExample = command.replace(/\.env\.example\b/g, "");
    return /(^|[\s"'`]|\/)\.env(\.|[\s"'`]|$)/.test(withoutExample);
  }
  return /(^|[\s"'`]|\/)\.env(\.|[\s"'`]|$)/.test(command);
}

const input = await readStdin();
const command = input.command ?? input.tool_input?.command ?? "";

if (deniesEnvCommit(command)) {
  const message =
    "Blocked: refusing to git add/commit paths matching .env*. Use .env.example without secrets instead.";
  process.stdout.write(
    JSON.stringify({
      permission: "deny",
      user_message: message,
      agent_message: message,
    }),
  );
  process.exit(0);
}

process.stdout.write(JSON.stringify({ permission: "allow" }));
process.exit(0);
