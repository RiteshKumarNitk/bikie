"use client";

import { useState } from "react";
import { LocationPicker, LocationPickerValue } from "@/components/shared/LocationPicker";

// Reused between the signup page's inline "Partner details" block and the login
// page's self-service Rider -> Partner upgrade mini-form (ADR-013) — same field
// set, same styling, so it's centralized here instead of duplicated twice.
export const partnerTypes = [
  "RENTAL",
  "MECHANIC",
  "FUEL_DELIVERY",
  "TOUR_GUIDE",
  "HOTEL",
  "CAMPING",
  "ACCESSORIES",
  "PHOTOGRAPHY",
];

export const governmentIdTypes = { AADHAAR: "Aadhaar", PASSPORT: "Passport" };

export interface PartnerBusinessDetails {
  businessName: string;
  type: string;
  city: string;
  businessMobile: string;
  businessEmail: string;
  description: string;
  // --- ADR-014 ---
  contactPerson1Name: string;
  contactPerson1Mobile: string;
  contactPerson2Name: string;
  contactPerson2Mobile: string;
  // --- ADR-036: shop address + map pin + typed government ID ---
  addressLine: string;
  area: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  governmentIdType: string;
  governmentIdNumber: string;
  // --- §6 (OPERATIONS) ---
  workingHours: string;
  serviceRadiusKm: string;
  yearsOfExperience: string;
}

export const emptyPartnerBusinessDetails: PartnerBusinessDetails = {
  businessName: "",
  type: partnerTypes[0],
  city: "",
  businessMobile: "",
  businessEmail: "",
  description: "",
  contactPerson1Name: "",
  contactPerson1Mobile: "",
  contactPerson2Name: "",
  contactPerson2Mobile: "",
  addressLine: "",
  area: "",
  pincode: "",
  latitude: null,
  longitude: null,
  governmentIdType: "AADHAAR", // Defaulting to AADHAAR as per mockup
  governmentIdNumber: "",
  workingHours: "",
  serviceRadiusKm: "",
  yearsOfExperience: "",
};

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30";

