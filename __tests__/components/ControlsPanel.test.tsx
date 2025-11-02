import { render, screen, fireEvent } from '@testing-library/react';
import { ControlsPanel } from '../../src/components/Panels/ControlsPanel';

describe('ControlsPanel', () => {
  function setup(extra?: Partial<React.ComponentProps<typeof ControlsPanel>>) {
    const props: React.ComponentProps<typeof ControlsPanel> = {
      colorMode: 'none',
      setColorMode: jest.fn(),
      customColor: '#ffffff',
      setCustomColor: jest.fn(),
      secondaryColors: { helix: '#a', sheet: '#b', coil: '#c' },
      setSecondaryColors: jest.fn(),
      rainbowPalette: 'rainbow',
      setRainbowPalette: jest.fn(),
      detectedChains: ['A', 'B'],
      chainColors: { A: '#4ECDC4', B: '#FF6B6B' },
      setChainColor: jest.fn(),
      illustrative: false,
      onToggleIllustrative: jest.fn(),
      surface: { enabled: false, opacity: 40, inherit: true, customColor: '#4ECDC4' },
      setSurface: jest.fn(),
      onResetView: jest.fn(),
      onAddLocalStructures: undefined,
      ...extra
    };
    render(<ControlsPanel {...props} />);
    return props;
  }

  it('changes color mode via menu', () => {
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: /Select/i }));
    fireEvent.click(screen.getByText('Rainbow'));
    expect(props.setColorMode).toHaveBeenCalledWith('rainbow');
  });

  it('toggles illustrative', () => {
    const props = setup();
    const checkbox = screen.getByLabelText('Illustrative') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(props.onToggleIllustrative).toHaveBeenCalledWith(true);
  });

  it('enables surface and adjusts opacity', () => {
    const props = setup();
    // enable
    fireEvent.click(screen.getByLabelText('Surface'));
    expect(props.setSurface).toHaveBeenCalledWith({ enabled: true, opacity: 40, inherit: true, customColor: '#4ECDC4' });
  });
});


