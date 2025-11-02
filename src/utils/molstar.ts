import type { StructureFormat } from '../types';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { createRoot } from 'react-dom/client';

// Only allow Mol* to register default behaviors (global model props) once per page
let __molstarBehaviorsInitialized = false;

// Minimal shape to avoid importing Mol* app types that pull Node-only deps
type MolstarViewerInstance = { plugin: any };

export interface MolstarViewerHandle {
  viewer: MolstarViewerInstance | null;
  mount: (container: HTMLElement) => Promise<void>;
  clear: () => Promise<void>;
  loadStructureText: (data: string, format: StructureFormat, maintainView?: boolean) => Promise<void>;
  updateColorTheme: (
    mode: 'custom' | 'element' | 'residue' | 'secondary' | 'chain' | 'rainbow',
    params?: ColorThemeParams
  ) => Promise<void>;
  listChains: () => Promise<string[]>;
  applyIllustrativeStyle: (enabled: boolean) => Promise<void>;
  applySurface: (enabled: boolean, options?: { opacity?: number; inherit?: boolean; customColor?: string }) => Promise<void>;
  resetView: () => Promise<void>;
  resetColorTheme: () => Promise<void>;
}

type ChainColorParams = { chainColors: Record<string | number, string | number> };
type CustomColorParams = { hex: string | number };
type SecondaryColorParams = { secondaryColors: { helix: string; sheet: string; coil: string } };
type RainbowParams = { palette?: string };
export type ColorThemeParams = Partial<ChainColorParams & CustomColorParams & SecondaryColorParams & RainbowParams>;

type TrajectoryLike = { cell?: unknown };
function isTrajectory(value: unknown): value is TrajectoryLike {
  return typeof value === 'object' && value !== null && 'cell' in (value as Record<string, unknown>);
}

type ChainUnit = { label_asym_id?: string; chainGroupId?: string | number };
type StructureCellData = { units?: ChainUnit[] };
function isStructureCellData(value: unknown): value is StructureCellData {
  return typeof value === 'object' && value !== null && ('units' in (value as Record<string, unknown>));
}

type AtomicHierarchy = {
  residueAtomSegments: { index: ArrayLike<number> };
  residues: { label_seq_id: { value: (i: number) => number } };
};
type ColorLocDetailed = { unit: { model: { atomicHierarchy: AtomicHierarchy } }; element: number };

