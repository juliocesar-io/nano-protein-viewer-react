import { render, screen, fireEvent } from '@testing-library/react';
import { LayoutPanel } from '../../src/components/Panels/LayoutPanel';

describe('LayoutPanel', () => {
  it('switches between Single and Grid', () => {
    const setMode = jest.fn();
    render(<div style={{ position: 'relative' }}><LayoutPanel mode="single" setMode={setMode} /></div>);
    fireEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(setMode).toHaveBeenCalledWith('grid');
    fireEvent.click(screen.getByRole('button', { name: 'Single' }));
    expect(setMode).toHaveBeenCalledWith('single');
  });
});


