/**
 * Yahoo-Messenger-style room categories. Free-text codes validated here at
 * the app layer, never a DB enum — rendered client-side via
 * `groups.category.<code>` in packages/i18n so adding a category never
 * needs a migration (same pattern as LOCALE_REGISTRY).
 */
export const ROOM_CATEGORIES = [
  "general",
  "sports",
  "music",
  "movies",
  "gaming",
  "tech",
  "dating",
] as const;

export type RoomCategory = (typeof ROOM_CATEGORIES)[number];

export function isRoomCategory(value: string): value is RoomCategory {
  return (ROOM_CATEGORIES as readonly string[]).includes(value);
}
