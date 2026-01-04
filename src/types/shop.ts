// Shop Profile Types

export type ShopType = 'diesel-heavy-duty' | 'gas-automotive' | 'both';
export type ServiceLocation = 'mobile-only' | 'shop-only' | 'both';

// Diesel/Heavy-Duty Services
export type DieselServiceType = 
  | 'engine-diagnostics'
  | 'engine-repair'
  | 'engine-rebuild'
  | 'transmission-repair'
  | 'brake-system'
  | 'air-brake-service'
  | 'electrical-diagnostics'
  | 'electrical-repair'
  | 'tire-service'
  | 'tire-replacement'
  | 'wheel-alignment'
  | 'suspension-repair'
  | 'hydraulic-systems'
  | 'air-conditioning'
  | 'exhaust-repair'
  | 'def-system'
  | 'dpf-cleaning'
  | 'oil-change'
  | 'preventive-maintenance'
  | 'dot-inspections'
  | 'trailer-repair'
  | 'reefer-repair'
  | 'welding'
  | 'roadside-assistance';

// Gas/Automotive Services
export type GasServiceType = 
  | 'engine-diagnostics'
  | 'engine-repair'
  | 'transmission-service'
  | 'transmission-repair'
  | 'brake-service'
  | 'brake-replacement'
  | 'oil-change'
  | 'tune-up'
  | 'electrical-diagnostics'
  | 'electrical-repair'
  | 'battery-service'
  | 'tire-rotation'
  | 'tire-replacement'
  | 'wheel-alignment'
  | 'suspension-repair'
  | 'air-conditioning'
  | 'heating-repair'
  | 'exhaust-repair'
  | 'catalytic-converter'
  | 'emissions-testing'
  | 'state-inspection'
  | 'windshield-replacement'
  | 'fluid-service'
  | 'coolant-flush'
  | 'fuel-system-cleaning'
  | 'timing-belt'
  | 'roadside-assistance';

export interface ShopProfile {
  id: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  
  // Shop Type
  shopType: ShopType;
  serviceLocation: ServiceLocation;
  
  // Services Offered
  dieselServices?: DieselServiceType[];
  gasServices?: GasServiceType[];
  
  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  
  // Business Details
  businessLicense?: string;
  insuranceCertificate?: string;
  taxId?: string;
  
  // Hours of Operation
  hours?: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };
  
  // Additional Info
  mobileServiceRadius?: number; // miles
  emergencyService24_7?: boolean;
  acceptedPaymentMethods?: ('cash' | 'credit-card' | 'debit-card' | 'check' | 'financing')[];
  
  // Status
  verified: boolean;
  active: boolean;
  profileComplete: boolean; // Tracks if shop has completed onboarding (business license, insurance, services)
  createdAt: string;
  updatedAt: string;
}

export interface ShopFormData {
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  shopType: ShopType;
  serviceLocation: ServiceLocation;
  dieselServices: DieselServiceType[];
  gasServices: GasServiceType[];
  address: string;
  city: string;
  state: string;
  zipCode: string;
  username: string;
  password: string;
  businessLicense?: string;
  insuranceCertificate?: string;
  taxId?: string;
  mobileServiceRadius?: number;
  emergencyService24_7: boolean;
  acceptedPaymentMethods: ('cash' | 'credit-card' | 'debit-card' | 'check' | 'financing')[];
}
