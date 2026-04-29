import { prisma } from '@/lib/prisma';

async function getSystemMetrics() {
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [
    auditEventsCount,
    emailsSent,
    emailsFailed,
    activeTrials,
    expiredTrials,
    paidTenants,
  ] = await Promise.all([
    // SecurityAuditLog events (last month)
    prisma.securityAuditLog.count({
      where: { timestamp: { gte: oneMonthAgo } },
    }),

    // Emails sent successfully (last month)
    prisma.emailLog.count({
      where: {
        createdAt: { gte: oneMonthAgo },
        status: { in: ['SENT', 'DELIVERED'] },
      },
    }),

    // Emails failed (last month)
    prisma.emailLog.count({
      where: {
        createdAt: { gte: oneMonthAgo },
        status: 'FAILED',
      },
    }),

    // Active trials
    prisma.tenant.count({
      where: {
        isTrialPeriod: true,
        trialEndsAt: { gt: now },
        status: 'ACTIVE',
      },
    }),

    // Expired trials
    prisma.tenant.count({
      where: {
        isTrialPeriod: true,
        trialEndsAt: { lt: now },
        status: 'ACTIVE',
      },
    }),

    // Paid tenants (subscriptionStatus ACTIVE)
    prisma.tenant.count({
      where: {
        subscriptionStatus: 'ACTIVE',
        isTrialPeriod: false,
      },
    }),
  ]);

  const totalTrials = activeTrials + expiredTrials;
  const conversionRate = totalTrials + paidTenants > 0
    ? ((paidTenants / (totalTrials + paidTenants)) * 100).toFixed(1)
    : '0.0';

  const totalEmails = emailsSent + emailsFailed;
  const emailSuccessRate = totalEmails > 0
    ? ((emailsSent / totalEmails) * 100).toFixed(1)
    : '—';

  return {
    auditEventsCount,
    emailsSent,
    emailsFailed,
    emailSuccessRate,
    activeTrials,
    expiredTrials,
    paidTenants,
    conversionRate,
  };
}

export async function SystemAnalytics() {
  const metrics = await getSystemMetrics();

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Métricas del Sistema
      </h3>

      <div className="space-y-4">
        {/* Audit Events */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Eventos de auditoría (30d)</span>
          <span className={`text-sm font-medium ${metrics.auditEventsCount === 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            {metrics.auditEventsCount.toLocaleString()}
            {metrics.auditEventsCount === 0 && (
              <span className="ml-1 text-xs text-red-400">⚠ sin registros</span>
            )}
          </span>
        </div>

        {/* Emails */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Emails enviados (30d)</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {metrics.emailsSent.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Emails fallidos (30d)</span>
          <span className={`text-sm font-medium ${metrics.emailsFailed > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            {metrics.emailsFailed.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de éxito emails</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {metrics.emailSuccessRate}%
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

        {/* Trials & Conversion */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Trials activos</span>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {metrics.activeTrials}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Trials expirados</span>
          <span className={`text-sm font-medium ${metrics.expiredTrials > 0 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
            {metrics.expiredTrials}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tenants con plan pago</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {metrics.paidTenants}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de conversión</span>
          <span className={`text-sm font-medium ${parseFloat(metrics.conversionRate) === 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            {metrics.conversionRate}%
          </span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Datos en tiempo real desde la base de datos
        </p>
      </div>
    </div>
  );
}
