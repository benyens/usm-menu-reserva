import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  UtensilsCrossed, 
  Clock, 
  AlertCircle,
  Check,
  Trash2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useReservations, MenuType } from "@/contexts/ReservationContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ReservationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    reservations, 
    cancelReservation, 
    updateReservationMenu,
    canModifyReservation 
  } = useReservations();

  const [isUpdatingMenu, setIsUpdatingMenu] = useState(false);

  const reservation = reservations.find(r => r.id === id);

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-card text-center py-12">
              <CardContent>
                <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Reserva no encontrada</h2>
                <p className="text-muted-foreground mb-6">
                  La reserva que buscas no existe o ha sido eliminada
                </p>
                <Button onClick={() => navigate('/reservations')}>
                  Volver a Mis Reservas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const canModify = canModifyReservation(new Date(reservation.date));
  const reservationDate = new Date(reservation.date);
  const isActive = reservation.status === 'confirmed';

  const handleCancelReservation = () => {
    cancelReservation(reservation.id);
    toast({
      title: "Reserva cancelada",
      description: "La reserva ha sido cancelada exitosamente",
    });
    navigate('/reservations');
  };

  const handleUpdateMenu = (newMenuType: MenuType) => {
    setIsUpdatingMenu(true);
    
    setTimeout(() => {
      const success = updateReservationMenu(reservation.id, newMenuType);
      
      if (success) {
        toast({
          title: "Menú actualizado",
          description: `Menú cambiado a ${newMenuType}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "No se pudo actualizar",
          description: "No es posible modificar reservas con menos de 48h de anticipación",
        });
      }
      
      setIsUpdatingMenu(false);
    }, 500);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => navigate('/reservations')}
              className="mb-4 transition-smooth"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Mis Reservas
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Detalle de Reserva</h1>
                <p className="text-muted-foreground mt-2">
                  Información completa de tu reserva de almuerzo
                </p>
              </div>
              
              <Badge 
                variant={isActive ? 'default' : 'destructive'}
                className="text-sm px-3 py-1"
              >
                {isActive ? 'Confirmada' : 'Cancelada'}
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date & Status Card */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Fecha y Estado</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span className="font-semibold text-lg">
                      {formatDate(reservationDate)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant={isActive ? 'default' : 'destructive'}>
                      {isActive ? 'Confirmada' : 'Cancelada'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Creada:</span>
                    <span className="text-sm">
                      {formatDate(new Date(reservation.createdAt))} - {formatTime(new Date(reservation.createdAt))}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Menu Information */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    <span>Tipo de Menú</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Menú seleccionado:</span>
                    <Badge 
                      variant={reservation.menuType === 'Normal' ? 'default' : 'secondary'}
                      className="text-sm px-3 py-1"
                    >
                      {reservation.menuType}
                    </Badge>
                  </div>

                  {canModify && isActive && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Cambiar tipo de menú:
                        </p>
                        <div className="flex gap-3">
                          <Button
                            variant={reservation.menuType === 'Normal' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleUpdateMenu('Normal')}
                            disabled={isUpdatingMenu || reservation.menuType === 'Normal'}
                          >
                            Normal
                          </Button>
                          <Button
                            variant={reservation.menuType === 'Hipocalórico' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleUpdateMenu('Hipocalórico')}
                            disabled={isUpdatingMenu || reservation.menuType === 'Hipocalórico'}
                          >
                            Hipocalórico
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {!canModify && isActive && (
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-accent-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          No es posible modificar el menú
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Los cambios solo pueden realizarse con 48 horas de anticipación
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Menu Description */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Descripción del Menú</CardTitle>
                </CardHeader>
                <CardContent>
                  {reservation.menuType === 'Normal' ? (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Menú Normal</h4>
                      <p className="text-muted-foreground text-sm">
                        Incluye entrada, plato principal, postre y bebida. Preparado con ingredientes 
                        frescos y balanceado nutricionalmente para una comida completa.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Menú Hipocalórico</h4>
                      <p className="text-muted-foreground text-sm">
                        Menú especial con menor contenido calórico, manteniendo el balance nutricional. 
                        Incluye entrada liviana, plato principal bajo en calorías, postre dietético y bebida.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actions Panel */}
            <div className="space-y-6">
              {isActive && (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Check className="h-5 w-5 text-secondary" />
                      <span>Acciones</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {canModify && (
                      <Button
                        onClick={() => navigate('/calendar')}
                        variant="secondary"
                        className="w-full transition-smooth"
                      >
                        Hacer Nueva Reserva
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="w-full transition-smooth"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancelar Reserva
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que quieres cancelar la reserva para el{' '}
                            {formatDate(reservationDate)}? Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, mantener</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleCancelReservation}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Sí, cancelar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              )}

              {/* Status Info */}
              <Card className={`shadow-card ${!canModify && isActive ? 'border-accent/20 bg-accent/5' : ''}`}>
                <CardContent className="p-4">
                  {canModify && isActive ? (
                    <div className="text-center">
                      <Clock className="h-8 w-8 mx-auto text-secondary mb-2" />
                      <h4 className="font-semibold text-secondary-foreground mb-1">
                        Modificable
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Puedes cambiar el menú o cancelar esta reserva
                      </p>
                    </div>
                  ) : isActive ? (
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 mx-auto text-accent mb-2" />
                      <h4 className="font-semibold text-accent-foreground mb-1">
                        Bloqueada
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Menos de 48h para la fecha de la reserva
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Trash2 className="h-8 w-8 mx-auto text-destructive mb-2" />
                      <h4 className="font-semibold text-destructive-foreground mb-1">
                        Cancelada
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Esta reserva ha sido cancelada
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetail;