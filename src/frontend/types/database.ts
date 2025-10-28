// Database types generated from Supabase schema

export type UserRole = "USER" | "ADMIN";
export type WardrobeStatus = "PUBLIC" | "PRIVATE";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          address: string | null;
          iban: string | null;
          bank_name: string | null;
          account_holder_name: string | null;
          iban_verified_at: string | null;
          role: UserRole;
          wardrobe_status: WardrobeStatus;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          address?: string | null;
          iban?: string | null;
          bank_name?: string | null;
          account_holder_name?: string | null;
          iban_verified_at?: string | null;
          role?: UserRole;
          wardrobe_status?: WardrobeStatus;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          address?: string | null;
          iban?: string | null;
          bank_name?: string | null;
          account_holder_name?: string | null;
          iban_verified_at?: string | null;
          role?: UserRole;
          wardrobe_status?: WardrobeStatus;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// Extended profile type with computed properties
export type ProfileWithStatus = Profile & {
  isActiveSeller: boolean;
};

