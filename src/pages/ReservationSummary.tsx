import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Check, Trash2, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReservations, MenuType } from "@/contexts/ReservationContext";
import { useToast } from "@/hooks/use-toast";

const ReservationSummary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    pendingReservations,
    removeFromPending,
    updatePendingMenu,
    confirmPendingReservations,
    clearPending
  } = useReservations();

  const handleConfirmReservations = () => {
    if (pendingReservations.length === 0) {
      toast({
        variant: "destructive",
        title: "Sin reservas",
        description: "No hay reservas pendientes para confirmar",
      });
      return;
    }

    confirmPendingReservations();
    toast({
      title: "¡Reservas confirmadas!",
      description: `Se confirmaron ${pendingReservations.length} reservas exitosamente`,
    });
    navigate('/reservations');
  };

  const handleRemoveReservation = (date: Date) => {
    removeFromPending(date);
    toast({
      title: "Reserva removida",
      description: "La reserva ha sido removida del resumen",
    });
  };

  const handleMenuChange = (date: Date, menuType: MenuType) => {
    updatePendingMenu(date, menuType);
    toast({
      title: "Menú actualizado",
      description: `Menú cambiado a ${menuType}`,
    });
  };

  const totalReservations = pendingReservations.length;
  const normalMenuCount = pendingReservations.filter(r => r.menuType === 'Normal').length;
  const hipocaloricoMenuCount = pendingReservations.filter(r => r.menuType === 'Hipocalórico').length;

  if (totalReservations === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={() => navigate('/calendar')}
              className="mb-6 transition-smooth"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Calendario
            </Button>

            <Card className="shadow-card text-center py-12">
              <CardContent>
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No hay reservas pendientes</h2>
                <p className="text-muted-foreground mb-6">
                  Selecciona días en el calendario para crear tus reservas
                </p>
                <Button onClick={() => navigate('/calendar')}>
                  Ir al Calendario
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button
                variant="outline"
                onClick={() => navigate('/calendar')}
                className="mb-4 transition-smooth"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Calendario
              </Button>
              <h1 className="text-3xl font-bold text-foreground">Resumen de Reservas</h1>
              <p className="text-muted-foreground mt-2">
                Revisa y confirma tus reservas de almuerzo
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Reservations List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Días Seleccionados</h2>
              
              {pendingReservations
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((reservation, index) => (
                  <Card key={index} className="shadow-card hover:shadow-hover transition-smooth">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary/10 p-3 rounded-full">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {reservation.date.toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h3>
                            <div className="flex items-center space-x-2 mt-2">
                              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Menú:</span>
                              <Badge
                                variant={reservation.menuType === 'Normal' ? 'default' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => handleMenuChange(
                                  reservation.date,
                                  reservation.menuType === 'Normal' ? 'Hipocalórico' : 'Normal'
                                )}
                              >
                                {reservation.menuType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveReservation(reservation.date)}
                          className="text-destructive hover:bg-destructive/10 transition-smooth"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Summary Panel */}
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-secondary" />
                    <span>Resumen</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de días:</span>
                    <span className="font-semibold">{totalReservations}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Menú Normal:</span>
                      <span className="font-medium">{normalMenuCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Menú Hipocalórico:</span>
                      <span className="font-medium">{hipocaloricoMenuCount}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={handleConfirmReservations}
                      className="w-full bg-gradient-primary hover:bg-primary/90 transition-smooth"
                      size="lg"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirmar Reservas
                    </Button>
                    
                    <Button
                      onClick={() => {
                        clearPending();
                        navigate('/calendar');
                      }}
                      variant="outline"
                      className="w-full transition-smooth"
                    >
                      Cancelar Todo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-accent-foreground mb-2">
                    💡 Consejo
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Puedes cambiar el tipo de menú haciendo clic en la etiqueta de cada reserva.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationSummary;