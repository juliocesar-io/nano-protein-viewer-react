declare module 'molstar/build/viewer/molstar' {
  // Minimal shim to satisfy TypeScript for the bundled viewer import path.
  // The runtime module provides a Viewer factory; we treat it as 'any' here.
  export const Viewer: any;
}


