import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

interface Product {
  id: number;
  name: string;
  image: string;
}

interface ProductMarqueeProps {
  products: Product[];
}

const ProductMarquee = ({ products }: ProductMarqueeProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <div className="relative w-full flex items-center justify-center">
      <video
        ref={videoRef}
        src="https://cdn.poehali.dev/projects/37487b42-26a7-4ea4-bd44-c9a83bc78370/bucket/7313841d-8730-4f61-85d3-8d12f1447709.webm"
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        className="w-full rounded-xl shadow-2xl"
      />
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all backdrop-blur-sm"
      >
        <Icon name={muted ? 'VolumeX' : 'Volume2'} size={20} />
      </button>
    </div>
  );
};

export default ProductMarquee;