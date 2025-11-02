import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NanoProteinViewer } from '../../src/components/NanoProteinViewer';

jest.mock('../../src/utils/molstar', () => {
  const calls: any[] = [];
  const viewer = {
    mount: jest.fn(async (_el: HTMLElement) => {}),
    clear: jest.fn(async () => {}),
    loadStructureText: jest.fn(async () => {}),
    listChains: jest.fn(async () => ['A', 'B']),
    updateColorTheme: jest.fn(async () => {}),
    applyIllustrativeStyle: jest.fn(async () => {}),
    applySurface: jest.fn(async () => {}),
    resetView: jest.fn(async () => {}),
    resetColorTheme: jest.fn(async () => {}),
  };
  return {
    createMolstarViewer: () => viewer,
  };
});

describe('NanoProteinViewer', () => {
  beforeEach(() => {
    // Mock fetch for structureUrls (Response is not available in Jest by default)
    global.fetch = jest.fn(async () => ({ ok: true, text: async () => 'ATOM\n' })) as any;
  });

  it('mounts viewer and loads first structure, applies control changes, and switches file', async () => {
    render(
      <div style={{ width: 800, height: 600 }}>
        <NanoProteinViewer structureUrls={[
          { name: '1CRN', url: 'https://files.rcsb.org/download/1CRN.pdb', format: 'pdb' },
          { name: 'AF', url: 'https://alphafold.ebi.ac.uk/files/AF.cif', format: 'mmcif',
            style: { colorMode: 'secondary', surface: { enabled: true, opacity: 30, inherit: true } } }
        ]} />
      </div>
    );

    // Wait for initial load to complete
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Open color menu and choose Rainbow
    fireEvent.click(screen.getByRole('button', { name: /Select|Rainbow|Custom|Element|Residue|Secondary|Chain/ }));
    fireEvent.click(screen.getByText('Rainbow'));

    // Toggle illustrative
    fireEvent.click(screen.getByLabelText('Illustrative'));

    // Enable surface
    fireEvent.click(screen.getByLabelText('Surface'));

    // Switch file using files panel
    // The second file is labelled 'AF'
    await waitFor(() => expect(screen.getByText('AF')).toBeInTheDocument());
    fireEvent.click(screen.getByText('AF'));
  });
});


