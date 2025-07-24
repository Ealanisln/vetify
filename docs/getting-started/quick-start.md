# 🚀 Quick Start Guide

> **Get up and running with Vetify in minutes.**

## Prerequisites

- Node.js 18.17 or higher
- pnpm 8.x
- PostgreSQL database
- Git

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/vetify.git
cd vetify

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Configure your environment variables

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Next Steps

1. [Environment Setup](environment-setup.md) - Configure your development environment
2. [Architecture Overview](../architecture/system-overview.md) - Understand the system design
3. [Feature Documentation](../features/core/pet-management.md) - Learn about core features
