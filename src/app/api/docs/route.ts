/**
 * Swagger UI Documentation Page
 *
 * Serves an interactive API documentation page using Swagger UI.
 * This endpoint is public and does not require authentication.
 *
 * @route GET /api/docs
 */

import { NextRequest, NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Determine base URL from request
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  const specUrl = `${baseUrl}/api/openapi.json`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vetify API Documentation v${APP_VERSION}</title>
  <meta name="description" content="Interactive API documentation for Vetify veterinary practice management platform">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    :root {
      --primary-color: #75a99c;
      --primary-dark: #5a8a7d;
      --bg-color: #1a1a1a;
      --text-color: #ffffff;
    }

    html {
      box-sizing: border-box;
    }

    *,
    *::before,
    *::after {
      box-sizing: inherit;
    }

    body {
      margin: 0;
      background: var(--bg-color);
    }

    /* Custom header */
    .custom-header {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      padding: 20px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .custom-header h1 {
      color: white;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .custom-header .version {
      color: rgba(255, 255, 255, 0.8);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 0.875rem;
    }

    .custom-header a {
      color: white;
      text-decoration: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 0.875rem;
      padding: 8px 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      transition: all 0.2s;
    }

    .custom-header a:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    /* Swagger UI customizations */
    .swagger-ui {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .swagger-ui .topbar {
      display: none;
    }

    .swagger-ui .info {
      margin: 30px 0;
    }

    .swagger-ui .info .title {
      font-size: 2rem;
      color: #333;
    }

    .swagger-ui .info .description {
      font-size: 1rem;
      line-height: 1.6;
    }

    .swagger-ui .info .description h1,
    .swagger-ui .info .description h2,
    .swagger-ui .info .description h3 {
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }

    .swagger-ui .info .description code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    .swagger-ui .info .description pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }

    .swagger-ui .info .description pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }

    .swagger-ui .opblock.opblock-get {
      border-color: var(--primary-color);
      background: rgba(117, 169, 156, 0.1);
    }

    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: var(--primary-color);
    }

    .swagger-ui .opblock.opblock-post {
      border-color: #49cc90;
      background: rgba(73, 204, 144, 0.1);
    }

    .swagger-ui .opblock.opblock-put {
      border-color: #fca130;
      background: rgba(252, 161, 48, 0.1);
    }

    .swagger-ui .opblock.opblock-delete {
      border-color: #f93e3e;
      background: rgba(249, 62, 62, 0.1);
    }

    .swagger-ui .btn.authorize {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    .swagger-ui .btn.authorize:hover {
      background: var(--primary-dark);
      border-color: var(--primary-dark);
    }

    .swagger-ui .btn.execute {
      background: var(--primary-color);
      border-color: var(--primary-color);
    }

    .swagger-ui .btn.execute:hover {
      background: var(--primary-dark);
      border-color: var(--primary-dark);
    }

    .swagger-ui section.models {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .swagger-ui section.models h4 {
      color: #333;
    }

    /* Loading state */
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: #666;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .loading::after {
      content: 'Loading API documentation...';
    }

    /* Footer */
    .custom-footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 0.875rem;
      border-top: 1px solid #e0e0e0;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <header class="custom-header">
    <div>
      <h1>Vetify API Documentation</h1>
      <span class="version">v${APP_VERSION}</span>
    </div>
    <a href="/dashboard" target="_blank">Back to Dashboard</a>
  </header>

  <div id="swagger-ui" class="loading"></div>

  <footer class="custom-footer">
    &copy; ${new Date().getFullYear()} Vetify. All rights reserved.
  </footer>

  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'StandaloneLayout',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        displayRequestDuration: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai'
        },
        onComplete: function() {
          document.getElementById('swagger-ui').classList.remove('loading');
        }
      });

      window.ui = ui;
    };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
