import { getRoom } from "@/lib/rooms";
import type { RoomId } from "@/lib/rooms";
import { notFound } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";

export default function RoomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { roomName: string };
}) {
  const room = getRoom(params.roomName as RoomId);
  if (!room) notFound();
  return <AuthGuard>{children}</AuthGuard>;
}
