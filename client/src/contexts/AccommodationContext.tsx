import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Accommodation, Report, ReportStatus } from '../types';

interface AccommodationContextType {
  accommodations: Accommodation[];
  addReport: (accommodationId: string, report: Partial<Report>) => void;
  updateAccommodationStatus: (accommodationId: string, status: ReportStatus) => void;
  updateAccommodationSSI: (accommodationId: string, newSSI: number) => void;
}

const AccommodationContext = createContext<AccommodationContextType | undefined>(undefined);

export const AccommodationProvider: React.FC<{
  children: ReactNode;
  initialAccommodations: Accommodation[]
}> = ({ children, initialAccommodations }) => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>(initialAccommodations);

  const addReport = (accommodationId: string, _reportData: Partial<Report>) => {
    const updatedAccommodations = accommodations.map(acc => {
      if (acc._id === accommodationId) {
        return {
          ...acc,
          totalReports: acc.totalReports + 1,
          updatedAt: new Date().toISOString(),
        };
      }
      return acc;
    });

    setAccommodations(updatedAccommodations);
  };

  const updateAccommodationStatus = (accommodationId: string, _status: ReportStatus) => {
    const updatedAccommodations = accommodations.map(acc => {
      if (acc._id === accommodationId) {
        return {
          ...acc,
          updatedAt: new Date().toISOString(),
        };
      }
      return acc;
    });
    setAccommodations(updatedAccommodations);
  };

  const updateAccommodationSSI = (accommodationId: string, newSSI: number) => {
    const updatedAccommodations = accommodations.map(acc => {
      if (acc._id === accommodationId) {
        return {
          ...acc,
          ssi: newSSI,
          updatedAt: new Date().toISOString(),
        };
      }
      return acc;
    });
    setAccommodations(updatedAccommodations);
  };

  return (
    <AccommodationContext.Provider
      value={{
        accommodations,
        addReport,
        updateAccommodationStatus,
        updateAccommodationSSI
      }}
    >
      {children}
    </AccommodationContext.Provider>
  );
};

export const useAccommodation = (): AccommodationContextType => {
  const context = useContext(AccommodationContext);
  if (context === undefined) {
    throw new Error('useAccommodation must be used within an AccommodationProvider');
  }
  return context;
};
