import { createRouter } from "@tanstack/react-router";
import { queryClient } from "@/lib/queryClient";
import { getDeviceOS } from "@/lib/utils";
import { routeTree } from "@/routeTree.gen";

// Create a new router instance
export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPendingMs: 0,
  defaultPendingMinMs: 0,
  scrollRestoration: true,
  defaultViewTransition:
    getDeviceOS() === "ios"
      ? false
      : {
          types(locationChangeInfo) {
            if (!locationChangeInfo.pathChanged) return [];

            let direction = "none";

            if (locationChangeInfo.fromLocation) {
              const fromIndex =
                locationChangeInfo.fromLocation.state.__TSR_index;
              const toIndex = locationChangeInfo.toLocation.state.__TSR_index;

              direction = fromIndex > toIndex ? "backward" : "forward";
            }

            return [`navigate-${direction}`];
          },
        },
});
