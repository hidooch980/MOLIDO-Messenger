export interface AuthUser {
  id: string;
  username: string;
  email: string;
  localePreference: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export type PresenceState = "online" | "away" | "busy" | "offline";

export interface Friend {
  friendshipId: string;
  id: string;
  username: string;
  avatarUrl: string | null;
  statusMessage: string | null;
  presence: PresenceState;
}

export interface PublicProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  statusMessage: string | null;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  createdAt: string;
  requester: PublicProfile;
}

export interface RoomLastMessage {
  body: string | null;
  systemEventCode?: string | null;
  systemEventName?: string | null;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  /** Only populated by GET /api/rooms (the "my rooms" list), not the public lobby. */
  lastMessage?: RoomLastMessage | null;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string | null;
  /** Present on messages received live over the socket. */
  senderUsername?: string;
  /** Present on messages fetched via the REST history endpoint. */
  sender?: { username: string } | null;
  body: string | null;
  systemEventCode?: string | null;
  systemEventName?: string | null;
  createdAt: string;
}

export function senderNameOf(message: ChatMessage): string | undefined {
  return message.senderUsername ?? message.sender?.username ?? undefined;
}
