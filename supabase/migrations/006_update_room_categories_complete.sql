-- Atualizar configuração de preços com todos os tipos de quarto
-- Esta migração adiciona os tipos de quarto que faltam na configuração

UPDATE pricing_config
SET room_categories = '[
  {
    "id": "private-shared-bathroom",
    "name": "Private: Shared bathroom",
    "pricePerNight": 140,
    "billingType": "per_room"
  },
  {
    "id": "private-double",
    "name": "Private: Double",
    "pricePerNight": 150,
    "billingType": "per_room"
  },
  {
    "id": "private-sea-view",
    "name": "Private: Sea-View",
    "pricePerNight": 200,
    "billingType": "per_room"
  },
  {
    "id": "private-triple",
    "name": "Private: Triple",
    "pricePerNight": 180,
    "billingType": "per_room"
  },
  {
    "id": "private-family",
    "name": "Private: Family",
    "pricePerNight": 220,
    "billingType": "per_room"
  },
  {
    "id": "shared-mixed-economic",
    "name": "Shared: Mixed Economic",
    "pricePerNight": 70,
    "billingType": "per_person"
  },
  {
    "id": "shared-mixed-standard",
    "name": "Shared: Mixed Standard",
    "pricePerNight": 80,
    "billingType": "per_person"
  },
  {
    "id": "shared-female-economic",
    "name": "Shared: Female Economic",
    "pricePerNight": 75,
    "billingType": "per_person"
  },
  {
    "id": "shared-female-standard",
    "name": "Shared: Female Standard",
    "pricePerNight": 85,
    "billingType": "per_person"
  }
]'::jsonb,
updated_at = NOW()
WHERE is_active = true;

-- Comentário explicativo
COMMENT ON COLUMN pricing_config.room_categories IS 'Todos os tipos de acomodação disponíveis com seus respectivos preços. Atualizado para incluir Private (Shared bathroom, Double, Sea-View, Triple, Family) e Shared (Mixed Economic, Mixed Standard, Female Economic, Female Standard).';

