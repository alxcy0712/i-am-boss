import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROBABILITY_CONFIG } from "../config/probabilities";

export interface ProbabilityConfigAudit {
  topLevelSections: string[];
  requiredSections: string[];
  missingRequiredSections: string[];
  numericLeafCount: number;
  invalidChancePaths: string[];
  uncommentedSections: string[];
}

export const REQUIRED_PROBABILITY_SECTIONS = [
  "founder",
  "hiring",
  "cultureFit",
  "companyCulture",
  "valuation",
  "society",
  "specialEvents",
  "staffing",
  "candidateBackground",
  "resignation",
  "finance",
  "employeeLifecycle",
  "promotion",
  "macroCycle",
  "policy",
  "court",
  "laborMarket",
  "securitiesMarket",
] as const;

export function auditProbabilityConfig(): ProbabilityConfigAudit {
  const sourcePath = resolve(dirname(fileURLToPath(import.meta.url)), "../config/probabilities.ts");
  return auditProbabilityConfigSource(PROBABILITY_CONFIG, readFileSync(sourcePath, "utf8"));
}

export function auditProbabilityConfigSource(
  config: Record<string, unknown>,
  sourceText: string,
): ProbabilityConfigAudit {
  const topLevelSections = Object.keys(config);
  const numericLeaves = collectNumericLeaves(config);

  return {
    topLevelSections,
    requiredSections: [...REQUIRED_PROBABILITY_SECTIONS],
    missingRequiredSections: REQUIRED_PROBABILITY_SECTIONS.filter(
      (section) => !topLevelSections.includes(section),
    ),
    numericLeafCount: numericLeaves.length,
    invalidChancePaths: numericLeaves
      .filter((leaf) => isChanceLikePath(leaf.path))
      .filter((leaf) => leaf.value < 0 || leaf.value > 1)
      .map((leaf) => leaf.path),
    uncommentedSections: topLevelSections.filter(
      (section) => !sectionBlockHasComment(sourceText, section),
    ),
  };
}

function collectNumericLeaves(
  value: unknown,
  path: string[] = [],
): Array<{ path: string; value: number }> {
  if (typeof value === "number") {
    return [{ path: path.join("."), value }];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    collectNumericLeaves(child, [...path, key]),
  );
}

function isChanceLikePath(path: string): boolean {
  const normalized = path.toLowerCase();
  return (
    normalized.includes("chance") ||
    normalized.includes("probability") ||
    normalized.includes("risk") ||
    normalized.includes("acceptance")
  );
}

function sectionBlockHasComment(sourceText: string, section: string): boolean {
  const start = sourceText.indexOf(`  ${section}:`);
  if (start < 0) {
    return false;
  }

  const rest = sourceText.slice(start + section.length + 3);
  const nextSection = rest.search(/\n {2}[a-zA-Z][a-zA-Z0-9]*:/);
  const sectionBlock = nextSection >= 0 ? rest.slice(0, nextSection) : rest;
  return sectionBlock.includes("//");
}
