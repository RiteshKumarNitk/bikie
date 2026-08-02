"use client";

/**
 * Shared editor for a rider's emergency-contact list (0-3 entries), used by both
 * the post-signup onboarding form (`app/onboarding/page.tsx`) and the dashboard
 * settings "Rider Details" section (`components/dashboard/RiderDetailsSettings.tsx`).
 * Kept presentational/controlled so both callers can wire it to their own submit
 * logic (PUT /api/rider-profile) without duplicating the add/remove-up-to-3 logic.
 */
export interface EmergencyContactValue {
  name: string;
  phone: string;
  /** Optional — SOS fan-out emails contacts who have one, on top of SMS/WhatsApp. */
  email: string;
  relation: string;
}

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30";
const labelClassName = "text-sm font-medium";

export function EmergencyContactsEditor({
  contacts,
  onChange,
  max = 3,
}: {
  contacts: EmergencyContactValue[];
  onChange: (contacts: EmergencyContactValue[]) => void;
  max?: number;
}) {
  function updateContact(index: number, field: keyof EmergencyContactValue, value: string) {
    onChange(contacts.map((contact, i) => (i === index ? { ...contact, [field]: value } : contact)));
  }

  function removeContact(index: number) {
    onChange(contacts.filter((_, i) => i !== index));
  }

  function addContact() {
    if (contacts.length >= max) return;
    onChange([...contacts, { name: "", phone: "", email: "", relation: "" }]);
  }

  return (
    <div className="space-y-4">
      {contacts.map((contact, index) => (
        <div
          key={index}
          className="relative space-y-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4"
        >
          <button
            type="button"
            onClick={() => removeContact(index)}
            className="absolute right-3 top-3 text-xs font-medium text-foreground/40 hover:text-red-400"
            aria-label={`Remove contact ${index + 1}`}
          >
            Remove
          </button>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-text">
            Contact {index + 1}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClassName} htmlFor={`contact-name-${index}`}>
                Name
              </label>
              <input
                id={`contact-name-${index}`}
                value={contact.name}
                onChange={(e) => updateContact(index, "name", e.target.value)}
                placeholder="e.g. Priya Sharma"
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor={`contact-phone-${index}`}>
                Phone
              </label>
              <input
                id={`contact-phone-${index}`}
                type="tel"
                value={contact.phone}
                onChange={(e) => updateContact(index, "phone", e.target.value)}
                placeholder="+91 98765 43210"
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor={`contact-email-${index}`}>
                Email <span className="font-normal text-foreground/40">(optional)</span>
              </label>
              <input
                id={`contact-email-${index}`}
                type="email"
                value={contact.email}
                onChange={(e) => updateContact(index, "email", e.target.value)}
                placeholder="priya@example.com"
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor={`contact-relation-${index}`}>
                Relation <span className="font-normal text-foreground/40">(optional)</span>
              </label>
              <input
                id={`contact-relation-${index}`}
                value={contact.relation}
                onChange={(e) => updateContact(index, "relation", e.target.value)}
                placeholder="e.g. Spouse, Parent, Friend"
                className={inputClassName}
              />
            </div>
          </div>
        </div>
      ))}

      {contacts.length < max && (
        <button
          type="button"
          onClick={addContact}
          className="w-full rounded-xl border border-dashed border-foreground/20 py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:border-accent hover:text-accent-text"
        >
          + Add another contact
        </button>
      )}
    </div>
  );
}
