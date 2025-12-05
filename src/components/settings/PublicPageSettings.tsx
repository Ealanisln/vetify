'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import {
  Loader2,
  Save,
  RotateCcw,
  AlertCircle,
  Globe,
  Eye,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Clock,
  Palette,
  Plus,
  Trash2,
  GripVertical,
  Facebook,
  Instagram,
  Twitter,
  MessageCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { ThemeSelector } from './ThemeSelector';
import { ImageUploader } from '../ui/ImageUploader';
import type { ThemeId } from '@/lib/themes';

interface PublicHours {
  weekdays?: string;
  saturday?: string;
  sunday?: string;
}

interface PublicService {
  title: string;
  description: string;
  price?: string;
  icon?: string;
}

interface PublicSocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  whatsapp?: string;
}

interface PublicImages {
  hero?: string;
}

interface PublicPageData {
  slug: string;
  publicPageEnabled: boolean;
  publicBookingEnabled: boolean;
  publicDescription: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
  publicAddress: string | null;
  publicThemeColor: string | null;
  publicTheme: ThemeId | null;
  publicHours: PublicHours | null;
  publicServices: PublicService[] | null;
  publicSocialMedia: PublicSocialMedia | null;
  publicImages: PublicImages | null;
  logo: string | null;
}

interface PublicPageSettingsProps {
  tenantId: string;
}

const serviceIcons = [
  { value: 'stethoscope', label: 'Estetoscopio' },
  { value: 'syringe', label: 'Vacunas' },
  { value: 'scissors', label: 'Peluquería' },
  { value: 'heart', label: 'Corazón' },
  { value: 'bone', label: 'Hueso' },
  { value: 'paw', label: 'Pata' },
  { value: 'pill', label: 'Medicamentos' },
  { value: 'microscope', label: 'Laboratorio' },
];

