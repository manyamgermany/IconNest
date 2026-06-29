import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const svgToPng = (svgStr: string, size: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas not supported'));

    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Blob conversion failed'));
      }, 'image/png');
    };
    img.onerror = () => {
      reject(new Error('Image loading failed'));
    };
    img.src = url;
  });
};

export async function exportToZip(
  icons: {name: string, svg: string, category?: string}[], 
  brandName: string,
  format: 'SVG' | 'PNG' | 'EPS' = 'SVG',
  size: number = 32
) {
  const zip = new JSZip();
  
  for (const icon of icons) {
    const folderName = icon.category || 'Uncategorized';
    const folder = zip.folder(folderName);
    if (!folder) continue;

    if (format === 'PNG') {
      try {
        const pngBlob = await svgToPng(icon.svg, size);
        folder.file(`${icon.name}-${size}px.png`, pngBlob);
      } catch (e) {
        console.error('Failed to convert PNG', e);
        folder.file(`${icon.name}.svg`, icon.svg);
      }
    } else if (format === 'EPS') {
      // Mock EPS wrapper
      const epsString = `%!PS-Adobe-3.0 EPSF-3.0\n%%BoundingBox: 0 0 ${size} ${size}\n%%EndComments\n${icon.svg}`;
      folder.file(`${icon.name}.eps`, epsString);
    } else {
      folder.file(`${icon.name}.svg`, icon.svg);
    }
  }
  
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${brandName || 'brand'}-icon-set-${format.toLowerCase()}.zip`);
}
