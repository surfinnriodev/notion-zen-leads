# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a lead management system for Surf Inn Rio, a surf hostel business. The application handles lead tracking, pricing calculation, message templates, and dashboard analytics for surf retreat reservations.

**Stack**: React + TypeScript + Vite + Supabase + shadcn/ui + Tailwind CSS

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

### Data Flow & State Management

- **React Query** (`@tanstack/react-query`) manages all server state and caching
- **Supabase** provides real-time PostgreSQL database with auto-generated types
- No global state management library - component state + React Query handles everything

### Core Domain Models

**Lead/Reservation** (`src/types/leads.ts`):
- Central entity: `NotionReserva` (alias for `Tables<"reservations">`)
- Extended with pricing: `LeadWithCalculation` adds `calculatedPrice` and `totalPrice`
- Conversion pipeline: Database → `convertLeadToCalculationInput()` → `calculatePrice()` → `calculateLeadPrice()`

**Pricing System** (`src/types/pricing.ts`, `src/utils/priceCalculator.ts`):
- Dynamic pricing configuration stored in Supabase `pricing_config` table
- Three pricing components: Room Categories, Packages, and Activity Items
- Special pricing rules in `src/utils/pricingRules.ts`:
  - Surf lessons have tiered pricing (1-3: R$180, 4-7: R$160, 8+: R$140)
  - Yoga is free on Wednesdays and Fridays at 7am
  - Transfers calculated by group size (max 4 people per vehicle)
  - Retained vs Pending values calculation for payment tracking

### Key Pages & Features

**1. Dashboard** (`src/pages/Dashboard.tsx`)
- Metrics calculated via `useDashboardData` hook
- Revenue tracking, conversion funnel, lead status distribution
- Top packages and monthly revenue charts

**2. Leads** (`src/pages/Leads.tsx`)
- Two view modes: List and Kanban Board
- Kanban columns generated dynamically from status data (`useKanbanStatuses`)
- Drag-and-drop powered by `@dnd-kit` libraries
- Status order: "novo" → "dúvidas" → "orçamento enviado" → "fup 1" → "link de pagamento enviado" → "pago | a se hospedar" → "hospedado" → "hospedagem concluída" → "perdido" → "origem"
- Important: Leads with status "Lead" are mapped to "novo" column

**3. Calculator** (`src/pages/Calculator.tsx`)
- Standalone pricing calculator
- Uses same pricing engine as lead management
- Form: `PriceCalculatorForm.tsx` with configuration via `PricingConfigForm.tsx`

**4. Messages** (`src/pages/Messages.tsx`)
- Template-based messaging system
- Variables: `{{nome}}`, `{{check_in}}`, `{{preco_total}}`, etc.
- Message history tracked in `message_history` table

### Component Organization

```
src/
├── components/
│   ├── calculator/       # Pricing calculator UI
│   ├── dashboard/        # Dashboard metrics and charts
│   ├── leads/           # Lead management (cards, modals, kanban)
│   ├── messages/        # Message template forms
│   └── ui/              # shadcn/ui components (DO NOT MODIFY directly)
├── hooks/               # Custom React hooks for data fetching
├── pages/               # Top-level route components
├── types/               # TypeScript type definitions
├── utils/               # Business logic utilities
└── integrations/
    └── supabase/        # Auto-generated Supabase client and types
```

### Database Schema

Key tables in Supabase:
- `reservations` - Main lead/reservation data
- `pricing_config` - Dynamic pricing configuration (JSON)
- `message_templates` - Email/message templates
- `message_history` - Sent message log
- `app_version` - Version tracking for cache busting

### Important Implementation Details

**Room Type Mapping**:
- Room types have multiple representations (display names vs IDs)
- Mapping handled in `src/types/leads.ts` via `ROOM_TYPE_MAPPING`
- Always search by both ID and name when matching rooms

**Pricing Calculation**:
- Packages DO NOT add to total cost (only reference included items)
- Accommodation can be 0 (manual pricing via `accommodation_price_override`)
- Daily items: breakfast (pending value) + unlimited board rental (deposit/service)
- Fixed items: surf lessons, yoga, massage, transfers, experiences
- Video analysis always multiplied by number of people
- Transfers only calculated if item exists in config AND has price > 0

**Version Management**:
- `useVersionCheck` hook forces reload on version mismatch (critical for iOS)
- Version badge shown in UI via `VersionBadge` component
- Cache busting via hash filenames in build (`vite.config.ts`)

**shadcn/ui Components**:
- Located in `src/components/ui/`
- Auto-generated via shadcn CLI - avoid manual edits
- Use Radix UI primitives under the hood
- Import pattern: `import { Button } from "@/components/ui/button"`

## Path Alias

The `@` alias maps to `src/`:
```typescript
import { supabase } from "@/integrations/supabase/client"
// Resolves to: src/integrations/supabase/client.ts
```

## TypeScript Configuration

- `noImplicitAny: false` - Allows implicit any types
- `strictNullChecks: false` - Nullable types not enforced
- `skipLibCheck: true` - Skip type checking of declaration files
- Keep this relaxed config when making changes

## Database Types

Supabase types are auto-generated in `src/integrations/supabase/types.ts`. To access table types:
```typescript
import { Tables } from "@/integrations/supabase/types"
type Reservation = Tables<"reservations">
```

## Styling

- Tailwind CSS for all styling
- shadcn/ui provides base component styles
- Theme system via `next-themes` (dark mode support)
- CSS variables defined in `src/index.css` for theming

## Common Patterns

**Data Fetching**:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['leads'],
  queryFn: async () => {
    const { data, error } = await supabase.from('reservations').select('*')
    if (error) throw error
    return data
  }
})
```

**Mutations**:
```typescript
const mutation = useMutation({
  mutationFn: async (lead) => {
    const { data, error } = await supabase.from('reservations').insert(lead)
    if (error) throw error
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
    toast.success('Lead criado!')
  }
})
```

## Important Files to Check Before Changes

- **Pricing logic**: Always review `src/utils/priceCalculator.ts` and `src/utils/pricingRules.ts`
- **Type definitions**: Check `src/types/leads.ts` and `src/types/pricing.ts` for data structures
- **Room mapping**: Verify `ROOM_TYPE_MAPPING` in `src/types/leads.ts` when modifying room types
- **Status flow**: Check `useKanbanStatuses.ts` for status column configuration

## Supabase Integration

The Supabase client is configured in `src/integrations/supabase/client.ts` with:
- Auto-refresh tokens enabled
- localStorage for session persistence
- Database types imported from auto-generated types file

**Database migrations** are in `supabase/migrations/` - these document schema changes.
