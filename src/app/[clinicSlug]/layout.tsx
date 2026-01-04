import { notFound } from 'next/navigation';
import { getTenantBySlug, hasPublicTeam } from '../../lib/tenant';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';
import { DynamicPublicTheme } from '../../components/public/DynamicPublicTheme';
import { WhatsAppButton } from '../../components/public/WhatsAppButton';
import { getTheme } from '../../lib/themes';
import type { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ clinicSlug: string }> 
}): Promise<Metadata> {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);
  
  if (!tenant) {
    return {
      title: 'Clínica no encontrada'
    };
  }

  return {
    title: `${tenant.name} | Clínica Veterinaria`,
    description: tenant.publicDescription || `Agenda tu cita en ${tenant.name}`,
    openGraph: {
      title: tenant.name,
      description: tenant.publicDescription || `Agenda tu cita en ${tenant.name}`,
      type: 'website',
      url: `https://vetify.app/${tenant.slug}`,
    }
  };
}

export default async function PublicLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;
  const tenant = await getTenantBySlug(clinicSlug);

  if (!tenant || !tenant.publicPageEnabled) {
    notFound();
  }

  const hasGallery = (tenant.publicImages?.gallery?.length ?? 0) > 0;
  const hasTeam = await hasPublicTeam(tenant.id);

  // Get theme colors for the tenant
  const theme = getTheme(tenant.publicTheme);
  const primaryColor = tenant.publicThemeColor || theme.colors.primary;

  return (
    <DynamicPublicTheme primaryColor={primaryColor} themeColors={theme.colors}>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <PublicNavbar tenant={{ ...tenant, hasGallery, hasTeam }} />
        <main className="flex-1">
          {children}
        </main>
        <PublicFooter tenant={tenant} />

        {/* Floating WhatsApp button */}
        {tenant.publicPhone && (
          <WhatsAppButton
            phoneNumber={tenant.publicPhone}
            clinicName={tenant.name}
            themeColor={primaryColor}
          />
        )}
      </div>
    </DynamicPublicTheme>
  );
} 