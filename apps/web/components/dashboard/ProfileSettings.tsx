"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function ProfileSettings({ name, email, image: initialImage, phone: initialPhone }: { name: string; email: string; image: string | null; phone: string | null }) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [image, setImage] = useState(initialImage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      
      // Update the user's profile image via better-auth
      await authClient.updateUser({
        image: url,
      });
      
      setImage(url);
      router.refresh(); // Refresh to update session data everywhere
    } catch (err) {
      console.error(err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/user/phone", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-6">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-foreground/10 flex items-center justify-center">
          {image ? (
            <Image src={image} alt="Profile" fill className="object-cover" />
          ) : (
            <span className="text-2xl font-bold text-foreground/40">{name.charAt(0).toUpperCase()}</span>
          )}
          {uploadingImage && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          )}
        </div>
        <div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="rounded-xl border border-foreground/10 bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/5 disabled:opacity-50"
          >
            Change Picture
          </button>
          <p className="mt-2 text-xs text-foreground/50">JPG, PNG or GIF. Max size 5MB.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-foreground/10 pt-6">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">Name</label>
          <input readOnly value={name} className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm opacity-60" />
        </div>
        {email && !email.endsWith("@bikie.local") && (
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">Email</label>
            <input readOnly value={email} className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm opacity-60" />
          </div>
        )}
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-foreground/50">Phone (for SOS)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            placeholder="+1234567890"
            className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}