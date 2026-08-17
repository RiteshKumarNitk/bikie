import type { Metadata } from "next";
import { getJson } from "@/lib/api";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";

export const metadata: Metadata = { title: "Testimonials" };

export default async function TestimonialsPage() {
  const { testimonials } = await getJson<{ testimonials: any[] }>("/api/admin/testimonials", { auth: true });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Testimonials</h1>
      <p className="mt-1 text-sm text-white/50">Manage customer testimonials shown on the landing page.</p>
      <TestimonialsManager initial={testimonials} />
    </div>
  );
}