export type RoomId =
  | "study"
  | "health"
  | "college"
  | "reflection"
  | "projects"
  | "planner";

export interface RoomConfig {
  id: RoomId;
  name: string;
  emoji: string;
  tagline: string;
  card: string;
  accent: string;
  muted: string;
}

export const ROOMS: RoomConfig[] = [
  {
    id: "study",
    name: "Study",
    emoji: "🧠",
    tagline: "Consistency over pressure",
    card: "#B6FFEA",
    accent: "#9ADCFF",
    muted: "#7189BF",
  },
  {
    id: "health",
    name: "Health",
    emoji: "🧘",
    tagline: "Small habits, big impact",
    card: "#A8DF8E",
    accent: "#A8DF8E",
    muted: "#377D71",
  },
  {
    id: "college",
    name: "College",
    emoji: "🎓",
    tagline: "Stay on top of your academics",
    card: "#51e5ff",
    accent: "#51e5ff",
    muted: "#BBDEFB",
  },
  {
    id: "reflection",
    name: "Reflection",
    emoji: "🪞",
    tagline: "A quiet look at your day",
    card: "#FB929E",
    accent: "#C9A9A6",
    muted: "#F0E4DD",
  },
  {
    id: "projects",
    name: "Projects",
    emoji: "🗂",
    tagline: "Bring ideas to life",
    card: "#A696C8",
    accent: "#9C27B0",
    muted: "#E1BEE7",
  },
  {
    id: "planner",
    name: "Planner",
    emoji: "📅",
    tagline: "Plan your days with clarity",
    card: "#B7B7B7",
    accent: "#F9A825",
    muted: "#FFECB3",
  },
];

export function getRoom(id: RoomId): RoomConfig | undefined {
  return ROOMS.find((r) => r.id === id);
}

export function getRoomIds(): RoomId[] {
  return ROOMS.map((r) => r.id);
}
