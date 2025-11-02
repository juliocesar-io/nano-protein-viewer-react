import { render, screen, fireEvent } from '@testing-library/react';
import { FileListPanel } from '../../src/components/Panels/FileListPanel';

describe('FileListPanel', () => {
  it('renders files and calls onSelect', () => {
    const onSelect = jest.fn();
    const files = [
      { name: '1CRN', format: 'pdb' as const },
      { name: 'AF', format: 'mmcif' as const }
    ];
    render(<FileListPanel files={files} currentIndex={0} onSelect={onSelect} />);
    expect(screen.getByText('Loaded Files')).toBeInTheDocument();
    fireEvent.click(screen.getByText('AF'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});


