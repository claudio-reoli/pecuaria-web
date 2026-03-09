import { useRef, useState, useEffect } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { api } from '../services/api';

const MAX_SIZE = 3 * 1024 * 1024; // 3MB

interface ImageCaptureProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

function compressImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      const maxDim = 1920;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = (h * maxDim) / w;
          w = maxDim;
        } else {
          w = (w * maxDim) / h;
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      const tryExport = () => {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size <= maxSize) {
              resolve(blob);
            } else if (quality > 0.3) {
              quality -= 0.15;
              tryExport();
            } else {
              resolve(blob || new Blob());
            }
          },
          'image/jpeg',
          quality
        );
      };
      tryExport();
    };
    img.onerror = () => resolve(new Blob([file]));
    img.src = URL.createObjectURL(file);
  });
}

export function ImageCapture({ value, onChange, label = 'Foto' }: ImageCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const upload = async (blob: Blob) => {
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'foto.jpg');
      const res = await api.uploadImage(formData);
      onChange(res.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem (JPG, PNG, etc.)');
      return;
    }
    let blob: Blob = file;
    if (file.size > MAX_SIZE) {
      blob = await compressImage(file, MAX_SIZE);
      if (blob.size > MAX_SIZE) {
        setError('Imagem muito grande. Máximo 3MB.');
        return;
      }
    }
    await upload(blob);
    e.target.value = '';
  };

  const startWebcam = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Seu navegador não suporta acesso à câmera. Use HTTPS ou localhost.');
      return;
    }
    try {
      const constraints = { video: { facingMode: 'user', width: { ideal: 1280 } } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(() =>
        navigator.mediaDevices.getUserMedia({ video: true })
      );
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setShowWebcam(true);
    } catch (err) {
      console.error('Erro webcam:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setShowWebcam(false);
  };

  const capture = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      async (blob) => {
        if (blob) {
          let b = blob;
          if (blob.size > MAX_SIZE) {
            b = await compressImage(new File([blob], 'cap.jpg', { type: 'image/jpeg' }), MAX_SIZE);
          }
          await upload(b);
        }
        stopWebcam();
        setCapturing(false);
      },
      'image/jpeg',
      0.9
    );
  };

  const imageUrl = value ? (value.startsWith('http') || value.startsWith('/') ? value : `/api${value}`) : '';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-600">{label}</label>
      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 min-h-[120px]">
        {imageUrl ? (
          <div className="relative inline-block">
            <img src={imageUrl} alt="Preview" className="max-h-40 rounded object-contain border" />
            {!uploading && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                title="Remover"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ) : showWebcam ? (
          <div>
            <video ref={videoRef} autoPlay playsInline muted className="max-h-40 rounded border" />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={capture}
                disabled={capturing}
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50"
              >
                {capturing ? 'Capturando...' : 'Tirar foto'}
              </button>
              <button type="button" onClick={stopWebcam} className="px-3 py-1 border rounded text-sm hover:bg-gray-100">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <label
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-white cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFile}
                className="sr-only"
                disabled={uploading}
              />
              <ImagePlus size={18} />
              {uploading ? 'Enviando...' : 'Selecionar arquivo'}
            </label>
            <button
              type="button"
              onClick={startWebcam}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-white disabled:opacity-50"
            >
              <Camera size={18} />
              Câmera / Webcam
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
