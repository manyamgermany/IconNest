declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  export type Icon = FC<IconProps>;
  export const Monitor: Icon;
  export const Check: Icon;
  export const ChevronDown: Icon;
  export const Download: Icon;
  export const AlertCircle: Icon;
  export const RefreshCw: Icon;
  export const Layers: Icon;
  export const Upload: Icon;
  export const ImageIcon: Icon;
  export const LinkIcon: Icon;
  export const ZoomIn: Icon;
  export const ZoomOut: Icon;
  export const Maximize: Icon;
}
