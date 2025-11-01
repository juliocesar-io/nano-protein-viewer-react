export type StructureFormat = 'pdb' | 'mmcif' | 'sdf';

export interface StructureUrl {
  name: string;
  url: string;
  format?: StructureFormat;
  style?: {
    colorMode?: 'none' | 'custom' | 'element' | 'residue' | 'secondary' | 'chain' | 'rainbow';
    customColor?: string;
    illustrative?: boolean;
    surface?: { enabled: boolean; opacity?: number; inherit?: boolean; customColor?: string };
  };
}

export interface LoadedStructure {
  name: string;
  data: string;
  format: StructureFormat;
  style?: {
    colorMode?: 'none' | 'custom' | 'element' | 'residue' | 'secondary' | 'chain' | 'rainbow';
    customColor?: string;
    illustrative?: boolean;
    surface?: { enabled: boolean; opacity?: number; inherit?: boolean; customColor?: string };
  };
}

