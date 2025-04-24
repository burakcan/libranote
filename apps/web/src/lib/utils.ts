import { clsx, type ClassValue } from "clsx";
import { memoize } from "es-toolkit";
import { twMerge } from "tailwind-merge";
import { ClientCollection } from "@/types/Entities";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export const getUserColors = memoize(
  (userId: string): [string, string] => {
    // Create a simple hash from the userId string.
    let hash: number = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Determine a base hue from the hash, ensuring it's between 0 and 359.
    const baseHue: number = Math.abs(hash) % 360;
    // Calculate the contrasting (complementary) hue.
    const contrastingHue: number = (baseHue + 140) % 360;

    // For improved contrast, we use different lightness levels:
    // - The first color is a lighter pastel.
    // - The second color is a slightly darker pastel.
    const pastel1: string = hslToHex(baseHue, 70, 80); // Lighter pastel
    const pastel2: string = hslToHex(contrastingHue, 70, 60); // Darker pastel for contrast

    return [pastel1, pastel2];
  },
  { cache: new Map() }
);

export const getCollectionColor = memoize(
  ([collectionId, collections]: [string | null, ClientCollection[]]) => {
    if (!collectionId) {
      return "var(--color-transparent)";
    }

    const collection = collections.find((c) => c.id === collectionId);
    return collection?.members[0].color || "var(--color-transparent)";
  },
  {
    getCacheKey: ([collectionId, collections]) => {
      return [
        collectionId,
        collections.map((c) => c.members[0].color).join(","),
      ].join("|");
    },
  }
);

export const getCollectionTitle = memoize(
  ([collectionId, collections]: [string | null, ClientCollection[]]) => {
    if (!collectionId) {
      return "Untitled Collection";
    }

    const collection = collections.find((c) => c.id === collectionId);
    return collection?.title || "Untitled Collection";
  },
  {
    getCacheKey: ([collectionId, collections]) =>
      [collectionId, collections.map((c) => c.id).join(",")].join("|"),
  }
);

interface NavigatorUAData {
  platform: string;
  // Add other properties if needed
}

export const getDeviceOS = ():
  | "ios"
  | "android"
  | "windows"
  | "macos"
  | "linux"
  | "unknown" => {
  if (typeof window === "undefined" || !navigator) {
    return "unknown";
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // Try using modern userAgentData API first (only available in modern browsers)
  if ("userAgentData" in navigator) {
    const uaData = (navigator as { userAgentData?: NavigatorUAData })
      .userAgentData;
    const platform = uaData?.platform.toLowerCase();

    if (platform) {
      if (platform.includes("mac")) return "macos";
      if (platform.includes("windows")) return "windows";
      if (platform.includes("linux")) return "linux";
      if (platform.includes("android")) return "android";
      if (platform.includes("ios")) return "ios";
    }
  }

  // iOS detection - check for iPhone, iPad, iPod
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  // Android detection - check for Android and not Chrome OS
  if (/android/.test(userAgent) && !/cros/.test(userAgent)) {
    return "android";
  }

  // Windows detection - check for Windows NT or Win64
  if (/windows nt|win64/.test(userAgent)) {
    return "windows";
  }

  // macOS detection - check for Mac OS X or Macintosh
  if (/macintosh|mac os x/.test(userAgent)) {
    return "macos";
  }

  // Linux detection - check for Linux, X11, and exclude Android/Chrome OS
  if (
    (/linux|x11/.test(userAgent) && !/android|cros/.test(userAgent)) ||
    userAgent.includes("ubuntu") ||
    userAgent.includes("fedora") ||
    userAgent.includes("arch")
  ) {
    return "linux";
  }

  return "unknown";
};
