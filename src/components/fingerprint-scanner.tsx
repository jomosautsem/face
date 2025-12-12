"use client"

import { useState } from "react"
import { Fingerprint, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Status = 'idle' | 'scanning' | 'success' | 'error';

export function FingerprintScanner() {
  const [status, setStatus] = useState<Status>('idle');
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = () => {
    setStatus('scanning');
    setTimeout(() => {
      if (Math.random() > 0.2) {
        setStatus('success');
        setHasScanned(true);
      } else {
        setStatus('error');
      }
    }, 2500);
  };

  const handleReset = () => {
    setStatus('idle');
  };

  const iconClass = "h-8 w-8";
  const buttonIconClass = "mr-2 h-5 w-5";

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-6 text-center transition-colors duration-300">
      <div className={cn("flex items-center justify-center h-16 w-16 rounded-full transition-colors",
        status === 'idle' && 'bg-muted',
        status === 'scanning' && 'bg-primary/10',
        status === 'success' && 'bg-accent/20',
        status === 'error' && 'bg-destructive/20'
      )}>
        {status === 'success' && <CheckCircle2 className={cn(iconClass, "text-accent")} />}
        {status === 'scanning' && <Fingerprint className={cn(iconClass, 'text-primary animate-pulse')} />}
        {status === 'idle' && <Fingerprint className={cn(iconClass, "text-muted-foreground")} />}
        {status === 'error' && <Fingerprint className={cn(iconClass, "text-destructive")} />}
      </div>
      <div className="min-h-[40px]">
        <p className="text-sm text-muted-foreground">
          {status === 'idle' && 'Coloca tu dedo en el escáner para comenzar.'}
          {status === 'scanning' && 'No te muevas, escaneo en progreso...'}
          {status === 'success' && 'Tu huella ha sido escaneada exitosamente.'}
          {status === 'error' && 'No se pudo leer la huella. Por favor, limpia el escáner e intenta de nuevo.'}
        </p>
      </div>
      <Button 
        onClick={status === 'error' ? handleReset : handleScan}
        disabled={status === 'scanning' || status === 'success'}
        variant={status === 'error' ? 'destructive' : 'default'}
        className="w-full sm:w-auto"
      >
        {status === 'idle' && <><Fingerprint className={buttonIconClass} /> Escanear Huella</>}
        {status === 'scanning' && <><Loader2 className={cn(buttonIconClass, "animate-spin")} /> Escaneando...</>}
        {status === 'success' && <><CheckCircle2 className={buttonIconClass} /> Escaneado Exitosamente</>}
        {status === 'error' && <><XCircle className={buttonIconClass} /> Intentar de Nuevo</>}
      </Button>
    </div>
  );
}
