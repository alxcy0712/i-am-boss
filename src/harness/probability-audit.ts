import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { auditProbabilityConfig, type ProbabilityConfigAudit } from "./probability-config-audit";

export function createProbabilityAuditCliReport(): ProbabilityConfigAudit {
  return auditProbabilityConfig();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(createProbabilityAuditCliReport(), null, 2));
}
