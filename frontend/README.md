# CrediFlux Frontend

Production-quality React + Vite + TypeScript application for credit risk assessment and model governance.

## Key Features

- **Dark Navy Fintech Palette:** Bespoke `#0B1220` styling with `#00D4AA` teal and `#38BDF8` blue accents.
- **Interactive Model Governance:** Surfaces live model specifications and Phase 0 audit findings.
- **Prospective Intake Blocker:** Explains missing lender underwriting features and prevents data leakage.
- **Retrospective Scoring Engine:** Evaluates single historical loan records and batch CSV portfolios.
- **Accuracy Paradox Visualization:** Interactive Recharts comparing default recall vs. accuracy.
- **Feasibility Audit Matrix:** Comprehensive 35-feature classification.
- **User Profile Menu:** Interactive role switcher and underwriting risk tolerance settings.

## Development Setup

```bash
# Install dependencies
npm install

# Start development server on port 5173
npm run dev

# Run Vitest component tests
node node_modules/vitest/vitest.mjs run

# Production build
node node_modules/typescript/bin/tsc
node node_modules/vite/bin/vite.js build
```

## Environment Variables

Copy `.env.example` to `.env`:
```
VITE_API_URL=http://localhost:8000/api
```
