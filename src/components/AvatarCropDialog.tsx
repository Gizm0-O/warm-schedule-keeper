import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Props {
  src: string;
  open: boolean;
  onClose: () => void;
  onCropped: (blob: Blob) => void;
  aspect?: number;
  cropShape?: "round" | "rect";
  /** longest output side in px */
  outputSize?: number;
}

async function getCroppedBlob(src: string, area: Area, outW: number, outH: number): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outW, outH);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9));
}

export default function AvatarCropDialog({ src, open, onClose, onCropped, aspect = 1, cropShape = "round", outputSize = 1024 }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const save = async () => {
    if (!area) return;
    const outW = aspect >= 1 ? outputSize : Math.round(outputSize * aspect);
    const outH = aspect >= 1 ? Math.round(outputSize / aspect) : outputSize;
    const blob = await getCroppedBlob(src, area, outW, outH);
    onCropped(blob);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vyber výřez fotky</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-80 bg-muted rounded-lg overflow-hidden">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={false}
            minZoom={1}
            maxZoom={4}
            restrictPosition
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Přiblížení</label>
          <Slider value={[zoom]} min={1} max={4} step={0.01} onValueChange={(v) => setZoom(v[0])} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Zrušit</Button>
          <Button onClick={save}>Použít</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
