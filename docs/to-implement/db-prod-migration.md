# Claude Code Prompt: Migrate Development Database to Supabase Production

I need help migrating my Next.js 15 application's development PostgreSQL database to a Supabase production environment. Please follow these steps:

## Project Context
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL (currently local development)
- **Target**: Supabase hosted PostgreSQL
- **Language**: TypeScript
- **ORM/Query Builder**: [Specify: Prisma/Drizzle/Raw SQL/etc.]

## Migration Requirements

### 1. Database Schema Export
First, analyze my current development database:
- Examine all tables, columns, and data types in my local database
- Document all foreign key relationships and constraints
- Identify all indexes, triggers, and custom functions
- Note any database extensions being used (e.g., uuid-ossp, postgis)
- Check for any custom types or enums

### 2. Supabase Project Setup
Using the Supabase MCP tools:
- List my existing Supabase projects
- If needed, guide me through creating a new production project in the appropriate region
- Retrieve the project connection details and API keys
- Enable any required PostgreSQL extensions that my dev database uses

### 3. Schema Migration
Create migration files that:
- Define all tables with proper types, constraints, and relationships
- Include all indexes for performance optimization
- Set up Row Level Security (RLS) policies for each table
- Configure appropriate roles and permissions
- Handle any custom PostgreSQL functions or triggers

Apply these migrations using the Supabase MCP:
- Use `apply_migration` to execute DDL operations
- Verify each migration was successful
- Run security and performance advisors after schema creation

### 4. Data Migration Strategy
For data migration, create a strategy that:
- Exports data from development database (consider data size and relationships)
- Handles foreign key dependencies in the correct order
- Manages large datasets efficiently (batch inserts if necessary)
- Preserves data integrity and relationships
- Excludes any sensitive development data that shouldn't go to production

### 5. Next.js Configuration
Update my Next.js 15 application configuration:

**Environment Variables** (`.env.production`):
```typescript
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"
NEXT_PUBLIC_SUPABASE_URL="your-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Database Client Configuration**:
- Update connection pooling settings for production
- Configure SSL/TLS requirements
- Set appropriate timeout values
- Handle connection pooling for serverless environments

**Type Safety**:
- Generate TypeScript types from the new Supabase schema
- Update any existing type definitions
- Ensure type safety across the application

### 6. Server Actions & API Routes
Review and update:
- All Server Actions that interact with the database
- API Routes using database connections
- Database client initialization in server components
- Connection pooling for edge runtime compatibility

### 7. Verification & Testing
After migration:
- Test all CRUD operations
- Verify foreign key relationships work correctly
- Check that indexes are being used (query performance)
- Run the Supabase security advisor to catch any RLS issues
- Test authentication flows if using Supabase Auth
- Verify all environment-specific configurations

### 8. Rollback Strategy
Create a rollback plan:
- Document how to revert migrations if needed
- Keep backups of the development database
- Prepare rollback scripts for each major change

## Additional Considerations

**Security**:
- Ensure no development secrets are exposed in production
- Review and implement proper RLS policies
- Configure appropriate CORS settings
- Set up database connection security

**Performance**:
- Optimize queries for production load
- Configure appropriate connection pool sizes
- Add necessary indexes for query performance
- Consider read replicas if needed

**Monitoring**:
- Set up logging for database operations
- Configure alerts for connection issues
- Monitor query performance

## My Current Setup
[Provide Claude with context about your current setup:]
- Database schema file location: [path]
- ORM configuration file: [path]
- Current database connection approach: [description]
- Any custom migrations already in place: [yes/no]
- Existing database seeding/fixtures: [location]

## Expected Output
Please provide:
1. Step-by-step migration commands/code
2. All necessary migration SQL files
3. Updated Next.js configuration files
4. TypeScript type definitions for the schema
5. Verification scripts to test the migration
6. A checklist to follow during the migration process

Let's begin by analyzing my current database schema and creating a comprehensive migration plan.
