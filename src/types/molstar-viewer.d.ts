declare module 'molstar/build/viewer/molstar' {
  // Minimal but typed shim for the Mol* bundled Viewer used in this project.
  export interface MolstarPluginBuilder {
    to: (cell: unknown) => {
      update: (params: Record<string, unknown>) => { commit: () => Promise<void> };
    };
    delete: (cell: unknown) => void;
    commit: () => Promise<void>;
  }

  export interface MolstarPlugin {
    clear: () => Promise<void> | void;
    dispose: () => void;
    builders: {
      data: {
        rawData: (args: { data: string; label?: string }) => Promise<{ cell?: unknown } | unknown>;
      };
      structure: {
        parseTrajectory: (raw: unknown, format: 'mmcif' | 'pdb') => Promise<unknown>;
        hierarchy: {
          applyPreset: (trajectory: unknown, preset: 'default') => Promise<void>;
        };
        representation: {
          addRepresentation: (
            cell: unknown,
            params: {
              type: string;
              typeParams?: Record<string, unknown>;
              color?: string;
              colorParams?: Record<string, unknown>;
            }
          ) => Promise<void>;
        };
      };
    };
    representation: {
      structure: {
        themes: {
          colorThemeRegistry: {
            add: (definition: {
              name: string;
              label: string;
              category: string;
              factory: (ctx?: unknown) => {
                granularity: string;
                color: (loc: unknown) => number;
              };
              getParams: () => Record<string, unknown>;
              defaultValues: Record<string, unknown>;
              isApplicable: (ctx: { structure?: unknown }) => boolean;
            }) => void;
          };
        };
      };
    };
    managers: {
      structure: {
        hierarchy: { current: { structures: unknown[] } };
        component: {
          updateRepresentationsTheme: (
            components: unknown[],
            theme: { color: string }
          ) => Promise<void>;
        };
      };
      camera: { reset: () => void };
    };
    canvas3d?: {
      props: {
        postprocessing: {
          outline: { name: string; params: unknown };
          occlusion: { name: string; params: unknown };
          shadow: { name: string; params: unknown };
        };
      };
      setProps: (props: {
        postprocessing: {
          outline: { name: 'on' | 'off'; params: unknown };
          occlusion: { name: 'on' | 'off'; params: unknown };
          shadow: { name: 'on' | 'off'; params: unknown };
        };
      }) => void;
    };
    build: () => MolstarPluginBuilder;
  }

  export interface MolstarViewerInstance {
    plugin: MolstarPlugin;
  }

  export const Viewer: {
    create: (
      container: HTMLElement,
      options: Record<string, unknown>
    ) => Promise<MolstarViewerInstance>;
  };
}


