import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="rounded-3xl border border-[#94A3B8]/20 bg-[#0F172A]/80 p-10 text-center max-w-md">
        <h1 className="text-2xl font-semibold text-[#F1F5F9]">Page not found</h1>
        <p className="mt-2 text-[#94A3B8]">
          This room or page doesn’t exist. Head back to your house.
        </p>
        <div className="mt-8">
          <Link href="/dashboard">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
        </div>
        <p className="mt-4">
          <Link href="/" className="text-sm text-[#7DD3FC] hover:underline">
            Back to landing
          </Link>
        </p>
      </div>
    </main>
  );
}
