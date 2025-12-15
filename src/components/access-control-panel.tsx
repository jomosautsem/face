"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Fingerprint, Loader2, CheckCircle2, XCircle, Camera, User, ScanFace, CalendarClock, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

type Status = 'idle' | 'scanning' | 'success' | 'error' | 'verified';
type MembershipStatus = 'current' | 'expiring' | 'expired';

interface UserData {
  id: string;
  fullName: string;
  endDate: Date;
  profilePictureUrl: string;
}

export function AccessControlPanel() {
  const [fingerprintStatus, setFingerprintStatus] = useState<Status>('idle');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('current');
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const isCameraScanning = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
          setHasCameraPermission(false);
      }
  }

  useEffect(() => {
    return () => {
        stopCamera();
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }
    }
  }, []);

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

  const findUserAndSetState = async () => {
    setLoadingUsers(true);
    setFingerprintStatus('scanning');
    setCurrentUser(null);
    try {
      const { data: users, error: fetchError } = await supabase.from('users').select('*');

      if (fetchError) throw fetchError;

      if (users && users.length > 0) {
        // Always succeed in finding a user if there are any
        const randomUserFromDb = users[Math.floor(Math.random() * users.length)];
        
        const userWithDate: UserData = {
          id: randomUserFromDb.id,
          fullName: randomUserFromDb.fullName,
          endDate: new Date(randomUserFromDb.endDate),
          profilePictureUrl: randomUserFromDb.profilePictureUrl,
        };
        
        const status = calculateMembershipStatus(userWithDate.endDate);
        
        setFingerprintStatus('success');
        setCurrentUser(userWithDate);
        setMembershipStatus(status);

        setTimeout(() => setFingerprintStatus('verified'), 1500);
      } else {
        setFingerprintStatus('error');
        setCurrentUser(null);
        toast({
          variant: "destructive",
          title: "No hay usuarios registrados",
          description: "La base de datos está vacía. Agregue un usuario primero."
        })
      }
    } catch (error: any) {
      console.error("Error during scan:", error);
      setFingerprintStatus('error');
      setCurrentUser(null);
      toast({
        variant: "destructive",
        title: "Error de Escaneo",
        description: error.message || "Ocurrió un error al buscar el usuario."
      })
    } finally {
      setLoadingUsers(false);
    }
  };


  const handleFingerprintScan = () => {
    findUserAndSetState();
  };

  const toggleCameraScan = () => {
    if (isCameraScanning.current) {
      // Stop scanning
      isCameraScanning.current = false;
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      stopCamera();
      setFingerprintStatus('idle');
      setCurrentUser(null);
      // Force re-render
      setHasCameraPermission(false)
    } else {
      // Start scanning
      getCameraPermission().then(() => {
        isCameraScanning.current = true;
        toast({ title: "Escaneo automático iniciado", description: "Buscando usuarios cada 5 segundos." });
        findUserAndSetState(); // Scan immediately
        scanIntervalRef.current = setInterval(() => {
          findUserAndSetState();
        }, 5000);
         // Force re-render
        setHasCameraPermission(true);
      });
    }
  };
  
  const handleReset = () => {
    setFingerprintStatus('idle');
    setCurrentUser(null);
  };

  const getStatusColor = () => {
    if (!currentUser || fingerprintStatus !== 'verified') return "bg-muted/20";
    switch (membershipStatus) {
        case 'current': return "bg-green-500";
        case 'expiring': return "bg-yellow-400";
        case 'expired': return "bg-red-500";
    }
  };

  const getAvatarBorder = () => {
    if (!currentUser || fingerprintStatus !== 'verified') return "border-muted/20";
     switch (membershipStatus) {
        case 'current': return "neon-pulse-green border-green-500";
        case 'expiring': return "neon-pulse-yellow border-yellow-400";
        case 'expired': return "neon-pulse-red border-red-500";
    }
  }
  
  const getStatusMessage = () => {
      if (!currentUser) return "Esperando escaneo...";
      const today = new Date();
      const endDate = currentUser.endDate;
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (membershipStatus) {
          case 'current': return `Membresía activa. Vence en ${diffDays} días.`;
          case 'expiring': return diffDays >= 1 ? 'La membresía vence mañana.' : 'La membresía vence hoy.';
          case 'expired': return "Membresía vencida.";
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start" style={{ perspective: '1000px' }}>
        <div className="space-y-8">
            <Card className="w-full shadow-2xl border-primary/20 bg-card/80 backdrop-blur-sm transform transition-transform duration-500 hover:rotate-x-2 hover:-translate-y-2">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-xl text-primary">
                        <span className="flex items-center gap-2"><Camera /> Escáner de Cámara</span>
                        <Button
                            onClick={toggleCameraScan}
                            disabled={loadingUsers}
                            variant={isCameraScanning.current ? "destructive" : "default"}
                            size="sm"
                        >
                            {isCameraScanning.current ? <><VideoOff className="mr-2 h-4 w-4" /> Detener</> : <><Video className="mr-2 h-4 w-4" /> Iniciar Escaneo</>}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video w-full bg-black rounded-md overflow-hidden relative flex items-center justify-center border-2 border-primary/30">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        {!hasCameraPermission && !isCameraScanning.current && (
                             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                                <Camera className="h-16 w-16 text-primary/50 mb-4"/>
                                <p className="text-primary/80">Cámara Desactivada</p>
                             </div>
                        )}
                        {hasCameraPermission && (
                            <div className={cn("absolute inset-0 flex items-center justify-center p-4 transition-opacity", isCameraScanning.current ? "opacity-100" : "opacity-0")}>
                               <ScanFace className="w-32 h-32 text-primary/20 animate-pulse" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="w-full shadow-2xl border-primary/20 bg-card/80 backdrop-blur-sm transform transition-transform duration-500 hover:rotate-x-2 hover:-translate-y-2">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-primary"><Fingerprint /> Escáner de Huella</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 text-center">
                     <div className={cn("relative flex items-center justify-center h-24 w-24 rounded-full transition-all duration-300",
                        fingerprintStatus === 'scanning' && 'bg-primary/10',
                        fingerprintStatus === 'success' && 'bg-green-500/20',
                        fingerprintStatus === 'error' && 'bg-red-500/20'
                    )}>
                        <div className={cn(
                            "absolute inset-0 rounded-full animate-ping-slow",
                            fingerprintStatus === 'scanning' && 'bg-primary/50',
                            fingerprintStatus === 'success' && 'bg-green-500/50',
                            fingerprintStatus === 'error' && 'bg-red-500/50',
                            (fingerprintStatus === 'idle' || fingerprintStatus === 'verified') && 'hidden'
                         )} />
                        {fingerprintStatus === 'success' && <CheckCircle2 className="h-12 w-12 text-green-400" />}
                        {fingerprintStatus === 'scanning' && <Fingerprint className="h-12 w-12 text-primary animate-pulse" />}
                        {(fingerprintStatus === 'idle' || fingerprintStatus === 'verified') && <Fingerprint className="h-12 w-12 text-muted-foreground" />}
                        {fingerprintStatus === 'error' && <XCircle className="h-12 w-12 text-red-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground min-h-[40px]">
                        {fingerprintStatus === 'idle' && 'Listo para escanear. Presiona el botón para iniciar.'}
                        {fingerprintStatus === 'scanning' && 'Buscando usuario...'}
                        {fingerprintStatus === 'success' && '¡Éxito! Verificado.'}
                        {fingerprintStatus === 'error' && 'No se pudo identificar al usuario. Intenta de nuevo.'}
                        {fingerprintStatus === 'verified' && 'Escaneo completo. Listo para el próximo usuario.'}
                    </p>
                    <Button 
                        onClick={fingerprintStatus === 'idle' || fingerprintStatus === 'error' ? handleFingerprintScan : handleReset}
                        disabled={fingerprintStatus === 'scanning' || fingerprintStatus === 'success' || loadingUsers || isCameraScanning.current}
                        className="w-full"
                        variant="default"
                    >
                        {loadingUsers && <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Buscando...</>}
                        {!loadingUsers && fingerprintStatus === 'idle' && 'Iniciar Escaneo de Huella'}
                        {!loadingUsers && fingerprintStatus === 'scanning' && <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Escaneando...</>}
                        {!loadingUsers && fingerprintStatus === 'success' && <><CheckCircle2 className="mr-2 h-5 w-5" /> Verificado</>}
                        {!loadingUsers && (fingerprintStatus === 'error') && 'Reintentar'}
                        {!loadingUsers && (fingerprintStatus === 'verified') && 'Escanear Siguiente'}
                    </Button>
                </CardContent>
            </Card>
        </div>
        
        <Card className="w-full sticky top-8 shadow-2xl border-primary/20 bg-card/80 backdrop-blur-sm transform transition-transform duration-500 hover:-rotate-x-2 hover:-translate-y-2">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-primary">Información del Usuario</CardTitle>
                <CardDescription className="text-base text-muted-foreground">Resultados del escaneo</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <div className="relative w-full h-3 rounded-full bg-muted/20 overflow-hidden">
                  <div className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-500", getStatusColor())} style={{ width: '100%' }} />
                </div>
                <div className={cn("relative p-1 rounded-full transition-all duration-300", getAvatarBorder())}>
                    <Avatar className="h-36 w-36 border-4 border-background">
                        <AvatarImage src={currentUser?.profilePictureUrl} alt="Foto de perfil" />
                        <AvatarFallback className="bg-secondary">
                            <User className="h-20 w-20 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                </div>
                {currentUser ? (
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold">{currentUser.fullName}</h2>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <CalendarClock className="h-5 w-5" />
                            <p>{getStatusMessage()}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground space-y-2 py-8">
                         {isCameraScanning.current ? (
                            <>
                               <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                               <p>Escaneo automático activo...</p>
                               <p className="text-sm">Buscando rostros reconocidos.</p>
                            </>
                        ) : (
                            <>
                                <User className="mx-auto h-12 w-12 text-gray-600" />
                                <p>Esperando identificación...</p>
                                <p className="text-sm">Escanee su rostro o huella digital.</p>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  )
}
