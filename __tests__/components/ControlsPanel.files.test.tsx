import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlsPanel } from '../../src/components/Panels/ControlsPanel';

describe('ControlsPanel file handling', () => {
  it('detects formats and calls onAddLocalStructures', async () => {
    const onAddLocalStructures = jest.fn();
    const { container } = render(
      <ControlsPanel
        colorMode="none"
        setColorMode={() => {}}
        customColor=""
        setCustomColor={() => {}}
        secondaryColors={{ helix: '#a', sheet: '#b', coil: '#c' }}
        setSecondaryColors={() => {}}
        detectedChains={[]}
        chainColors={{}}
        setChainColor={() => {}}
        illustrative={false}
        onToggleIllustrative={() => {}}
        surface={{ enabled: false, opacity: 40, inherit: true, customColor: '#4ECDC4' }}
        setSurface={() => {}}
        onAddLocalStructures={onAddLocalStructures}
      />
    );

    const input = container.querySelector('#controls-file-input') as HTMLInputElement;
    const pdb = new File(['ATOM  '], '1CRN.pdb', { type: 'text/plain' });
    const cif = new File(['data_ '], 'AF.cif', { type: 'text/plain' });
    // jsdom File may lack .text(); stub it
    (pdb as any).text = async () => 'ATOM  ';
    (cif as any).text = async () => 'data_ ';
    await userEvent.upload(input, [pdb, cif]);

    expect(onAddLocalStructures).toHaveBeenCalled();
  });
});


