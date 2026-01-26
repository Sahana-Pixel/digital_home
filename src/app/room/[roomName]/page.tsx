import { getRoom, getRoomIds } from "@/lib/rooms";
import type { RoomConfig } from "@/lib/rooms";
import { notFound } from "next/navigation";
import { StudyRoom } from "@/components/rooms/StudyRoom";
import { HealthRoom } from "@/components/rooms/HealthRoom";
import { CollegeRoom } from "@/components/rooms/CollegeRoom";
import { ReflectionRoom } from "@/components/rooms/ReflectionRoom";
import { ProjectsRoom } from "@/components/rooms/ProjectsRoom";
import { PlannerRoom } from "@/components/rooms/PlannerRoom";

const ROOM_COMPONENTS: Record<string, React.ComponentType<{ room: RoomConfig }>> = {
  study: StudyRoom,
  health: HealthRoom,
  college: CollegeRoom,
  reflection: ReflectionRoom,
  projects: ProjectsRoom,
  planner: PlannerRoom,
};

export function generateStaticParams() {
  return getRoomIds().map((id) => ({ roomName: id }));
}

export default function RoomPage({ params }: { params: { roomName: string } }) {
  const room = getRoom(params.roomName as ReturnType<typeof getRoomIds>[number]);
  if (!room) notFound();

  const Component = ROOM_COMPONENTS[room.id];
  if (!Component) return <GenericRoomPage room={room} />;
  return <Component room={room} />;
}

function GenericRoomPage({ room }: { room: NonNullable<ReturnType<typeof getRoom>> }) {
  return (
    <main className="min-h-screen">
      <header
        className="px-6 py-6 rounded-b-2xl"
        style={{
          background: `linear-gradient(135deg, ${room.card} 0%, ${room.muted} 100%)`,
          color: "#0B1220",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold">
            {room.emoji} {room.name} Room
          </h1>
          <p className="mt-1 text-[#0B1220]/80">{room.tagline}</p>
          <p className="mt-2 text-sm opacity-70">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div
          className="rounded-2xl p-8 text-center text-[#94A3B8]"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
        >
          <p>Nothing here yet.</p>
          <p className="mt-2 text-sm">This room is ready for you to fill.</p>
        </div>
      </div>
    </main>
  );
}
