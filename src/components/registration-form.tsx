"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ProfilePictureHandler } from "./profile-picture-handler"
import { FingerprintScanner } from "./fingerprint-scanner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, UserPlus, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useFirestore, useAuth } from "@/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "El nombre completo debe tener al menos 2 caracteres.",
  }),
  startDate: z.date({
    required_error: "La fecha de inicio es requerida.",
  }),
  endDate: z.date({
    required_error: "La fecha de fin es requerida.",
  }),
}).refine((data) => data.endDate > data.startDate, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio.",
  path: ["endDate"], 
});

export function RegistrationForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = React.useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = React.useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firestore = useFirestore();
  const auth = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({ variant: "destructive", title: "Error", description: "Firestore no está disponible." });
      return;
    }
     if (!profileImageFile) {
      toast({ variant: "destructive", title: "Error", description: "Por favor, sube o toma una foto de perfil." });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload image to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `profile_pictures/${Date.now()}_${profileImageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, profileImageFile);
      const profilePictureUrl = await getDownloadURL(uploadResult.ref);

      // 2. Save user data to Firestore
      await addDoc(collection(firestore, "users"), {
        ...values,
        profilePictureUrl,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "¡Registro Exitoso!",
        description: `¡Bienvenido, ${values.fullName}! Tu registro está completo.`,
        className: "bg-accent text-accent-foreground border-accent",
      });
      form.reset();
      setProfileImageFile(null); // Reset image file
      router.push("/");

    } catch (error) {
      console.error("Error al registrar usuario:", error);
      toast({
        variant: "destructive",
        title: "Error de Registro",
        description: "No se pudo completar el registro. Por favor, intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl shadow-2xl relative">
       <Link href="/" passHref>
          <Button variant="ghost" className="absolute top-4 left-4" disabled={isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
      <CardHeader className="text-center pt-16">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl font-bold font-headline">Registro de Nuevo Usuario</CardTitle>
        <CardDescription className="text-lg">Complete el formulario para registrar un nuevo miembro</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <div className="space-y-6">
                <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej. Juan Pérez" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Inicio de Membresía</FormLabel>
                            <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                            )}
                                             disabled={isSubmitting}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                            ) : (
                                                <span>Elige una fecha</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(date) => {
                                            field.onChange(date);
                                            setIsStartDatePickerOpen(false);
                                        }}
                                        disabled={(date) => date < new Date("1900-01-01") || isSubmitting}
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Fin de Membresía</FormLabel>
                             <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                            )}
                                            disabled={isSubmitting}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                            ) : (
                                                <span>Elige una fecha</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(date) => {
                                            field.onChange(date);
                                            setIsEndDatePickerOpen(false);
                                        }}
                                        disabled={(date) => date < (form.getValues("startDate") || new Date()) || isSubmitting}
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>

            <Separator />
            
            <ProfilePictureHandler onImageChange={setProfileImageFile} isUploading={isSubmitting} />
            
            <Separator />
            
            <FingerprintScanner />

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isSubmitting ? "Registrando..." : "Registrar Usuario"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
