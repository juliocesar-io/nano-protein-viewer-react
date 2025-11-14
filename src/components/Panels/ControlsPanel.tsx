import { useMemo, useState } from 'react';

type ColorMode = 'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow';

interface ControlsPanelProps {
  colorMode: ColorMode;
  setColorMode: (m: ColorMode) => void;
  customColor: string;
  setCustomColor: (hex: string) => void;
  secondaryColors: { helix: string; sheet: string; coil: string };
  setSecondaryColors: (c: { helix: string; sheet: string; coil: string }) => void;
  rainbowPalette?: 'rainbow'|'viridis'|'plasma'|'magma'|'blue-red'|'pastel';
  setRainbowPalette?: (p: 'rainbow'|'viridis'|'plasma'|'magma'|'blue-red'|'pastel') => void;
  detectedChains?: string[];
  chainColors?: Record<string,string>;
  setChainColor?: (chainId: string, hex: string) => void;
  illustrative?: boolean;
  onToggleIllustrative?: (v: boolean) => void;
  surface?: { enabled: boolean; opacity: number; inherit: boolean; customColor: string };
  setSurface?: (s: { enabled: boolean; opacity: number; inherit: boolean; customColor: string }) => void;
  plddtEnabled?: boolean;
  onTogglePLDDT?: (enabled: boolean) => void;
  plddtAvailable?: boolean;
  onResetView?: () => void;
  // layout controls removed; handled by separate LayoutPanel
  onAddLocalStructures?: (items: Array<{ name: string; data: string; format: 'pdb'|'mmcif' }>) => void;
}

