export type HangerRentalStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface HangerRental {
  id: string;
  market_id: string;
  seller_id: string;
  hanger_count: number;
  total_price: number;
  status: HangerRentalStatus;
  payment_confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateHangerRentalInput {
  marketId: string;
  hangerCount: number;
}

export interface UpdateHangerRentalInput {
  id: string;
  hangerCount: number;
}

export interface CreateHangerRentalResult { success: boolean; data?: HangerRental; error?: string }
export interface UpdateHangerRentalResult { success: boolean; data?: HangerRental; error?: string }
export interface CancelHangerRentalResult { success: boolean; error?: string }


