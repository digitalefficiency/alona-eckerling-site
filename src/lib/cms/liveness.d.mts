// Type surface of liveness.mjs (the "is my publish live?" decision).
export type LivenessReason = "local" | "exact" | "contained" | "building" | "no-vercel-metadata" | "bad-sha";

export declare function livenessVerdict(input: {
  onVercel: boolean;
  servingSha: string | undefined;
  commitSha: string | undefined;
  containment?: "contained" | "not-contained" | "unknown";
}): { live: boolean; reason: LivenessReason };
