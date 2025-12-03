# Location Reports API

API endpoint for fetching location-based analytics and reports.

## Endpoint

```
GET /api/reports/location
```

## Authentication

Requires authenticated user with valid Kinde session.

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Report type: `all`, `revenue`, `inventory`, `performance`, `comparison`. Default: `all` |
| `locationId` | string | No | Specific location UUID to filter reports |
| `startDate` | string | No | Start date for date range filter (YYYY-MM-DD) |
| `endDate` | string | No | End date for date range filter (YYYY-MM-DD) |
| `compare` | boolean | No | Enable comparison mode. Set to `true` |
| `locationIds` | string | No | Comma-separated location UUIDs for comparison |

## Response Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Cache-Control` | `private, max-age=300` | Cache for 5 minutes |
| `X-Cache` | `HIT` or `MISS` | Indicates if response was cached |

## Report Types

### All (`type=all`)

Returns complete report data including revenue, inventory, and performance.

```json
{
  "revenue": { ... },
  "inventory": { ... },
  "performance": { ... }
}
```

### Revenue (`type=revenue`)

```json
{
  "revenue": {
    "todaySales": { "total": 1500.00, "count": 5 },
    "weekSales": { "total": 8000.00, "count": 25 },
    "monthSales": { "total": 35000.00, "count": 120 },
    "yearSales": { "total": 420000.00, "count": 1500 },
    "monthlyGrowth": 15.5,
    "averageTicket": 291.67,
    "dailySales": [
      { "date": "2024-01-15", "total": 1500, "count": 5 }
    ],
    "monthlySales": [
      { "month": "2024-01", "total": 35000, "count": 120 }
    ]
  }
}
```

### Inventory (`type=inventory`)

```json
{
  "inventory": {
    "totalItems": 150,
    "inventoryValue": 85000.00,
    "lowStockCount": 8,
    "topProducts": [
      {
        "id": "uuid",
        "name": "Vacuna Triple",
        "revenue": 5000,
        "quantitySold": 25,
        "profit": 1500
      }
    ],
    "categories": [
      { "category": "Medicamentos", "count": 50, "value": 35000 }
    ]
  }
}
```

### Performance (`type=performance`)

```json
{
  "performance": {
    "appointments": {
      "total": 120,
      "completed": 100,
      "cancelled": 15,
      "noShow": 5,
      "completionRate": 83.33
    },
    "customers": {
      "total": 250,
      "new": 30,
      "active": 180,
      "retentionRate": 72.0
    },
    "staff": {
      "total": 8,
      "active": 6,
      "appointmentsPerStaff": 15
    }
  }
}
```

### Comparison (`type=comparison`)

Compare multiple locations by key metrics.

```json
{
  "comparison": [
    {
      "locationId": "uuid",
      "locationName": "Sucursal Norte",
      "revenue": 50000,
      "appointments": 150,
      "customers": 120,
      "inventoryValue": 30000,
      "averageTicket": 333.33,
      "rank": 1
    }
  ]
}
```

## Error Responses

### 400 Bad Request

Invalid request parameters.

```json
{
  "error": "Invalid report type. Must be one of: all, revenue, inventory, performance, comparison"
}
```

### 403 Forbidden

User lacks access to the requested location.

```json
{
  "error": "No tienes acceso a esta ubicación"
}
```

### 500 Internal Server Error

```json
{
  "error": "Error interno del servidor"
}
```

## Access Control

- Staff can only access reports for locations they are assigned to
- Multi-location staff see aggregated data or can filter by location
- Single-location staff automatically see their assigned location
- Comparison mode filters to only accessible locations

## Caching

Reports are cached in Redis for 5 minutes:
- Cache key format: `vetify:report:{tenantId}:{locationId}:{type}:{startDate}:{endDate}`
- Cache is invalidated when data changes (sales, appointments, inventory)

## Examples

### Get all reports for tenant

```bash
curl -X GET "/api/reports/location" \
  -H "Authorization: Bearer <token>"
```

### Get revenue for specific location

```bash
curl -X GET "/api/reports/location?type=revenue&locationId=<uuid>" \
  -H "Authorization: Bearer <token>"
```

### Compare multiple locations

```bash
curl -X GET "/api/reports/location?type=comparison&compare=true&locationIds=uuid1,uuid2,uuid3" \
  -H "Authorization: Bearer <token>"
```

### Get reports for date range

```bash
curl -X GET "/api/reports/location?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <token>"
```
