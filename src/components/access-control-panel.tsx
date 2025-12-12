"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Fingerprint, Loader2, CheckCircle2, XCircle, Camera, User, ScanFace, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Status = 'idle' | 'scanning' | 'success' | 'error' | 'verified';
type MembershipStatus = 'current' | 'expiring' | 'expired';

interface UserData {
  fullName: string;
  endDate: Date;
  profilePicture: string;
}

const mockUser: UserData = {
    fullName: "Jane Doe",
    endDate: new Date(), // This will be updated in useEffect
    profilePicture: "https://images.unsplash.com/photo-1531123414780-f74242c2b052?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8cGVyc29uJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzY1NDU4MjcxfDA&ixlib=rb-4.1.0&q=80&w=1080"
};

export function AccessControlPanel() {
  const [fingerprintStatus, setFingerprintStatus] = useState<Status>('idle');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('current');

  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const getCameraPermission = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("La API de cámara no es compatible con este navegador.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Acceso a la cámara denegado',
        description: 'Por favor, habilita los permisos de la cámara en la configuración de tu navegador para usar esta aplicación.',
      });
    }
  }, [toast]);

  useEffect(() => {
    getCameraPermission();

    // Clean up camera stream
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [getCameraPermission]);

  const calculateMembershipStatus = (endDate: Date): MembershipStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 1) return 'expiring';
    return 'current';
  };

  const handleScan = () => {
    setFingerprintStatus('scanning');
    setCurrentUser(null);
    setTimeout(() => {
      if (Math.random() > 0.1) { // 90% success rate
        const daysToAdd = Math.floor(Math.random() * 10) - 2; // -2 to 7 days from now
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysToAdd);
        mockUser.endDate = futureDate;

        const status = calculateMembershipStatus(mockUser.endDate);
        
        setFingerprintStatus('success');
        setCurrentUser(mockUser);
        setMembershipStatus(status);

        setTimeout(() => setFingerprintStatus('verified'), 1500);

      } else {
        setFingerprintStatus('error');
        setCurrentUser(null);
      }
    }, 2000);
  };
  
  const handleReset = () => {
    setFingerprintStatus('idle');
    setCurrentUser(null);
  };

  const getStatusColor = () => {
    if (!currentUser) return "bg-gray-400";
    switch (membershipStatus) {
        case 'current': return "bg-yellow-400";
        case 'expiring': return "bg-green-500";
        case 'expired': return "bg-red-500";
    }
  };
  
  const getStatusMessage = () => {
      if (!currentUser) return "Esperando escaneo...";
      const today = new Date();
      const endDate = currentUser.endDate;
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      switch (membershipStatus) {
          case 'current': return `Membresía activa. Vence en ${diffDays} días.`;
          case 'expiring': return diffDays === 1 ? 'La membresía vence mañana.' : 'La membresía vence hoy.';
          case 'expired': return "Membresía vencida.";
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
            <Card className="w-full shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl"><Camera /> Escáner de Cámara</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video w-full bg-muted rounded-md overflow-hidden relative flex items-center justify-center">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        {!hasCameraPermission && (
                             <Alert variant="destructive" className="w-11/12">
                                <AlertTitle>Se requiere acceso a la cámara</AlertTitle>
                                <AlertDescription>
                                    Por favor, permite el acceso a la cámara para usar esta función.
                                </AlertDescription>
                            </Alert>
                        )}
                        {hasCameraPermission && (
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                               <ScanFace className="w-32 h-32 text-white/20 animate-pulse" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="w-full shadow-lg">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl"><Fingerprint /> Escáner de Huella</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 text-center">
                     <div className={cn("flex items-center justify-center h-20 w-20 rounded-full transition-colors",
                        (fingerprintStatus === 'idle' || fingerprintStatus === 'verified') && 'bg-muted',
                        fingerprintStatus === 'scanning' && 'bg-primary/10',
                        fingerprintStatus === 'success' && 'bg-accent/20',
                        fingerprintStatus === 'error' && 'bg-destructive/20'
                    )}>
                        {fingerprintStatus === 'success' && <CheckCircle2 className="h-10 w-10 text-accent" />}
                        {fingerprintStatus === 'scanning' && <Fingerprint className="h-10 w-10 text-primary animate-pulse" />}
                        {(fingerprintStatus === 'idle' || fingerprintStatus === 'verified') && <Fingerprint className="h-10 w-10 text-muted-foreground" />}
                        {fingerprintStatus === 'error' && <XCircle className="h-10 w-10 text-destructive" />}
                    </div>
                    <p className="text-sm text-muted-foreground min-h-[40px]">
                        {fingerprintStatus === 'idle' && 'Listo para escanear. Presiona el botón para iniciar.'}
                        {fingerprintStatus === 'scanning' && 'Mantén el dedo quieto, escaneando...'}
                        {fingerprintStatus === 'success' && '¡Éxito! Verificado.'}
                        {fingerprintStatus === 'error' && 'No se pudo leer la huella. Intenta de nuevo.'}
                        {fingerprintStatus === 'verified' && 'Escaneo completo. Listo para el próximo usuario.'}
                    </p>
                    <Button 
                        onClick={fingerprintStatus === 'idle' || fingerprintStatus === 'error' ? handleScan : handleReset}
                        disabled={fingerprintStatus === 'scanning' || fingerprintStatus === 'success'}
                        className="w-full"
                    >
                        {fingerprintStatus === 'idle' && 'Iniciar Escaneo de Huella'}
                        {fingerprintStatus === 'scanning' && <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Escaneando...</>}
                        {fingerprintStatus === 'success' && <><CheckCircle2 className="mr-2 h-5 w-5" /> Verificado</>}
                        {(fingerprintStatus === 'error') && <><XCircle className="mr-2 h-5 w-5" /> Reintentar</>}
                        {(fingerprintStatus === 'verified') && 'Escanear Siguiente'}
                    </Button>
                </CardContent>
            </Card>
        </div>
        
        <Card className="w-full sticky top-8 shadow-lg">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Información del Usuario</CardTitle>
                <CardDescription>Resultados del escaneo</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <div className={cn("w-full h-3 rounded-full transition-colors duration-500", getStatusColor())} />
                <Avatar className="h-36 w-36 border-4 border-muted">
                    <AvatarImage src={currentUser?.profilePicture} alt="Profile picture" />
                    <AvatarFallback className="bg-secondary">
                        <User className="h-20 w-20 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
                {currentUser ? (
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">{currentUser.fullName}</h2>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <CalendarClock className="h-5 w-5" />
                            <p>{getStatusMessage()}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground space-y-2 py-8">
                        <p>Esperando identificación...</p>
                        <p className="text-sm">Escanee su rostro o huella digital.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  )
}
