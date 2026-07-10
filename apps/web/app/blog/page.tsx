import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { blogPosts } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Blog",
  description: "Travel guides, bike reviews, maintenance tips, routes, and safety advice from BIKIE.",
};

export default function BlogPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">The BIKIE Blog</h1>
        <p className="mt-2 text-foreground/60">Travel, reviews, maintenance, touring, safety, routes, and guides.</p>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-3xl bg-card">
              <div className="relative aspect-[16/10]">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <span className="text-xs font-medium uppercase tracking-wide text-accent-text">{post.category}</span>
                <p className="mt-2 font-semibold">{post.title}</p>
                <p className="mt-2 text-sm text-foreground/60">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
