# Vetify - Veterinary Practice Management Platform

A comprehensive, multi-tenant SaaS platform for veterinary practices with advanced features including appointment management, client communication, and business analytics.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## 📁 Project Structure

```
vetify/
├── src/                    # Source code
│   ├── app/              # Next.js App Router
│   ├── components/       # Reusable UI components
│   ├── lib/             # Utility libraries
│   └── types/           # TypeScript type definitions
├── config/               # Configuration files
│   ├── jest.config.ts   # Jest testing configuration
│   ├── next.config.js   # Next.js configuration
│   ├── tailwind.config.ts # Tailwind CSS configuration
│   └── tsconfig.json    # TypeScript configuration
├── deployment/           # Deployment configurations
│   ├── vercel.json      # Vercel deployment config
│   └── VERCEL_*.md      # Vercel setup documentation
├── docs/                 # Documentation
│   ├── additional/      # Additional project docs
│   └── ...              # Feature documentation
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── scripts/             # Utility scripts
└── tests/               # Test files
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL
- Supabase account

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Configure your database connection
3. Set up Supabase credentials

### Testing
```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

## 🚀 Deployment

### Vercel (Recommended)
- Configuration files are in `/deployment/`
- Follow the setup instructions in `/deployment/VERCEL_SETUP_INSTRUCTIONS.md`

### Manual Deployment
- Build: `pnpm build`
- Start: `pnpm start`

## 📚 Documentation

- **Core Features**: `/docs/features/`
- **Architecture**: `/docs/architecture/`
- **API Reference**: `/docs/api/`
- **Deployment**: `/deployment/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

---

**Note**: Configuration files in the root directory are symlinks to maintain Next.js compatibility. The actual files are located in `/config/`.

