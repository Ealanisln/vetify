#!/bin/bash

# Script to configure Tailscale DNS for Supabase connectivity
# This adds global nameservers to Tailscale configuration

echo "Configurando Tailscale DNS para mejor compatibilidad con Supabase..."

# Add global nameservers to Tailscale
/Applications/Tailscale.app/Contents/MacOS/Tailscale set --accept-dns=true
/Applications/Tailscale.app/Contents/MacOS/Tailscale set --accept-routes=true

echo ""
echo "✓ Configuración completada!"
echo ""
echo "Ahora necesitas configurar los nameservers globales en la aplicación de Tailscale:"
echo "1. Abre Tailscale desde la barra de menú"
echo "2. Ve a Preferences > DNS"
echo "3. Habilita 'Override local DNS'"
echo "4. Agrega estos nameservers:"
echo "   - 8.8.8.8"
echo "   - 1.1.1.1"
echo ""
echo "Alternativamente, puedes hacerlo desde el admin panel web:"
echo "https://login.tailscale.com/admin/dns"
