'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Loader2,
  QrCode,
  Download,
  Image as ImageIcon,
  FileText,
  Globe,
  Calendar,
  Wrench,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  getClinicPageUrl,
  QR_SIZE_OPTIONS,
  QR_TARGET_PAGE_OPTIONS,
  type QrTargetPage,
  type QrSize,
} from '@/lib/qr-url-utils';

interface TenantQrData {
  slug: string;
  name: string;
  logo: string | null;
  publicThemeColor: string | null;
  publicPageEnabled: boolean;
}

interface QrCodeGeneratorProps {
  tenantId: string;
}

export function QrCodeGenerator({ }: QrCodeGeneratorProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [tenantData, setTenantData] = useState<TenantQrData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // QR Configuration
  const [targetPage, setTargetPage] = useState<QrTargetPage>('landing');
  const [size, setSize] = useState<QrSize>(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [logoEnabled, setLogoEnabled] = useState(false);

  // Refs for download
  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const qrSvgRef = useRef<HTMLDivElement>(null);

  // Fetch tenant data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/settings/public-page');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Error al cargar datos');
        }

        setTenantData({
          slug: result.data.slug,
          name: result.data.name || 'Tu Clínica',
          logo: result.data.logo,
          publicThemeColor: result.data.publicThemeColor,
          publicPageEnabled: result.data.publicPageEnabled,
        });

        // Set default color from tenant theme if available
        if (result.data.publicThemeColor) {
          setFgColor(result.data.publicThemeColor);
        }
      } catch (err) {
        console.error('Error fetching tenant data:', err);
        setError('Error al cargar la configuración');
        toast.error('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get the current QR URL
  const qrUrl = tenantData ? getClinicPageUrl(tenantData.slug, targetPage) : '';

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      toast.success('URL copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar la URL');
    }
  };

  // Download as PNG
  const downloadPNG = async () => {
    if (!qrCanvasRef.current || !tenantData) return;

    setDownloading(true);
    try {
      const canvas = qrCanvasRef.current.querySelector('canvas');
      if (!canvas) throw new Error('Canvas not found');

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr-${tenantData.slug}-${targetPage}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('QR descargado como PNG');
    } catch (err) {
      console.error('Error downloading PNG:', err);
      toast.error('Error al descargar el QR');
    } finally {
      setDownloading(false);
    }
  };

  // Download as SVG
  const downloadSVG = () => {
    if (!qrSvgRef.current || !tenantData) return;

    setDownloading(true);
    try {
      const svgElement = qrSvgRef.current.querySelector('svg');
      if (!svgElement) throw new Error('SVG not found');

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `qr-${tenantData.slug}-${targetPage}.svg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('QR descargado como SVG');
    } catch (err) {
      console.error('Error downloading SVG:', err);
      toast.error('Error al descargar el QR');
    } finally {
      setDownloading(false);
    }
  };

  // Download as PDF
  const downloadPDF = async () => {
    if (!qrCanvasRef.current || !tenantData) return;

    setDownloading(true);
    try {
      const canvas = qrCanvasRef.current.querySelector('canvas');
      if (!canvas) throw new Error('Canvas not found');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add clinic name as title
      pdf.setFontSize(18);
      pdf.text(tenantData.name, 105, 30, { align: 'center' });

      // Add QR code centered
      const qrSize = 80; // 80mm
      const xPos = (210 - qrSize) / 2; // Center on A4 width
      pdf.addImage(imgData, 'PNG', xPos, 50, qrSize, qrSize);

      // Add URL below QR
      pdf.setFontSize(10);
      pdf.text(qrUrl, 105, 140, { align: 'center' });

      // Add target page description
      const targetLabel = QR_TARGET_PAGE_OPTIONS.find(opt => opt.value === targetPage)?.label || '';
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(`Escanea para visitar: ${targetLabel}`, 105, 150, { align: 'center' });

      // Add footer
      pdf.setTextColor(150);
      pdf.text('Generado con Vetify', 105, 280, { align: 'center' });

      pdf.save(`qr-${tenantData.slug}-${targetPage}.pdf`);

      toast.success('QR descargado como PDF');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Error al descargar el QR');
    } finally {
      setDownloading(false);
    }
  };

  // Get icon for target page
  const getTargetIcon = (target: QrTargetPage) => {
    switch (target) {
      case 'landing':
        return Globe;
      case 'booking':
        return Calendar;
      case 'services':
        return Wrench;
      default:
        return Globe;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="qr-loading">
        <Loader2 className="h-8 w-8 animate-spin text-[#75a99c]" />
      </div>
    );
  }

  // Error state
  if (error || !tenantData) {
    return (
      <Card className="border border-red-200 dark:border-red-800">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-red-600 dark:text-red-400">
              {error || 'Error al cargar la configuración'}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="qr-generator-container">
      {/* Warning if public page is disabled */}
      {!tenantData.publicPageEnabled && (
        <Card className="border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20" data-testid="public-page-warning">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Página pública deshabilitada
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Los códigos QR no funcionarán hasta que habilites tu página pública en la sección &quot;Página Pública&quot;.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Preview Section */}
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5" />
              Vista Previa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Preview */}
            <div
              className="flex items-center justify-center p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
              data-testid="qr-preview"
              ref={qrSvgRef}
            >
              <QRCodeSVG
                value={qrUrl}
                size={Math.min(size, 256)}
                fgColor={fgColor}
                bgColor={bgColor}
                level="H"
                includeMargin={true}
                imageSettings={
                  logoEnabled && tenantData.logo
                    ? {
                        src: tenantData.logo,
                        height: Math.min(size, 256) * 0.2,
                        width: Math.min(size, 256) * 0.2,
                        excavate: true,
                      }
                    : undefined
                }
              />
            </div>

            {/* Hidden canvas for downloads */}
            <div ref={qrCanvasRef} className="hidden">
              <QRCodeCanvas
                value={qrUrl}
                size={size}
                fgColor={fgColor}
                bgColor={bgColor}
                level="H"
                includeMargin={true}
                imageSettings={
                  logoEnabled && tenantData.logo
                    ? {
                        src: tenantData.logo,
                        height: size * 0.2,
                        width: size * 0.2,
                        excavate: true,
                      }
                    : undefined
                }
              />
            </div>

            {/* URL Display */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <code className="flex-1 text-sm text-gray-600 dark:text-gray-300 truncate" data-testid="qr-url-display">
                {qrUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="shrink-0"
              >
                <a href={qrUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={downloadPNG}
                disabled={downloading}
                className="flex-1 bg-[#75a99c] hover:bg-[#5b9788] text-white"
                data-testid="download-png"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-2" />
                )}
                PNG
              </Button>
              <Button
                onClick={downloadSVG}
                disabled={downloading}
                variant="outline"
                className="flex-1 border-gray-300 dark:border-gray-600"
                data-testid="download-svg"
              >
                <Download className="h-4 w-4 mr-2" />
                SVG
              </Button>
              <Button
                onClick={downloadPDF}
                disabled={downloading}
                variant="outline"
                className="flex-1 border-gray-300 dark:border-gray-600"
                data-testid="download-pdf"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Section */}
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target Page Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                URL de destino
              </Label>
              <div className="space-y-2">
                {QR_TARGET_PAGE_OPTIONS.map((option) => {
                  const Icon = getTargetIcon(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        targetPage === option.value
                          ? 'border-[#75a99c] bg-[#75a99c]/10 dark:bg-[#75a99c]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="targetPage"
                        value={option.value}
                        checked={targetPage === option.value}
                        onChange={(e) => setTargetPage(e.target.value as QrTargetPage)}
                        className="sr-only"
                        aria-label={option.label}
                      />
                      <Icon className={`h-5 w-5 ${targetPage === option.value ? 'text-[#75a99c]' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{option.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div className="space-y-2">
              <Label htmlFor="size" className="text-sm font-medium text-gray-700 dark:text-gray-300" aria-label="tamaño del código QR">
                Tamaño
              </Label>
              <select
                id="size"
                value={size}
                onChange={(e) => setSize(Number(e.target.value) as QrSize)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#75a99c]"
                data-testid="size-select"
                aria-label="tamaño"
              >
                {QR_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Configuration */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Colores
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fgColor" className="text-xs text-gray-500 dark:text-gray-400" aria-label="color del código QR">
                    Color QR
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="fgColor"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      data-testid="fg-color-input"
                      aria-label="color"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#75a99c]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bgColor" className="text-xs text-gray-500 dark:text-gray-400">
                    Fondo
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="bgColor"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#75a99c]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="logo-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Incluir logo
                </Label>
                <Switch
                  id="logo-toggle"
                  checked={logoEnabled}
                  onCheckedChange={setLogoEnabled}
                  disabled={!tenantData.logo}
                  data-testid="logo-toggle"
                />
              </div>
              {!tenantData.logo && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sube un logo en la sección &quot;Página Pública&quot; para poder incluirlo en el QR.
                </p>
              )}
              {logoEnabled && tenantData.logo && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" data-testid="logo-options">
                  <Image
                    src={tenantData.logo}
                    alt="Logo de la clínica"
                    width={40}
                    height={40}
                    className="rounded object-contain bg-white"
                    unoptimized
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    El logo se mostrará en el centro del código QR.
                  </p>
                </div>
              )}
            </div>

            {/* Reset to defaults */}
            <Button
              variant="outline"
              onClick={() => {
                setTargetPage('landing');
                setSize(256);
                setFgColor(tenantData.publicThemeColor || '#000000');
                setBgColor('#FFFFFF');
                setLogoEnabled(false);
              }}
              className="w-full border-gray-300 dark:border-gray-600"
            >
              Restablecer valores predeterminados
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