export function createMolstarViewer(): MolstarViewerHandle {
  let viewer: MolstarViewerInstance | null = null;
  let hostEl: HTMLElement | null = null;
  // Cache a single React root per target to avoid duplicate createRoot warnings
  const reactRootCache = new WeakMap<Element, { render: (c: any) => void; unmount: () => void }>();

  async function mount(container: HTMLElement) {
    // Reuse if already mounted to same container
    if (viewer && hostEl === container) return;

    // If mounted to a different container, dispose and recreate
    if (viewer && hostEl && hostEl !== container) {
      try {
        await viewer.plugin.clear();
        viewer.plugin.dispose();
      } catch {}
      // Unmount any cached React root for previous host
      try {
        const existingRoot = reactRootCache.get(hostEl);
        if (existingRoot) {
          existingRoot.unmount();
          reactRootCache.delete(hostEl);
        }
      } catch {}
      viewer = null;
      hostEl = null;
    }

    // Ensure this only runs in the browser and avoid static analysis of the path
    if (typeof window === 'undefined') return;
    // Using statically imported Mol* UI helpers

    // Configure UI similar to Viewer options
    const spec = DefaultPluginUISpec();

    // Desired options (aligned with the example provided)
    const layoutIsExpanded = false;
    const layoutShowControls = false;
    const layoutShowLeftPanel = false;
    const layoutShowSequence = true;
    const viewportShowExpand = false;
    const viewportShowSelectionMode = true;
    const viewportShowAnimation = false;

    // Layout initial state
    spec.layout = spec.layout || {};
    spec.layout.initial = {
      isExpanded: layoutIsExpanded,
      showControls: layoutShowControls,
      regionState: {
        bottom: 'hidden',
        left: layoutShowLeftPanel ? 'full' : 'hidden',
        right: 'hidden',
        top: layoutShowSequence ? 'hidden' : 'hidden'
      }
    } as any;

    // Avoid duplicate global symbol registrations across multiple plugin instances
    if (__molstarBehaviorsInitialized) {
      spec.behaviors = [];
    } else {
      __molstarBehaviorsInitialized = true;
    }


    // Viewport toolbar toggles
    spec.config = [
      ...(spec.config || []),
      [PluginConfig.Viewport.ShowExpand, viewportShowExpand],
      [PluginConfig.Viewport.ShowSelectionMode, viewportShowSelectionMode],
      [PluginConfig.Viewport.ShowAnimation, viewportShowAnimation]
    ];

    const plugin = await createPluginUI({
      target: container,
      spec,
      render: (component: any, target: Element) => {
        let root = reactRootCache.get(target);
        if (!root) {
          const r = createRoot(target as HTMLElement);
          root = {
            render: (c: any) => r.render(c),
            unmount: () => r.unmount()
          };
          reactRootCache.set(target, root);
        }
        root.render(component);
      }
    });
    
    // Ensure viewport is visible regardless of initial layout edge cases
    try {
      plugin.layout.setProps({
        isExpanded: layoutIsExpanded,
        showControls: layoutShowControls,
        regionState: {
          left: layoutShowLeftPanel ? 'full' : 'hidden',
          top: 'hidden',
          right: 'hidden',
          bottom: 'hidden'
        },
        expandToFullscreen: true
      });
    } catch {}
    
    viewer = { plugin };
    hostEl = container;
  }

  async function clear() {
    if (!viewer) return;
    await viewer.plugin.clear();
  }

  async function loadStructureText(data: string, format: StructureFormat, maintainView: boolean = false) {
    if (!viewer) throw new Error('Viewer not mounted');

    const plugin = viewer.plugin;
    if (!maintainView) {
      await plugin.clear();
    }

    // Use plugin builders consistently (avoids format string mismatch like 'cif')
    if (format === 'sdf') {
      console.warn('[Mol*] SDF is not supported by the current viewer pipeline. Please use PDB/mmCIF.');
      return;
    }

    // Prefer loading from raw string to avoid blob URL/download issues
    const raw = await plugin.builders.data.rawData({ data, label: 'structure' });
    if (!raw || !raw.cell) {
      console.warn('[Mol*] Failed to load data node (rawData).');
      return;
    }
    const molFormat: 'mmcif' | 'pdb' = format === 'mmcif' ? 'mmcif' : 'pdb';
    let parsedOk = false;
    try {
      const traj: unknown = await plugin.builders.structure.parseTrajectory(raw, molFormat);
      if (isTrajectory(traj) && traj.cell) {
        await plugin.builders.structure.hierarchy.applyPreset(traj, 'default');
        parsedOk = true;
      }
    } catch {
      // ignore here, will handle below
      // console.warn('parseTrajectory failed:', e);
    }

    if (!parsedOk) {
      // If structures already present (concurrent load finished), don't fail hard
      const existing = plugin.managers.structure.hierarchy.current.structures;
      if (existing && existing.length > 0) {
        if (!maintainView) plugin.managers.camera.reset();
        return;
      }
      console.warn('[Mol*] Failed to parse trajectory.');
      return;
    }

    if (!maintainView) plugin.managers.camera.reset();
  }

  async function updateColorTheme(
    mode: 'custom' | 'element' | 'residue' | 'secondary' | 'chain' | 'rainbow',
    params: ColorThemeParams = {}
  ) {
    if (!viewer) return;
    const plugin = viewer.plugin;
    const structures = plugin.managers.structure.hierarchy.current.structures;
    if (!structures || structures.length === 0) return;

    // Special handling: custom chain colors
    if (mode === 'chain' && params?.chainColors && Object.keys(params.chainColors).length > 0) {
      const name = 'custom-chain-react-' + Math.random().toString(36).slice(2);
      plugin.representation.structure.themes.colorThemeRegistry.add({
        name,
        label: 'Custom Chain Colors',
        category: 'Custom',
        factory: () => ({
          granularity: 'group',
          color: (loc: unknown) => {
            try {
              const unit = (loc as { unit?: ChainUnit }).unit;
              const chainId = unit?.label_asym_id ?? unit?.chainGroupId ?? 'A';
              const hex = params.chainColors && (params.chainColors[chainId] ?? params.chainColors[String(chainId)]) || 0x4ECDC4;
              const v = typeof hex === 'string' ? parseInt(String(hex).replace('#',''), 16) : hex;
              return v;
            } catch {
              return 0x4ECDC4;
            }
          }
        }),
        getParams: () => ({}),
        defaultValues: {},
        isApplicable: (ctx: { structure?: unknown }) => !!ctx.structure
      });
      for (const s of structures) {
        if (s.components && s.components.length > 0) {
          await plugin.managers.structure.component.updateRepresentationsTheme(s.components, { color: name });
        }
      }
      return;
    }

    // Special handling: rainbow palettes
    if (mode === 'rainbow') {
      const palettes: Record<string, string[]> = {
        'rainbow': ['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF8000', '#FF0000'],
        'viridis': ['#440154', '#482878', '#3e4989', '#31688e', '#26828e', '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde724'],
        'plasma': ['#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921'],
        'magma': ['#000004', '#1c1044', '#4f127b', '#812581', '#b5367a', '#e55964', '#fb8861', '#fec287', '#fcfdbf'],
        'blue-red': ['#0000FF', '#FF0000'],
        'pastel': ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E0BBE4']
      };
      const cname = params?.palette || 'rainbow';
      const colors = palettes[cname] || palettes['rainbow'];

      const themeName = 'rainbow-sequence-react-' + Math.random().toString(36).slice(2);
      const gradient = (cols: string[], steps: number) => {
        if (steps <= 1) return [cols[0]];
        const out: string[] = [];
        const segments = cols.length - 1;
        for (let i=0;i<steps;i++) {
          const pos = i/(steps-1)*segments; const idx = Math.floor(pos); const t = pos-idx;
          const a = cols[Math.min(idx, cols.length-1)]; const b = cols[Math.min(idx+1, cols.length-1)];
          const pa = parseInt(a.slice(1),16); const pb = parseInt(b.slice(1),16);
          const ar=(pa>>16)&255, ag=(pa>>8)&255, ab=pa&255; const br=(pb>>16)&255, bg=(pb>>8)&255, bb=pb&255;
          const r=Math.round(ar+(br-ar)*t), g=Math.round(ag+(bg-ag)*t), b2=Math.round(ab+(bb-ab)*t);
          out.push('#'+((1<<24)+(r<<16)+(g<<8)+b2).toString(16).slice(1).toUpperCase());
        }
        return out;
      };

      plugin.representation.structure.themes.colorThemeRegistry.add({
        name: themeName,
        label: 'Rainbow (Sequence)',
        category: 'Custom',
        factory: (ctx?: unknown) => {
          let min = Infinity, max = -Infinity;
          try {
            const s = (ctx as { structure?: { units?: Array<{ model?: { atomicHierarchy?: { residues?: { _rowCount?: number; label_seq_id?: { value?: (i: number) => number } } } } }> } })?.structure;
            const units = s?.units || [];
            for (const u of units) {
              const residues = u.model?.atomicHierarchy?.residues;
              if (!residues) continue;
              for (let i=0;i<(residues._rowCount||0);i++) {
                const id = residues.label_seq_id?.value?.(i) ?? 0;
                if (id>0) { if (id<min) min=id; if (id>max) max=id; }
              }
            }
          } catch {}
          if (!isFinite(min) || !isFinite(max)) { min=1; max=100; }
          const total = Math.max(1, max-min+1);
          const grad = gradient(colors, total).map(h => parseInt(h.slice(1),16));
          return {
            granularity: 'group',
            color: (loc: unknown) => {
              try {
                const l = loc as ColorLocDetailed;
                const u = l.unit; const idx = u.model.atomicHierarchy.residueAtomSegments.index[l.element];
                const id = u.model.atomicHierarchy.residues.label_seq_id.value(idx);
                const ci = Math.max(0, Math.min(total-1, id-min));
                return grad[ci] ?? 0x808080;
              } catch { return 0x808080; }
            }
          };
        },
        getParams: () => ({}),
        defaultValues: {},
        isApplicable: (ctx: { structure?: unknown }) => !!ctx.structure
      });

      for (const s of structures) {
        if (s.components && s.components.length > 0) {
          await plugin.managers.structure.component.updateRepresentationsTheme(s.components, { color: themeName });
        }
      }
      return;
    }

    const themeName = (() => {
      switch (mode) {
        case 'element': return 'element-symbol';
        case 'residue': return 'residue-name';
        case 'secondary': return 'secondary-structure';
        case 'chain': return 'chain-id';
        case 'custom':
        default: return 'uniform';
      }
    })();

    const themeParams = (() => {
      if (mode === 'custom' && params?.hex) {
        const hexValue = parseInt(String(params.hex).replace('#',''), 16);
        return { value: hexValue };
      }
      if (mode === 'secondary' && params?.secondaryColors) {
        const toHex = (h: string) => parseInt(h.replace('#',''), 16);
        return {
          colors: {
            name: 'custom',
            params: {
              alphaHelix: toHex(params.secondaryColors.helix),
              threeTenHelix: toHex(params.secondaryColors.helix),
              piHelix: toHex(params.secondaryColors.helix),
              betaStrand: toHex(params.secondaryColors.sheet),
              betaTurn: toHex(params.secondaryColors.sheet),
              coil: toHex(params.secondaryColors.coil),
              bend: toHex(params.secondaryColors.coil),
              turn: toHex(params.secondaryColors.coil),
              dna: toHex(params.secondaryColors.coil),
              rna: toHex(params.secondaryColors.coil),
              carbohydrate: toHex(params.secondaryColors.coil)
            }
          },
          saturation: -1,
          lightness: 0
        };
      }
      return {};
    })();

    for (const s of structures) {
      if (!s.components) continue;
      for (const c of s.components) {
        if (!c.representations) continue;
        for (const r of c.representations) {
          try {
            const update = plugin.build().to(r.cell).update({
              ...r.cell.transform.params,
              colorTheme: { name: themeName, params: themeParams }
            });
            await update.commit();
          } catch {
            // Representation may have been disposed due to a concurrent load; ignore.
          }
        }
      }
    }
  }

  async function resetColorTheme() {
    if (!viewer) return;
    const plugin = viewer.plugin;
    const structures = plugin.managers.structure.hierarchy.current.structures;
    if (!structures || structures.length === 0) return;
    for (const s of structures) {
      if (!s.components) continue;
      for (const c of s.components) {
        if (!c.representations) continue;
        for (const r of c.representations) {
          try {
            const update = plugin.build().to(r.cell).update({
              ...r.cell.transform.params,
              colorTheme: { name: 'chain-id', params: {} }
            });
            await update.commit();
          } catch {}
        }
      }
    }
  }

  async function listChains(): Promise<string[]> {
    if (!viewer) return [];
    const plugin = viewer.plugin;
    const structures = plugin.managers.structure.hierarchy.current.structures;
    const out = new Set<string>();
    try {
      for (const s of structures) {
        const data = s.cell?.obj?.data as unknown;
        if (!isStructureCellData(data) || !data.units) continue;
        for (const u of data.units) {
          const id = u?.label_asym_id ?? u?.chainGroupId ?? 'A';
          if (id) out.add(String(id));
        }
      }
    } catch {}
    return Array.from(out).sort();
  }

  async function applyIllustrativeStyle(enabled: boolean) {
    if (!viewer) return;
    const plugin = viewer.plugin;
    // toggle outline/occlusion postprocessing similar to index.html illustrative style
    if (plugin.canvas3d) {
      if (enabled) {
        const pp = plugin.canvas3d.props.postprocessing;
        plugin.canvas3d.setProps({
          postprocessing: {
            outline: { name: 'on', params: pp.outline.name === 'on' ? pp.outline.params : { scale: 1, threshold: 0.33, includeTransparent: true } },
            occlusion: { name: 'on', params: pp.occlusion.name === 'on' ? pp.occlusion.params : { multiScale: { name: 'off', params: {} }, radius: 5, bias: 0.8, blurKernelSize: 15, samples: 32, resolutionScale: 1 } },
            shadow: { name: 'off', params: {} }
          }
        });
      } else {
        plugin.canvas3d.setProps({
          postprocessing: {
            outline: { name: 'off', params: {} },
            occlusion: { name: 'off', params: {} },
            shadow: { name: 'off', params: {} }
          }
        });
      }
    }
  }

  async function applySurface(enabled: boolean, options: { opacity?: number; inherit?: boolean; customColor?: string } = {}) {
    if (!viewer) return;
    const plugin = viewer.plugin;
    let structures = plugin.managers.structure.hierarchy.current.structures;
    if (!structures || structures.length === 0) return;

    // remove existing surfaces
    try {
      const toDelete: unknown[] = [];
      for (const s of structures) {
        if (!s.components) continue;
        for (const c of s.components) {
          if (!c.representations) continue;
          for (const r of c.representations) {
            const typeField = (r.cell.transform.params as Record<string, unknown> | undefined)?.['type'] as { name?: string } | string | undefined;
            const t = typeof typeField === 'object' ? typeField?.name : typeField;
            if (t === 'gaussian-surface' || t === 'molecular-surface') toDelete.push(r.cell);
          }
        }
      }
      if (toDelete.length) {
        const del = plugin.build();
        toDelete.forEach(x => del.delete(x));
        await del.commit();
      }
    } catch {}

    if (!enabled) return;

    const alpha = Math.max(0, Math.min(1, (options.opacity ?? 40) / 100));

    // Refresh structures snapshot to avoid stale refs
    structures = plugin.managers.structure.hierarchy.current.structures;
    for (const s of structures) {
      if (!s.components) continue;
      for (const c of s.components) {
        try {
          let colorName = 'uniform';
            let colorParams: Record<string, unknown> = {};
          if (options.inherit) {
            const paramsAny = c.representations?.[0]?.cell.transform.params as Record<string, unknown> | undefined;
            const base = (paramsAny?.['colorTheme'] as { name?: string; params?: Record<string, unknown> } | undefined);
            colorName = base?.name || 'chain-id';
            colorParams = base?.params || {};
          } else if (options.customColor) {
            colorName = 'uniform';
            colorParams = { value: parseInt(String(options.customColor).replace('#',''), 16) };
          } else {
            colorName = 'uniform';
            colorParams = { value: 0x4ECDC4 };
          }

          await plugin.builders.structure.representation.addRepresentation(c.cell, {
            type: 'gaussian-surface',
            typeParams: { quality: 'auto', alpha },
            color: colorName,
            colorParams
          });
        } catch {
          // Skip if component/parent disappeared due to concurrent reload
        }
      }
    }
  }

  async function resetView() {
    if (!viewer) return;
    viewer.plugin.managers.camera.reset();
  }

  return { viewer, mount, clear, loadStructureText, updateColorTheme, listChains, applyIllustrativeStyle, applySurface, resetView, resetColorTheme };
}