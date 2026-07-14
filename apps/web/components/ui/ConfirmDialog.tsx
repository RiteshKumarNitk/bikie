"use client";

import { useState } from "react";

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-2 text-sm text-white/60">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{ title: string; message: string; resolve: (v: boolean) => void } | null>(null);

  const confirm = (title: string, message: string) =>
    new Promise<boolean>((resolve) => setState({ title, message, resolve }));

  const dialog = state ? (
    <ConfirmDialog
      open
      title={state.title}
      message={state.message}
      onConfirm={() => { state.resolve(true); setState(null); }}
      onCancel={() => { state.resolve(false); setState(null); }}
    />
  ) : null;

  return { confirm, dialog };
}