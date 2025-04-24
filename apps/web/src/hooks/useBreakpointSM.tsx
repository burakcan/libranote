import { useMediaQuery } from "usehooks-ts";
import { BREAKPOINT_SM } from "@/lib/constants";

export function useBreakpointSM() {
  return useMediaQuery(`(max-width: ${BREAKPOINT_SM})`);
}
