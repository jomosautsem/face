"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Camera, Upload, User, X } from 'lucide-react'

export function ProfilePictureHandler() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarPlaceholder = PlaceHolderImages.find(p => p.id === 'avatar-placeholder');

  const startWebcam = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        console.error("getUserMedia no es compatible en este navegador");
        setIsWebcamOpen(false);
      }
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      setIsWebcamOpen(false); // Close dialog on error
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isWebcamOpen) {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [isWebcamOpen, startWebcam, stopWebcam]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        setImageSrc(dataUrl);
        setIsWebcamOpen(false);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-32 w-32 border-4 border-muted">
        <AvatarImage src={imageSrc ?? undefined} alt="Foto de perfil" />
        <AvatarFallback className="bg-secondary">
            {avatarPlaceholder && !imageSrc ? (
                 <Image src={avatarPlaceholder.imageUrl} alt={avatarPlaceholder.description} data-ai-hint={avatarPlaceholder.imageHint} width={128} height={128} className="object-cover" />
            ) : (
                <User className="h-16 w-16 text-muted-foreground" />
            )}
        </AvatarFallback>
      </Avatar>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="flex gap-2">
        <Button variant="outline" onClick={triggerFileUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Subir
        </Button>
        <Dialog open={isWebcamOpen} onOpenChange={setIsWebcamOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Camera className="mr-2 h-4 w-4" />
              Tomar Foto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Captura con Webcam</DialogTitle>
            </DialogHeader>
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
              <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <DialogFooter>
              <Button onClick={capturePhoto} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Camera className="mr-2 h-4 w-4" />
                Capturar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
