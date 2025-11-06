import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';




const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255, 'Email muy largo'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100, 'Contraseña muy larga')
});


const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre muy largo'),
  employeeId: z.string().trim().min(3, 'ID de empleado requerido').max(50, 'ID muy largo'),
  department: z.string().trim().max(100, 'Departamento muy largo').optional()
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestLogin = async () => {
  const email = 'test@usm.cl';
  const password = '123456';

  setIsLoading(true);
  try {
    // 1) Intentar login directo
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInErr) {
      // Ya existe y se logueó
      toast({ title: 'Bienvenido', description: 'Sesión iniciada como usuario de prueba' });
      navigate('/');
      return;
    }

    // 2) Si falla por credenciales, probamos registrar
    if (signInErr.message === 'Invalid login credentials') {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin, // ok si tienes confirm OFF
          data: {
            full_name: 'Usuario de Prueba',
            employee_id: 'TEST001',
            department: 'Informática',
            role: 'tester',
          },
        },
      });

      // Si ya estaba registrado, seguimos; si hay otro error, salimos
      if (signUpErr && signUpErr.message !== 'User already registered') {
        toast({ title: 'Error creando usuario de prueba', description: signUpErr.message, variant: 'destructive' });
        return;
      }

      // 3) Iniciar sesión ahora que existe
      const { data: afterData, error: afterErr } = await supabase.auth.signInWithPassword({ email, password });
      if (afterErr) {
        toast({ title: 'No se pudo iniciar sesión', description: afterErr.message, variant: 'destructive' });
        return;
      }

      // 4) Asegurar/crear perfil en `profiles` (después de tener sesión para pasar RLS)
      const userId = afterData?.user?.id;
      if (userId) {
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert(
            {
              user_id: userId,
              email,
              full_name: 'Usuario de Prueba',
              employee_id: 'TEST001',
              department: 'Informática',
              role: 'tester',
            },
            { onConflict: 'user_id' }
          );
        if (upsertErr) {
          // no bloquea el login si falla el perfil, solo avisa
          console.warn('profiles upsert error:', upsertErr);
        }
      }

      toast({ title: 'Bienvenido', description: 'Sesión iniciada como usuario de prueba' });
      navigate('/');
      return;
    }

    // 5) Otros errores de login
    toast({ title: 'Error al iniciar sesión', description: signInErr.message, variant: 'destructive' });
  } finally {
    setIsLoading(false);
  }
};


  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email')?.toString().trim() || '';
    const password = formData.get('password')?.toString() || '';
    
    const data = { email, password };

    try {
      const validData = loginSchema.parse(data);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: validData.email,
        password: validData.password
      });
      
      if (error) {
        toast({
          title: 'Error de inicio de sesión',
          description: error.message === 'Invalid login credentials' 
            ? 'Credenciales inválidas' 
            : error.message,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Bienvenido',
        description: 'Has iniciado sesión correctamente'
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Error de validación',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email')?.toString().trim() || '';
    const password = formData.get('password')?.toString() || '';
    const fullName = formData.get('fullName')?.toString().trim() || '';
    const employeeId = formData.get('employeeId')?.toString().trim() || '';
    const department = formData.get('department')?.toString().trim() || '';
    
    const data = { email, password, fullName, employeeId, department };

    try {
      const validData = signupSchema.parse(data);
      
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: validData.email,
        password: validData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validData.fullName,
            employee_id: validData.employeeId,
            department: validData.department || null
          }
        }
      });

      if (error) {
        toast({
          title: 'Error de registro',
          description: error.message === 'User already registered' 
            ? 'El usuario ya está registrado' 
            : error.message,
          variant: 'destructive'
        });
        return;
      }

      if (signUpData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: signUpData.user.id,
            email: validData.email,
            full_name: validData.fullName,
            employee_id: validData.employeeId,
            department: validData.department || null,
            role: 'employee'
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        toast({
          title: 'Registro exitoso',
          description: 'Tu cuenta ha sido creada correctamente'
        });
      }
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Error de validación',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Casino USM</CardTitle>
          <CardDescription>Sistema de Reservas de Almuerzo</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="juan.perez@usm.cl"
                    required
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    maxLength={100}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full mt-2"
                  onClick={handleTestLogin}
                >
                  Entrar como Usuario de Prueba
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullName">Nombre Completo</Label>
                  <Input
                    id="signup-fullName"
                    name="fullName"
                    placeholder="Juan Pérez González"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="juan.perez@usm.cl"
                    required
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-employeeId">ID Empleado</Label>
                  <Input
                    id="signup-employeeId"
                    name="employeeId"
                    placeholder="USM2024001"
                    required
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-department">Departamento</Label>
                  <Input
                    id="signup-department"
                    name="department"
                    placeholder="Informática"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    maxLength={100}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registrando...' : 'Registrarse'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;