-- Adicionar Package 3 - Surf Intensive aos pacotes configurados
-- Esta migração atualiza a configuração de pacotes para incluir o terceiro pacote

UPDATE pricing_config
SET packages = '[
  {
    "id": "package-1",
    "name": "Package 1 - Surf In Rio",
    "fixedPrice": 300,
    "overridesIndividualPricing": false,
    "includedItems": {
      "surfLessons": 4,
      "yogaLessons": 1
    }
  },
  {
    "id": "package-2",
    "name": "Package 2 - Carioca Ride",
    "fixedPrice": 500,
    "overridesIndividualPricing": false,
    "includedItems": {
      "breakfast": true,
      "unlimitedBoardRental": true,
      "surfLessons": 4,
      "yogaLessons": 1,
      "surfSkate": 1,
      "videoAnalysis": 1,
      "massage": 1,
      "transfer": 1
    }
  },
  {
    "id": "package-3",
    "name": "Package 3 - Surf Intensive",
    "fixedPrice": 800,
    "overridesIndividualPricing": false,
    "includedItems": {
      "breakfast": true,
      "unlimitedBoardRental": true,
      "surfLessons": 8,
      "yogaLessons": 2,
      "surfSkate": 1,
      "surfGuide": 1,
      "videoAnalysis": 1,
      "massage": 1,
      "transfer": 1
    }
  }
]'::jsonb,
updated_at = NOW()
WHERE is_active = true;

