/**
 * OpenAPI 3.0 Specification Generator
 *
 * Generates the complete OpenAPI specification for the Vetify API v1.
 * This specification is used by Swagger UI for interactive documentation.
 */

import { APP_VERSION } from '@/lib/version';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
  paths: Record<string, unknown>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
    responses?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
  };
  security: Array<Record<string, string[]>>;
}

/**
 * Generate the complete OpenAPI specification
 */
export function generateOpenAPISpec(baseUrl: string): OpenAPISpec {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Vetify API',
      version: APP_VERSION,
      description: `
# Vetify API Documentation

Welcome to the Vetify API! This API allows you to programmatically manage your veterinary practice data including customers, pets, appointments, inventory, and more.

## Authentication

All API requests require authentication using an API key. Include your API key in the \`Authorization\` header:

\`\`\`
Authorization: Bearer vfy_a1b2c3d4_e5f6g7h8i9j0k1l2m3n4o5p6
\`\`\`

API keys can be generated from your dashboard under Settings > API Keys.

## API Key Format

API keys follow the format: \`vfy_{8-char}_{32-char}\`

Each key can have specific scopes that control access:
- \`read:pets\` / \`write:pets\` - Pet information
- \`read:customers\` / \`write:customers\` - Customer information
- \`read:appointments\` / \`write:appointments\` - Appointment scheduling
- \`read:inventory\` / \`write:inventory\` - Inventory management
- \`read:locations\` - Location information
- \`read:reports\` - Reports and analytics
- \`read:sales\` / \`write:sales\` - Sales information

## Rate Limiting

API requests are rate-limited per API key. Default limits are 1000 requests per hour.

Rate limit headers are included in every response:
- \`X-RateLimit-Limit\` - Maximum requests allowed per window
- \`X-RateLimit-Remaining\` - Requests remaining in current window
- \`X-RateLimit-Reset\` - Unix timestamp when the window resets

When rate limited, you'll receive a \`429 Too Many Requests\` response.

## Location Filtering

API keys can optionally be scoped to specific locations. When scoped:
- All queries are automatically filtered to that location
- Cross-location data access is prevented
- Location scope takes precedence over query parameters

## Pagination

List endpoints support pagination via query parameters:
- \`limit\` - Number of items to return (default: 50, max: 100)
- \`offset\` - Number of items to skip (default: 0)

Paginated responses include metadata:
\`\`\`json
{
  "data": [...],
  "meta": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
\`\`\`

## Error Handling

Errors return appropriate HTTP status codes with a JSON body:

\`\`\`json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": "Optional additional details"
}
\`\`\`

Common error codes:
- \`400\` - Bad Request (invalid input)
- \`401\` - Unauthorized (missing/invalid API key)
- \`403\` - Forbidden (missing required scope)
- \`404\` - Not Found
- \`409\` - Conflict (business logic violation)
- \`429\` - Too Many Requests (rate limited)
- \`500\` - Internal Server Error
      `.trim(),
      contact: {
        name: 'Vetify Support',
        email: 'support@vetify.app',
      },
    },
    servers: [
      {
        url: baseUrl,
        description: 'Current server',
      },
    ],
    tags: [
      {
        name: 'Customers',
        description: 'Customer management operations',
      },
      {
        name: 'Pets',
        description: 'Pet records management',
      },
      {
        name: 'Appointments',
        description: 'Appointment scheduling and management',
      },
      {
        name: 'Locations',
        description: 'Practice location information',
      },
      {
        name: 'Inventory',
        description: 'Inventory management',
      },
      {
        name: 'Inventory Transfers',
        description: 'Inventory transfer between locations',
      },
      {
        name: 'Reports',
        description: 'Analytics and reporting',
      },
      {
        name: 'Webhooks',
        description: 'Webhook event delivery system',
      },
    ],
    paths: {
      // ========================================================================
      // CUSTOMERS
      // ========================================================================
      '/api/v1/customers': {
        get: {
          tags: ['Customers'],
          summary: 'List customers',
          description: 'Retrieve a paginated list of customers. Requires `read:customers` scope.',
          operationId: 'listCustomers',
          parameters: [
            { $ref: '#/components/parameters/locationIdQuery' },
            {
              name: 'search',
              in: 'query',
              description: 'Search by name, email, or phone',
              schema: { type: 'string' },
            },
            {
              name: 'isActive',
              in: 'query',
              description: 'Filter by active status',
              schema: { type: 'boolean' },
            },
            { $ref: '#/components/parameters/limitQuery' },
            { $ref: '#/components/parameters/offsetQuery' },
          ],
          responses: {
            '200': {
              description: 'List of customers',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/PaginatedResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Customer' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        post: {
          tags: ['Customers'],
          summary: 'Create customer',
          description: 'Create a new customer record. Requires `write:customers` scope.',
          operationId: 'createCustomer',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CustomerCreate' },
                example: {
                  name: 'John Smith',
                  firstName: 'John',
                  lastName: 'Smith',
                  email: 'john.smith@example.com',
                  phone: '+1-555-123-4567',
                  address: '123 Main St, Anytown, USA',
                  preferredContactMethod: 'email',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Customer created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Customer' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
      '/api/v1/customers/{id}': {
        get: {
          tags: ['Customers'],
          summary: 'Get customer',
          description: 'Retrieve a specific customer by ID including their pets. Requires `read:customers` scope.',
          operationId: 'getCustomer',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          responses: {
            '200': {
              description: 'Customer details with pets',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/CustomerWithPets' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        put: {
          tags: ['Customers'],
          summary: 'Update customer',
          description: 'Update an existing customer. Requires `write:customers` scope.',
          operationId: 'updateCustomer',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CustomerUpdate' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Customer updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Customer' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        delete: {
          tags: ['Customers'],
          summary: 'Delete customer',
          description: 'Soft delete a customer (sets isActive to false). Requires `write:customers` scope.',
          operationId: 'deleteCustomer',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          responses: {
            '204': { description: 'Customer deleted successfully' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },

      // ========================================================================
      // PETS
      // ========================================================================
      '/api/v1/pets': {
        get: {
          tags: ['Pets'],
          summary: 'List pets',
          description: 'Retrieve a paginated list of pets with customer information. Requires `read:pets` scope.',
          operationId: 'listPets',
          parameters: [
            { $ref: '#/components/parameters/locationIdQuery' },
            {
              name: 'customerId',
              in: 'query',
              description: 'Filter by customer ID',
              schema: { type: 'string', format: 'uuid' },
            },
            {
              name: 'species',
              in: 'query',
              description: 'Filter by species (case-insensitive)',
              schema: { type: 'string' },
            },
            {
              name: 'isDeceased',
              in: 'query',
              description: 'Filter by deceased status',
              schema: { type: 'boolean' },
            },
            { $ref: '#/components/parameters/limitQuery' },
            { $ref: '#/components/parameters/offsetQuery' },
          ],
          responses: {
            '200': {
              description: 'List of pets',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/PaginatedResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/PetWithCustomer' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        post: {
          tags: ['Pets'],
          summary: 'Create pet',
          description:
            'Create a new pet record. Requires `write:pets` scope. Triggers `pet.created` webhook.',
          operationId: 'createPet',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PetCreate' },
                example: {
                  name: 'Max',
                  species: 'Dog',
                  breed: 'Golden Retriever',
                  dateOfBirth: '2020-03-15',
                  gender: 'male',
                  customerId: '550e8400-e29b-41d4-a716-446655440000',
                  weight: 30.5,
                  weightUnit: 'kg',
                  isNeutered: true,
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Pet created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Pet' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
      '/api/v1/pets/{id}': {
        get: {
          tags: ['Pets'],
          summary: 'Get pet',
          description: 'Retrieve a specific pet by ID with customer information. Requires `read:pets` scope.',
          operationId: 'getPet',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          responses: {
            '200': {
              description: 'Pet details with customer',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/PetWithCustomer' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        put: {
          tags: ['Pets'],
          summary: 'Update pet',
          description:
            'Update an existing pet. Requires `write:pets` scope. Triggers `pet.updated` webhook.',
          operationId: 'updatePet',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PetUpdate' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Pet updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Pet' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        delete: {
          tags: ['Pets'],
          summary: 'Delete pet',
          description:
            'Mark a pet as deceased (preserves medical history). Requires `write:pets` scope. Triggers `pet.deleted` webhook.',
          operationId: 'deletePet',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          responses: {
            '204': { description: 'Pet marked as deceased' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },

      // ========================================================================
      // APPOINTMENTS
      // ========================================================================
      '/api/v1/appointments': {
        get: {
          tags: ['Appointments'],
          summary: 'List appointments',
          description:
            'Retrieve a paginated list of appointments. Requires `read:appointments` scope.',
          operationId: 'listAppointments',
          parameters: [
            { $ref: '#/components/parameters/locationIdQuery' },
            {
              name: 'start_date',
              in: 'query',
              description: 'Filter from date (ISO 8601)',
              schema: { type: 'string', format: 'date-time' },
            },
            {
              name: 'end_date',
              in: 'query',
              description: 'Filter to date (ISO 8601)',
              schema: { type: 'string', format: 'date-time' },
            },
            {
              name: 'status',
              in: 'query',
              description: 'Filter by appointment status',
              schema: { $ref: '#/components/schemas/AppointmentStatus' },
            },
            {
              name: 'petId',
              in: 'query',
              description: 'Filter by pet ID',
              schema: { type: 'string', format: 'uuid' },
            },
            {
              name: 'customerId',
              in: 'query',
              description: 'Filter by customer ID',
              schema: { type: 'string', format: 'uuid' },
            },
            {
              name: 'staffId',
              in: 'query',
              description: 'Filter by staff ID',
              schema: { type: 'string', format: 'uuid' },
            },
            { $ref: '#/components/parameters/limitQuery' },
            { $ref: '#/components/parameters/offsetQuery' },
          ],
          responses: {
            '200': {
              description: 'List of appointments',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/PaginatedResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AppointmentWithRelations' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        post: {
          tags: ['Appointments'],
          summary: 'Create appointment',
          description:
            'Schedule a new appointment. Requires `write:appointments` scope. Triggers `appointment.created` webhook.',
          operationId: 'createAppointment',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AppointmentCreate' },
                example: {
                  dateTime: '2024-02-15T10:00:00Z',
                  duration: 30,
                  reason: 'Annual checkup and vaccinations',
                  petId: '550e8400-e29b-41d4-a716-446655440000',
                  staffId: '550e8400-e29b-41d4-a716-446655440001',
                  notes: 'Owner mentioned pet has been scratching more than usual',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Appointment created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/AppointmentWithRelations' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '409': { $ref: '#/components/responses/Conflict' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
      '/api/v1/appointments/{id}': {
        get: {
          tags: ['Appointments'],
          summary: 'Get appointment',
          description: 'Retrieve a specific appointment by ID. Requires `read:appointments` scope.',
          operationId: 'getAppointment',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          responses: {
            '200': {
              description: 'Appointment details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/AppointmentWithRelations' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        put: {
          tags: ['Appointments'],
          summary: 'Update appointment',
          description:
            'Update an existing appointment. Requires `write:appointments` scope. Triggers `appointment.updated` or `appointment.cancelled` webhook.',
          operationId: 'updateAppointment',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AppointmentUpdate' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Appointment updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/AppointmentWithRelations' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '409': { $ref: '#/components/responses/Conflict' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        delete: {
          tags: ['Appointments'],
          summary: 'Cancel appointment',
          description:
            'Cancel an appointment (sets status to CANCELLED_CLINIC). Requires `write:appointments` scope. Triggers `appointment.cancelled` webhook.',
          operationId: 'deleteAppointment',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          responses: {
            '204': { description: 'Appointment cancelled successfully' },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },

      // ========================================================================
      // LOCATIONS
      // ========================================================================
      '/api/v1/locations': {
        get: {
          tags: ['Locations'],
          summary: 'List locations',
          description:
            'Retrieve a list of practice locations. Requires `read:locations` scope. If API key is location-scoped, only returns that location.',
          operationId: 'listLocations',
          parameters: [
            {
              name: 'isActive',
              in: 'query',
              description: 'Filter by active status',
              schema: { type: 'boolean' },
            },
            { $ref: '#/components/parameters/limitQuery' },
            { $ref: '#/components/parameters/offsetQuery' },
          ],
          responses: {
            '200': {
              description: 'List of locations',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/PaginatedResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Location' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
      '/api/v1/locations/{id}': {
        get: {
          tags: ['Locations'],
          summary: 'Get location',
          description:
            'Retrieve a specific location by ID. Requires `read:locations` scope. If API key is location-scoped, can only access that location.',
          operationId: 'getLocation',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          responses: {
            '200': {
              description: 'Location details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/Location' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },

      // ========================================================================
      // INVENTORY
      // ========================================================================
      '/api/v1/inventory': {
        get: {
          tags: ['Inventory'],
          summary: 'List inventory items',
          description: 'Retrieve a paginated list of inventory items. Requires `read:inventory` scope.',
          operationId: 'listInventory',
          parameters: [
            { $ref: '#/components/parameters/locationIdQuery' },
            {
              name: 'category',
              in: 'query',
              description: 'Filter by category',
              schema: { $ref: '#/components/schemas/InventoryCategory' },
            },
            {
              name: 'status',
              in: 'query',
              description: 'Filter by status',
              schema: { $ref: '#/components/schemas/InventoryStatus' },
            },
            {
              name: 'search',
              in: 'query',
              description: 'Search by name or description',
              schema: { type: 'string' },
            },
            {
              name: 'lowStock',
              in: 'query',
              description: 'Filter items with quantity <= minStock',
              schema: { type: 'boolean' },
            },
            { $ref: '#/components/parameters/limitQuery' },
            { $ref: '#/components/parameters/offsetQuery' },
          ],
          responses: {
            '200': {
              description: 'List of inventory items',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/PaginatedResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/InventoryItem' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        post: {
          tags: ['Inventory'],
          summary: 'Create inventory item',
          description: 'Create a new inventory item. Requires `write:inventory` scope.',
          operationId: 'createInventoryItem',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InventoryItemCreate' },
                example: {
                  name: 'Amoxicillin 500mg',
                  category: 'MEDICINE',
                  description: 'Broad-spectrum antibiotic',
                  activeCompound: 'Amoxicillin',
                  presentation: 'Capsules',
                  brand: 'Generic',
                  quantity: 100,
                  minStock: 20,
                  cost: 0.5,
                  price: 1.5,
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Inventory item created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/InventoryItem' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
      '/api/v1/inventory/{id}': {
        get: {
          tags: ['Inventory'],
          summary: 'Get inventory item',
          description: 'Retrieve a specific inventory item by ID. Requires `read:inventory` scope.',
          operationId: 'getInventoryItem',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          responses: {
            '200': {
              description: 'Inventory item details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/InventoryItem' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        put: {
          tags: ['Inventory'],
          summary: 'Update inventory item',
          description: 'Update an existing inventory item. Requires `write:inventory` scope.',
          operationId: 'updateInventoryItem',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InventoryItemUpdate' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Inventory item updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/InventoryItem' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        delete: {
          tags: ['Inventory'],
          summary: 'Delete inventory item',
          description:
            'Soft delete an inventory item (sets status to DISCONTINUED). Requires `write:inventory` scope.',
          operationId: 'deleteInventoryItem',
          parameters: [{ $ref: '#/components/parameters/idPath' }],
          responses: {
            '204': { description: 'Inventory item deleted successfully' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '404': { $ref: '#/components/responses/NotFound' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },

      // ========================================================================
      // INVENTORY TRANSFERS
      // ========================================================================
      '/api/v1/inventory/transfers': {
        get: {
          tags: ['Inventory Transfers'],
          summary: 'List inventory transfers',
          description:
            'Retrieve a list of inventory transfers. Requires `read:inventory` scope. If API key is location-scoped, shows transfers involving that location.',
          operationId: 'listInventoryTransfers',
          parameters: [
            {
              name: 'status',
              in: 'query',
              description: 'Filter by transfer status',
              schema: { $ref: '#/components/schemas/TransferStatus' },
            },
            {
              name: 'fromLocationId',
              in: 'query',
              description: 'Filter by source location',
              schema: { type: 'string', format: 'uuid' },
            },
            {
              name: 'toLocationId',
              in: 'query',
              description: 'Filter by destination location',
              schema: { type: 'string', format: 'uuid' },
            },
            {
              name: 'inventoryItemId',
              in: 'query',
              description: 'Filter by inventory item',
              schema: { type: 'string', format: 'uuid' },
            },
            { $ref: '#/components/parameters/limitQuery' },
            { $ref: '#/components/parameters/offsetQuery' },
          ],
          responses: {
            '200': {
              description: 'List of inventory transfers',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/PaginatedResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/InventoryTransfer' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
        post: {
          tags: ['Inventory Transfers'],
          summary: 'Create inventory transfer',
          description: 'Create a new inventory transfer request. Requires `write:inventory` scope.',
          operationId: 'createInventoryTransfer',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InventoryTransferCreate' },
                example: {
                  inventoryItemId: '550e8400-e29b-41d4-a716-446655440000',
                  fromLocationId: '550e8400-e29b-41d4-a716-446655440001',
                  toLocationId: '550e8400-e29b-41d4-a716-446655440002',
                  quantity: 10,
                  requestedById: '550e8400-e29b-41d4-a716-446655440003',
                  notes: 'Urgent transfer for low stock',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Transfer created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/InventoryTransfer' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },

      // ========================================================================
      // REPORTS
      // ========================================================================
      '/api/v1/reports/sales': {
        get: {
          tags: ['Reports'],
          summary: 'Get sales report',
          description: 'Retrieve sales analytics for a given period. Requires `read:reports` scope.',
          operationId: 'getSalesReport',
          parameters: [
            {
              name: 'start_date',
              in: 'query',
              description: 'Start date (ISO 8601)',
              required: true,
              schema: { type: 'string', format: 'date' },
            },
            {
              name: 'end_date',
              in: 'query',
              description: 'End date (ISO 8601)',
              required: true,
              schema: { type: 'string', format: 'date' },
            },
            { $ref: '#/components/parameters/locationIdQuery' },
            {
              name: 'groupBy',
              in: 'query',
              description: 'Group results by period or category',
              schema: {
                type: 'string',
                enum: ['day', 'week', 'month', 'category'],
                default: 'day',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Sales report data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/SalesReport' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
      '/api/v1/reports/inventory': {
        get: {
          tags: ['Reports'],
          summary: 'Get inventory report',
          description:
            'Retrieve inventory analytics including low stock and expiring items. Requires `read:reports` scope.',
          operationId: 'getInventoryReport',
          parameters: [
            { $ref: '#/components/parameters/locationIdQuery' },
            {
              name: 'category',
              in: 'query',
              description: 'Filter by inventory category',
              schema: { $ref: '#/components/schemas/InventoryCategory' },
            },
          ],
          responses: {
            '200': {
              description: 'Inventory report data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/InventoryReport' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '403': { $ref: '#/components/responses/Forbidden' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description: 'API key in format: vfy_{8-char}_{32-char}',
        },
      },
      parameters: {
        idPath: {
          name: 'id',
          in: 'path',
          description: 'Resource ID (UUID)',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        locationIdQuery: {
          name: 'locationId',
          in: 'query',
          description: 'Filter by location ID',
          schema: { type: 'string', format: 'uuid' },
        },
        limitQuery: {
          name: 'limit',
          in: 'query',
          description: 'Number of items to return (1-100)',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        },
        offsetQuery: {
          name: 'offset',
          in: 'query',
          description: 'Number of items to skip',
          schema: { type: 'integer', minimum: 0, default: 0 },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: 'name: Name is required',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - Missing or invalid API key',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Invalid API key',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Missing required scope',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Missing required scope: write:pets',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found - Resource does not exist',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Pet not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        Conflict: {
          description: 'Conflict - Business logic violation',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Staff has a scheduling conflict at this time',
                code: 'CONFLICT',
              },
            },
          },
        },
        RateLimited: {
          description: 'Too Many Requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Rate limit exceeded. Try again in 3600 seconds.',
                code: 'RATE_LIMITED',
              },
            },
          },
          headers: {
            'X-RateLimit-Limit': {
              description: 'The number of allowed requests per window',
              schema: { type: 'integer' },
            },
            'X-RateLimit-Remaining': {
              description: 'The number of remaining requests in the current window',
              schema: { type: 'integer' },
            },
            'X-RateLimit-Reset': {
              description: 'Unix timestamp when the rate limit window resets',
              schema: { type: 'integer' },
            },
          },
        },
      },
      schemas: {
        // ======================================================================
        // Common Schemas
        // ======================================================================
        Error: {
          type: 'object',
          required: ['error', 'code'],
          properties: {
            error: {
              type: 'string',
              description: 'Human-readable error message',
            },
            code: {
              type: 'string',
              description: 'Machine-readable error code',
            },
            details: {
              type: 'string',
              description: 'Additional error details',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {},
            },
            meta: {
              type: 'object',
              properties: {
                total: {
                  type: 'integer',
                  description: 'Total number of items',
                },
                limit: {
                  type: 'integer',
                  description: 'Number of items per page',
                },
                offset: {
                  type: 'integer',
                  description: 'Number of items skipped',
                },
                hasMore: {
                  type: 'boolean',
                  description: 'Whether there are more items',
                },
              },
            },
          },
        },

        // ======================================================================
        // Customer Schemas
        // ======================================================================
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            firstName: { type: 'string', nullable: true },
            lastName: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email', nullable: true },
            phone: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            preferredContactMethod: {
              type: 'string',
              enum: ['phone', 'email', 'sms'],
              nullable: true,
            },
            notes: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            source: { type: 'string', nullable: true },
            locationId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CustomerWithPets: {
          allOf: [
            { $ref: '#/components/schemas/Customer' },
            {
              type: 'object',
              properties: {
                pets: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PetSummary' },
                },
              },
            },
          ],
        },
        CustomerSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email', nullable: true },
            phone: { type: 'string', nullable: true },
          },
        },
        CustomerCreate: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', maxLength: 255 },
            firstName: { type: 'string', maxLength: 100 },
            lastName: { type: 'string', maxLength: 100 },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', maxLength: 50 },
            address: { type: 'string', maxLength: 500 },
            preferredContactMethod: {
              type: 'string',
              enum: ['phone', 'email', 'sms'],
            },
            notes: { type: 'string' },
            locationId: { type: 'string', format: 'uuid' },
          },
        },
        CustomerUpdate: {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 255 },
            firstName: { type: 'string', maxLength: 100 },
            lastName: { type: 'string', maxLength: 100 },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', maxLength: 50 },
            address: { type: 'string', maxLength: 500 },
            preferredContactMethod: {
              type: 'string',
              enum: ['phone', 'email', 'sms'],
            },
            notes: { type: 'string' },
            isActive: { type: 'boolean' },
            locationId: { type: 'string', format: 'uuid' },
          },
        },

        // ======================================================================
        // Pet Schemas
        // ======================================================================
        Pet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            internalId: { type: 'string', nullable: true },
            name: { type: 'string' },
            species: { type: 'string' },
            breed: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
            gender: { type: 'string', enum: ['male', 'female', 'unknown'] },
            weight: { type: 'number', nullable: true },
            weightUnit: { type: 'string', enum: ['kg', 'lb'], nullable: true },
            microchipNumber: { type: 'string', nullable: true },
            isNeutered: { type: 'boolean' },
            isDeceased: { type: 'boolean' },
            profileImage: { type: 'string', format: 'uri', nullable: true },
            customerId: { type: 'string', format: 'uuid' },
            locationId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PetWithCustomer: {
          allOf: [
            { $ref: '#/components/schemas/Pet' },
            {
              type: 'object',
              properties: {
                customer: { $ref: '#/components/schemas/CustomerSummary' },
              },
            },
          ],
        },
        PetSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            species: { type: 'string' },
            breed: { type: 'string' },
          },
        },
        PetCreate: {
          type: 'object',
          required: ['name', 'species', 'breed', 'dateOfBirth', 'gender', 'customerId'],
          properties: {
            name: { type: 'string', maxLength: 100 },
            species: { type: 'string', maxLength: 50 },
            breed: { type: 'string', maxLength: 100 },
            dateOfBirth: { type: 'string', format: 'date' },
            gender: { type: 'string', enum: ['male', 'female', 'unknown'] },
            customerId: { type: 'string', format: 'uuid' },
            locationId: { type: 'string', format: 'uuid' },
            internalId: { type: 'string', maxLength: 50 },
            weight: { type: 'number', minimum: 0 },
            weightUnit: { type: 'string', enum: ['kg', 'lb'] },
            microchipNumber: { type: 'string', maxLength: 50 },
            isNeutered: { type: 'boolean', default: false },
            profileImage: { type: 'string', format: 'uri' },
          },
        },
        PetUpdate: {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 100 },
            species: { type: 'string', maxLength: 50 },
            breed: { type: 'string', maxLength: 100 },
            dateOfBirth: { type: 'string', format: 'date' },
            gender: { type: 'string', enum: ['male', 'female', 'unknown'] },
            locationId: { type: 'string', format: 'uuid' },
            internalId: { type: 'string', maxLength: 50 },
            weight: { type: 'number', minimum: 0 },
            weightUnit: { type: 'string', enum: ['kg', 'lb'] },
            microchipNumber: { type: 'string', maxLength: 50 },
            isNeutered: { type: 'boolean' },
            isDeceased: { type: 'boolean' },
            profileImage: { type: 'string', format: 'uri' },
          },
        },

        // ======================================================================
        // Appointment Schemas
        // ======================================================================
        AppointmentStatus: {
          type: 'string',
          enum: [
            'SCHEDULED',
            'CONFIRMED',
            'CHECKED_IN',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED_CLIENT',
            'CANCELLED_CLINIC',
            'NO_SHOW',
          ],
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            dateTime: { type: 'string', format: 'date-time' },
            duration: { type: 'integer', description: 'Duration in minutes' },
            reason: { type: 'string' },
            notes: { type: 'string', nullable: true },
            status: { $ref: '#/components/schemas/AppointmentStatus' },
            petId: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid', nullable: true },
            staffId: { type: 'string', format: 'uuid', nullable: true },
            locationId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AppointmentWithRelations: {
          allOf: [
            { $ref: '#/components/schemas/Appointment' },
            {
              type: 'object',
              properties: {
                pet: { $ref: '#/components/schemas/PetSummary' },
                customer: {
                  allOf: [{ $ref: '#/components/schemas/CustomerSummary' }],
                  nullable: true,
                },
                staff: {
                  allOf: [{ $ref: '#/components/schemas/StaffSummary' }],
                  nullable: true,
                },
                location: {
                  allOf: [{ $ref: '#/components/schemas/LocationSummary' }],
                  nullable: true,
                },
              },
            },
          ],
        },
        StaffSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            position: { type: 'string' },
          },
        },
        LocationSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
          },
        },
        AppointmentCreate: {
          type: 'object',
          required: ['dateTime', 'reason', 'petId'],
          properties: {
            dateTime: { type: 'string', format: 'date-time' },
            duration: {
              type: 'integer',
              minimum: 15,
              maximum: 480,
              default: 30,
              description: 'Duration in minutes (15-480)',
            },
            reason: { type: 'string', maxLength: 500 },
            notes: { type: 'string', maxLength: 2000 },
            status: { $ref: '#/components/schemas/AppointmentStatus' },
            petId: { type: 'string', format: 'uuid' },
            customerId: {
              type: 'string',
              format: 'uuid',
              description: 'Optional - auto-set from pet if not provided',
            },
            staffId: { type: 'string', format: 'uuid' },
            locationId: { type: 'string', format: 'uuid' },
          },
        },
        AppointmentUpdate: {
          type: 'object',
          properties: {
            dateTime: { type: 'string', format: 'date-time' },
            duration: { type: 'integer', minimum: 15, maximum: 480 },
            reason: { type: 'string', maxLength: 500 },
            notes: { type: 'string', maxLength: 2000 },
            status: { $ref: '#/components/schemas/AppointmentStatus' },
            petId: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            staffId: { type: 'string', format: 'uuid' },
            locationId: { type: 'string', format: 'uuid' },
          },
        },

        // ======================================================================
        // Location Schemas
        // ======================================================================
        Location: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            address: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email', nullable: true },
            timezone: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            isPrimary: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ======================================================================
        // Inventory Schemas
        // ======================================================================
        InventoryCategory: {
          type: 'string',
          enum: [
            'MEDICINE',
            'VACCINE',
            'DEWORMER',
            'FLEA_TICK_PREVENTION',
            'FOOD_PRESCRIPTION',
            'FOOD_REGULAR',
            'SUPPLEMENT',
            'ACCESSORY',
            'CONSUMABLE_CLINIC',
            'SURGICAL_MATERIAL',
            'LAB_SUPPLIES',
            'HYGIENE_GROOMING',
            'OTHER',
          ],
        },
        InventoryStatus: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED', 'DISCONTINUED'],
        },
        InventoryItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            category: { $ref: '#/components/schemas/InventoryCategory' },
            description: { type: 'string', nullable: true },
            activeCompound: { type: 'string', nullable: true },
            presentation: { type: 'string', nullable: true },
            measure: { type: 'string', nullable: true },
            brand: { type: 'string', nullable: true },
            quantity: { type: 'integer' },
            minStock: { type: 'integer', nullable: true },
            expirationDate: { type: 'string', format: 'date', nullable: true },
            status: { $ref: '#/components/schemas/InventoryStatus' },
            batchNumber: { type: 'string', nullable: true },
            specialNotes: { type: 'string', nullable: true },
            storageLocation: { type: 'string', nullable: true },
            cost: { type: 'number', nullable: true },
            price: { type: 'number', nullable: true },
            locationId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        InventoryItemSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            category: { type: 'string' },
          },
        },
        InventoryItemCreate: {
          type: 'object',
          required: ['name', 'category'],
          properties: {
            name: { type: 'string', maxLength: 255 },
            category: { $ref: '#/components/schemas/InventoryCategory' },
            description: { type: 'string', maxLength: 1000 },
            activeCompound: { type: 'string', maxLength: 255 },
            presentation: { type: 'string', maxLength: 100 },
            measure: { type: 'string', maxLength: 50 },
            brand: { type: 'string', maxLength: 100 },
            quantity: { type: 'integer', minimum: 0, default: 0 },
            minStock: { type: 'integer', minimum: 0 },
            expirationDate: { type: 'string', format: 'date' },
            status: {
              $ref: '#/components/schemas/InventoryStatus',
              default: 'ACTIVE',
            },
            batchNumber: { type: 'string', maxLength: 100 },
            specialNotes: { type: 'string', maxLength: 500 },
            storageLocation: { type: 'string', maxLength: 100 },
            cost: { type: 'number', minimum: 0 },
            price: { type: 'number', minimum: 0 },
            locationId: { type: 'string', format: 'uuid' },
          },
        },
        InventoryItemUpdate: {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 255 },
            category: { $ref: '#/components/schemas/InventoryCategory' },
            description: { type: 'string', maxLength: 1000 },
            activeCompound: { type: 'string', maxLength: 255 },
            presentation: { type: 'string', maxLength: 100 },
            measure: { type: 'string', maxLength: 50 },
            brand: { type: 'string', maxLength: 100 },
            quantity: { type: 'integer', minimum: 0 },
            minStock: { type: 'integer', minimum: 0 },
            expirationDate: { type: 'string', format: 'date' },
            status: { $ref: '#/components/schemas/InventoryStatus' },
            batchNumber: { type: 'string', maxLength: 100 },
            specialNotes: { type: 'string', maxLength: 500 },
            storageLocation: { type: 'string', maxLength: 100 },
            cost: { type: 'number', minimum: 0 },
            price: { type: 'number', minimum: 0 },
            locationId: { type: 'string', format: 'uuid' },
          },
        },

        // ======================================================================
        // Inventory Transfer Schemas
        // ======================================================================
        TransferStatus: {
          type: 'string',
          enum: ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
        },
        InventoryTransfer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            inventoryItemId: { type: 'string', format: 'uuid' },
            inventoryItem: { $ref: '#/components/schemas/InventoryItemSummary' },
            fromLocationId: { type: 'string', format: 'uuid' },
            fromLocation: { $ref: '#/components/schemas/LocationSummary' },
            toLocationId: { type: 'string', format: 'uuid' },
            toLocation: { $ref: '#/components/schemas/LocationSummary' },
            quantity: { type: 'integer' },
            status: { $ref: '#/components/schemas/TransferStatus' },
            notes: { type: 'string', nullable: true },
            requestedById: { type: 'string', format: 'uuid' },
            requestedBy: { $ref: '#/components/schemas/StaffSummary' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        InventoryTransferCreate: {
          type: 'object',
          required: [
            'inventoryItemId',
            'fromLocationId',
            'toLocationId',
            'quantity',
            'requestedById',
          ],
          properties: {
            inventoryItemId: { type: 'string', format: 'uuid' },
            fromLocationId: { type: 'string', format: 'uuid' },
            toLocationId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer', minimum: 1 },
            notes: { type: 'string', maxLength: 500 },
            requestedById: { type: 'string', format: 'uuid' },
          },
        },

        // ======================================================================
        // Report Schemas
        // ======================================================================
        SalesReport: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                totalSales: { type: 'integer' },
                totalRevenue: { type: 'number' },
                averageOrderValue: { type: 'number' },
                periodStart: { type: 'string', format: 'date-time' },
                periodEnd: { type: 'string', format: 'date-time' },
              },
            },
            breakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date' },
                  category: { type: 'string' },
                  locationId: { type: 'string', format: 'uuid' },
                  locationName: { type: 'string' },
                  count: { type: 'integer' },
                  revenue: { type: 'number' },
                },
              },
            },
          },
        },
        InventoryReport: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                totalItems: { type: 'integer' },
                totalValue: { type: 'number' },
                lowStockCount: { type: 'integer' },
                outOfStockCount: { type: 'integer' },
                expiringSoonCount: { type: 'integer' },
              },
            },
            byCategory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  count: { type: 'integer' },
                  totalValue: { type: 'number' },
                },
              },
            },
            lowStockItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  category: { type: 'string' },
                  quantity: { type: 'integer' },
                  minStock: { type: 'integer' },
                  locationId: { type: 'string', format: 'uuid', nullable: true },
                },
              },
            },
            expiringItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  category: { type: 'string' },
                  quantity: { type: 'integer' },
                  expirationDate: { type: 'string', format: 'date' },
                  locationId: { type: 'string', format: 'uuid', nullable: true },
                },
              },
            },
          },
        },

        // ======================================================================
        // Webhook Schemas
        // ======================================================================
        WebhookEvent: {
          type: 'string',
          enum: [
            'pet.created',
            'pet.updated',
            'pet.deleted',
            'appointment.created',
            'appointment.updated',
            'appointment.cancelled',
            'inventory.low_stock',
            'inventory.transfer_completed',
            'sale.completed',
          ],
          description: 'Available webhook event types',
        },
        WebhookPayload: {
          type: 'object',
          description: 'Webhook payload structure sent to your endpoint',
          properties: {
            event: { $ref: '#/components/schemas/WebhookEvent' },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'When the event occurred',
            },
            data: {
              type: 'object',
              description: 'Event-specific data (the entity that changed)',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  };
}
