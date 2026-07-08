import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the BIKIE team — email, phone, office, and social links.",
};

export default function ContactPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]} />

      <div className="mx-auto max-w-5xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Contact Us</h1>
        <p className="mt-2 text-foreground/60">We usually respond within a business day.</p>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ContactForm />

          <div className="space-y-6">
            <div className="rounded-3xl bg-card p-6">
              <p className="text-sm text-foreground/50">Email</p>
              <p className="mt-1 font-medium">support@bikie.app</p>
            </div>
            <div className="rounded-3xl bg-card p-6">
              <p className="text-sm text-foreground/50">Phone</p>
              <p className="mt-1 font-medium">+91 98765 43210</p>
            </div>
            <div className="rounded-3xl bg-card p-6">
              <p className="text-sm text-foreground/50">Office</p>
              <p className="mt-1 font-medium">BIKIE HQ, Jaipur, Rajasthan, India</p>
            </div>
            <div className="rounded-3xl bg-card p-6">
              <p className="text-sm text-foreground/50">Social</p>
              <p className="mt-1 font-medium">@bikieapp on Instagram, Facebook &amp; YouTube</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
