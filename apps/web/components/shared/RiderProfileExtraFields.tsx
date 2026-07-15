"use client";

/**
 * Shared field group for the ADR-014 additions to `RiderProfile` (father/mother
 * name, DOB, gender, blood group, medical info, vehicle details, government ID,
 * and riding-frequency/club preferences). Used by both the post-signup onboarding
 * form (`app/onboarding/page.tsx`) and the dashboard settings "Rider Details"
 * section (`components/dashboard/RiderDetailsSettings.tsx`), same precedent as
 * `EmergencyContactsEditor` — presentational/controlled, each caller owns the
 * state and wires it into its own `PUT /api/rider-profile` submit.
 */
export interface RiderProfileExtraValue {
  fatherName: string;
  motherName: string;
  dateOfBirth: string; // yyyy-mm-dd, <input type="date"> value
  gender: string;
  bloodGroup: string;
  medicalHistory: string;
  allergies: string;
  vehicleType: string;
  vehicleBrand: string;
  vehicleModel: string;
  governmentIdType: string; // "" | "AADHAAR" | "PASSPORT"
  governmentIdNumber: string;
  riderFrequency: string; // "" | "OCCASIONAL" | "WEEKLY" | "DAILY"
  ridingClubType: string; // "" | "SOLO" | "CLUB_MEMBER"
  clubName: string;
}

export const emptyRiderProfileExtraValue: RiderProfileExtraValue = {
  fatherName: "",
  motherName: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  medicalHistory: "",
  allergies: "",
  vehicleType: "",
  vehicleBrand: "",
  vehicleModel: "",
  governmentIdType: "",
  governmentIdNumber: "",
  riderFrequency: "",
  ridingClubType: "",
  clubName: "",
};

export const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
export const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const vehicleTypeOptions = ["Motorbike", "Scooter", "Bicycle", "Other"];
export const governmentIdTypeOptions: { value: "AADHAAR" | "PASSPORT"; label: string }[] = [
  { value: "AADHAAR", label: "Aadhaar" },
  { value: "PASSPORT", label: "Passport" },
];
export const riderFrequencyOptions: { value: "OCCASIONAL" | "WEEKLY" | "DAILY"; label: string }[] = [
  { value: "OCCASIONAL", label: "Occasional" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "DAILY", label: "Daily" },
];

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30";
const labelClassName = "text-sm font-medium";

