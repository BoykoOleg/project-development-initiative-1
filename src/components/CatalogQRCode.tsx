import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CatalogQRCode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const catalogUrl = `${window.location.origin}#catalog?mobile=true`;
      QRCode.toCanvas(canvasRef.current, catalogUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, []);

  return (
    <Card className="w-fit mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Каталог продукции</CardTitle>
        <CardDescription>Отсканируйте QR-код для быстрого доступа</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <canvas ref={canvasRef} />
      </CardContent>
    </Card>
  );
}