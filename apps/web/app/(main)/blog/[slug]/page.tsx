import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { blogPosts, type BlogPost } from "@/lib/blog-data";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Post Not Found" };
  return { title: post.title, description: post.excerpt };
}

function blogPostJsonLd(post: BlogPost) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: [post.coverImage],
    datePublished: post.publishedAt,
    articleSection: post.category,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "BIKIE" },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <div className="pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostJsonLd(post)) }}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />

      <div className="mx-auto max-w-3xl px-6 pt-6">
        <span className="text-xs font-medium uppercase tracking-wide text-accent-text">{post.category}</span>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{post.title}</h1>
        <p className="mt-2 text-sm text-foreground/50">
          {post.author} ·{" "}
          {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl">
          <Image src={post.coverImage} alt={post.title} fill priority className="object-cover" />
        </div>

        <div className="mt-8 space-y-5 text-foreground/70">
          {post.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
