import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Filter, 
  Trash2, 
  AlertCircle, 
  UtensilsCrossed,
  Clock,
  CalendarX
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReservations, MenuType, Reservation } from "@/contexts/ReservationContext";
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

const MyReservations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    reservations, 
    cancelReservation, 
    cancelReservationsByPeriod,
    canModifyReservation 
  } = useReservations();

  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [filter, setFilter] = useState<'all' | 'Normal' | 'Hipocalórico'>('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  const getWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return { start: startOfWeek, end: endOfWeek };
  };

  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  };

  const getCurrentRange = () => {
    return viewType === 'week' ? getWeekRange(currentDate) : getMonthRange(currentDate);
  };

  const getFilteredReservations = () => {
    const { start, end } = getCurrentRange();
    
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.date);
      const isInRange = reservationDate >= start && reservationDate <= end;
      const matchesFilter = filter === 'all' || reservation.menuType === filter;
      const isActive = reservation.status === 'confirmed';
      
      return isInRange && matchesFilter && isActive;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const handleCancelReservation = (id: string) => {
    cancelReservation(id);
    toast({
      title: "Reserva cancelada",
      description: "La reserva ha sido cancelada exitosamente",
    });
  };

  const handleCancelPeriod = () => {
    const { start, end } = getCurrentRange();
    cancelReservationsByPeriod(start, end);
    
    const periodText = viewType === 'week' ? 'semana' : 'mes';
    toast({
      title: `${periodText.charAt(0).toUpperCase() + periodText.slice(1)} cancelada`,
      description: `Todas las reservas de la ${periodText} han sido canceladas`,
    });
  };

  const filteredReservations = getFilteredReservations();
  const { start, end } = getCurrentRange();
  
  const periodText = viewType === 'week' 
    ? `Semana del ${start.getDate()} - ${end.getDate()} de ${start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
    : `${start.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mis Reservas</h1>
              <p className="text-muted-foreground mt-2">
                Gestiona tus reservas de almuerzo
              </p>
            </div>
            
            <Button 
              onClick={() => navigate('/calendar')}
              className="bg-gradient-primary transition-smooth"
            >
              Nueva Reserva
            </Button>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* View Type Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={viewType === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('week')}
              >
                Semana
              </Button>
              <Button
                variant={viewType === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('month')}
              >
                Mes
              </Button>
            </div>

            {/* Filter */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                <Filter className="h-4 w-4 mr-1" />
                Todos
              </Button>
              <Button
                variant={filter === 'Normal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('Normal')}
              >
                Normal
              </Button>
              <Button
                variant={filter === 'Hipocalórico' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('Hipocalórico')}
              >
                Hipocalórico
              </Button>
            </div>

            {/* Cancel Period Button */}
            {filteredReservations.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10">
                    <CalendarX className="h-4 w-4 mr-2" />
                    Cancelar {viewType === 'week' ? 'Semana' : 'Mes'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar todas las reservas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción cancelará todas las reservas confirmadas de la {viewType === 'week' ? 'semana' : 'mes'} actual. 
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancelPeriod}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Confirmar Cancelación
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Period Display */}
          <Card className="mb-6 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{periodText}</span>
                </div>
                <Badge variant="outline">
                  {filteredReservations.length} reservas
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Reservations List */}
          {filteredReservations.length === 0 ? (
            <Card className="shadow-card text-center py-12">
              <CardContent>
                <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">
                  {filter === 'all' 
                    ? `No tienes reservas esta ${viewType === 'week' ? 'semana' : 'mes'}`
                    : `No tienes reservas de menú ${filter} esta ${viewType === 'week' ? 'semana' : 'mes'}`
                  }
                </h2>
                <p className="text-muted-foreground mb-6">
                  Selecciona fechas en el calendario para crear nuevas reservas
                </p>
                <Button onClick={() => navigate('/calendar')}>
                  Hacer Reserva
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <Card key={reservation.id} className="shadow-card hover:shadow-hover transition-smooth">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-lg">
                            {new Date(reservation.date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h3>
                          
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Menú:</span>
                              <Badge variant={reservation.menuType === 'Normal' ? 'default' : 'secondary'}>
                                {reservation.menuType}
                              </Badge>
                            </div>
                            
                            {!canModifyReservation(new Date(reservation.date)) && (
                              <div className="flex items-center space-x-2 text-accent">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">No modificable (&lt;48h)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/reservation/${reservation.id}`)}
                        >
                          Ver Detalle
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que quieres cancelar la reserva para el{' '}
                                {new Date(reservation.date).toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long'
                                })}? Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, mantener</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleCancelReservation(reservation.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Sí, cancelar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReservations;