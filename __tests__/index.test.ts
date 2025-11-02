import { createMolstarViewer, NanoProteinViewer } from '../src';

describe('library exports', () => {
  it('exposes createMolstarViewer API functions', () => {
    const v = createMolstarViewer();
    expect(typeof v.mount).toBe('function');
    expect(typeof v.clear).toBe('function');
    expect(typeof v.loadStructureText).toBe('function');
  });

  it('exposes NanoProteinViewer component', () => {
    expect(NanoProteinViewer).toBeTruthy();
  });
});


