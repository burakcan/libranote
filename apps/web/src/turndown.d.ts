declare module "@joplin/turndown" {
  export { default } from "turndown";
}

declare module "@joplin/turndown-plugin-gfm" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const gfm: any;
}