export function PublicPageSettings({ }: PublicPageSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PublicPageData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'images' | 'theme' | 'hours' | 'services' | 'social'>('general');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/public-page');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar configuración');
      }

      setData(result.data);
    } catch (error) {
      console.error('Error fetching public page settings:', error);
      toast.error('Error al cargar la configuración de la página pública');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = <K extends keyof PublicPageData>(
    field: K,
    value: PublicPageData[K]
  ) => {
    if (!data) return;
    setData({ ...data, [field]: value });
    setHasChanges(true);
  };

  const handleHoursChange = (field: keyof PublicHours, value: string) => {
    if (!data) return;
    const currentHours = data.publicHours || {};
    setData({
      ...data,
      publicHours: { ...currentHours, [field]: value || undefined }
    });
    setHasChanges(true);
  };

  const handleSocialChange = (field: keyof PublicSocialMedia, value: string) => {
    if (!data) return;
    const currentSocial = data.publicSocialMedia || {};
    setData({
      ...data,
      publicSocialMedia: { ...currentSocial, [field]: value || undefined }
    });
    setHasChanges(true);
  };

  const handleAddService = () => {
    if (!data) return;
    const currentServices = data.publicServices || [];
    if (currentServices.length >= 10) {
      toast.error('Máximo 10 servicios permitidos');
      return;
    }
    setData({
      ...data,
      publicServices: [
        ...currentServices,
        { title: '', description: '', price: '', icon: 'stethoscope' }
      ]
    });
    setHasChanges(true);
  };

  const handleRemoveService = (index: number) => {
    if (!data) return;
    const currentServices = [...(data.publicServices || [])];
    currentServices.splice(index, 1);
    setData({ ...data, publicServices: currentServices });
    setHasChanges(true);
  };

  const handleServiceChange = (
    index: number,
    field: keyof PublicService,
    value: string
  ) => {
    if (!data) return;
    const currentServices = [...(data.publicServices || [])];
    currentServices[index] = { ...currentServices[index], [field]: value };
    setData({ ...data, publicServices: currentServices });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!data) return;

    try {
      setSaving(true);
      const response = await fetch('/api/settings/public-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicPageEnabled: data.publicPageEnabled,
          publicBookingEnabled: data.publicBookingEnabled,
          publicDescription: data.publicDescription,
          publicPhone: data.publicPhone,
          publicEmail: data.publicEmail,
          publicAddress: data.publicAddress,
          publicThemeColor: data.publicThemeColor,
          publicTheme: data.publicTheme,
          publicHours: data.publicHours,
          publicServices: data.publicServices?.filter(s => s.title.trim()),
          publicSocialMedia: data.publicSocialMedia,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar');
      }

      setData(result.data);
      setHasChanges(false);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving public page settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchData();
    setHasChanges(false);
    toast.info('Cambios descartados');
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
        <p className="text-gray-600 dark:text-gray-400">
          Error al cargar la configuración
        </p>
      </div>
    );
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${data.slug}`;

  return (
    <div className="space-y-6">
      {/* Status and Preview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={data.publicPageEnabled}
                  onCheckedChange={(checked) => handleChange('publicPageEnabled', checked)}
                />
                <Label className="font-medium">
                  {data.publicPageEnabled ? 'Página Pública Activa' : 'Página Pública Desactivada'}
                </Label>
              </div>
              <Badge variant={data.publicPageEnabled ? 'default' : 'secondary'}>
                {data.publicPageEnabled ? (
                  <><Globe className="h-3 w-3 mr-1" /> Visible</>
                ) : (
                  'Oculta'
                )}
              </Badge>
            </div>

            {data.publicPageEnabled && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                <Eye className="h-4 w-4" />
                Ver página pública
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {data.publicPageEnabled && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                URL de tu página: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">{publicUrl}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {[
          { id: 'general', label: 'General', icon: Globe },
          { id: 'images', label: 'Imagenes', icon: ImageIcon },
          { id: 'theme', label: 'Tema', icon: Palette },
          { id: 'hours', label: 'Horarios', icon: Clock },
          { id: 'services', label: 'Servicios', icon: GripVertical },
          { id: 'social', label: 'Redes Sociales', icon: MessageCircle },
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(id as typeof activeTab)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción de la Clínica</Label>
              <Textarea
                id="description"
                placeholder="Describe tu clínica veterinaria..."
                value={data.publicDescription || ''}
                onChange={(e) => handleChange('publicDescription', e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500">
                {(data.publicDescription || '').length}/1000 caracteres
              </p>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Teléfono
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+52 999 123 4567"
                  value={data.publicPhone || ''}
                  onChange={(e) => handleChange('publicPhone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@miclinica.com"
                  value={data.publicEmail || ''}
                  onChange={(e) => handleChange('publicEmail', e.target.value)}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Dirección
              </Label>
              <Textarea
                id="address"
                placeholder="Calle, número, colonia, ciudad..."
                value={data.publicAddress || ''}
                onChange={(e) => handleChange('publicAddress', e.target.value)}
                rows={2}
              />
            </div>

            {/* Theme Color */}
            <div className="space-y-2">
              <Label htmlFor="themeColor" className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Color Principal
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="themeColor"
                  value={data.publicThemeColor || '#75a99c'}
                  onChange={(e) => handleChange('publicThemeColor', e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={data.publicThemeColor || '#75a99c'}
                  onChange={(e) => handleChange('publicThemeColor', e.target.value)}
                  className="w-32 font-mono"
                  placeholder="#75a99c"
                />
                <div
                  className="w-20 h-10 rounded border"
                  style={{ backgroundColor: data.publicThemeColor || '#75a99c' }}
                />
              </div>
            </div>

            {/* Booking Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Reservas Online</Label>
                <p className="text-sm text-gray-500">
                  Permite a los clientes agendar citas desde la página pública
                </p>
              </div>
              <Switch
                checked={data.publicBookingEnabled}
                onCheckedChange={(checked) => handleChange('publicBookingEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Imagenes de la Clinica
            </CardTitle>
            <p className="text-sm text-gray-500">
              Sube el logo y la imagen principal de tu pagina publica
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <ImageUploader
              imageType="logo"
              currentImage={data.logo}
              aspectRatio="1:1"
              label="Logo de la Clinica"
              description="Se mostrara en la barra de navegacion y como favicon. Recomendado: 400x400px."
              onUpload={(url) => handleChange('logo', url)}
              onDelete={() => handleChange('logo', null)}
            />

            {/* Hero Image Upload */}
            <ImageUploader
              imageType="hero"
              currentImage={data.publicImages?.hero}
              aspectRatio="16:9"
              label="Imagen Principal (Hero)"
              description="Imagen destacada de la pagina publica. Recomendado: 1920x1080px."
              onUpload={(url) => {
                const currentImages = data.publicImages || {};
                handleChange('publicImages', { ...currentImages, hero: url });
              }}
              onDelete={() => {
                const currentImages = data.publicImages || {};
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { hero: _hero, ...rest } = currentImages;
                handleChange('publicImages', Object.keys(rest).length ? rest : null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <ThemeSelector
          selectedTheme={data.publicTheme || 'modern'}
          onThemeChange={(themeId) => {
            handleChange('publicTheme', themeId);
          }}
        />
      )}

      {/* Hours Tab */}
      {activeTab === 'hours' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios de Atención
            </CardTitle>
            <p className="text-sm text-gray-500">
              Estos horarios se mostrarán en tu página pública
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weekdays">Lunes a Viernes</Label>
              <Input
                id="weekdays"
                placeholder="9:00 AM - 6:00 PM"
                value={data.publicHours?.weekdays || ''}
                onChange={(e) => handleHoursChange('weekdays', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saturday">Sábado</Label>
              <Input
                id="saturday"
                placeholder="9:00 AM - 2:00 PM"
                value={data.publicHours?.saturday || ''}
                onChange={(e) => handleHoursChange('saturday', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sunday">Domingo</Label>
              <Input
                id="sunday"
                placeholder="Cerrado"
                value={data.publicHours?.sunday || ''}
                onChange={(e) => handleHoursChange('sunday', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GripVertical className="h-5 w-5" />
              Servicios Destacados
            </CardTitle>
            <p className="text-sm text-gray-500">
              Lista de servicios que aparecerán en tu página pública (máximo 10)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data.publicServices || []).map((service, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg space-y-3 bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Servicio {index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveService(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      placeholder="Consulta General"
                      value={service.title}
                      onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio (opcional)</Label>
                    <Input
                      placeholder="$500"
                      value={service.price || ''}
                      onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Descripción del servicio..."
                    value={service.description}
                    onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icono</Label>
                  <select
                    value={service.icon || 'stethoscope'}
                    onChange={(e) => handleServiceChange(index, 'icon', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    {serviceIcons.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={handleAddService}
              disabled={(data.publicServices || []).length >= 10}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Servicio
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Social Media Tab */}
      {activeTab === 'social' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Redes Sociales
            </CardTitle>
            <p className="text-sm text-gray-500">
              Enlaces a tus perfiles en redes sociales
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" /> Facebook
              </Label>
              <Input
                id="facebook"
                type="url"
                placeholder="https://facebook.com/miclinica"
                value={data.publicSocialMedia?.facebook || ''}
                onChange={(e) => handleSocialChange('facebook', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" /> Instagram
              </Label>
              <Input
                id="instagram"
                type="url"
                placeholder="https://instagram.com/miclinica"
                value={data.publicSocialMedia?.instagram || ''}
                onChange={(e) => handleSocialChange('instagram', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" /> Twitter/X
              </Label>
              <Input
                id="twitter"
                type="url"
                placeholder="https://twitter.com/miclinica"
                value={data.publicSocialMedia?.twitter || ''}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+52 999 123 4567"
                value={data.publicSocialMedia?.whatsapp || ''}
                onChange={(e) => handleSocialChange('whatsapp', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Número de WhatsApp con código de país
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Tienes cambios sin guardar
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Descartar
            </Button>
            <Button onClick={handleSave} size="sm" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
