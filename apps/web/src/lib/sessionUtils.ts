export function parseUserAgent(userAgent?: string) {
  if (!userAgent) return "Unknown Device";

  // Simple user agent parsing - you could use a library like ua-parser-js for more robust parsing
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isTablet = /iPad|Tablet/.test(userAgent);

  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // Browser detection
  if (userAgent.includes("Chrome") && !userAgent.includes("Edge")) {
    browser = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browser = "Safari";
  } else if (userAgent.includes("Edge")) {
    browser = "Edge";
  }

  // OS detection
  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac OS")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS";
  }

  const deviceType = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";
  return `${browser} on ${os} (${deviceType})`;
}

export function formatLastActive(dateString: string, isCurrent: boolean) {
  if (isCurrent) return "Current session";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    return "Recently";
  }
}
