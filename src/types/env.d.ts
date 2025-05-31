declare namespace NodeJS {
  interface ProcessEnv {
    // Database
    DATABASE_URL: string;
    DIRECT_URL: string;

    // Kinde Authentication
    KINDE_CLIENT_ID: string;
    KINDE_CLIENT_SECRET: string;
    KINDE_ISSUER_URL: string;
    KINDE_SITE_URL: string;
    KINDE_POST_LOGOUT_REDIRECT_URL: string;
    KINDE_POST_LOGIN_REDIRECT_URL: string;

    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    // N8N Integration
    N8N_WEBHOOK_URL: string;
    N8N_API_KEY: string;
    NEXT_PUBLIC_N8N_WEBHOOK_URL: string;

    // WhatsApp Business API
    WHATSAPP_PHONE_NUMBER_ID: string;
    WHATSAPP_ACCESS_TOKEN: string;
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: string;
    WHATSAPP_DEBUG_MODE: string;

    // Facebook/Meta
    FACEBOOK_APP_ID: string;
    FACEBOOK_APP_SECRET: string;

    // App URLs
    VETIFY_API_URL: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_BASE_URL?: string;

    // PocketBase (legacy)
    NEXT_PUBLIC_POCKETBASE_URL?: string;

    // Environment
    NODE_ENV: 'development' | 'production' | 'test';
  }
} 