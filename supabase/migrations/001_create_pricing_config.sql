-- Tabela para configuração de preços
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Configurações de quartos
  room_categories JSONB NOT NULL DEFAULT '[]',
  
  -- Configurações de pacotes
  packages JSONB NOT NULL DEFAULT '[]',
  
  -- Configurações de itens
  items JSONB NOT NULL DEFAULT '[]'
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pricing_config_active ON pricing_config(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_config_created_at ON pricing_config(created_at);

-- Inserir configuração padrão
INSERT INTO pricing_config (name, description, room_categories, packages, items) VALUES (
  'Configuração Padrão',
  'Configuração inicial de preços para Surf Inn Rio',
  '[
    {
      "id": "private-double",
      "name": "Private: Double",
      "pricePerNight": 150,
      "billingType": "per_room"
    },
    {
      "id": "private-single", 
      "name": "Private: Single",
      "pricePerNight": 120,
      "billingType": "per_room"
    },
    {
      "id": "shared-mixed",
      "name": "Shared: Mixed Standard", 
      "pricePerNight": 80,
      "billingType": "per_person"
    },
    {
      "id": "shared-female",
      "name": "Shared: Female Only",
      "pricePerNight": 85,
      "billingType": "per_person"
    }
  ]',
  '[
    {
      "id": "package-1",
      "name": "Package 1 - Basic",
      "fixedPrice": 200,
      "overridesIndividualPricing": false,
      "includedItems": {
        "breakfast": true,
        "surfLessons": 2,
        "yogaLessons": 1
      }
    },
    {
      "id": "package-2", 
      "name": "Package 2 - Carioca Ride",
      "fixedPrice": 400,
      "overridesIndividualPricing": false,
      "includedItems": {
        "breakfast": true,
        "unlimitedBoardRental": true,
        "surfLessons": 4,
        "yogaLessons": 2,
        "videoAnalysis": 1,
        "massage": 1
      }
    }
  ]',
  '[
    {
      "id": "breakfast",
      "name": "Café da Manhã",
      "price": 25,
      "billingType": "per_person",
      "category": "daily",
      "dbColumn": "breakfast"
    },
    {
      "id": "unlimited-board-rental",
      "name": "Aluguel de Prancha Ilimitado", 
      "price": 30,
      "billingType": "per_person",
      "category": "daily",
      "dbColumn": "aluguel_de_prancha"
    },
    {
      "id": "surf-lesson",
      "name": "Aula de Surf",
      "price": 80,
      "billingType": "per_unit",
      "category": "fixed",
      "dbColumn": "aulas_de_surf"
    },
    {
      "id": "yoga-lesson",
      "name": "Aula de Yoga",
      "price": 50,
      "billingType": "per_unit", 
      "category": "fixed",
      "dbColumn": "aulas_de_yoga"
    },
    {
      "id": "surf-skate",
      "name": "Surf-Skate",
      "price": 40,
      "billingType": "per_unit",
      "category": "fixed",
      "dbColumn": "skate"
    },
    {
      "id": "video-analysis",
      "name": "Análise de Vídeo",
      "price": 60,
      "billingType": "per_unit",
      "category": "fixed",
      "dbColumn": "analise_de_video"
    },
    {
      "id": "massage",
      "name": "Massagem",
      "price": 120,
      "billingType": "per_unit",
      "category": "fixed",
      "dbColumn": "massagem_extra"
    },
    {
      "id": "surf-guide",
      "name": "Surf Guide",
      "price": 100,
      "billingType": "per_unit",
      "category": "fixed",
      "dbColumn": "surf_guide"
    },
    {
      "id": "transfer",
      "name": "Transfer",
      "price": 80,
      "billingType": "per_reservation",
      "category": "fixed",
      "dbColumn": "transfer"
    },
    {
      "id": "hike",
      "name": "Trilha",
      "price": 60,
      "billingType": "per_reservation",
      "category": "fixed",
      "dbColumn": "hike_extra"
    },
    {
      "id": "rio-city-tour",
      "name": "Rio City Tour",
      "price": 150,
      "billingType": "per_reservation",
      "category": "fixed",
      "dbColumn": "rio_city_tour"
    },
    {
      "id": "carioca-experience",
      "name": "Carioca Experience",
      "price": 200,
      "billingType": "per_reservation",
      "category": "fixed",
      "dbColumn": "carioca_experience"
    }
  ]'
) ON CONFLICT DO NOTHING;
