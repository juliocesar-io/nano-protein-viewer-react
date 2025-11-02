// Minimal Jest mock for Mol* UI and QA used by src/utils/molstar.ts during tests

export const PluginConfig = {
  Viewport: {
    ShowControls: 'ShowControls',
    ShowSettings: 'ShowSettings',
    ShowExpand: 'ShowExpand',
    ShowSelectionMode: 'ShowSelectionMode',
    ShowAnimation: 'ShowAnimation',
    ShowScreenshotControls: 'ShowScreenshotControls',
    ShowToggleFullscreen: 'ShowToggleFullscreen',
    ShowReset: 'ShowReset',
    ShowXR: 'ShowXR'
  }
} as const;

export function DefaultPluginUISpec() {
  return { config: [], layout: { initial: {} }, behaviors: [] } as any;
}

export async function createPluginUI({ target }: { target: Element }) {
  if (!target) throw new Error('no target');
  const calls: any = {};
  const plugin: any = {
    clear: async () => {},
    dispose: () => {},
  };
  plugin.builders = {
    data: { rawData: async () => ({ cell: {} }) },
    structure: {
      parseTrajectory: async () => ({ cell: {} }),
      hierarchy: { applyPreset: async () => {} },
      representation: { addRepresentation: async () => {} },
    },
  };
  plugin.representation = {
    structure: {
      themes: {
        colorThemeRegistry: { add: () => {} },
      },
    },
  };
  const makeBuild = () => ({
    to: () => ({ update: () => ({ commit: async () => {} }) }),
    delete: () => {},
    commit: async () => {},
  });
  plugin.build = makeBuild;
  plugin.managers = {
    structure: {
      component: { updateRepresentationsTheme: async () => {} },
      hierarchy: { current: { structures: [] as any[] } },
    },
    camera: { reset: () => {} },
    lociLabels: { addProvider: () => {} },
  };
  plugin.canvas3d = {
    props: { postprocessing: { outline: { name: 'off', params: {} }, occlusion: { name: 'off', params: {} }, shadow: { name: 'off', params: {} } } },
    setProps: () => {},
  };
  plugin.context = {};
  (globalThis as any).__mockViewer = { plugin };
  return plugin;
}

export const PLDDTConfidenceColorThemeProvider = {
  name: 'plddt-confidence',
  isApplicable: () => false,
} as any;

export const QualityAssessment = {
  isApplicable: () => false,
} as any;

export const QualityAssessmentProvider = {
  attach: async () => {},
  get: () => ({ value: {} }),
} as any;


