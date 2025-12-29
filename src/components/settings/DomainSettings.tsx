'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Loader2,
  Globe,
  Save,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DomainVerificationStatus {
  status: 'pending' | 'verified' | 'failed' | 'error';
  message: string;
  cnameTarget?: string;
}

interface DomainData {
  domain: string | null;
  domainVerified: boolean;
  slug: string;
  dnsStatus: DomainVerificationStatus | null;
  cnameTarget: string;
}

interface DomainSettingsProps {
  tenantId: string;
}

export function DomainSettings({ }: DomainSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [data, setData] = useState<DomainData | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const fetchDomainSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/domain');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar configuración');
      }

      setData(result.data);
      setNewDomain(result.data.domain || '');
    } catch (error) {
      console.error('Error fetching domain settings:', error);
      toast.error('Error al cargar la configuración del dominio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomainSettings();
  }, [fetchDomainSettings]);

  const handleDomainChange = (value: string) => {
    setNewDomain(value.toLowerCase().trim());
    setHasChanges(value !== (data?.domain || ''));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/domain', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: newDomain || null }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar');
      }

      setData(result.data);
      setHasChanges(false);
      toast.success(result.message);
    } catch (error) {
      console.error('Error saving domain:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar el dominio');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const response = await fetch('/api/tenant/verify-domain', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al verificar');
      }

      setData(result.data);
      toast.success(result.message);
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast.error(error instanceof Error ? error.message : 'Error al verificar el dominio');
    } finally {
      setVerifying(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar el dominio personalizado?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/settings/domain', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: null }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar');
      }

      setData(result.data);
      setNewDomain('');
      setHasChanges(false);
      toast.success('Dominio eliminado exitosamente');
    } catch (error) {
      console.error('Error removing domain:', error);
      toast.error('Error al eliminar el dominio');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Error al cargar la configuración</p>
        <Button onClick={fetchDomainSettings} variant="outline" className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (!data.domain) return null;

    if (data.domainVerified) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }

    switch (data.dnsStatus?.status) {
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    if (!data.domain) return null;

    if (data.domainVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="h-3 w-3" />
          Verificado
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <AlertCircle className="h-3 w-3" />
        Pendiente
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">Dominio Personalizado</h3>
        <p className="text-sm text-muted-foreground">
          Configura un dominio personalizado para tu página pública
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Estado del Dominio
            </div>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Domain Display */}
          {data.domain ? (
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <p className="font-medium">{data.domain}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.dnsStatus?.message || 'Verificando estado...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(`https://${data.domain}`, '_blank')}
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                  disabled={saving}
                  title="Eliminar dominio"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
              <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay dominio personalizado configurado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tu página pública está disponible en:{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                  vetify.app/{data.slug}
                </code>
              </p>
            </div>
          )}

          {/* Verification Button */}
          {data.domain && !data.domainVerified && (
            <Button
              onClick={handleVerify}
              variant="outline"
              disabled={verifying}
              className="w-full"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verificar Configuración DNS
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Domain Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {data.domain ? 'Cambiar Dominio' : 'Agregar Dominio'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Dominio</Label>
            <Input
              id="domain"
              type="text"
              value={newDomain}
              onChange={(e) => handleDomainChange(e.target.value)}
              placeholder="ejemplo.com"
              className="lowercase"
            />
            <p className="text-xs text-muted-foreground">
              Ingresa tu dominio sin incluir &quot;https://&quot; o &quot;www&quot;
            </p>
          </div>

          {hasChanges && (
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Dominio
            </Button>
          )}
        </CardContent>
      </Card>

      {/* DNS Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Instrucciones de Configuración DNS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para usar tu dominio personalizado, debes configurar un registro CNAME en tu proveedor de DNS.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 font-medium">Tipo</th>
                  <th className="text-left py-2 font-medium">Nombre/Host</th>
                  <th className="text-left py-2 font-medium">Valor/Apunta a</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2">CNAME</td>
                  <td className="py-2">
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                      @ o tu-subdominio
                    </code>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                        {data.cnameTarget}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(data.cnameTarget)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Nota importante
                </p>
                <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Los cambios de DNS pueden tardar hasta 48 horas en propagarse.</li>
                  <li>• El certificado SSL se genera automáticamente una vez verificado.</li>
                  <li>• Si usas Cloudflare, desactiva el proxy (nube naranja) temporalmente.</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
