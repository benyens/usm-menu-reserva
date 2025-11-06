import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReservations, MenuType } from "@/contexts/ReservationContext";
import { useToast } from "@/hooks/use-toast";

const Calendar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    reservations,
    pendingReservations, 
    addToPending, 
    removeFromPending, 
    updatePendingMenu,
    updateReservationMenu,
    canModifyReservation 
  } = useReservations();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('month');
  const [activeMenuDate, setActiveMenuDate] = useState<Date | null>(null); // <-- para popover en días reservados

  // Helpers
  const isWithin48Hours = (date: Date): boolean => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return diff < 48 * 60 * 60 * 1000;
  };
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // --- NUEVO: helpers de reservas confirmadas ---
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  const getReservationForDate = (date: Date) =>
    reservations.find(r => sameDay(new Date(r.date), date) && r.status === 'confirmed');

  const isReserved = (date: Date) => Boolean(getReservationForDate(date));

  const isDateSelected = (date: Date): boolean =>
    pendingReservations.some(r => sameDay(r.date, date));

  const getSelectedMenu = (date: Date): MenuType => {
    const reservation = pendingReservations.find(r => sameDay(r.date, date));
    return reservation?.menuType || 'Normal';
  };

  const handleDateClick = (date: Date) => {
    // Si es día reservado, no lo agregamos a pending: abrimos/cerramos el popover para cambiar menú
    const reserved = getReservationForDate(date);
    if (reserved) {
      setActiveMenuDate(prev => (prev && sameDay(prev, date) ? null : date));
      return;
    }

    // Validaciones normales para días no reservados
    if (isWithin48Hours(date)) {
      toast({ variant: "destructive", title: "No disponible", description: "No es posible reservar con menos de 48 horas de anticipación" });
      return;
    }
    if (isWeekend(date)) {
      toast({ variant: "destructive", title: "No disponible", description: "El casino no funciona los fines de semana" });
      return;
    }

    if (isDateSelected(date)) {
      removeFromPending(date);
      toast({ title: "Día removido", description: "El día ha sido removido de tu selección" });
    } else {
      addToPending(date, 'Normal');
      toast({ title: "Día agregado", description: "El día ha sido agregado a tu selección" });
    }
  };

  const handlePendingMenuChange = (date: Date, menuType: MenuType) => {
    updatePendingMenu(date, menuType);
  };

  // NUEVO: cambiar menú de una reserva ya confirmada
  const handleReservedMenuChange = async (date: Date, menuType: MenuType) => {
    const reserved = getReservationForDate(date);
    if (!reserved) return;

    if (!canModifyReservation(new Date(reserved.date))) {
      toast({ variant: "destructive", title: "No modificable", description: "No puedes cambiar el menú con menos de 48 horas" });
      return;
    }

    const ok = await updateReservationMenu(reserved.id, menuType);
    if (ok) {
      setActiveMenuDate(null);
    }
  };

  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // lunes
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - (startDay === 0 ? 6 : startDay - 1));
    const endDay = endDate.getDay();
    endDate.setDate(endDate.getDate() + (endDay === 0 ? 0 : 7 - endDay));

    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewType === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
    setActiveMenuDate(null); // cerrar popovers al navegar
  };

  const days = viewType === 'week' ? generateWeekDays() : generateMonthDays();
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Seleccionar Fechas</h1>
              <p className="text-muted-foreground mt-2">
                Elige los días para reservar tu almuerzo (pueden ser no consecutivos)
              </p>
            </div>
            {pendingReservations.length > 0 && (
              <Button onClick={() => navigate('/summary')} className="bg-gradient-primary transition-smooth">
                Ver Resumen ({pendingReservations.length})
              </Button>
            )}
          </div>

          {/* View Type Toggle + nav */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex bg-muted rounded-lg p-1">
              <Button variant={viewType === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setViewType('week')} className="transition-smooth">
                Semana
              </Button>
              <Button variant={viewType === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => setViewType('month')} className="transition-smooth">
                Mes
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigatePeriod('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-lg min-w-[200px] text-center">
                {viewType === 'week' 
                  ? `Semana del ${days[0]?.getDate()} - ${days[6]?.getDate()} de ${days[0]?.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
                  : currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                }
              </span>
              <Button variant="outline" size="sm" onClick={() => navigatePeriod('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Calendario de Reservas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="text-center font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((date, index) => {
                  const reserved = getReservationForDate(date);
                  const reservedMenu = reserved?.menuType;
                  const reservedModifiable = reserved ? canModifyReservation(new Date(reserved.date)) : false;

                  // Para días libres aplican las reglas de 48h y fines de semana
                  const disabledFreeDay = !reserved && (isWithin48Hours(date) || isWeekend(date));
                  const isSelected = isDateSelected(date);
                  const isCurrentMonthDay = viewType === 'month' ? isCurrentMonth(date) : true;

                  // aspecto del botón
                  const variant =
                    reserved
                      ? "default"                         // reservado: destacado
                      : isSelected
                        ? "default"
                        : "outline";

                  const btnClasses = `
                    w-full h-20 flex flex-col items-center justify-center relative transition-smooth
                    ${disabledFreeDay ? "opacity-50 cursor-not-allowed" : ""}
                    ${!isCurrentMonthDay ? "opacity-30" : ""}
                    ${reserved ? "bg-primary text-primary-foreground shadow-focus" : ""}
                    ${isSelected && !reserved ? "bg-primary text-primary-foreground shadow-focus" : "hover:bg-muted/50"}
                  `;

                  return (
                    <div key={index} className="relative">
                      <Button
                        variant={variant as any}
                        className={btnClasses}
                        onClick={() => {
                          if (disabledFreeDay) return;
                          handleDateClick(date);
                        }}
                        // OJO: un día reservado no se deshabilita (para permitir cambiar menú);
                        // sólo deshabilitamos días libres no reservables.
                        disabled={disabledFreeDay}
                      >
                        <span className="text-sm font-medium">{date.getDate()}</span>

                        {/* Badges */}
                        {reserved ? (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {reservedMenu}
                          </Badge>
                        ) : isSelected ? (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {getSelectedMenu(date)}
                          </Badge>
                        ) : null}

                        {/* Indicador no disponible (libre pero bloqueado) */}
                        {!reserved && disabledFreeDay && (
                          <span className="absolute top-1 right-1 text-xs text-muted-foreground">✕</span>
                        )}

                        {/* Indicador <48h para reservas existentes */}
                        {reserved && !reservedModifiable && (
                          <span className="absolute top-1 right-1 flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                          </span>
                        )}
                      </Button>

                      {/* Popover para cambiar menú:
                          - si es reservado: se abre al hacer click (activeMenuDate)
                          - si es pending: se muestra igual que antes */}
                      {reserved ? (
                        activeMenuDate && sameDay(activeMenuDate, date) && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10">
                            <div className="p-2 space-y-1">
                              <Button
                                variant={reservedMenu === 'Normal' ? "default" : "ghost"}
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => handleReservedMenuChange(date, 'Normal')}
                                disabled={!reservedModifiable}
                              >
                                Normal
                              </Button>
                              <Button
                                variant={reservedMenu === 'Hipocalórico' ? "default" : "ghost"}
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => handleReservedMenuChange(date, 'Hipocalórico')}
                                disabled={!reservedModifiable}
                              >
                                Hipocalórico
                              </Button>
                            </div>
                          </div>
                        )
                      ) : (
                        isSelected && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10">
                            <div className="p-2 space-y-1">
                              <Button
                                variant={getSelectedMenu(date) === 'Normal' ? "default" : "ghost"}
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => handlePendingMenuChange(date, 'Normal')}
                              >
                                Normal
                              </Button>
                              <Button
                                variant={getSelectedMenu(date) === 'Hipocalórico' ? "default" : "ghost"}
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => handlePendingMenuChange(date, 'Hipocalórico')}
                              >
                                Hipocalórico
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span>Seleccionado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-muted border rounded"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-muted/50 border rounded opacity-50 flex items-center justify-center text-xs text-muted-foreground">
                ✕
              </div>
              <span>No disponible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
