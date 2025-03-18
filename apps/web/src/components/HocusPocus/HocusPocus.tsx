"use client";

import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import { useEffect, useRef } from "react";

const socket = new HocuspocusProviderWebsocket({
  url: process.env.NEXT_PUBLIC_HOCUPSPOCUS_URL || "",
});

export function Hocuspocus() {
  const hocuspocus = useRef<HocuspocusProvider | null>(null);

  const wsToken = async () => {
    const response = await fetch("/api/auth/wstoken");
    const data = await response.json();
    return data.token;
  };

  useEffect(() => {
    wsToken().then((token) => {
      hocuspocus.current = new HocuspocusProvider({
        websocketProvider: socket,
        url: process.env.NEXT_PUBLIC_HOCUPSPOCUS_URL || "",
        name: "example-document",
        token,
      });

      hocuspocus.current.on("error", (error) => {
        console.error(error);
      });

      const tasks = hocuspocus.current.document.getArray("tasks");

      tasks.observe((changes) => {
        console.log(changes);
        console.log(tasks.toArray());
      });

      tasks.push([
        {
          title: "Task 1",
          completed: false,
        },
      ]);

      window.hocuspocus = hocuspocus.current;
    });
  }, []);

  return null;
}
