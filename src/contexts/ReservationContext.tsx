import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';
import { parseYMD, toYMD } from '@/utils/date';
import { parse } from 'path';

export type MenuType = 'Normal' | 'Hipocalórico';

export interface Reservation {
  id: string;
  date: Date;
  menuType: MenuType;
  status: 'confirmed' | 'cancelled';
  createdAt: Date;
}

interface ReservationContextType {
  reservations: Reservation[];
  pendingReservations: Array<{ date: Date; menuType: MenuType }>;
  loading: boolean;
  addToPending: (date: Date, menuType: MenuType) => void;
  removeFromPending: (date: Date) => void;
  updatePendingMenu: (date: Date, menuType: MenuType) => void;
  clearPending: () => void;
  confirmPendingReservations: () => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  cancelReservationsByPeriod: (startDate: Date, endDate: Date) => Promise<void>;
  updateReservationMenu: (id: string, menuType: MenuType) => Promise<boolean>;
  canModifyReservation: (date: Date) => boolean;
  fetchReservations: () => Promise<void>;
  resetDemo: () => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

// Helper function to check if a date is within 48 hours
const isWithin48Hours = (date: Date): boolean => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff < 48 * 60 * 60 * 1000; // 48 hours in milliseconds
};

// Sample data for demo
const createSampleReservations = (): Reservation[] => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const nextWeek2 = new Date(today);
  nextWeek2.setDate(today.getDate() + 9);
  
  return [
    {
      id: '1',
      date: nextWeek,
      menuType: 'Normal',
      status: 'confirmed',
      createdAt: new Date(),
    },
    {
      id: '2',
      date: nextWeek2,
      menuType: 'Hipocalórico',
      status: 'confirmed',
      createdAt: new Date(),
    },
  ];
};

export const ReservationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pendingReservations, setPendingReservations] = useState<Array<{ date: Date; menuType: MenuType }>>([]);
  const [loading, setLoading] = useState(false);

  const addToPending = (date: Date, menuType: MenuType) => {
    setPendingReservations(prev => {
      const existingIndex = prev.findIndex(r => r.date.toDateString() === date.toDateString());
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { date, menuType };
        return updated;
      }
      return [...prev, { date, menuType }];
    });
  };

  const removeFromPending = (date: Date) => {
    setPendingReservations(prev => 
      prev.filter(r => r.date.toDateString() !== date.toDateString())
    );
  };

  const updatePendingMenu = (date: Date, menuType: MenuType) => {
    setPendingReservations(prev => 
      prev.map(r => 
        r.date.toDateString() === date.toDateString() 
          ? { ...r, menuType } 
          : r
      )
    );
  };

  const fetchReservations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      const formattedReservations: Reservation[] = data.map(r => ({
        id: r.id,
        date: parseYMD(r.date), // 'YYYY-MM-DD' to Date
        menuType: r.menu_type as MenuType,
        status: r.status as 'confirmed' | 'cancelled',
        createdAt: new Date(r.created_at),
      }));

      setReservations(formattedReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearPending = () => {
    setPendingReservations([]);
  };

  const confirmPendingReservations = async () => {
    if (!user || pendingReservations.length === 0) return;

    setLoading(true);
    try {
      // 1) Prepara fechas por tipo de menú (para reactivar en lote)
      const byMenu: Record<MenuType, string[]> = { Normal: [], Hipocalórico: [] };
      for (const p of pendingReservations) {
        byMenu[p.menuType].push(toYMD(p.date)); // 'YYYY-MM-DD'
      }

      // 2) REACTIVAR canceladas (update status + menu_type)
      //    Hacemos un UPDATE por cada grupo de menú para poder setear menu_type correcto
      for (const menuType of Object.keys(byMenu) as MenuType[]) {
        const dates = byMenu[menuType];
        if (dates.length === 0) continue;

        const { error: updErr } = await supabase
          .from('reservations')
          .update({ status: 'confirmed', menu_type: menuType })
          .eq('user_id', user.id)
          .eq('status', 'cancelled')
          .in('date', dates);

        if (updErr) throw updErr;
      }

      // 3) INSERTAR las que no existan (si hay duplicado, lo ignoramos)
      //    (Si tienes trigger que setea NEW.user_id := auth.uid(), puedes quitar user_id aquí)
      const rows = pendingReservations.map(p => ({
        user_id: user.id,
        date: toYMD(p.date), // 'YYYY-MM-DD'
        menu_type: p.menuType,
        status: 'confirmed',
      }));

      const { error: insErr } = await supabase
        .from('reservations')
        .insert(rows)
        .select();

      // Si hay duplicados por UNIQUE(user_id,date), los ignoramos:
      // (en Supabase/PostgREST el code suele ser '23505')
      // Si quieres ser explícito:
      // if (insErr && insErr.code !== '23505') throw insErr;
      if (insErr && insErr.code && insErr.code !== '23505') throw insErr;

      await fetchReservations();
      clearPending();

      toast({
        title: "¡Reservas confirmadas!",
        description: `Se confirmaron/actualizaron ${pendingReservations.length} reserva(s)`,
      });
    } catch (error: any) {
      console.error('confirmPendingReservations error:', error);
      toast({
        title: "Error",
        description: error?.message ?? "No se pudieron confirmar las reservas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const cancelReservation = async (id: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchReservations();
      
      toast({
        title: "Reserva cancelada",
        description: "La reserva se ha cancelado exitosamente",
      });
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelReservationsByPeriod = async (startDate: Date, endDate: Date) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const startDateStr = toYMD(startDate);
      const endDateStr = toYMD(endDate);
      
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (error) throw error;

      await fetchReservations();
      
      toast({
        title: "Reservas canceladas",
        description: "Las reservas del período seleccionado se han cancelado",
      });
    } catch (error) {
      console.error('Error cancelling reservations by period:', error);
      toast({
        title: "Error",
        description: "No se pudieron cancelar las reservas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReservationMenu = async (id: string, menuType: MenuType): Promise<boolean> => {
    if (!user) return false;
    
    const reservation = reservations.find(r => r.id === id);
    if (!reservation || !canModifyReservation(reservation.date)) {
      return false;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ menu_type: menuType })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchReservations();
      
      toast({
        title: "Menú actualizado",
        description: "El tipo de menú se ha actualizado exitosamente",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating reservation menu:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el menú",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const canModifyReservation = (date: Date): boolean => {
    return !isWithin48Hours(date);
  };

  const resetDemo = () => {
    setReservations([]);
    clearPending();
  };

  // Fetch reservations when user changes
  useEffect(() => {
    if (user && !authLoading) {
      fetchReservations();
    } else if (!user) {
      setReservations([]);
    }
  }, [user, authLoading]);

  return (
    <ReservationContext.Provider value={{
      reservations,
      pendingReservations,
      loading,
      addToPending,
      removeFromPending,
      updatePendingMenu,
      clearPending,
      confirmPendingReservations,
      cancelReservation,
      cancelReservationsByPeriod,
      updateReservationMenu,
      canModifyReservation,
      fetchReservations,
      resetDemo,
    }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservations = () => {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservations must be used within a ReservationProvider');
  }
  return context;
};