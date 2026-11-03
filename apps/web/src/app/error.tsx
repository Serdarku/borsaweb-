"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold text-rose-400">Bir hata oluştu</h2>
      <p className="text-zinc-400 mt-2 text-sm">{error.message}</p>
      <button onClick={reset} className="mt-4 bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm">Tekrar dene</button>
    </div>
  );
}