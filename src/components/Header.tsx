import { Button } from "@/components/ui/button";
import { Calendar, Home, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

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