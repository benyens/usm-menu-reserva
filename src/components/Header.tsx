import { Button } from "@/components/ui/button";
import { Calendar, Home, User, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cerrar sesión',
        variant: 'destructive'
      });
    } else {
      navigate('/auth');
    }
  };

  // Don't show header on auth page
  if (location.pathname === '/auth') {
    return null;
  }

  const navItems = [
    { path: "/", label: "Inicio", icon: Home },
    { path: "/calendar", label: "Reservar", icon: Calendar },
    { path: "/reservations", label: "Mis Reservas", icon: User },
  ];

  return (
    <header className="bg-gradient-primary shadow-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-primary-foreground">
              Casino USM
            </div>
            <span className="text-primary-foreground/80 text-sm">
              Reserva de Almuerzos
            </span>
            {profile && (
              <span className="text-primary-foreground/60 text-xs ml-4">
                {profile.full_name} - {profile.employee_id}
              </span>
            )}
          </div>
          
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "secondary" : "ghost"}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 text-sm transition-smooth ${
                    isActive 
                      ? "bg-secondary text-secondary-foreground" 
                      : "text-primary-foreground hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
            
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center space-x-2 text-sm text-primary-foreground hover:bg-white/10 transition-smooth"
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </Button>
          </nav>

          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground"
            >
              Menú
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;