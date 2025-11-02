import { render, screen, fireEvent, act } from '@testing-library/react';
import { GridView } from '../../src/components/Panels/GridView';

jest.mock('../../src/utils/molstar', () => {
  return {
    createMolstarViewer: () => {
      return {
        mount: jest.fn(async (host: HTMLElement) => {
          const canvas = document.createElement('canvas');
          // @ts-ignore
          canvas.toDataURL = () => 'data:image/png;base64,AAAA';
          host.appendChild(canvas);
        }),
        clear: jest.fn(async () => {}),
        loadStructureText: jest.fn(async () => {}),
      };
    },
  };
});

describe('GridView', () => {
  it('renders previews and activates a grid item', async () => {
    const onSelect = jest.fn();
    const files = [
      { name: '1', data: 'ATOM', format: 'pdb' as const },
      { name: '2', data: 'data_', format: 'mmcif' as const },
    ];
    render(<div style={{ position: 'relative', width: 600, height: 400 }}><GridView files={files} onSelect={onSelect} /></div>);

    // wait for preview to be generated
    await act(async () => { await new Promise(r => setTimeout(r, 250)); });

    const clickable = document.querySelector('[id^="grid-item-0"]') as HTMLElement;
    await act(async () => { fireEvent.click(clickable); });
    expect(onSelect).toHaveBeenCalledWith(0);
  });
});