export function PartnerBusinessFields({
  value,
  onChange,
  idPrefix = "partner",
  showDescription = true,
}: {
  value: PartnerBusinessDetails;
  onChange: (next: PartnerBusinessDetails) => void;
  idPrefix?: string;
  showDescription?: boolean;
}) {
  const [showContactPerson2, setShowContactPerson2] = useState(
    Boolean(value.contactPerson2Name || value.contactPerson2Mobile),
  );

  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleLocationChange = async (coords: LocationPickerValue) => {
    // Update coordinates immediately
    onChange({ ...value, latitude: coords.latitude, longitude: coords.longitude });
    
    // Reverse geocode
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        
        const city = address.city || address.town || address.village || address.county || value.city;
        const area = address.suburb || address.neighbourhood || address.residential || value.area;
        const pincode = address.postcode || value.pincode;
        
        const streetParts = [address.road, address.house_number, address.building].filter(Boolean);
        const addressLine = streetParts.length > 0 ? streetParts.join(", ") : value.addressLine;
        
        onChange({
          ...value,
          latitude: coords.latitude,
          longitude: coords.longitude,
          city,
          area,
          pincode,
          addressLine
        });
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* BUSINESS DETAILS BLOCK */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2">Business Details</p>
        
        <div>
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-businessName`}>
            Business / Provider name <span className="text-red-500">*</span>
          </label>
          <input
            id={`${idPrefix}-businessName`}
            value={value.businessName}
            onChange={(e) => onChange({ ...value, businessName: e.target.value })}
            placeholder="Your business or full name"
            className={inputClassName}
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Location Map <span className="font-normal text-foreground/40">(Pin to auto-fill address)</span>
            {isGeocoding && <span className="ml-2 text-xs text-accent">Fetching address...</span>}
          </label>
          <div className="mt-1.5 mb-4">
            <LocationPicker
              value={value.latitude != null && value.longitude != null ? { latitude: value.latitude, longitude: value.longitude } : null}
              onChange={handleLocationChange}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-addressLine`}>
            Street address <span className="text-red-500">*</span>
          </label>
          <input
            id={`${idPrefix}-addressLine`}
            value={value.addressLine}
            onChange={(e) => onChange({ ...value, addressLine: e.target.value })}
            placeholder="Shop / office address"
            className={inputClassName}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium" htmlFor={`${idPrefix}-area`}>
              Area <span className="text-red-500">*</span>
            </label>
            <input
              id={`${idPrefix}-area`}
              value={value.area}
              onChange={(e) => onChange({ ...value, area: e.target.value })}
              placeholder="Area / locality"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor={`${idPrefix}-city`}>
              City <span className="text-red-500">*</span>
            </label>
            <input
              id={`${idPrefix}-city`}
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              placeholder="City"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor={`${idPrefix}-pincode`}>
              Pin code <span className="text-red-500">*</span>
            </label>
            <input
              id={`${idPrefix}-pincode`}
              value={value.pincode}
              onChange={(e) => onChange({ ...value, pincode: e.target.value })}
              placeholder="6-digit PIN"
              inputMode="numeric"
              className={inputClassName}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor={`${idPrefix}-businessMobile`}>
              Mobile <span className="text-red-500">*</span>
            </label>
            <input
              id={`${idPrefix}-businessMobile`}
              value={value.businessMobile}
              onChange={(e) => onChange({ ...value, businessMobile: e.target.value })}
              placeholder="+91 XXXXX XXXXX"
              inputMode="tel"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor={`${idPrefix}-businessEmail`}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id={`${idPrefix}-businessEmail`}
              value={value.businessEmail}
              onChange={(e) => onChange({ ...value, businessEmail: e.target.value })}
              placeholder="you@example.com"
              inputMode="email"
              className={inputClassName}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor={`${idPrefix}-governmentIdNumber`}>
              Aadhaar number <span className="text-red-500">*</span>
            </label>
            <input
              id={`${idPrefix}-governmentIdNumber`}
              value={value.governmentIdNumber}
              onChange={(e) => onChange({ ...value, governmentIdNumber: e.target.value, governmentIdType: "AADHAAR" })}
              placeholder="XXXX XXXX XXXX"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor={`${idPrefix}-type`}>
              Service type <span className="text-red-500">*</span>
            </label>
            <select
              id={`${idPrefix}-type`}
              value={value.type}
              onChange={(e) => onChange({ ...value, type: e.target.value })}
              className={inputClassName}
            >
              <option value="" disabled className="bg-card">Select service</option>
              {partnerTypes.map((type) => (
                <option key={type} value={type} className="bg-card">
                  {type === "RENTAL" ? "Motorbike Rental" :
                   type === "MECHANIC" ? "Mechanic / Repair" :
                   type === "FUEL_DELIVERY" ? "Fuel Supply" :
                   type === "TOUR_GUIDE" ? "Tour Guide" :
                   type === "PHOTOGRAPHY" ? "Photography" :
                   type === "ACCESSORIES" ? "Accessories" :
                   type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Keeping original extra fields (Description, Working Hours, etc.) but making them optional */}
        {showDescription && (
          <div>
            <label className="text-sm font-medium" htmlFor={`${idPrefix}-description`}>
              Description <span className="font-normal text-foreground/40">(optional)</span>
            </label>
            <textarea
              id={`${idPrefix}-description`}
              value={value.description}
              onChange={(e) => onChange({ ...value, description: e.target.value })}
              rows={3}
              placeholder="Tell riders what you offer"
              className={inputClassName}
            />
          </div>
        )}
      </div>

      {/* OPERATIONS BLOCK - Kept as requested to not remove extra fields */}
      <div className="space-y-4 border-t border-foreground/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2">Operations</p>
        <div>
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-workingHours`}>
            Working hours <span className="font-normal text-foreground/40">(optional)</span>
          </label>
          <input
            id={`${idPrefix}-workingHours`}
            value={value.workingHours}
            onChange={(e) => onChange({ ...value, workingHours: e.target.value })}
            placeholder="e.g. Mon–Sat 9:00–19:00, Sun by appointment"
            className={inputClassName}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor={`${idPrefix}-serviceRadiusKm`}>
              Service radius (km) <span className="font-normal text-foreground/40">(optional)</span>
            </label>
            <input
              id={`${idPrefix}-serviceRadiusKm`}
              value={value.serviceRadiusKm}
              onChange={(e) => onChange({ ...value, serviceRadiusKm: e.target.value.replace(/[^0-9]/g, "") })}
              placeholder="e.g. 20"
              inputMode="numeric"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor={`${idPrefix}-yearsOfExperience`}>
              Years of experience <span className="font-normal text-foreground/40">(optional)</span>
            </label>
            <input
              id={`${idPrefix}-yearsOfExperience`}
              value={value.yearsOfExperience}
              onChange={(e) => onChange({ ...value, yearsOfExperience: e.target.value.replace(/[^0-9]/g, "") })}
              placeholder="e.g. 8"
              inputMode="numeric"
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      {/* CONTACT PERSONS BLOCK */}
      <div className="space-y-4 border-t border-foreground/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2">Contact Persons</p>
        
        <div className="rounded-xl border border-foreground/10 p-5 space-y-4 bg-foreground/[0.02]">
          <p className="text-xs font-bold tracking-wider text-foreground/60 uppercase">Contact Person 1 <span className="text-red-500">*</span></p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor={`${idPrefix}-contactPerson1Name`}>
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id={`${idPrefix}-contactPerson1Name`}
                value={value.contactPerson1Name}
                onChange={(e) => onChange({ ...value, contactPerson1Name: e.target.value })}
                placeholder="Contact person name"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor={`${idPrefix}-contactPerson1Mobile`}>
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                id={`${idPrefix}-contactPerson1Mobile`}
                value={value.contactPerson1Mobile}
                onChange={(e) => onChange({ ...value, contactPerson1Mobile: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                inputMode="numeric"
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-foreground/10 p-5 space-y-4 bg-foreground/[0.02]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold tracking-wider text-foreground/60 uppercase">
              Contact Person 2 <span className="font-normal normal-case text-foreground/40">(optional)</span>
            </p>
            {showContactPerson2 && (
              <button
                type="button"
                onClick={() => {
                  setShowContactPerson2(false);
                  onChange({ ...value, contactPerson2Name: "", contactPerson2Mobile: "" });
                }}
                className="text-xs font-medium text-accent-text hover:text-accent-hover"
              >
                Remove
              </button>
            )}
          </div>
          
          {showContactPerson2 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor={`${idPrefix}-contactPerson2Name`}>
                  Name
                </label>
                <input
                  id={`${idPrefix}-contactPerson2Name`}
                  value={value.contactPerson2Name}
                  onChange={(e) => onChange({ ...value, contactPerson2Name: e.target.value })}
                  placeholder="Contact person name"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor={`${idPrefix}-contactPerson2Mobile`}>
                  Mobile
                </label>
                <input
                  id={`${idPrefix}-contactPerson2Mobile`}
                  value={value.contactPerson2Mobile}
                  onChange={(e) => onChange({ ...value, contactPerson2Mobile: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  inputMode="numeric"
                  className={inputClassName}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowContactPerson2(true)}
              className="text-xs font-medium text-accent-text hover:text-accent-hover"
            >
              + Add another contact
            </button>
          )}
        </div>
      </div>

      {/* MONTHLY SUBSCRIPTION BLOCK (Informational) */}
      <div className="space-y-4 border-t border-foreground/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2">Monthly Subscription</p>
        <div className="rounded-xl border border-accent/50 p-5 bg-card">
          <p className="text-xs font-bold tracking-wider text-accent uppercase mb-1">Monthly Plan</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">₹99</span>
            <span className="text-sm text-foreground/50">/month</span>
          </div>
          <p className="mt-2 text-sm text-foreground/70">
            List bikes, respond to panic alerts & manage bookings via BIKIE
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm font-medium text-foreground/70">Due today (first month)</p>
          <p className="text-xl font-bold">₹99</p>
        </div>
      </div>

    </div>
  );
}
