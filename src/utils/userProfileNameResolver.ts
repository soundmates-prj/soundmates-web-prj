import userService from "../services/userService";

const nameCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string>>();

const normalize = (value?: string | null): string => (value ?? "").trim();

const buildDisplayName = (
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null,
): string => {
  const first = normalize(firstName);
  const last = normalize(lastName);
  if (last && first) return `${last} ${first}`;
  if (last) return last;
  if (first) return first;
  return normalize(fallback) || "An danh";
};

export async function resolveUserDisplayName(
  userId: string,
  fallbackName?: string,
): Promise<string> {
  const id = normalize(userId);
  if (!id) return buildDisplayName(undefined, undefined, fallbackName);

  const cached = nameCache.get(id);
  if (cached) return cached;

  const pending = inFlightRequests.get(id);
  if (pending) return pending;

  const request = (async () => {
    try {
      const response = await userService.getPublicProfile(id);
      const profile = response.success ? response.data : undefined;

      const resolved = buildDisplayName(
        profile?.firstName,
        profile?.lastName,
        fallbackName ?? profile?.username ?? id,
      );

      nameCache.set(id, resolved);
      return resolved;
    } catch {
      const resolved = buildDisplayName(undefined, undefined, fallbackName ?? id);
      nameCache.set(id, resolved);
      return resolved;
    } finally {
      inFlightRequests.delete(id);
    }
  })();

  inFlightRequests.set(id, request);
  return request;
}

export async function resolveUserDisplayNames(
  userIds: string[],
  fallbackByUserId: Record<string, string | undefined> = {},
): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(userIds.map((id) => normalize(id)).filter(Boolean)));

  const pairs = await Promise.all(
    uniqueIds.map(async (id) => {
      const displayName = await resolveUserDisplayName(id, fallbackByUserId[id]);
      return [id, displayName] as const;
    }),
  );

  return Object.fromEntries(pairs);
}
