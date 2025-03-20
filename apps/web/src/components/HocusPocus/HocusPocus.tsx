"use client";

import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useRef } from "react";
import { hocuspocusSocket } from "@/lib/hocuspocus/socket";
import { useJWT } from "@/query/useJWT";
export function Hocuspocus() {
  const hocuspocus = useRef<HocuspocusProvider | null>(null);
  const { data: jwt } = useJWT();

  useEffect(() => {
    if (!jwt) return;

    if (hocuspocus.current) {
      hocuspocus.current.disconnect();
      hocuspocus.current.destroy();
    }

    hocuspocus.current = new HocuspocusProvider({
      websocketProvider: hocuspocusSocket,
      url: process.env.NEXT_PUBLIC_HOCUPSPOCUS_URL || "",
      name: "example-document",
      token: jwt,
    });

    hocuspocus.current.on("error", (error: Error) => {
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
  }, [jwt]);

  return null;
}
