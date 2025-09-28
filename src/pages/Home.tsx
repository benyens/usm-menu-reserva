import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle , ClipboardList} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReservations } from "@/contexts/ReservationContext";


const Home = () => {
  const navigate = useNavigate();
  const { reservations, resetDemo } = useReservations();

  const activeReservations = reservations.filter(r => r.status === 'confirmed').length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Bienvenido al Casino USM
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Reserva tus almuerzos de forma rápida y sencilla
            </p>
          </div>

          {/* Main Actions Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Reserve Lunch Card */}
            <Card className="shadow-card hover:shadow-hover transition-smooth">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Reservar Almuerzos</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Selecciona los días y el tipo de menú para hacer tus reservas
                </p>
                <Button 
                  onClick={() => navigate('/calendar')}
                  size="lg"
                  className="w-full bg-gradient-primary hover:bg-primary/90 transition-smooth"
                >
                  Comenzar Reserva
                </Button>
              </CardContent>
            </Card>

            {/* My Reservations Card */}
            <Card className="shadow-card hover:shadow-hover transition-smooth">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mb-4">
                  <ClipboardList className="h-8 w-8 text-accent-foreground" />   {/* <-- cambiado */}
                </div>
                <CardTitle className="text-2xl">Mis Reservas</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Revisa, modifica o cancela tus reservas existentes
                </p>
                <div className="bg-muted rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium">
                    Tienes <span className="text-primary font-bold">{activeReservations}</span> reservas activas
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/reservations')}
                  variant="secondary"
                  size="lg"
                  className="w-full transition-smooth"
                >
                  Ver Mis Reservas
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Information Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* 48h Rule Card */}
            <Card className="border-accent/20 bg-accent/5">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-accent" />
                  <CardTitle className="text-lg">Regla de 48 Horas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Las reservas deben realizarse con al menos 48 horas de anticipación. 
                  No es posible reservar para días muy próximos.
                </p>
              </CardContent>
            </Card>

            {/* Menu Types Card */}
            <Card className="border-secondary/20 bg-secondary/5">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-secondary" />
                  <CardTitle className="text-lg">Tipos de Menú</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Disponibles: <strong>Normal</strong> e <strong>Hipocalórico</strong>. 
                  Puedes seleccionar el tipo para cada día de forma individual.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;