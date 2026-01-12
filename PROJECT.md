# Tessie Stats - Tesla & Powerwall Dashboard

## 🎯 Project Overview

**Tessie Stats** is a bespoke dashboard application for monitoring Tesla vehicles and Powerwall systems. It provides real-time data visualization, historical analytics, and comprehensive energy management insights.

### Tech Stack
- **Backend:** Node.js + NestJS
- **Frontend:** React + TypeScript
- **Database:** PostgreSQL (via Vercel Postgres)
- **Deployment:** Vercel (Serverless)
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query (React Query)
- **Charts:** Recharts

---

## 🚨 CRITICAL: Rules for AI Coding Agents

### Before Starting ANY Task

1. **READ THE DOCUMENTATION FIRST**
   - Check `PROJECT.md` (this file) for project context
   - Check `ARCHITECTURE.md` for technical specifications
   - Check `docs/TESLA_API.md` for API reference
   - Check existing code patterns in similar files

2. **UNDERSTAND THE CONTEXT**
   - Review related existing code before making changes
   - Follow established patterns and conventions
   - Ask clarifying questions if requirements are ambiguous

3. **COMPLETE BEFORE MARKING DONE**
   - ✅ All unit tests pass (`npm run test`)
   - ✅ Linting passes (`npm run lint`)
   - ✅ Type checking passes (`npm run typecheck`)
   - ✅ Code follows project conventions
   - ✅ New code has appropriate test coverage

### Code Quality Gates (MANDATORY)

```bash
# These MUST pass before any task is considered complete:
npm run lint          # ESLint - zero errors
npm run typecheck     # TypeScript - zero errors  
npm run test          # Jest - all tests pass
npm run test:cov      # Coverage - maintain >80% on new code
```

---

## 📁 Project Structure

```
tessie-stats/
├── api/                      # Vercel serverless functions (NestJS)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # Authentication & API key management
│   │   │   ├── tesla/        # Tesla API integration
│   │   │   ├── vehicle/      # Vehicle data management
│   │   │   ├── powerwall/    # Powerwall data management
│   │   │   ├── charging/     # Charging session tracking
│   │   │   ├── solar/        # Solar production analytics
│   │   │   └── jobs/         # Background data sync jobs
│   │   ├── common/           # Shared utilities, guards, interceptors
│   │   ├── database/         # Database entities, migrations
│   │   └── main.ts
│   ├── test/                 # API tests
│   └── package.json
│
├── web/                      # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client services
│   │   ├── stores/           # State management
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utility functions
│   ├── test/                 # Frontend tests
│   └── package.json
│
├── docs/                     # Documentation
│   ├── TESLA_API.md          # Tesla API reference
│   ├── DATABASE_SCHEMA.md    # Database design
│   └── DEPLOYMENT.md         # Deployment guide
│
├── .cursorrules              # Cursor AI agent rules
├── PROJECT.md                # This file
├── ARCHITECTURE.md           # Technical architecture
├── PREREQUISITES.md          # Setup requirements
├── vercel.json               # Vercel configuration
└── package.json              # Root package.json (workspaces)
```

---

## ✨ Features

### Dashboard (Real-time)
| Feature | Data Source | Description |
|---------|-------------|-------------|
| Odometer | Vehicle API | Current mileage |
| Location | Vehicle API | GPS coordinates + address |
| Speed | Vehicle API | Current speed (if driving) |
| Destination | Vehicle API | Navigation destination |
| ETA | Vehicle API | Time to destination |
| Battery % | Vehicle API | Current charge level |
| Solar Production | Powerwall API | Current kW generation |
| Energy Distribution | Powerwall API | Solar → Car/Powerwall/Home/Grid |
| Grid I/O | Powerwall API | Import/Export status |

### Historical Views
- **Charging Sessions:** Complete history with cost, energy, duration, charge source (home/supercharger/destination)
- **Driving History:** Trips, efficiency, driver identification
- **Energy Analytics:** Daily/weekly/monthly solar production and consumption
- **Battery Degradation:** State of health over time

### Multi-Driver Support
- Driver identification via profile settings
- Per-driver statistics and trip attribution
- Driving style analytics

### Solar Analytics
- % of charging from solar over time periods (day/week/month/year)
- Grid dependency metrics
- Self-consumption ratios

---

## 🔐 Security

### API Key Storage
- Tesla API keys encrypted at rest using AES-256-GCM
- Encryption key stored in environment variables
- Keys never logged or exposed in responses

### Authentication Flow
1. User provides Tesla API refresh token
2. Token encrypted and stored in database
3. Backend uses token to fetch access tokens
4. Access tokens cached with appropriate TTL

---

## 🔄 Data Synchronization

### Sync Strategy (Free Tier Optimized)
- **Polling interval:** Configurable (default: 5 minutes)
- **Rate limiting:** Respects Tesla API limits
- **Smart polling:** Increased frequency when vehicle is active
- **Background jobs:** Vercel Cron for scheduled syncs

### Data Retention
- Real-time data: 24 hours granular
- Historical data: Aggregated daily for long-term storage
- Charging sessions: Full detail retained indefinitely

---

## 🧪 Testing Requirements

### Unit Tests
- All services must have unit tests
- Mock external API calls
- Test edge cases and error handling
- Minimum 80% coverage on new code

### Integration Tests
- API endpoint tests
- Database interaction tests
- Authentication flow tests

### Frontend Tests
- Component rendering tests
- Hook behavior tests
- User interaction tests

---

## 📝 Coding Conventions

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if necessary)
- Explicit return types on functions
- Use interfaces over types where possible

### NestJS Backend
- Follow NestJS module structure
- Use dependency injection
- DTOs for all request/response objects
- Validation pipes on all endpoints

### React Frontend
- Functional components only
- Custom hooks for shared logic
- Props interfaces defined
- Memoization where beneficial

### Naming Conventions
- **Files:** kebab-case (`charging-session.service.ts`)
- **Classes:** PascalCase (`ChargingSessionService`)
- **Functions:** camelCase (`getChargingSessions`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Interfaces:** PascalCase with 'I' prefix optional (`ChargingSession` or `IChargingSession`)

### Git Commits
- Conventional commits format
- `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`

---

## 🚀 Development Workflow

### Starting a New Feature
1. Read relevant documentation
2. Create feature branch
3. Implement with tests
4. Run quality gates
5. Submit for review

### Quality Checklist
- [ ] Code follows project conventions
- [ ] Unit tests written and passing
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Documentation updated if needed
- [ ] No hardcoded values (use config/env)
- [ ] Error handling implemented
- [ ] Logging added for debugging

---

## 📚 External Resources

- [Tesla Fleet API Documentation](https://developer.tesla.com/docs/fleet-api)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)

---

## ⚠️ Important Notes

1. **Tesla API Changes:** Tesla frequently updates their API. Always verify endpoints against current documentation.

2. **Rate Limits:** Be mindful of API rate limits, especially on free tier.

3. **Vehicle Wake:** Some data requires waking the vehicle, which impacts battery. Use judiciously.

4. **Privacy:** Location and driving data is sensitive. Handle with care.

5. **Vercel Limits:** Serverless function timeout limits apply. Design for short-lived operations.
