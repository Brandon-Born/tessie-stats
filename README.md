# 🚗⚡ Tessie Stats

A personal Tesla & Powerwall dashboard for monitoring your electric vehicle and home energy system.

![Tesla Dashboard](docs/assets/dashboard-preview.png)

## Features

### Dashboard
- **Real-time vehicle status** - Battery, location, speed, charging state
- **Energy flow visualization** - Solar, battery, grid, home consumption
- **At-a-glance metrics** - Odometer, range, solar production

### Analytics
- **Charging history** - All sessions with cost, energy, duration
- **Solar tracking** - % charged from solar over time
- **Multi-driver stats** - Per-driver trip and efficiency data
- **Energy reports** - Daily, weekly, monthly breakdowns

### Privacy First
- **Self-hosted** - Your data stays with you
- **Encrypted storage** - API tokens encrypted at rest
- **No third parties** - Direct Tesla API integration

## Tech Stack

- **Backend:** NestJS (Node.js)
- **Frontend:** React + TypeScript
- **Database:** PostgreSQL (Vercel Postgres)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Quick Start

### Prerequisites

See [PREREQUISITES.md](PREREQUISITES.md) for detailed setup instructions.

1. Tesla Developer account with approved app
2. Vercel account with Postgres database
3. Node.js 20+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tessie-stats.git
cd tessie-stats

# Install dependencies
npm install

# Copy environment template
cp env.example .env.local

# Edit .env.local with your values

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Documentation

| Document | Description |
|----------|-------------|
| [PROJECT.md](PROJECT.md) | Project overview and coding guidelines |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture and specifications |
| [PREREQUISITES.md](PREREQUISITES.md) | Setup requirements and credentials |
| [docs/TESLA_API.md](docs/TESLA_API.md) | Tesla API reference |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Database design |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment guide |

## Development

### Commands

```bash
# Development
npm run dev         # Start both API and web
npm run dev:api     # Start API only
npm run dev:web     # Start web only

# Quality
npm run lint        # Run ESLint
npm run typecheck   # Run TypeScript check
npm run test        # Run tests
npm run validate    # Run all checks

# Database
npm run db:migrate  # Run migrations
npm run db:seed     # Seed data
```

### Project Structure

```
tessie-stats/
├── api/            # NestJS backend
├── web/            # React frontend
├── docs/           # Documentation
├── .cursorrules    # AI agent guidelines
└── PROJECT.md      # Main project doc
```

## For AI Coding Agents

⚠️ **Before coding, read:**
1. [.cursorrules](.cursorrules) - Agent rules
2. [PROJECT.md](PROJECT.md) - Project guidelines
3. [ARCHITECTURE.md](ARCHITECTURE.md) - Technical specs

**Quality gates (must pass):**
```bash
npm run lint        # Zero errors
npm run typecheck   # Zero errors
npm run test        # All pass
```

## License

MIT - Personal use only. Not affiliated with Tesla, Inc.

---

Built with ❤️ for Tesla enthusiasts
