"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import React, { useEffect, useState } from "react"

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
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface User {
  id: string;
  fullName: string;
  startDate: string;
  endDate: string;
  profilePictureUrl: string;
}

interface UserEditFormProps {
    user: User;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onUserUpdate: () => void;
}

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

export function UserEditForm({ user, isOpen, onOpenChange, onUserUpdate }: UserEditFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user.fullName,
      startDate: new Date(user.startDate),
      endDate: new Date(user.endDate),
    },
  });

  useEffect(() => {
    if (user) {
        form.reset({
            fullName: user.fullName,
            startDate: new Date(user.startDate),
            endDate: new Date(user.endDate),
        });
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          fullName: values.fullName,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
        })
        .match({ id: user.id });

      if (error) throw error;
      
      onUserUpdate();
      onOpenChange(false);

    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el usuario.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Actualiza los datos de {user.fullName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
            <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
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
                                  setIsStartOpen(false);
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
                    <FormLabel>Fecha de Fin</FormLabel>
                     <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
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

                                  setIsEndOpen(false);
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
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
