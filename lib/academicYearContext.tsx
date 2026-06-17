'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AcademicYear } from './types';

// Exported keys so storage.ts can use them
export const STORAGE_KEY_ACADEMIC_YEARS = 'school_app_academic_years';
export const STORAGE_KEY_ACTIVE_YEAR_ID = 'school_app_active_year_id';

interface AcademicYearContextType {
  academicYears: AcademicYear[];
  activeAcademicYear: AcademicYear | null;
  isLoading: boolean;
  addAcademicYear: (year: Omit<AcademicYear, 'id' | 'isActive'>) => Promise<void>;
  updateAcademicYear: (id: string, year: Partial<AcademicYear>) => Promise<void>;
  deleteAcademicYear: (id: string) => Promise<void>;
  setActiveAcademicYear: (id: string) => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: React.ReactNode }) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [activeYearId, setActiveYearId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { getAllAcademicYears, getActiveYearId: getStoredActiveId } = await import('./storage');
      let years = await getAllAcademicYears();

      if (years.length === 0) {
        // Create default academic year
        const currentYear = new Date().getFullYear();
        const defaultYear: AcademicYear = {
          id: crypto.randomUUID(),
          name: `${currentYear}/${currentYear + 1} Ganjil`,
          startDate: `${currentYear}-07-01`,
          endDate: `${currentYear}-12-31`,
          isActive: true,
        };
        years = [defaultYear];
        const { saveAcademicYear } = await import('./storage');
        await saveAcademicYear(defaultYear);
      }

      setAcademicYears(years);

      let activeId = getStoredActiveId();
      if (!activeId || !years.find((y) => y.id === activeId)) {
        const activeYear = years.find((y) => y.isActive) || years[0];
        activeId = activeYear.id;
        localStorage.setItem(STORAGE_KEY_ACTIVE_YEAR_ID, activeId);
      }

      setActiveYearId(activeId);
    } catch (error) {
      console.error('Error loading academic years:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addAcademicYear = async (yearData: Omit<AcademicYear, 'id' | 'isActive'>) => {
    const newYear: AcademicYear = {
      ...yearData,
      id: crypto.randomUUID(),
      isActive: academicYears.length === 0,
    };
    const { saveAcademicYear } = await import('./storage');
    await saveAcademicYear(newYear);
    await loadData();
    
    if (academicYears.length === 0) {
      setActiveAcademicYear(newYear.id);
    }
  };

  const updateAcademicYear = async (id: string, updates: Partial<AcademicYear>) => {
    const existing = academicYears.find(y => y.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates };
    const { saveAcademicYear } = await import('./storage');
    await saveAcademicYear(updated);
    await loadData();
  };

  const deleteAcademicYear = async (id: string) => {
    const { deleteAcademicYearData } = await import('./storage');
    await deleteAcademicYearData(id);
    await loadData();

    if (activeYearId === id && academicYears.length > 1) {
      const remaining = academicYears.filter(y => y.id !== id);
      setActiveAcademicYear(remaining[0].id);
    } else if (academicYears.length <= 1) {
      setActiveYearId(null);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_YEAR_ID);
    }
  };

  const setActiveAcademicYear = async (id: string) => {
    const { saveAcademicYear } = await import('./storage');
    for (const year of academicYears) {
      await saveAcademicYear({ ...year, isActive: year.id === id });
    }
    setActiveYearId(id);
    localStorage.setItem(STORAGE_KEY_ACTIVE_YEAR_ID, id);
    await loadData();
  };

  const activeAcademicYear = academicYears.find((y) => y.id === activeYearId) || null;

  return (
    <AcademicYearContext.Provider
      value={{
        academicYears,
        activeAcademicYear,
        isLoading,
        addAcademicYear,
        updateAcademicYear,
        deleteAcademicYear,
        setActiveAcademicYear,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
}
