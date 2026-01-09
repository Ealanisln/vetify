# 📚 Vetify Documentation

Esta es la documentación oficial de Vetify, organizada y optimizada para GitBook.

## 🚀 Getting Started

### Prerequisites
```bash
# Instalar GitBook CLI
npm install -g gitbook-cli

# Instalar dependencias de GitBook
cd gitbook-docs
gitbook install
```

### Development
```bash
# Servir documentación localmente
pnpm docs:dev

# La documentación estará disponible en:
# http://localhost:4000
```

### Build
```bash
# Build para producción
pnpm docs:build

# Generar PDF
pnpm docs:pdf

# Generar EPUB
pnpm docs:epub
```

## 📁 Estructura

```
gitbook-docs/
├── README.md              # Landing page
├── SUMMARY.md             # Table of contents
├── .gitbook.yaml          # GitBook configuration
├── getting-started/       # Guías de inicio
├── architecture/          # Arquitectura del sistema
├── development/           # Guías de desarrollo
├── features/              # Documentación de features
│   ├── core/             # Features principales
│   ├── business/         # Features de negocio
│   └── advanced/         # Features avanzadas
├── integrations/          # Integraciones externas
│   ├── whatsapp/         # WhatsApp API
│   ├── n8n/              # N8N workflows
│   └── stripe/           # Stripe payments
├── deployment/            # Deployment y operaciones
├── troubleshooting/       # Solución de problemas
├── releases/              # Notas de versiones
└── roadmap/              # Roadmap y planificación
```

## 🔧 Scripts Disponibles

```bash
# Documentación
pnpm docs:dev              # Servir en desarrollo
pnpm docs:build            # Build para producción
pnpm docs:pdf              # Generar PDF
pnpm docs:clean            # Limpiar build cache

# Organización
pnpm organize:docs         # Reorganizar archivos MD
pnpm clean:docs            # Limpiar archivos dispersos
```

## 📝 Contributing

### Agregar Nueva Documentación

1. **Crear archivo MD** en la carpeta apropiada
2. **Actualizar SUMMARY.md** con el nuevo link
3. **Seguir convenciones** de naming y estructura
4. **Testear localmente** con `pnpm docs:dev`

### Convenciones

- **Nombres de archivo**: kebab-case (ej: `pet-management.md`)
- **Títulos**: Usar emojis descriptivos
- **Código**: Incluir ejemplos TypeScript cuando sea relevante
- **Links**: Usar paths relativos
- **Imágenes**: Guardar en `assets/`

### Templates

Usar templates consistentes para diferentes tipos de documentación:

- **Feature docs**: Incluir overview, implementation, examples, troubleshooting
- **Integration docs**: Prerequisites, setup, configuration, examples
- **API docs**: Endpoints, parameters, responses, examples

## 🎯 Best Practices

- **Claridad**: Documentación clara y concisa
- **Ejemplos**: Incluir ejemplos de código prácticos
- **Actualización**: Mantener documentación actualizada con el código
- **Testing**: Verificar que los ejemplos funcionen
- **SEO**: Usar metadatos apropiados

## 📞 Support

¿Necesitas ayuda con la documentación?

- **Issues**: Crear issue en GitHub
- **Slack**: Canal #documentation
- **Email**: contacto@vetify.pro

---

**¡Happy documenting!** 📖✨
