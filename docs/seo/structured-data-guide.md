# Structured Data Guide

Complete guide to implementing Schema.org structured data (JSON-LD) in Vetify.

## Table of Contents

1. [Overview](#overview)
2. [Available Schemas](#available-schemas)
3. [Implementation Patterns](#implementation-patterns)
4. [Schema Examples](#schema-examples)
5. [Testing](#testing)
6. [Best Practices](#best-practices)

## Overview

Structured data helps search engines understand your content and display rich results. Vetify implements Schema.org schemas using JSON-LD format.

### Benefits

- **Rich Snippets**: Enhanced search results with ratings, prices, etc.
- **Knowledge Panels**: Business information in Google Knowledge Graph
- **Voice Search**: Better compatibility with voice assistants
- **Local SEO**: Improved local search rankings for clinics
- **Click-Through Rate**: Higher CTR with rich results

## Available Schemas

Vetify provides pre-built schemas for common use cases:

### 1. Organization Schema
Company/brand information for the main Vetify brand.

### 2. SoftwareApplication Schema
Details about the Vetify software product.

### 3. LocalBusiness/VeterinaryCare Schema
Individual veterinary clinic business information.

### 4. Service Schema
Specific services offered by clinics.

### 5. Product Schema
SaaS pricing plans with offers.

### 6. BreadcrumbList Schema
Navigation hierarchy for any page.

### 7. FAQPage Schema
Frequently asked questions with answers.

### 8. WebPage Schema
Generic page metadata (rarely needed directly).

### 9. Article Schema
Blog posts and articles (when implemented).

## Implementation Patterns

### Basic Pattern

```typescript
import { StructuredData } from '@/components/seo/StructuredData';
import { generateSchemaFunction } from '@/lib/seo/structured-data';

export default function YourPage() {
  // Generate schema
  const schema = generateSchemaFunction({
    // schema properties
  });

  return (
    <>
      {/* Add to page */}
      <StructuredData data={schema} />
      {/* Rest of page content */}
    </>
  );
}
```

### Multiple Schemas

You can include multiple schemas on a single page:

```typescript
<StructuredData data={[schema1, schema2, schema3]} />
```

## Schema Examples

### 1. BreadcrumbList (Most Common)

Add to every page for navigation hierarchy:

```typescript
import { createBreadcrumbsFromPath } from '@/lib/seo/breadcrumbs';

export default function PricingPage() {
  const breadcrumbSchema = createBreadcrumbsFromPath(
    '/precios',
    'Precios y Planes',
    'es'
  );

  return (
    <>
      <StructuredData data={breadcrumbSchema} />
      {/* Page content */}
    </>
  );
}
```

**Output**:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://vetify.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Precios y Planes"
    }
  ]
}
```

### 2. LocalBusiness (Clinic Pages)

For individual clinic pages:

```typescript
import { generateLocalBusinessSchema } from '@/lib/seo/structured-data';

const clinicSchema = generateLocalBusinessSchema(
  {
    name: 'Clínica Veterinaria San Miguel',
    description: 'Atención veterinaria profesional en CDMX',
    url: 'https://vetify.com/san-miguel',
    telephone: '+52 55 1234 5678',
    email: 'contacto@sanmiguel.vet',
    address: {
      streetAddress: 'Av. Insurgentes Sur 123',
      addressLocality: 'Ciudad de México',
      addressRegion: 'CDMX',
      postalCode: '03100',
      addressCountry: 'MX',
    },
    geo: {
      latitude: 19.4326,
      longitude: -99.1332,
    },
    openingHours: [
      {
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '14:00',
      },
    ],
    images: ['https://example.com/clinic-image.jpg'],
    priceRange: '$$',
  },
  'es'
);
```

### 3. Service (Veterinary Services)

For pages describing specific services:

```typescript
import { generateServiceSchema } from '@/lib/seo/structured-data';

const consultationSchema = generateServiceSchema(
  {
    name: 'Consulta Veterinaria General',
    description: 'Examen físico completo de tu mascota con diagnóstico profesional y recomendaciones de tratamiento.',
    serviceType: 'Veterinary Consultation',
    provider: {
      name: 'Clínica Veterinaria San Miguel',
      url: 'https://vetify.com/san-miguel',
    },
    areaServed: {
      type: 'City',
      name: 'Ciudad de México',
    },
    price: {
      price: '500',
      priceCurrency: 'MXN',
    },
    image: 'https://example.com/consultation.jpg',
  },
  'es'
);
```

### 4. Product (Pricing Plans)

For pricing pages:

```typescript
import { generatePricingProductSchema } from '@/lib/seo/structured-data';
import { COMPLETE_PLANS } from '@/lib/pricing-config';

const pricingSchema = generatePricingProductSchema([
  {
    name: COMPLETE_PLANS.BASICO.name,
    description: COMPLETE_PLANS.BASICO.description,
    monthlyPrice: COMPLETE_PLANS.BASICO.monthlyPrice,
    yearlyPrice: COMPLETE_PLANS.BASICO.yearlyPrice,
  },
  {
    name: COMPLETE_PLANS.PROFESIONAL.name,
    description: COMPLETE_PLANS.PROFESIONAL.description,
    monthlyPrice: COMPLETE_PLANS.PROFESIONAL.monthlyPrice,
    yearlyPrice: COMPLETE_PLANS.PROFESIONAL.yearlyPrice,
  },
], 'es');
```

### 5. FAQPage

For pages with FAQs:

```typescript
import { generateFAQPageSchema, COMMON_FAQS_ES } from '@/lib/seo/faq-schema';

// Use pre-defined FAQs
const faqSchema = generateFAQPageSchema(COMMON_FAQS_ES.pricing);

// Or create custom FAQs
const customFAQSchema = generateFAQPageSchema([
  {
    question: '¿Cuánto tiempo toma la implementación?',
    answer: 'La implementación toma aproximadamente 1-2 semanas desde el registro hasta el lanzamiento completo.',
  },
  {
    question: '¿Ofrecen capacitación?',
    answer: 'Sí, incluimos capacitación completa para todo tu equipo como parte de la implementación.',
  },
]);
```

### 6. Organization (Root/About Pages)

For the main Vetify brand:

```typescript
import { generateOrganizationSchema } from '@/lib/seo/structured-data';

const orgSchema = generateOrganizationSchema(
  'es',
  {
    includeAddress: true,
    socialLinks: [
      'https://facebook.com/vetify',
      'https://twitter.com/vetify',
      'https://linkedin.com/company/vetify',
    ],
  }
);
```

## Common Patterns

### Pattern 1: Page with Navigation + FAQs

```typescript
export default function FeaturesPage() {
  const breadcrumbSchema = createBreadcrumbsFromPath('/funcionalidades', 'Funcionalidades', 'es');
  const faqSchema = generateFAQPageSchema(COMMON_FAQS_ES.features);

  return (
    <>
      <StructuredData data={[breadcrumbSchema, faqSchema]} />
      {/* Page content */}
    </>
  );
}
```

### Pattern 2: Clinic Page with Business Info

```typescript
export default async function ClinicPage({ params }) {
  const clinic = await getClinicData(params.slug);

  const localBusinessSchema = generateLocalBusinessSchema({
    name: clinic.name,
    // ... other clinic data
  }, 'es');

  const breadcrumbSchema = createBreadcrumbsFromPath(
    `/${clinic.slug}`,
    clinic.name,
    'es'
  );

  return (
    <>
      <StructuredData data={[localBusinessSchema, breadcrumbSchema]} />
      {/* Page content */}
    </>
  );
}
```

### Pattern 3: Service Listing Page

```typescript
export default function ServicesPage() {
  const serviceSchemas = generateCommonVeterinaryServices(
    'Vetify',
    'https://vetify.com',
    'México',
    'es'
  );

  const breadcrumbSchema = createBreadcrumbsFromPath('/servicios', 'Servicios', 'es');

  return (
    <>
      <StructuredData data={[breadcrumbSchema, ...serviceSchemas]} />
      {/* Page content */}
    </>
  );
}
```

## Testing

### 1. Google Rich Results Test

Test your structured data:
```
https://search.google.com/test/rich-results
```

Enter your page URL or paste the JSON-LD code directly.

### 2. Schema Markup Validator

Validate JSON-LD syntax:
```
https://validator.schema.org/
```

### 3. View in Browser

Open page source (Ctrl+U / Cmd+U) and search for:
```html
<script type="application/ld+json">
```

## Best Practices

### ✅ DO

1. **Include Breadcrumbs on Every Page**
   ```typescript
   const breadcrumbSchema = createBreadcrumbsFromPath(path, title, 'es');
   ```

2. **Use Specific Types**
   - Use `VeterinaryCare` instead of generic `LocalBusiness`
   - Use `SoftwareApplication` for the product

3. **Include All Available Data**
   - Add business hours when available
   - Include geo coordinates for better local SEO
   - Add images to schemas when possible

4. **Test Before Deploying**
   - Use Google Rich Results Test
   - Verify no syntax errors
   - Check all required properties are present

5. **Keep Content Consistent**
   - Schema data should match visible page content
   - Don't include information not shown to users

### ❌ DON'T

1. **Don't Include Hidden Content**
   - Only include data visible on the page
   - Don't add "SEO spam" in schemas

2. **Don't Use Incorrect Types**
   - Don't use `Article` for a pricing page
   - Don't use `Product` for a service

3. **Don't Duplicate Schemas**
   - One schema per type per page
   - Don't include same LocalBusiness multiple times

4. **Don't Use Fake Data**
   - All ratings must be real
   - All reviews must be genuine
   - All prices must be accurate

5. **Don't Skip Required Properties**
   - Check Schema.org for required properties
   - Use validation tools to catch missing fields

## Common Errors

### Error: Missing Required Property

**Problem**:
```
Error: Missing required property "address" for LocalBusiness
```

**Solution**:
Ensure all required properties are provided:
```typescript
address: {
  streetAddress: clinic.address,
  addressLocality: clinic.city,
  addressRegion: clinic.state,
  postalCode: clinic.postalCode,
  addressCountry: 'MX',
}
```

### Error: Invalid Date Format

**Problem**:
```
Error: Invalid format for "datePublished"
```

**Solution**:
Use ISO 8601 format:
```typescript
datePublished: new Date().toISOString() // "2025-01-15T10:30:00.000Z"
```

### Error: Invalid URL

**Problem**:
```
Error: "@id" must be a valid URL
```

**Solution**:
Always use absolute URLs:
```typescript
url: `${baseUrl}/${path}` // https://vetify.com/path
```

## Advanced Topics

### Custom Schemas

To create a custom schema not provided by our helpers:

```typescript
const customSchema = {
  '@context': 'https://schema.org',
  '@type': 'YourSchemaType',
  name: 'Your Data',
  // ... other properties
};

return <StructuredData data={customSchema} />;
```

### Conditional Schemas

Include schemas based on conditions:

```typescript
const schemas = [breadcrumbSchema];

if (hasReviews) {
  schemas.push(reviewSchema);
}

if (hasEvents) {
  schemas.push(eventSchema);
}

return <StructuredData data={schemas} />;
```

### Dynamic Schema Generation

Generate schemas from database content:

```typescript
const products = await prisma.product.findMany();

const productSchemas = products.map(product => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: 'MXN',
  },
}));

return <StructuredData data={productSchemas} />;
```

## Checklist

When adding structured data to a page:

- [ ] Breadcrumb schema included
- [ ] All required properties provided
- [ ] URLs are absolute (not relative)
- [ ] Dates in ISO 8601 format
- [ ] Tested with Google Rich Results Test
- [ ] Tested with Schema Markup Validator
- [ ] No syntax errors
- [ ] Schema type matches content
- [ ] Data matches visible content
- [ ] TypeScript types are correct

## Resources

- [Schema.org Full Specification](https://schema.org/)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [JSON-LD Specification](https://json-ld.org/)

## Next Steps

- [Metadata Guide](./metadata-guide.md) - Add page metadata
- [OG Images Guide](./og-images-guide.md) - Customize OG images
