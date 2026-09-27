import { spawnSync } from "node:child_process";

function run(command) {
  return spawnSync(process.execPath, [".cursor/hooks/block-env-commit.mjs"], {
    input: JSON.stringify({ command }),
    encoding: "utf8",
  });
}

const denyCmd = ["git", "add", ".env.local"].join(" ");
const allowCmd = ["git", "status"].join(" ");

const deny = JSON.parse(run(denyCmd).stdout);
const allow = JSON.parse(run(allowCmd).stdout);

if (deny.permission !== "deny") {
  console.error("FAIL: expected deny", deny);
  process.exit(1);
}
if (allow.permission !== "allow") {
  console.error("FAIL: expected allow", allow);
  process.exit(1);
}
console.log("hook smoke OK");
