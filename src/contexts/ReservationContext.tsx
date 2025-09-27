import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  addToPending: (date: Date, menuType: MenuType) => void;
  removeFromPending: (date: Date) => void;
  updatePendingMenu: (date: Date, menuType: MenuType) => void;
  clearPending: () => void;
  confirmPendingReservations: () => void;
  cancelReservation: (id: string) => void;
  cancelReservationsByPeriod: (startDate: Date, endDate: Date) => void;
  updateReservationMenu: (id: string, menuType: MenuType) => boolean;
  canModifyReservation: (date: Date) => boolean;
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
  const [reservations, setReservations] = useState<Reservation[]>(createSampleReservations());
  const [pendingReservations, setPendingReservations] = useState<Array<{ date: Date; menuType: MenuType }>>([]);

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

  const clearPending = () => {
    setPendingReservations([]);
  };

  const confirmPendingReservations = () => {
    const newReservations = pendingReservations.map(pending => ({
      id: Date.now().toString() + Math.random().toString(),
      date: pending.date,
      menuType: pending.menuType,
      status: 'confirmed' as const,
      createdAt: new Date(),
    }));
    
    setReservations(prev => [...prev, ...newReservations]);
    clearPending();
  };

  const cancelReservation = (id: string) => {
    setReservations(prev => 
      prev.map(r => 
        r.id === id ? { ...r, status: 'cancelled' } : r
      )
    );
  };

  const cancelReservationsByPeriod = (startDate: Date, endDate: Date) => {
    setReservations(prev => 
      prev.map(r => {
        const reservationDate = new Date(r.date);
        if (reservationDate >= startDate && reservationDate <= endDate && r.status === 'confirmed') {
          return { ...r, status: 'cancelled' };
        }
        return r;
      })
    );
  };

  const updateReservationMenu = (id: string, menuType: MenuType): boolean => {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation || !canModifyReservation(reservation.date)) {
      return false;
    }
    
    setReservations(prev => 
      prev.map(r => 
        r.id === id ? { ...r, menuType } : r
      )
    );
    return true;
  };

  const canModifyReservation = (date: Date): boolean => {
    return !isWithin48Hours(date);
  };

  const resetDemo = () => {
    setReservations(createSampleReservations());
    clearPending();
  };

  return (
    <ReservationContext.Provider value={{
      reservations,
      pendingReservations,
      addToPending,
      removeFromPending,
      updatePendingMenu,
      clearPending,
      confirmPendingReservations,
      cancelReservation,
      cancelReservationsByPeriod,
      updateReservationMenu,
      canModifyReservation,
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