export function getLiveListenersCount(
  session: { listenersCount?: number; totalListeners?: number; nowPlaying?: { totalListeners?: number } } | null | undefined,
  nowPlaying?: { totalListeners?: number } | null
): number {
  return session?.listenersCount ??
         nowPlaying?.totalListeners ??
         session?.nowPlaying?.totalListeners ??
         session?.totalListeners ??
         0;
}
