'use client';

import { Check, Palette } from 'lucide-react';
import { getAllThemes, type ThemeId, type Theme } from '@/lib/themes';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ThemeSelectorProps {
  selectedTheme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
}

function ThemePreviewCard({
  theme,
  isSelected,
  onClick,
}: {
  theme: Theme;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left rounded-xl overflow-hidden border-2 transition-all duration-200
        ${isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      {/* Theme Preview */}
      <div
        className="h-32 relative"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.heroGradientFrom} 0%, ${theme.colors.heroGradientTo} 100%)`
        }}
      >
        {/* Mini preview mockup */}
        <div className="absolute inset-4 flex flex-col">
          {/* Header mockup */}
          <div
            className="h-3 w-20 rounded mb-2"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <div
            className="h-2 w-32 rounded opacity-60"
            style={{ backgroundColor: theme.colors.textMuted }}
          />

          {/* Cards mockup */}
          <div className="flex gap-2 mt-auto">
            <div
              className="flex-1 h-10 rounded"
              style={{
                backgroundColor: theme.colors.cardBg,
                boxShadow: theme.layout.shadowStyle !== 'none' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                borderRadius: theme.layout.borderRadius,
              }}
            />
            <div
              className="flex-1 h-10 rounded"
              style={{
                backgroundColor: theme.colors.cardBg,
                boxShadow: theme.layout.shadowStyle !== 'none' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                borderRadius: theme.layout.borderRadius,
              }}
            />
          </div>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Theme Info */}
      <div
        className="p-3"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <h3
            className="font-semibold text-sm"
            style={{ color: theme.colors.text }}
          >
            {theme.name}
          </h3>
        </div>
        <p
          className="text-xs"
          style={{ color: theme.colors.textMuted }}
        >
          {theme.description}
        </p>

        {/* Color palette preview */}
        <div className="flex gap-1 mt-2">
          {[
            theme.colors.primary,
            theme.colors.secondary,
            theme.colors.accent,
            theme.colors.background,
          ].map((color, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border border-gray-200"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </button>
  );
}

export function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  const themes = getAllThemes();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Tema de la Página
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecciona un estilo visual para tu página pública
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((theme) => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              isSelected={selectedTheme === theme.id}
              onClick={() => onThemeChange(theme.id)}
            />
          ))}
        </div>

        {/* Active theme details */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Tema seleccionado</h4>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg"
              style={{
                backgroundColor: themes.find(t => t.id === selectedTheme)?.colors.primary,
              }}
            />
            <div>
              <p className="font-semibold">
                {themes.find(t => t.id === selectedTheme)?.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {themes.find(t => t.id === selectedTheme)?.description}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
