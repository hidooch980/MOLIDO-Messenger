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
