#!/bin/bash

# Script to switch database connection based on network availability
# Usage: ./scripts/switch-db.sh [test|localhost|production]

MODE=${1:-test}

case $MODE in
  test)
    echo "🔍 Probando conectividad con Supabase..."
    echo ""

    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
      echo "❌ ERROR: DATABASE_URL environment variable not set"
      echo "   Please set it in your .env file or export it:"
      echo "   export DATABASE_URL='postgresql://...'"
      exit 1
    fi

    # Extract connection details from DATABASE_URL
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

    # Test pooler connectivity
    echo "1. Verificando conexión al pooler (IPv4)..."
    nc -zv -G 5 "$DB_HOST" "$DB_PORT" 2>&1 | grep -q "succeeded" && \
      echo "   ✓ Pooler accesible" || \
      echo "   ✗ No se pudo conectar al pooler"

    # Test PostgreSQL auth
    echo "2. Probando autenticación PostgreSQL..."
    PGCONNECT_TIMEOUT=5 psql "$DATABASE_URL" \
      -c "SELECT 1 as test;" 2>&1 | grep -q "1 row" && \
      echo "   ✓ Autenticación exitosa" || \
      echo "   ✗ Error de autenticación"

    echo ""
    echo "3. Probando con Prisma..."
    node -e "import('@prisma/client').then(({PrismaClient}) => {
      const p = new PrismaClient();
      p.\$queryRaw\`SELECT version()\`.then(r => {
        console.log('   ✓ Prisma conectado:', r[0].version.split(',')[0]);
        p.\$disconnect();
      }).catch(e => {
        console.log('   ✗ Error:', e.message);
        p.\$disconnect();
      });
    });"
    ;;

  localhost)
    echo "🏠 Configurando para usar localhost (desarrollo local)..."
    echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vetify" > .env.local
    echo "✓ Configurado para localhost"
    ;;

  production)
    echo "☁️  Configurando para Supabase (producción)..."
    # Restaurar desde .env.example o .env
    if [ -f .env ]; then
      grep "DATABASE_URL" .env > .env.local
      echo "✓ Configurado para Supabase"
    else
      echo "✗ No se encontró .env con la configuración de producción"
    fi
    ;;

  *)
    echo "Uso: ./scripts/switch-db.sh [test|localhost|production]"
    echo ""
    echo "  test        - Prueba la conectividad con Supabase"
    echo "  localhost   - Cambia a base de datos local"
    echo "  production  - Cambia a Supabase"
    ;;
esac
