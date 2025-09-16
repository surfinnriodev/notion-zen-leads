import { useState, useEffect } from 'react';
import { PricingConfig } from '@/types/pricing';

const DEFAULT_CONFIG: PricingConfig = {
  roomCategories: [
    { id: 'private-double', name: 'Private: Double', pricePerNight: 150, perPerson: false },
    { id: 'private-single', name: 'Private: Single', pricePerNight: 120, perPerson: false },
    { id: 'shared-mixed', name: 'Shared: Mixed Standard', pricePerNight: 80, perPerson: true },
    { id: 'shared-female', name: 'Shared: Female Only', pricePerNight: 85, perPerson: true },
  ],
  packages: [
    {
      id: 'basic-package',
      name: 'Pacote Básico',
      fixedPrice: 300,
      includedItems: {
        breakfast: true,
        unlimitedBoardRental: true,
        surfLessons: 2,
      }
    },
    {
      id: 'complete-package',
      name: 'Pacote Completo',
      fixedPrice: 500,
      includedItems: {
        breakfast: true,
        unlimitedBoardRental: true,
        surfLessons: 5,
        yogaLessons: 3,
        surfSkate: 2,
        videoAnalysis: 1,
      }
    }
  ],
  dailyItems: {
    breakfast: { price: 25, perPerson: true },
    unlimitedBoardRental: { price: 30, perPerson: true },
  },
  fixedItems: {
    surfLessons: {
      tier1_3: { price: 80, perPerson: true },
      tier4_7: { price: 70, perPerson: true },
      tier8plus: { price: 60, perPerson: true },
    },
    yogaLessons: { price: 40, perPerson: true },
    surfSkate: { price: 35, perPerson: true },
    videoAnalysis: { price: 50, perPerson: true },
    massage: { price: 80, perPerson: true },
    surfGuide: { price: 120, perPerson: true },
    transfer: { price: 100, perReservation: true },
    activities: {
      hike: { price: 60, perPerson: true },
      rioCityTour: { price: 80, perPerson: true },
      cariocaExperience: { price: 100, perPerson: true },
    },
  },
};

export const usePricingConfig = () => {
  const [config, setConfig] = useState<PricingConfig>(() => {
    const saved = localStorage.getItem('pricing-config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('pricing-config', JSON.stringify(config));
  }, [config]);

  const updateConfig = (newConfig: Partial<PricingConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const resetToDefault = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return { config, updateConfig, resetToDefault };
};