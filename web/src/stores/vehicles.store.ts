import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VehiclesState {
    selectedVehicleId: string | null;
    setSelectedVehicleId: (id: string | null) => void;
}

export const useVehiclesStore = create<VehiclesState>()(
    persist(
        (set) => ({
            selectedVehicleId: null,
            setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
        }),
        {
            name: 'vehicles-storage',
        }
    )
);
