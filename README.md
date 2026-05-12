<div align="center">

# FlowBrand Strategy Service

**AI-powered marketing strategy generation for the FlowBrand platform.**

A focused microservice that takes a marketing brief and generates a complete strategy — funnel stages, tasks, the works — using Claude.

![status](https://img.shields.io/badge/status-in%20development-yellow)
![node](https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white)
![nestjs](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![postgres](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![claude](https://img.shields.io/badge/Anthropic-Claude-D97757)

</div>

---

## What this service does

The FlowBrand product promises AI-generated marketing strategies. The main FlowBrand backend has the data model for it (`Strategy`, `FunnelStage`, `FunnelTask` tables) — but no endpoint actually produces strategies. Users hit the brief form and there's nowhere to send the data.

This service fills that gap. You POST a marketing brief, it calls Claude with a structured prompt, parses the response, persists the full strategy tree (one strategy → multiple funnel stages → multiple tasks per stage) in a single database transaction, and returns the tree as JSON.

Built as a standalone microservice so it doesn't touch the main FlowBrand backend — drop-in addition rather than rewrite.

## Status

> **🚧 In active development — Stage 5 submission for the HNG internship program (deadline: 2026-05-12, 8pm WAT).**

| Component | Status |
|---|---|
| Project scaffold | ✅ Done |
| RFC document | ⏳ In progress |
| Core endpoints (`POST /strategies/generate`, `GET /strategies`, `GET /strategies/:id`) | ⏳ In progress |
| LLM integration (Anthropic Claude) | ⏳ In progress |
| Database migrations | ⏳ In progress |
| Tests (unit + e2e) | ⏳ In progress |
| System design doc | ⏳ In progress |
| AWS deployment | ⏳ In progress |
| Curveball decision log | ⏳ In progress |

This README updates as each piece lands.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 20 LTS | Long-term support, matches main FlowBrand |
| Framework | NestJS 11 | Mirrors the main FlowBrand backend so patterns are portable |
| Language | TypeScript 5 | Type safety end-to-end |
| Database | PostgreSQL 16 | Same as main FlowBrand; transactional writes for the strategy tree |
| ORM | TypeORM 0.3 | Migration-driven schema, matches main FlowBrand |
| LLM | Anthropic Claude (Sonnet 4) | Good cost/quality ratio, native JSON output mode |
| API docs | Swagger / OpenAPI | Auto-generated from controllers |
| Validation | class-validator | DTO-level enforcement |
| Tests | Jest | Unit + e2e |

## API (preview — locks in during RFC)

> 📖 **Live Swagger UI:** *deployment link will appear here once Phase 5 ships*

```
POST   /api/v1/strategies/generate     # brief → strategy tree
GET    /api/v1/strategies              # list strategies for the user
GET    /api/v1/strategies/:id          # one strategy with stages
GET    /api/v1/strategies/:id/funnel   # full tree: strategy + stages + tasks
```

All routes are JWT-guarded (header: `Authorization: Bearer <token>`).
Generation is rate-limited to **5 successful generations per user per day** to keep token costs predictable.

## Quick start (local dev)

### Prerequisites

- Node.js 20+
- Postgres 16 running locally (or via Docker)
- An Anthropic API key

### Steps

```bash
# 1. Clone
git clone https://github.com/ibraheembello/flowbrand-strategy-service.git
cd flowbrand-strategy-service

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Open .env and fill in DB_PASSWORD, ANTHROPIC_API_KEY, JWT_SECRET

# 4. Run migrations
npm run migration:run

# 5. Start the dev server
npm run start:dev

# 6. Open Swagger
# → http://localhost:3009/api/docs
```

## Project structure

```
src/
├── modules/
│   ├── strategies/          # POST /generate, GET, etc. — orchestrates the flow
│   │   ├── dto/             # Request/response DTOs
│   │   ├── entities/        # Strategy, FunnelStage, FunnelTask
│   │   └── ...
│   ├── llm/                 # Anthropic SDK wrapper + prompt builder + parser
│   ├── auth/                # JWT guard (demo shim)
│   └── shared/              # Constants, helpers, custom exceptions
├── database/
│   ├── migrations/          # TypeORM migrations
│   └── data-source.ts       # ORM config
├── app.module.ts
└── main.ts
```

## Documentation

- **RFC:** *Google Doc link will appear here when Phase 1 is done*
- **System Design Document:** *Google Doc link will appear here when Phase 3 is done*
- **API Reference:** Swagger UI on the live deployment (see Quick start)

## Running tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

## Deployment

Currently deployed alongside the main FlowBrand backend on AWS EC2.

> 🌐 **Live URL:** *will appear here once Phase 5 ships*
>
> Swagger: `http://<live-host>:3009/api/docs`
> Health: `http://<live-host>:3009/health`

## Why a separate repo

The Stage 5 task explicitly requires leaving existing functionality untouched. Building this in-place in the main FlowBrand backend would have meant either:

1. Adding migrations the rest of the team didn't agree to, or
2. Branching off and risking merge conflicts with active feature PRs.

A standalone microservice with a clean API contract sidesteps both. The main FlowBrand backend can call this service when it's ready — interface-only coupling.

## Author

**Ibraheem Bello** — [github.com/ibraheembello](https://github.com/ibraheembello)

Built as a submission for the HNG internship Stage 5 backend task. Cooked under deadline pressure with a deliberate curveball (see RFC change log).

## License

MIT
