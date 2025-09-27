import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
      <Card className="max-w-md w-full shadow-card text-center">
        <CardContent className="p-8">
          <div className="bg-destructive/10 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Página no encontrada
          </h2>
          <p className="text-muted-foreground mb-8">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
          
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-primary transition-smooth"
          >
            <Home className="h-4 w-4 mr-2" />
            Volver al Inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
