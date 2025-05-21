"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "@/components/settings/SettingsSection";

export function SecuritySettings() {
  const activeSessions = [
    {
      id: 1,
      device: "Chrome on macOS",
      location: "New York, USA",
      lastActive: "Current session",
      isCurrent: true,
    },
    {
      id: 2,
      device: "Firefox on Windows",
      location: "San Francisco, USA",
      lastActive: "2 hours ago",
      isCurrent: false,
    },
    {
      id: 3,
      device: "Safari on iOS",
      location: "London, UK",
      lastActive: "1 day ago",
      isCurrent: false,
    },
  ];

  return (
    <div className="space-y-6">
      <SettingsSection title="Active Sessions">
        <div className="space-y-4">
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
              <div className="col-span-5 sm:col-span-4">Device</div>
              <div className="col-span-4 sm:col-span-3">Location</div>
              <div className="col-span-3">Last Active</div>
              <div className="hidden sm:block sm:col-span-2"></div>
            </div>

            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="grid grid-cols-12 gap-2 p-3 border-t text-sm items-center"
              >
                <div className="col-span-5 sm:col-span-4 truncate">
                  {session.device}
                </div>
                <div className="col-span-4 sm:col-span-3 truncate">
                  {session.location}
                </div>
                <div className="col-span-3 truncate">
                  {session.isCurrent ? (
                    <span className="text-green-600 font-medium">
                      {session.lastActive}
                    </span>
                  ) : (
                    session.lastActive
                  )}
                </div>
                <div className="hidden sm:block sm:col-span-2 text-right">
                  {!session.isCurrent && (
                    <Button variant="ghost" size="sm">
                      Log Out
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline">Log Out All Other Sessions</Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Privacy & Terms">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="text-primary hover:underline flex items-center gap-1"
            >
              Privacy Policy
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="text-primary hover:underline flex items-center gap-1"
            >
              Terms of Service
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
