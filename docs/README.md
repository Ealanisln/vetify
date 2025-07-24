# 📚 Vetify Documentation

This directory contains the complete documentation for the Vetify platform, organized for GitBook.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17 or higher
- pnpm 8.x
- GitBook CLI (optional)

### Setup
```bash
# Install GitBook CLI
npm install -g gitbook-cli

# Initialize GitBook
gitbook init

# Serve documentation locally
gitbook serve
```

### Available Scripts
```bash
# Migrate existing documentation
pnpm migrate-docs

# Serve documentation locally
pnpm docs:dev

# Build documentation
pnpm docs:build

# Deploy documentation
pnpm docs:deploy
```

## 📁 Directory Structure

```
docs/
├── getting-started/          # Getting started guides
├── architecture/            # System architecture
├── development/             # Development guides
├── features/               # Feature documentation
│   ├── core/              # Core features
│   ├── business/          # Business features
│   └── advanced/          # Advanced features
├── integrations/          # Third-party integrations
│   ├── whatsapp/         # WhatsApp API
│   ├── n8n/              # N8N workflows
│   └── stripe/           # Stripe payments
├── deployment/            # Deployment guides
├── troubleshooting/       # Troubleshooting guides
├── releases/             # Release notes
└── roadmap/              # Future plans
```

## 🎯 Documentation Standards

### File Naming
- Use kebab-case for file names
- Include descriptive names
- Add appropriate emojis for visual organization

### Content Structure
- Start with a brief description
- Include code examples
- Add troubleshooting sections
- Link to related documentation

### Metadata
Each documentation file should include frontmatter:
```yaml
---
title: "Document Title"
description: "Brief description"
category: "Category"
tags: ["tag1", "tag2"]
order: 1
---
```

## 🔧 Configuration

### GitBook Configuration
The main GitBook configuration is in `.gitbook.yaml`:
- Plugins and themes
- Custom styling
- PDF and EPUB export settings

### Custom Styles
Custom CSS is available in `styles/`:
- `website.css` - Web styling
- `pdf.css` - PDF export styling
- `epub.css` - EPUB export styling
- `mobi.css` - MOBI export styling

## 📖 Content Guidelines

### Writing Style
- Use clear, concise language
- Include practical examples
- Provide step-by-step instructions
- Add screenshots when helpful

### Code Examples
- Use TypeScript for code examples
- Include proper error handling
- Add comments for complex logic
- Test all code examples

### Links and References
- Use relative links within documentation
- Link to external resources when appropriate
- Maintain a consistent linking structure
- Update broken links regularly

## 🚀 Deployment

### Local Development
```bash
# Start local server
gitbook serve

# Access at http://localhost:4000
```

### Production Build
```bash
# Build static files
gitbook build

# Deploy to your hosting platform
```

### Hosting Options
- **GitHub Pages**: Free hosting for public repositories
- **Netlify**: Easy deployment with Git integration
- **Vercel**: Fast deployment with automatic builds
- **Custom Server**: Deploy to your own server

## 🔄 Maintenance

### Regular Tasks
- Update outdated information
- Fix broken links
- Add new features documentation
- Review and improve existing content

### Version Control
- Commit documentation changes regularly
- Use descriptive commit messages
- Tag releases for major updates
- Maintain a changelog

## 🤝 Contributing

### Adding New Documentation
1. Create new file in appropriate directory
2. Follow naming conventions
3. Add frontmatter metadata
4. Include proper links and references
5. Test locally before committing

### Updating Existing Documentation
1. Verify information is current
2. Update code examples if needed
3. Check all links work
4. Test changes locally
5. Update related documentation

### Review Process
1. Self-review for accuracy
2. Test all code examples
3. Check formatting and links
4. Get peer review for major changes
5. Update table of contents if needed

## 📞 Support

### Getting Help
- Check [Troubleshooting Guide](troubleshooting/common-issues.md)
- Review [Common Issues](troubleshooting/common-issues.md)
- Search existing documentation
- Contact the development team

### Reporting Issues
- Create detailed issue reports
- Include steps to reproduce
- Provide error messages
- Suggest improvements

---

**Need help?** Check our [Troubleshooting Guide](troubleshooting/common-issues.md) or [contact support](../../README.md#-support). 