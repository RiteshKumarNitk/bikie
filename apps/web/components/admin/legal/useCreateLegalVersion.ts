"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LegalDocumentTypeDTO, LegalVersionDetailDTO } from "@bikie/types";
import { useToast } from "@/components/ui/Toast";

/** "Create New Version" — starts the next version as a DRAFT (pre-filled from the current text) and
 * opens its editor. If a draft already exists, opens that one instead of failing. */
export function useCreateLegalVersion() {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState<LegalDocumentTypeDTO | null>(null);

  async function create(type: LegalDocumentTypeDTO) {
    setCreating(type);
    try {
      const res = await fetch(`/api/admin/legal/${type}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = (await res.json().catch(() => ({}))) as Partial<LegalVersionDetailDTO> & {
        error?: string;
        message?: string;
        draftId?: string;
      };
      if (res.status === 409 && data.draftId) {
        toast.info("A draft is already in progress — opening it.");
        router.push(`/admin/legal/versions/${data.draftId}`);
        return;
      }
      if (!res.ok || !data.id) throw new Error(data.message ?? "Could not create a new version.");
      router.push(`/admin/legal/versions/${data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create a new version.");
    } finally {
      setCreating(null);
    }
  }

  return { create, creating };
}