export function ControlsPanel(props: ControlsPanelProps) {
  const [open, setOpen] = useState(false);
  const palette = useMemo(() => [
    '#4ECDC4','#FF6B6B','#4DABF7','#69DB7C','#FFD93D',
    '#FF922B','#DA77F2','#FF8CC8','#15AABF','#868E96'
  ], []);
  const fileInputId = 'controls-file-input';
  const colorInputId = 'controls-custom-color-input';

  const detectFormat = (name: string, content: string): 'pdb'|'mmcif'|null => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.cif') || lower.endsWith('.mmcif')) return 'mmcif';
    if (lower.endsWith('.pdb') || lower.endsWith('.pdbqt')) return 'pdb';
    if (content.includes('data_') || content.includes('_atom_site')) return 'mmcif';
    if (content.includes('ATOM') || content.includes('HETATM')) return 'pdb';
    return null;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !props.onAddLocalStructures) return;
    const items: Array<{ name: string; data: string; format: 'pdb'|'mmcif' }> = [];
    for (const f of Array.from(files)) {
      const text = await f.text();
      const fmt = detectFormat(f.name, text);
      if (fmt) items.push({ name: f.name, data: text, format: fmt });
    }
    if (items.length) props.onAddLocalStructures(items);
  };

  return (
    <div style={{
      background: 'rgba(30, 30, 30, 0.95)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 12,
      padding: 25,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      width: '100%',
      boxSizing: 'border-box'
    }}>

      {props.onAddLocalStructures && (
        <div style={{ marginTop: 10 }}>
          <input id={fileInputId} type="file" accept=".pdb,.PDB,.cif,.CIF,.mmcif,.MMCIF" multiple style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
          <button onClick={() => document.getElementById(fileInputId)?.click()} style={{
            padding: '10px 14px', width: '100%', borderRadius: 10, border: 'none',
            background: 'linear-gradient(180deg, #5B9CFF, #357AE8)', color: '#fff', fontWeight: 600,
            letterSpacing: 0.2, boxShadow: '0 6px 16px rgba(53, 122, 232, 0.5)', cursor: 'pointer'
          }}>Load PDB/mmCIF</button>
        </div>
      )}

      {/* layout controls handled elsewhere */}

      <div style={{ marginTop: 12 }}>
        <h4 style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.9)' }}>Colors</h4>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setOpen(o => !o)} style={{
            background: 'rgba(50, 50, 50, 0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '6px 12px',
            fontSize: 12, color: 'rgba(255,255,255,0.9)', cursor: 'pointer'
          }}>
            {props.colorMode === 'none' ? 'Select' : (props.colorMode === 'rainbow' ? 'Rainbow' : props.colorMode.charAt(0).toUpperCase()+props.colorMode.slice(1))} ▼
          </button>
          {open && (
            <div style={{ position: 'absolute', background: 'rgba(40, 40, 40, 0.98)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, marginTop: 4, zIndex: 20, width: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              {(['none','custom','element','residue','secondary','chain','rainbow'] as ColorMode[]).map(m => (
                <div key={m} onClick={() => { props.setColorMode(m); setOpen(false); }}
                  style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.9)', background: props.colorMode===m?'rgba(100, 150, 255, 0.3)':'transparent' }}>
                  {m === 'none' ? 'None' : m.charAt(0).toUpperCase()+m.slice(1)}
                </div>
              ))}
            </div>
          )}
        </div>

        {props.colorMode === 'custom' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              {palette.map(hex => (
                <div
                  key={hex}
                  title={hex}
                  onClick={() => props.setCustomColor(hex)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: hex,
                    border: '1px solid rgba(255,255,255,0.3)',
                    boxShadow: props.customColor===hex ? '0 0 0 2px rgba(255,255,255,0.6)' : 'none',
                    cursor: 'pointer'
                  }}
                />
              ))}
              {/* native color input as the final circle with + overlay */}
              <div style={{ position: 'relative', width: 22, height: 22 }} title="Pick custom color">
                <input
                  id={colorInputId}
                  type="color"
                  value={/^#([0-9A-F]{3}){1,2}$/i.test(props.customColor) ? props.customColor : '#ffffff'}
                  onChange={(e) => props.setCustomColor(e.target.value)}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    width: 22,
                    height: 22,
                    padding: 0,
                    borderRadius: '50%',
                    border: '1px dashed rgba(255,255,255,0.4)',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                />
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontWeight: 800,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.9)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    pointerEvents: 'none',
                    lineHeight: 1
                  }}
                >+
                </span>
              </div>
            </div>
          </div>
        )}

        {props.colorMode === 'secondary' && (
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>Helix <input type="color" value={props.secondaryColors.helix} onChange={(e) => props.setSecondaryColors({ ...props.secondaryColors, helix: e.target.value })} style={{ marginLeft: 8 }} /></label>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>Sheet <input type="color" value={props.secondaryColors.sheet} onChange={(e) => props.setSecondaryColors({ ...props.secondaryColors, sheet: e.target.value })} style={{ marginLeft: 8 }} /></label>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>Coil <input type="color" value={props.secondaryColors.coil} onChange={(e) => props.setSecondaryColors({ ...props.secondaryColors, coil: e.target.value })} style={{ marginLeft: 8 }} /></label>
          </div>
        )}

        {props.colorMode === 'rainbow' && props.setRainbowPalette && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              {(['rainbow','viridis','plasma','magma','blue-red','pastel'] as const).map(p => (
                <button key={p} onClick={() => props.setRainbowPalette!(p)}
                  style={{ padding: '6px 8px', fontSize: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: props.rainbowPalette===p?'rgba(100, 150, 255, 0.3)':'rgba(50, 50, 50, 0.8)', color: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {props.colorMode === 'chain' && props.detectedChains && props.chainColors && props.setChainColor && (
          <div style={{ marginTop: 10 }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.9)' }}>Customize Chain Colors</h4>
            <div style={{ display: 'grid', gap: 6 }}>
              {props.detectedChains.map(id => (
                <label key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
                  <span>Chain {id}</span>
                  <input type="color" value={props.chainColors![id] || '#4ECDC4'} onChange={(e) => props.setChainColor!(id, e.target.value)} />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <h4 style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.9)' }}>Style</h4>
        {typeof props.illustrative === 'boolean' && props.onToggleIllustrative && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
            <input type="checkbox" checked={props.illustrative} onChange={(e) => props.onToggleIllustrative!(e.target.checked)} /> Illustrative
          </label>
        )}
        {props.surface && props.setSurface && (
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
              <input
                type="checkbox"
                checked={props.surface.enabled}
                onChange={(e) => props.setSurface!({
                  enabled: e.target.checked,
                  opacity: props.surface!.opacity,
                  inherit: props.surface!.inherit,
                  customColor: props.surface!.customColor
                })}
              /> Surface
            </label>
            {props.surface.enabled && (
              <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>Opacity
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={props.surface.opacity}
                    onChange={(e) => props.setSurface!({
                      enabled: props.surface!.enabled,
                      opacity: parseInt(e.target.value),
                      inherit: props.surface!.inherit,
                      customColor: props.surface!.customColor
                    })}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
                  <input
                    type="checkbox"
                    checked={props.surface.inherit}
                    onChange={(e) => props.setSurface!({
                      enabled: props.surface!.enabled,
                      opacity: props.surface!.opacity,
                      inherit: e.target.checked,
                      customColor: props.surface!.customColor
                    })}
                  /> Inherit color from theme
                </label>
                {!props.surface.inherit && (
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>Surface Color
                    <input
                      type="color"
                      value={props.surface.customColor}
                      onChange={(e) => props.setSurface!({
                        enabled: props.surface!.enabled,
                        opacity: props.surface!.opacity,
                        inherit: props.surface!.inherit,
                        customColor: e.target.value
                      })}
                      style={{ marginLeft: 8 }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        )}
        {props.plddtAvailable && typeof props.plddtEnabled === 'boolean' && props.onTogglePLDDT && (
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
              <input
                type="checkbox"
                checked={props.plddtEnabled}
                onChange={(e) => props.onTogglePLDDT!(e.target.checked)}
              /> PLDDT
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

