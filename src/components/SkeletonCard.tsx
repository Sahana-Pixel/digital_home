export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5 animate-skeleton"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}
    >
      <div className="h-8 w-8 rounded-lg bg-[#94A3B8]/30 mb-3" />
      <div className="h-5 w-24 rounded bg-[#94A3B8]/30" />
    </div>
  );
}

export function SkeletonRoomHeader() {
  return (
    <div
      className="rounded-b-2xl px-6 py-6 animate-skeleton"
      style={{ backgroundColor: "rgba(148, 163, 184, 0.15)" }}
    >
      <div className="h-7 w-48 rounded bg-[#94A3B8]/30" />
      <div className="h-4 w-64 rounded bg-[#94A3B8]/20 mt-2" />
      <div className="h-3 w-24 rounded bg-[#94A3B8]/20 mt-2" />
    </div>
  );
}