export function RiderProfileExtraFields({
  value,
  onChange,
  idPrefix = "",
  sectionHeadingClassName = "text-xs font-semibold uppercase tracking-wider text-accent-text",
}: {
  value: RiderProfileExtraValue;
  onChange: (next: RiderProfileExtraValue) => void;
  idPrefix?: string;
  sectionHeadingClassName?: string;
}) {
  function set<K extends keyof RiderProfileExtraValue>(field: K, fieldValue: RiderProfileExtraValue[K]) {
    onChange({ ...value, [field]: fieldValue });
  }

  const id = (name: string) => `${idPrefix}${name}`;

  return (
    <>
      <div className="space-y-4 border-t border-foreground/10 pt-6">
        <p className={sectionHeadingClassName}>Personal details</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClassName} htmlFor={id("fatherName")}>
              Father&apos;s name
            </label>
            <input
              id={id("fatherName")}
              value={value.fatherName}
              onChange={(e) => set("fatherName", e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor={id("motherName")}>
              Mother&apos;s name
            </label>
            <input
              id={id("motherName")}
              value={value.motherName}
              onChange={(e) => set("motherName", e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor={id("dateOfBirth")}>
              Date of birth
            </label>
            <input
              id={id("dateOfBirth")}
              type="date"
              value={value.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor={id("gender")}>
              Gender
            </label>
            <select
              id={id("gender")}
              value={value.gender}
              onChange={(e) => set("gender", e.target.value)}
              className={inputClassName}
            >
              <option value="" className="bg-card">
                Prefer not to answer
              </option>
              {genderOptions.map((option) => (
                <option key={option} value={option} className="bg-card">
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor={id("bloodGroup")}>
              Blood group
            </label>
            <select
              id={id("bloodGroup")}
              value={value.bloodGroup}
              onChange={(e) => set("bloodGroup", e.target.value)}
              className={inputClassName}
            >
              <option value="" className="bg-card">
                Select blood group
              </option>
              {bloodGroupOptions.map((option) => (
                <option key={option} value={option} className="bg-card">
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClassName} htmlFor={id("medicalHistory")}>
            Medical history <span className="font-normal text-foreground/40">(optional)</span>
          </label>
          <textarea
            id={id("medicalHistory")}
            value={value.medicalHistory}
            onChange={(e) => set("medicalHistory", e.target.value)}
            rows={3}
            placeholder="Any conditions partners or riders should be aware of in an emergency"
            className={inputClassName}
          />
        </div>
        <div>
          <label className={labelClassName} htmlFor={id("allergies")}>
            Allergies <span className="font-normal text-foreground/40">(optional)</span>
          </label>
          <textarea
            id={id("allergies")}
            value={value.allergies}
            onChange={(e) => set("allergies", e.target.value)}
            rows={2}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-foreground/10 pt-6">
        <p className={sectionHeadingClassName}>Vehicle details</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClassName} htmlFor={id("vehicleType")}>
              Vehicle type
            </label>
            <select
              id={id("vehicleType")}
              value={value.vehicleType}
              onChange={(e) => set("vehicleType", e.target.value)}
              className={inputClassName}
            >
              <option value="" className="bg-card">
                Select vehicle type
              </option>
              {vehicleTypeOptions.map((option) => (
                <option key={option} value={option} className="bg-card">
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor={id("vehicleBrand")}>
              Brand
            </label>
            <input
              id={id("vehicleBrand")}
              value={value.vehicleBrand}
              onChange={(e) => set("vehicleBrand", e.target.value)}
              placeholder="e.g. Royal Enfield"
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor={id("vehicleModel")}>
              Model
            </label>
            <input
              id={id("vehicleModel")}
              value={value.vehicleModel}
              onChange={(e) => set("vehicleModel", e.target.value)}
              placeholder="e.g. Classic 350"
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-foreground/10 pt-6">
        <div>
          <p className={sectionHeadingClassName}>Government ID</p>
          <p className="mt-1 text-sm text-foreground/60">
            Collected as plain text for reference only — we don&apos;t run any identity
            verification on this.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor={id("governmentIdType")}>
              ID type
            </label>
            <select
              id={id("governmentIdType")}
              value={value.governmentIdType}
              onChange={(e) => set("governmentIdType", e.target.value)}
              className={inputClassName}
            >
              <option value="" className="bg-card">
                Select ID type
              </option>
              {governmentIdTypeOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-card">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor={id("governmentIdNumber")}>
              ID number
            </label>
            <input
              id={id("governmentIdNumber")}
              value={value.governmentIdNumber}
              onChange={(e) => set("governmentIdNumber", e.target.value)}
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-foreground/10 pt-6">
        <p className={sectionHeadingClassName}>Riding details</p>
        <div>
          <label className={labelClassName} htmlFor={id("riderFrequency")}>
            How often do you ride?
          </label>
          <select
            id={id("riderFrequency")}
            value={value.riderFrequency}
            onChange={(e) => set("riderFrequency", e.target.value)}
            className={inputClassName}
          >
            <option value="" className="bg-card">
              Select frequency
            </option>
            {riderFrequencyOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-card">
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={labelClassName}>Riding style</span>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={() => set("ridingClubType", "SOLO")}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                value.ridingClubType === "SOLO"
                  ? "border-accent bg-accent/10 text-accent-text"
                  : "border-foreground/15 text-foreground/60 hover:border-foreground/30"
              }`}
            >
              Solo rider
            </button>
            <button
              type="button"
              onClick={() => set("ridingClubType", "CLUB_MEMBER")}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                value.ridingClubType === "CLUB_MEMBER"
                  ? "border-accent bg-accent/10 text-accent-text"
                  : "border-foreground/15 text-foreground/60 hover:border-foreground/30"
              }`}
            >
              Club member
            </button>
          </div>
        </div>
        {value.ridingClubType === "CLUB_MEMBER" && (
          <div>
            <label className={labelClassName} htmlFor={id("clubName")}>
              Club name
            </label>
            <input
              id={id("clubName")}
              value={value.clubName}
              onChange={(e) => set("clubName", e.target.value)}
              placeholder="e.g. Himalayan Riders Collective"
              className={inputClassName}
            />
          </div>
        )}
      </div>
    </>
  );
}
