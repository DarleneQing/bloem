export type MarketStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface MarketLocation {
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
}

export interface MarketDates {
  start: string; // ISO string
  end: string;   // ISO string
}

export interface MarketCapacity {
  maxVendors: number;
  currentVendors: number;
  availableSpots: number;
  maxHangers: number;
  currentHangers: number;
  availableHangers: number;
}

export interface MarketPricing {
  hangerPrice: number;
}

export interface MarketSummary {
  id: string;
  name: string;
  description?: string | null;
  pictureUrl?: string | null;
  location: MarketLocation;
  dates: MarketDates;
  capacity: MarketCapacity;
  pricing: MarketPricing;
  status: MarketStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface MarketDetail extends MarketSummary {
  createdBy?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  statistics?: {
    totalHangersRented: number;
    totalItems: number;
    totalRentals: number;
    totalTransactions: number;
  };
  isRegistered?: boolean;
}

export interface MarketListFilters {
  status?: "ACTIVE" | "COMPLETED" | "all";
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "start_date" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface MarketRegistrationResult { success: boolean }

export interface MarketCapacityResult {
  vendors: { max: number; current: number; available: number };
  hangers: { max: number; current: number; available: number };
}


