export function normalizeMediaUrl(url: string | null | undefined): string {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  if (trimmed.includes("host.docker.internal")) {
    return trimmed.replace(/host\.docker\.internal/gi, "localhost");
  }

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  return trimmed;
}