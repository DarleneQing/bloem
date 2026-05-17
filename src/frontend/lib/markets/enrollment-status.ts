export const MARKET_ENROLLMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export type MarketEnrollmentStatus = (typeof MARKET_ENROLLMENT_STATUSES)[number];

export interface MarketEnrollmentState {
  id: string;
  status: MarketEnrollmentStatus;
  submittedAt: string;
}

export function isApprovedEnrollment(status: MarketEnrollmentStatus | null | undefined): boolean {
  return status === "APPROVED";
}

export function hasEnrollmentApplication(status: MarketEnrollmentStatus | null | undefined): boolean {
  return status === "PENDING" || status === "APPROVED" || status === "REJECTED";
}
