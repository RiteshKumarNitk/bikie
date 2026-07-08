import type { CategoryDTO } from "@bikie/types";
import { Reveal } from "@/components/shared/Reveal";
import { CategoriesScroller } from "./CategoriesScroller";

export function Categories({ categories }: { categories: CategoryDTO[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <Reveal>
        <h2 className="text-3xl font-semibold md:text-4xl">Ride Your Style</h2>
        <p className="mt-2 text-foreground/60">Every category, one search away.</p>
      </Reveal>
      <div className="mt-8">
        <CategoriesScroller categories={categories} />
      </div>
    </section>
  );
}
