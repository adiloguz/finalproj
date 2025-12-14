import React, { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import { useZxing } from "react-zxing"; // Assuming installed, or we provide fallback logic

interface ScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);

  // Note: In a real environment, you would run `npm install react-zxing`
  // Here we use the hook. If the environment doesn't strictly support the hook at runtime 
  // without install, this code structure is still the correct React implementation.
  
  const { ref } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText());
    },
    onError(err) {
      // Suppress constant scanning errors, only show critical ones if needed
      if (err.name === 'NotAllowedError') {
        setError("Kamera izni verilmedi.");
      }
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-xl overflow-hidden relative border border-gray-700 shadow-2xl">
        <div className="p-4 flex justify-between items-center bg-gray-800 text-white">
          <h3 className="font-semibold flex items-center gap-2">
            <Camera size={20} /> Barkod Tara
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        <div className="relative aspect-[4/3] bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center">
              {error}
            </div>
          ) : (
            <>
              <video ref={ref} className="w-full h-full object-cover" />
              {/* Overlay for scanning area */}
              <div className="absolute inset-0 border-2 border-brand-500 opacity-50 m-12 rounded-lg animate-pulse"></div>
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 opacity-80 shadow-[0_0_10px_rgba(255,0,0,0.8)]"></div>
            </>
          )}
        </div>

        <div className="p-4 text-center text-gray-400 text-sm">
           Barkodu kırmızı çizgiye hizalayın.
        </div>
      </div>
    </div>
  );
};

export default Scanner;