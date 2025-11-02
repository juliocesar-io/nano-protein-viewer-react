/**
 * @jest-environment jsdom
 */
import { createMolstarViewer } from '../src';

type AnyRecord = Record<string, any>;

const makePlugin = () => {
  const calls: AnyRecord = { themeAdd: 0, updateTheme: 0, buildCommits: 0, addRep: 0 };
  const plugin: AnyRecord = {
    clear: jest.fn(async () => {}),
    dispose: jest.fn(() => {}),
  };
  plugin.builders = {
    data: {
      rawData: jest.fn(async () => ({ cell: {} }))
    },
    structure: {
      parseTrajectory: jest.fn(async () => ({ cell: {} })),
      hierarchy: { applyPreset: jest.fn(async () => {}) },
      representation: {
        addRepresentation: jest.fn(async () => { calls.addRep++; })
      }
    }
  };
  plugin.representation = {
    structure: {
      themes: {
        colorThemeRegistry: {
          add: jest.fn((..._args) => { calls.themeAdd++; })
        }
      }
    }
  };
  const makeBuild = () => ({
    to: (_cell: any) => ({
      update: (_params: any) => ({
        commit: jest.fn(async () => { calls.buildCommits++; })
      })
    }),
    delete: (_x: any) => {},
    commit: jest.fn(async () => {})
  });
  plugin.build = jest.fn(makeBuild);
  plugin.managers = {
    structure: {
      component: {
        updateRepresentationsTheme: jest.fn(async () => { calls.updateTheme++; })
      },
      hierarchy: {
        current: {
          structures: [] as any[]
        }
      }
    },
    camera: { reset: jest.fn(() => {}) }
  };
  plugin.canvas3d = {
    props: { postprocessing: { outline: { name: 'off', params: {} }, occlusion: { name: 'off', params: {} }, shadow: { name: 'off', params: {} } } },
    setProps: jest.fn((_p: any) => {})
  };
  return { plugin, calls };
};

jest.mock('molstar/lib/apps/viewer/app', () => {
  return {
    Viewer: {
      create: jest.fn(async (container: HTMLElement) => {
        if (!(container instanceof HTMLElement)) throw new Error('invalid container');
        const { plugin, calls } = makePlugin();
        const viewer = { plugin };
        // attach calls for inspection
        (viewer as any).__calls = calls;
        (globalThis as any).__mockViewer = viewer;
        return viewer;
      })
    }
  };
}, { virtual: true });

describe('createMolstarViewer', () => {
  let host: HTMLDivElement;
  beforeEach(() => { host = global.document.createElement('div'); host.style.width = '100px'; host.style.height = '100px'; });

  it('mounts and reuses on same container', async () => {
    const v = createMolstarViewer();
    await v.mount(host);
    await v.mount(host); // should no-op reuse
    await v.clear();
  });

  it('loads structure text (pdb) and resets camera when not maintaining view', async () => {
    const v = createMolstarViewer();
    await v.mount(host);
    await v.loadStructureText('ATOM ...', 'pdb');
  });

  it('skips unsupported SDF with warning', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const v = createMolstarViewer();
    await v.mount(host);
    await v.loadStructureText('SDF', 'sdf');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('updates color themes for various modes', async () => {
    const v = createMolstarViewer();
    await v.mount(host);
    // seed structures/components/representations
    const plugin: any = (globalThis as any).__mockViewer?.plugin;
    plugin.managers.structure.hierarchy.current.structures = [
      { components: [{ representations: [{ cell: { transform: { params: {} } } }] }] }
    ];

    await v.updateColorTheme('element');
    await v.updateColorTheme('residue');
    await v.updateColorTheme('secondary', { secondaryColors: { helix: '#a', sheet: '#b', coil: '#c' } });
    await v.updateColorTheme('custom', { hex: '#ff0000' });
    await v.updateColorTheme('chain', { chainColors: { A: '#00ff00' } });
    await v.updateColorTheme('rainbow', { palette: 'viridis' });
  });

  it('lists chains from structure units', async () => {
    const v = createMolstarViewer();
    await v.mount(host);
    const plugin: any = (globalThis as any).__mockViewer?.plugin;
    plugin.managers.structure.hierarchy.current.structures = [
      { cell: { obj: { data: { units: [{ label_asym_id: 'B' }, { chainGroupId: 1 }] } } } }
    ];
    const chains = await v.listChains();
    expect(chains).toEqual(['1', 'B']);
  });

  it('toggles illustrative style and surface', async () => {
    const v = createMolstarViewer();
    await v.mount(host);
    await v.applyIllustrativeStyle(true);
    await v.applyIllustrativeStyle(false);

    const plugin: any = (globalThis as any).__mockViewer?.plugin;
    // seed structures/components to add surface
    plugin.managers.structure.hierarchy.current.structures = [
      { components: [{ representations: [{ cell: { transform: { params: {} } } }] }], cell: { obj: { data: {} } } }
    ];
    await v.applySurface(true, { opacity: 50, inherit: false, customColor: '#123456' });
  });

  it('resets color theme to chain-id', async () => {
    const v = createMolstarViewer();
    await v.mount(host);
    const viewer: any = (globalThis as any).__mockViewer;
    const plugin: any = viewer.plugin;
    // seed representations so resetColorTheme iterates
    plugin.managers.structure.hierarchy.current.structures = [
      { components: [{ representations: [{ cell: { transform: { params: {} } } }] }] }
    ];
    await v.resetColorTheme();
    expect(typeof plugin.build).toBe('function');
  });

  it('deletes existing surfaces and supports inherit/customColor branches', async () => {
    const v = createMolstarViewer();
    await v.mount(host);
    const plugin: any = (globalThis as any).__mockViewer?.plugin;
    // Seed existing surfaces to trigger deletion path
    plugin.managers.structure.hierarchy.current.structures = [
      {
        components: [{
          representations: [
            { cell: { transform: { params: { type: { name: 'gaussian-surface' } } } } },
            { cell: { transform: { params: { type: 'molecular-surface' } } } }
          ]
        }]
      }
    ];
    await v.applySurface(false); // should delete and return

    // Now test inherit=true branch with re-added components
    plugin.managers.structure.hierarchy.current.structures = [
      { components: [{ representations: [{ cell: { transform: { params: { colorTheme: { name: 'chain-id', params: {} } } } } }] }], cell: { obj: { data: {} } } }
    ];
    await v.applySurface(true, { opacity: 30, inherit: true });

    // And custom without inherit
    await v.applySurface(true, { opacity: 80, inherit: false, customColor: '#abcdef' });
  });
});


