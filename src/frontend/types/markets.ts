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

// Additional types for form inputs and database entities

/**
 * Market entity from database (raw format)
 */
export interface MarketEntity {
  id: string;
  name: string;
  description: string;
  location: string;
  location_name: string | null;
  start_date: string;
  end_date: string;
  max_sellers: number;
  max_hangers: number | null;
  hanger_price: number;
  picture: string;
  status: MarketStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  unlimited_hangers_per_seller: boolean;
  max_hangers_per_seller: number;
}

/**
 * Market creation form data
 */
export interface MarketCreationData {
  name: string;
  description: string;
  locationName?: string;
  streetName: string;
  streetNumber?: string;
  zipCode?: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  maxSellers: number;
  maxHangers?: number;
  hangerPrice: number;
  picture?: string;
  unlimitedHangersPerSeller: boolean;
  maxHangersPerSeller: number;
}

/**
 * Market update form data
 */
export interface MarketUpdateData extends Partial<MarketCreationData> {
  id: string;
  status?: MarketStatus;
}

/**
 * Simple market reference (for dropdowns)
 */
export interface MarketReference {
  id: string;
  name: string;
  status: MarketStatus;
}


