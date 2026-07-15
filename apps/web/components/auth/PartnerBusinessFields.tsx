"use client";

import { useState } from "react";

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

export interface PartnerBusinessDetails {
  businessName: string;
  type: string;
  city: string;
  description: string;
  // --- ADR-014 ---
  aadhaarNumber: string;
  contactPerson1Name: string;
  contactPerson1Mobile: string;
  contactPerson2Name: string;
  contactPerson2Mobile: string;
}

export const emptyPartnerBusinessDetails: PartnerBusinessDetails = {
  businessName: "",
  type: partnerTypes[0],
  city: "",
  description: "",
  aadhaarNumber: "",
  contactPerson1Name: "",
  contactPerson1Mobile: "",
  contactPerson2Name: "",
  contactPerson2Mobile: "",
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
  // Defaults open if there's already contact-2 data (e.g. re-rendering with
  // previously-entered values), otherwise stays collapsed behind the toggle
  // since the backend field is optional and shouldn't look mandatory.
  const [showContactPerson2, setShowContactPerson2] = useState(
    Boolean(value.contactPerson2Name || value.contactPerson2Mobile),
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-businessName`}>
          Business name
        </label>
        <input
          id={`${idPrefix}-businessName`}
          value={value.businessName}
          onChange={(e) => onChange({ ...value, businessName: e.target.value })}
          placeholder="e.g. Goa Moto Rentals"
          className={inputClassName}
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-type`}>
          Service type
        </label>
        <select
          id={`${idPrefix}-type`}
          value={value.type}
          onChange={(e) => onChange({ ...value, type: e.target.value })}
          className={inputClassName}
        >
          {partnerTypes.map((type) => (
            <option key={type} value={type} className="bg-card">
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-city`}>
          City
        </label>
        <input
          id={`${idPrefix}-city`}
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          placeholder="e.g. Goa"
          className={inputClassName}
        />
      </div>
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
      <div>
        <label className="text-sm font-medium" htmlFor={`${idPrefix}-aadhaarNumber`}>
          Aadhaar number <span className="font-normal text-foreground/40">(optional)</span>
        </label>
        <input
          id={`${idPrefix}-aadhaarNumber`}
          value={value.aadhaarNumber}
          onChange={(e) => onChange({ ...value, aadhaarNumber: e.target.value })}
          placeholder="12-digit Aadhaar number"
          inputMode="numeric"
          className={inputClassName}
        />
      </div>

      <div className="space-y-4 border-t border-foreground/10 pt-4">
        <p className="text-sm font-medium">Contact person</p>
        <div>
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-contactPerson1Name`}>
            Name
          </label>
          <input
            id={`${idPrefix}-contactPerson1Name`}
            value={value.contactPerson1Name}
            onChange={(e) => onChange({ ...value, contactPerson1Name: e.target.value })}
            placeholder="e.g. Rahul Sharma"
            className={inputClassName}
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-contactPerson1Mobile`}>
            Mobile number
          </label>
          <input
            id={`${idPrefix}-contactPerson1Mobile`}
            value={value.contactPerson1Mobile}
            onChange={(e) => onChange({ ...value, contactPerson1Mobile: e.target.value })}
            placeholder="10-digit mobile number"
            inputMode="numeric"
            className={inputClassName}
          />
        </div>

        {showContactPerson2 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground/70">
                Contact person 2 <span className="font-normal text-foreground/40">(optional)</span>
              </p>
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
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor={`${idPrefix}-contactPerson2Name`}>
                Name
              </label>
              <input
                id={`${idPrefix}-contactPerson2Name`}
                value={value.contactPerson2Name}
                onChange={(e) => onChange({ ...value, contactPerson2Name: e.target.value })}
                placeholder="e.g. Priya Verma"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor={`${idPrefix}-contactPerson2Mobile`}>
                Mobile number
              </label>
              <input
                id={`${idPrefix}-contactPerson2Mobile`}
                value={value.contactPerson2Mobile}
                onChange={(e) => onChange({ ...value, contactPerson2Mobile: e.target.value })}
                placeholder="10-digit mobile number"
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
  );
}
