'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LoadedStructure, StructureFormat, StructureUrl } from '@types';
import { createMolstarViewer } from '@utils/molstar';
import { ControlsPanel } from './Panels/ControlsPanel';
import { GridView } from './Panels/GridView';
import { LayoutPanel } from './Panels/LayoutPanel';
import { FileListPanel } from './Panels/FileListPanel';

export interface NanoProteinViewerProps {
  structureUrls: StructureUrl[];
}

export function NanoProteinViewer({ structureUrls }: NanoProteinViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mol = useMemo(() => createMolstarViewer(), []);
  const [loaded, setLoaded] = useState<LoadedStructure[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  // Detect theme from URL query parameter
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const params = new URLSearchParams(window.location.search);
    return params.get('theme') === 'dark' ? 'dark' : 'light';
  });

  // Apply dark mode styles to Molstar components
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const styleId = 'molstar-dark-mode-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (theme === 'dark') {
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = `
        .msp-plugin .msp-sequence {
          background: #111318 !important;
        }
        .msp-plugin .msp-sequence-select {
          background: #1f222b !important;
        }
        .msp-plugin .msp-sequence-wrapper-non-empty {
          background: #0c0d11 !important;
          color: #ccd4e0 !important;
        }
        .msp-plugin .msp-sequence-chain-label,
        .msp-plugin .msp-sequence-label,
        .msp-plugin .msp-sequence-number {
          color: #51a2fb !important;
        }
        .msp-plugin .msp-sequence-present {
          color: #ccd4e0 !important;
        }
        .msp-plugin .msp-sequence-missing {
          color: #637ca0 !important;
        }
        .msp-plugin .msp-sequence-select > span {
          color: #ccd4e0 !important;
        }
        .msp-plugin .msp-sequence-select > select {
          background: #1f222b !important;
          color: #ccd4e0 !important;
        }
      `;
    } else {
      // Apply light theme styles
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = `
        .msp-plugin .msp-sequence {
          background: #f8fafc !important;
        }
        .msp-plugin .msp-sequence-select {
          background: #ffffff !important;
        }
        .msp-plugin .msp-sequence-wrapper-non-empty {
          background: #f1f5f9 !important;
          color: #1e293b !important;
        }
        .msp-plugin .msp-sequence-chain-label,
        .msp-plugin .msp-sequence-label,
        .msp-plugin .msp-sequence-number {
          color: #3b82f6 !important;
        }
        .msp-plugin .msp-sequence-present {
          color: #1e293b !important;
        }
        .msp-plugin .msp-sequence-missing {
          color: #94a3b8 !important;
        }
        .msp-plugin .msp-sequence-select > span {
          color: #1e293b !important;
        }
        .msp-plugin .msp-sequence-select > select {
          background: #ffffff !important;
          color: #1e293b !important;
        }
      `;
    }
    // Set background color based on theme
    mol.setBackgroundColor(theme);
  }, [theme, mol]);

  // Listen for URL changes to update theme and color mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkParams = () => {
      const params = new URLSearchParams(window.location.search);
      const newTheme = params.get('theme') === 'dark' ? 'dark' : 'light';
      setTheme(newTheme);
      
      const colorParam = params.get('color');
      const validModes: Array<'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow'> = ['none', 'custom', 'element', 'residue', 'secondary', 'chain', 'rainbow'];
      if (colorParam && validModes.includes(colorParam as any)) {
        setColorMode(colorParam as 'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow');
      }
    };
    checkParams();
    window.addEventListener('popstate', checkParams);
    return () => window.removeEventListener('popstate', checkParams);
  }, []);

  // Color controls - initialize from URL parameter
  const [colorMode, setColorMode] = useState<'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow'>(() => {
    if (typeof window === 'undefined') return 'custom';
    const params = new URLSearchParams(window.location.search);
    const colorParam = params.get('color');
    const validModes: Array<'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow'> = ['none', 'custom', 'element', 'residue', 'secondary', 'chain', 'rainbow'];
    if (colorParam && validModes.includes(colorParam as any)) {
      return colorParam as 'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow';
    }
    return 'custom';
  });
  const [customColor, setCustomColor] = useState('');
  const [secondaryColors, setSecondaryColors] = useState<{ helix: string; sheet: string; coil: string }>({ helix: '#0FA3FF', sheet: '#24B235', coil: '#E8E8E8' });
  const [rainbowPalette, setRainbowPalette] = useState<'rainbow'|'viridis'|'plasma'|'magma'|'blue-red'|'pastel'>('rainbow');
  const [detectedChains, setDetectedChains] = useState<string[]>([]);
  const [chainColors, setChainColors] = useState<Record<string,string>>({});
  const [illustrative, setIllustrative] = useState(false);
  const [surface, setSurface] = useState<{ enabled: boolean; opacity: number; inherit: boolean; customColor: string }>({ enabled: false, opacity: 40, inherit: true, customColor: '#4ECDC4' });
  const [plddtEnabled, setPlddtEnabled] = useState(false);
  const [plddtAvailable, setPlddtAvailable] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'single'|'grid'>('single');
  const [showControls, setShowControls] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  type ViewerSettings = {
    colorMode: typeof colorMode;
    customColor: string;
    secondaryColors: { helix: string; sheet: string; coil: string };
    rainbowPalette: typeof rainbowPalette;
    chainColors: Record<string,string>;
    illustrative: boolean;
    surface: { enabled: boolean; opacity: number; inherit: boolean; customColor: string };
  };
  const [settingsByFile, setSettingsByFile] = useState<Record<string, ViewerSettings>>({});
  const [isApplying, setIsApplying] = useState(false);
  const getDefaultSettings = (): ViewerSettings => ({
    colorMode, customColor, secondaryColors, rainbowPalette, chainColors, illustrative, surface
  });
  const getKey = (idx: number) => loaded[idx]?.name || String(idx);

  const detectFormat = (nameOrUrl: string, explicit?: StructureFormat): StructureFormat => {
    if (explicit) return explicit;
    const l = nameOrUrl.toLowerCase();
    if (l.endsWith('.cif') || l.endsWith('.mmcif')) return 'mmcif';
    if (l.endsWith('.sdf')) return 'sdf';
    return 'pdb';
  };

  const fetchAndLoad = useCallback(async (entry: StructureUrl) => {
    const res = await fetch(entry.url);
    if (!res.ok) throw new Error(`Failed to fetch ${entry.url}`);
    const text = await res.text();
    const format = detectFormat(entry.name || entry.url, entry.format);
    return { name: entry.name, data: text, format, style: entry.style } as LoadedStructure;
  }, []);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      const container = containerRef.current;
      if (!container) return;
      await mol.mount(container);

      if (structureUrls && structureUrls.length) {
        try {
          const results = await Promise.all(structureUrls.map(fetchAndLoad));
          if (isCancelled) return;
          setLoaded(results);
          setCurrentIndex(results.length > 0 ? 0 : -1);
          if (results.length > 0) {
            // Check if URL has color parameter - skip pLDDT auto-apply if set
            const urlParamsCheck = new URLSearchParams(window.location.search);
            const urlColorParamCheck = urlParamsCheck.get('color');
            const validModesCheck: Array<'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow'> = ['none', 'custom', 'element', 'residue', 'secondary', 'chain', 'rainbow'];
            const hasColorParam = !!(urlColorParamCheck && validModesCheck.includes(urlColorParamCheck as any));
            
            await mol.loadStructureText(results[0].data, results[0].format, false, hasColorParam);
            // Set background color after loading
            mol.setBackgroundColor(theme);
            // detect chains and init defaults
            const chains = await mol.listChains();
            setDetectedChains(chains);
            let localChainColors: Record<string,string> = chainColors;
            if (chains.length) {
              const defaults = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#BB8FCE','#85C1E2','#F8B4B4','#52B788'];
              const cc: Record<string,string> = {};
              chains.forEach((c, i) => { cc[c] = defaults[i % defaults.length]; });
              localChainColors = cc;
              setChainColors(cc);
            }
            // init settings for first file if missing
            const key = results[0].name;
            // Check if URL has color parameter - it takes precedence (reuse from above)
            const urlColorMode = urlColorParamCheck && validModesCheck.includes(urlColorParamCheck as any) 
              ? (urlColorParamCheck as 'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow')
              : null;
            
            let finalColorMode: 'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow' = colorMode;
            let finalCustomColor = customColor;
            
            if (results[0].style) {
              const s = results[0].style;
              // Use URL color parameter if present, otherwise use structure style
              if (urlColorMode) {
                finalColorMode = urlColorMode;
                setColorMode(urlColorMode);
              } else if (s.colorMode) {
                finalColorMode = s.colorMode;
                setColorMode(s.colorMode);
              }
              if (s.customColor !== undefined) {
                finalCustomColor = s.customColor;
                setCustomColor(s.customColor);
              }
              if (s.illustrative !== undefined) setIllustrative(s.illustrative);
              if (s.surface !== undefined) setSurface({
                enabled: !!s.surface.enabled,
                opacity: s.surface.opacity ?? 40,
                inherit: s.surface.inherit ?? true,
                customColor: s.surface.customColor ?? '#4ECDC4'
              });
              setSettingsByFile(prev => ({ ...prev, [key]: {
                colorMode: finalColorMode,
                customColor: finalCustomColor,
                secondaryColors,
                rainbowPalette,
                chainColors: localChainColors,
                illustrative: s.illustrative ?? illustrative,
                surface: {
                  enabled: !!(s.surface && s.surface.enabled),
                  opacity: s.surface?.opacity ?? surface.opacity,
                  inherit: s.surface?.inherit ?? surface.inherit,
                  customColor: s.surface?.customColor ?? surface.customColor
                }
              }}));
            } else {
              // If URL has color parameter, use it; otherwise use default
              if (urlColorMode) {
                finalColorMode = urlColorMode;
                setColorMode(urlColorMode);
              }
              setSettingsByFile(prev => prev[key] ? prev : ({ ...prev, [key]: getDefaultSettings() }));
            }
            
            // Check PLDDT availability
            const plddtAvail = await mol.isPLDDTAvailable();
            setPlddtAvailable(plddtAvail);
            
            // Apply color theme immediately after setting up
            try {
              if (finalColorMode === 'none') {
                // no theme override
              } else if (finalColorMode === 'custom') {
                if (finalCustomColor) await mol.updateColorTheme('custom', { hex: finalCustomColor });
              } else if (finalColorMode === 'secondary') {
                await mol.updateColorTheme('secondary', { secondaryColors });
              } else if (finalColorMode === 'element') {
                await mol.updateColorTheme('element');
              } else if (finalColorMode === 'residue') {
                await mol.updateColorTheme('residue');
              } else if (finalColorMode === 'chain') {
                // Use localChainColors which is guaranteed to be up-to-date
                await mol.updateColorTheme('chain', { chainColors: localChainColors });
              } else if (finalColorMode === 'rainbow') {
                await mol.updateColorTheme('rainbow', { palette: rainbowPalette });
              }
            } catch (e) {
              // eslint-disable-next-line no-console
              console.warn('Failed to apply color theme on initial load:', e);
            }
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
        }
      }
    })();
    return () => { isCancelled = true; };
  }, [fetchAndLoad, mol, structureUrls, theme]);

  const onSelectIndex = useCallback(async (idx: number) => {
    if (idx < 0 || idx >= loaded.length) return;

    // Persist settings of current file before switching
    if (currentIndex >= 0 && currentIndex < loaded.length) {
      const currentKey = getKey(currentIndex);
      setSettingsByFile(prev => ({
        ...prev,
        [currentKey]: { colorMode, customColor, secondaryColors, rainbowPalette, chainColors, illustrative, surface }
      }));
    }

    setIsApplying(true);
    setCurrentIndex(idx);
    
    // Check if URL has color parameter - skip pLDDT auto-apply if set
    const urlParamsSelect = new URLSearchParams(window.location.search);
    const urlColorParamSelect = urlParamsSelect.get('color');
    const validModesSelect: Array<'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow'> = ['none', 'custom', 'element', 'residue', 'secondary', 'chain', 'rainbow'];
    const hasColorParamSelect = !!(urlColorParamSelect && validModesSelect.includes(urlColorParamSelect as any));
    
    await mol.loadStructureText(loaded[idx].data, loaded[idx].format, false, hasColorParamSelect);
    // Set background color after loading
    mol.setBackgroundColor(theme);

    // Update detected chains for the newly loaded structure
    const chains = await mol.listChains();
    setDetectedChains(chains);
    
    // Update chain colors if chains were detected
    let updatedChainColors = chainColors;
    if (chains.length) {
      const defaults = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#BB8FCE','#85C1E2','#F8B4B4','#52B788'];
      const cc: Record<string,string> = {};
      chains.forEach((c, i) => { cc[c] = defaults[i % defaults.length]; });
      updatedChainColors = cc;
      setChainColors(cc);
    }

    // Check if URL has color parameter - it takes precedence (reuse from above)
    const urlColorMode = urlColorParamSelect && validModesSelect.includes(urlColorParamSelect as any) 
      ? (urlColorParamSelect as 'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow')
      : null;

    // Compute next settings deterministically for this file
    const key = getKey(idx);
    const saved = settingsByFile[key];
    const incoming = loaded[idx]?.style;
    // URL color parameter takes precedence over saved settings and structure style
    const finalColorMode = urlColorMode ?? (saved ? saved.colorMode : (incoming?.colorMode ?? colorMode));
    const next = saved ? {
      ...saved,
      colorMode: finalColorMode,
      chainColors: updatedChainColors  // Use updated chain colors
    } : {
      colorMode: finalColorMode,
      customColor: incoming?.customColor ?? customColor,
      secondaryColors,
      rainbowPalette,
      chainColors: updatedChainColors,  // Use updated chain colors
      illustrative: incoming?.illustrative ?? illustrative,
      surface: {
        enabled: !!(incoming?.surface && incoming.surface.enabled),
        opacity: incoming?.surface?.opacity ?? surface.opacity,
        inherit: incoming?.surface?.inherit ?? surface.inherit,
        customColor: incoming?.surface?.customColor ?? surface.customColor
      }
    } as ViewerSettings;

    // Set state from next and persist per file
    setColorMode(next.colorMode);
    setCustomColor(next.customColor);
    setSecondaryColors(next.secondaryColors);
    setRainbowPalette(next.rainbowPalette);
    setChainColors(next.chainColors);
    setIllustrative(next.illustrative);
    setSurface(next.surface);
    setSettingsByFile(prev => ({ ...prev, [key]: next }));

    // Apply immediately using next values to avoid leakage
    try {
      if (next.colorMode === 'none') {
        // no theme override
      } else if (next.colorMode === 'custom') {
        if (next.customColor) await mol.updateColorTheme('custom', { hex: next.customColor });
      } else if (next.colorMode === 'secondary') {
        await mol.updateColorTheme('secondary', { secondaryColors: next.secondaryColors });
      } else if (next.colorMode === 'element') {
        await mol.updateColorTheme('element');
      } else if (next.colorMode === 'residue') {
        await mol.updateColorTheme('residue');
      } else if (next.colorMode === 'chain') {
        // Use updated chain colors
        await mol.updateColorTheme('chain', { chainColors: next.chainColors });
      } else if (next.colorMode === 'rainbow') {
        await mol.updateColorTheme('rainbow', { palette: next.rainbowPalette });
      }
      await mol.applyIllustrativeStyle(next.illustrative);
      await mol.applySurface(next.surface.enabled, { opacity: next.surface.opacity, inherit: next.surface.inherit, customColor: next.surface.customColor });
      
      // Check PLDDT availability for the new structure
      const plddtAvail = await mol.isPLDDTAvailable();
      setPlddtAvailable(plddtAvail);
    } finally {
      setIsApplying(false);
    }
  }, [chainColors, colorMode, currentIndex, customColor, getDefaultSettings, getKey, illustrative, loaded, mol, rainbowPalette, secondaryColors, settingsByFile, surface, theme]);

  // When current file changes, restore its saved settings (or initialize from current defaults)
  useEffect(() => {
    (async () => {
      if (currentIndex < 0 || currentIndex >= loaded.length) return;
      const key = getKey(currentIndex);
      const saved = settingsByFile[key];
      if (saved) {
        setColorMode(saved.colorMode);
        setCustomColor(saved.customColor);
        setSecondaryColors(saved.secondaryColors);
        setRainbowPalette(saved.rainbowPalette);
        setChainColors(saved.chainColors);
        setIllustrative(saved.illustrative);
        setSurface(saved.surface);
      } else {
        setSettingsByFile(prev => ({ ...prev, [key]: getDefaultSettings() }));
      }
    })();
  }, [currentIndex, loaded.length]);

  // Apply color theme when controls change
  useEffect(() => {
    (async () => {
      if (!loaded.length || isApplying) return;
      if (colorMode === 'none') {
        const current = loaded[currentIndex] ?? loaded[0];
        if (current) {
          // Skip pLDDT when colorMode is explicitly set to 'none'
          await mol.loadStructureText(current.data, current.format, false, true);
        }
        return;
      }
      if (colorMode === 'custom') {
        if (!customColor) return;
        await mol.updateColorTheme('custom', { hex: customColor });
      } else if (colorMode === 'secondary') {
        await mol.updateColorTheme('secondary', { secondaryColors });
      } else if (colorMode === 'element') {
        await mol.updateColorTheme('element');
      } else if (colorMode === 'residue') {
        await mol.updateColorTheme('residue');
      } else if (colorMode === 'chain') {
        await mol.updateColorTheme('chain', { chainColors });
      } else if (colorMode === 'rainbow') {
        await mol.updateColorTheme('rainbow', { palette: rainbowPalette });
      }
    })();
  }, [colorMode, customColor, secondaryColors, rainbowPalette, chainColors, currentIndex, loaded.length, mol, isApplying]);

  // Apply illustrative/surface when toggled
  useEffect(() => { if (isApplying) return; (async () => { await mol.applyIllustrativeStyle(illustrative); })(); }, [illustrative, currentIndex, mol, isApplying]);
  useEffect(() => { if (isApplying) return; (async () => { await mol.applySurface(surface.enabled, { opacity: surface.opacity, inherit: surface.inherit, customColor: surface.customColor }); })(); }, [surface.enabled, surface.opacity, surface.inherit, surface.customColor, currentIndex, mol, isApplying]);
  
  // Apply PLDDT theme when toggled
  useEffect(() => {
    if (isApplying || !plddtAvailable) return;
    (async () => {
      await mol.applyPLDDTTheme(plddtEnabled);
    })();
  }, [plddtEnabled, plddtAvailable, currentIndex, mol, isApplying]);

  // Persist settings per file whenever controls change
  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= loaded.length) return;
    const key = getKey(currentIndex);
    setSettingsByFile(prev => ({
      ...prev,
      [key]: {
        colorMode, customColor, secondaryColors, rainbowPalette, chainColors, illustrative, surface
      }
    }));
  }, [colorMode, customColor, secondaryColors, rainbowPalette, chainColors, illustrative, surface, currentIndex, loaded.length]);

  // Ensure main viewer is mounted and shows current structure when switching back to single layout
  useEffect(() => {
    (async () => {
      if (layoutMode !== 'single') return;
      const el = containerRef.current;
      if (!el) return;
      await mol.mount(el);
      const current = loaded[currentIndex] ?? loaded[0];
      if (current) {
        // Check if URL has color parameter - skip pLDDT auto-apply if set
        const urlParamsLayout = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const urlColorParamLayout = urlParamsLayout?.get('color');
        const validModesLayout: Array<'none'|'custom'|'element'|'residue'|'secondary'|'chain'|'rainbow'> = ['none', 'custom', 'element', 'residue', 'secondary', 'chain', 'rainbow'];
        const hasColorParamLayout = !!(urlColorParamLayout && validModesLayout.includes(urlColorParamLayout as any));
        
        await mol.loadStructureText(current.data, current.format, false, hasColorParamLayout);
        // Set background color after loading
        mol.setBackgroundColor(theme);
      }
    })();
  }, [layoutMode, currentIndex, loaded, mol, theme]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {layoutMode === 'single' && (
        <div style={{ position: 'absolute', inset: 0 }} ref={containerRef} />
      )}
      {layoutMode === 'grid' && (
        <GridView files={loaded} onSelect={(i) => { onSelectIndex(i); }} />
      )}

      {layoutMode === 'single' && (
        showControls ? (
          <div style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', zIndex: 10, width: 260 }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowControls(false)}
                aria-label="Hide controls"
                title="Hide"
                style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '2px 8px', cursor: 'pointer', zIndex: 1 }}
              >×</button>
              <ControlsPanel
                colorMode={colorMode}
                setColorMode={setColorMode}
                customColor={customColor}
                setCustomColor={setCustomColor}
                secondaryColors={secondaryColors}
                setSecondaryColors={setSecondaryColors}
                // Rainbow
                rainbowPalette={rainbowPalette}
                setRainbowPalette={setRainbowPalette}
                // Chain
                detectedChains={detectedChains}
                chainColors={chainColors}
                setChainColor={(id, hex) => setChainColors(prev => ({ ...prev, [id]: hex }))}
                // Style
                illustrative={illustrative}
                onToggleIllustrative={setIllustrative}
                surface={surface}
              setSurface={setSurface}
              plddtEnabled={plddtEnabled}
              onTogglePLDDT={setPlddtEnabled}
              plddtAvailable={plddtAvailable}
              onAddLocalStructures={(items) => {
                setLoaded(prev => [...prev, ...items.map(i => ({ name: i.name, data: i.data, format: i.format }))]);
              }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowControls(true)}
            aria-label="Show controls"
            title="Show controls"
            style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', zIndex: 10,
              background: 'linear-gradient(180deg, #ffffffcc, #ffffffa0)', color: '#2b2b2b', border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 999, padding: '8px 14px', fontWeight: 600, letterSpacing: 0.2, boxShadow: '0 6px 16px rgba(0,0,0,0.15)', cursor: 'pointer' }}
          >Controls</button>
        )
      )}

      {showFiles ? (
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 280 }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFiles(false)}
              aria-label="Hide files"
              title="Hide"
              style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '2px 8px', cursor: 'pointer', zIndex: 1 }}
            >×</button>
            <FileListPanel
              files={loaded.map((f) => ({ name: f.name, format: f.format }))}
              currentIndex={currentIndex}
              onSelect={onSelectIndex}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowFiles(true)}
          aria-label="Show files"
          title="Show files"
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
            background: 'linear-gradient(180deg, #ffffffcc, #ffffffa0)', color: '#2b2b2b', border: '1px solid rgba(255,255,255,0.6)',
            borderRadius: 999, padding: '8px 14px', fontWeight: 600, letterSpacing: 0.2, boxShadow: '0 6px 16px rgba(0,0,0,0.15)', cursor: 'pointer' }}
        >Files</button>
      )}

      <LayoutPanel mode={layoutMode} setMode={setLayoutMode} />
    </div>
  );
}

