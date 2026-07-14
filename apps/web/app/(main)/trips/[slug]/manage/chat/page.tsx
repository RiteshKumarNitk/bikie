import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getJson } from "@/lib/api";
import { TripDetailDTO } from "@bikie/types";
import Link from "next/link";

export default async function ChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { trip } = await getJson<{ trip: TripDetailDTO }>(`/api/trips/${slug}`);
  if (!trip) notFound();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Community Chat</h2>
      <div className="rounded-3xl bg-card border border-foreground/10 p-6 text-center py-12">
        <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Centralized Conversations</h3>
        <p className="text-foreground/60 text-sm mt-2 max-w-sm mx-auto">
          We've centralized all group chats in the Community Dashboard so you can communicate with all your rides in one place.
        </p>
        <div className="mt-6">
          <Link href="/dashboard/messages" className="bg-foreground text-background px-6 py-3 rounded-full font-semibold hover:bg-foreground/90 transition">
            Go to Inbox
          </Link>
        </div>
      </div>
    </div>
  );
}
