/**
 * Unit tests for color manipulation utilities
 * Tests for dark mode color generation and color conversion functions
 */

import {
  hexToHSL,
  hslToHex,
  adjustLightness,
  adjustSaturation,
  getRelativeLuminance,
  isLightColor,
  generateDarkColors,
  adjustColorForDarkMode,
  getContrastRatio,
  meetsWCAGContrast,
  getContrastTextColor,
  generateThemeCSSVariables,
  publicThemeVars,
} from '../color-utils';

describe('Color Utils', () => {
  describe('hexToHSL', () => {
    it('should convert pure red to HSL', () => {
      const result = hexToHSL('#ff0000');
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert pure green to HSL', () => {
      const result = hexToHSL('#00ff00');
      expect(result.h).toBe(120);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert pure blue to HSL', () => {
      const result = hexToHSL('#0000ff');
      expect(result.h).toBe(240);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert white to HSL', () => {
      const result = hexToHSL('#ffffff');
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.l).toBe(100);
    });

    it('should convert black to HSL', () => {
      const result = hexToHSL('#000000');
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.l).toBe(0);
    });

    it('should handle hex without # prefix', () => {
      const result = hexToHSL('ff0000');
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert the brand color correctly', () => {
      // Vetify brand color #75a99c
      const result = hexToHSL('#75a99c');
      expect(result.h).toBeGreaterThan(150);
      expect(result.h).toBeLessThan(170);
      expect(result.s).toBeGreaterThan(20);
      expect(result.s).toBeLessThan(40);
      expect(result.l).toBeGreaterThan(50);
      expect(result.l).toBeLessThan(60);
    });
  });

  describe('hslToHex', () => {
    it('should convert pure red HSL to hex', () => {
      const result = hslToHex(0, 100, 50);
      expect(result.toLowerCase()).toBe('#ff0000');
    });

    it('should convert pure green HSL to hex', () => {
      const result = hslToHex(120, 100, 50);
      expect(result.toLowerCase()).toBe('#00ff00');
    });

    it('should convert pure blue HSL to hex', () => {
      const result = hslToHex(240, 100, 50);
      expect(result.toLowerCase()).toBe('#0000ff');
    });

    it('should convert white HSL to hex', () => {
      const result = hslToHex(0, 0, 100);
      expect(result.toLowerCase()).toBe('#ffffff');
    });

    it('should convert black HSL to hex', () => {
      const result = hslToHex(0, 0, 0);
      expect(result.toLowerCase()).toBe('#000000');
    });

    it('should handle all hue segments (0-360)', () => {
      // Yellow: h=60
      expect(hslToHex(60, 100, 50).toLowerCase()).toBe('#ffff00');
      // Cyan: h=180
      expect(hslToHex(180, 100, 50).toLowerCase()).toBe('#00ffff');
      // Magenta: h=300
      expect(hslToHex(300, 100, 50).toLowerCase()).toBe('#ff00ff');
    });
  });

  describe('hexToHSL and hslToHex roundtrip', () => {
    const testColors = [
      '#75a99c', // Brand color
      '#ff5733', // Orange-red
      '#3498db', // Blue
      '#2ecc71', // Green
      '#9b59b6', // Purple
      '#1abc9c', // Teal
    ];

    testColors.forEach((color) => {
      it(`should roundtrip convert ${color}`, () => {
        const hsl = hexToHSL(color);
        const hex = hslToHex(hsl.h, hsl.s, hsl.l);
        // Allow small rounding differences
        const original = hexToHSL(color);
        const converted = hexToHSL(hex);
        expect(converted.h).toBeCloseTo(original.h, 0);
        expect(converted.s).toBeCloseTo(original.s, 0);
        expect(converted.l).toBeCloseTo(original.l, 0);
      });
    });
  });

  describe('adjustLightness', () => {
    it('should increase lightness', () => {
      const original = hexToHSL('#808080'); // Gray, 50% lightness
      const adjusted = adjustLightness('#808080', 20);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.l).toBe(original.l + 20);
    });

    it('should decrease lightness', () => {
      const original = hexToHSL('#808080');
      const adjusted = adjustLightness('#808080', -20);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.l).toBe(original.l - 20);
    });

    it('should clamp at 100', () => {
      const adjusted = adjustLightness('#ffffff', 50);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.l).toBe(100);
    });

    it('should clamp at 0', () => {
      const adjusted = adjustLightness('#000000', -50);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.l).toBe(0);
    });
  });

  describe('adjustSaturation', () => {
    it('should increase saturation', () => {
      const adjusted = adjustSaturation('#75a99c', 20);
      const original = hexToHSL('#75a99c');
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.s).toBe(Math.min(original.s + 20, 100));
    });

    it('should decrease saturation', () => {
      const adjusted = adjustSaturation('#ff0000', -50);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.s).toBe(50);
    });

    it('should clamp at 100', () => {
      const adjusted = adjustSaturation('#ff0000', 50);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.s).toBe(100);
    });

    it('should clamp at 0', () => {
      const adjusted = adjustSaturation('#808080', -100);
      const adjustedHSL = hexToHSL(adjusted);
      expect(adjustedHSL.s).toBe(0);
    });
  });

  describe('getRelativeLuminance', () => {
    it('should return ~1 for white', () => {
      expect(getRelativeLuminance('#ffffff')).toBeCloseTo(1, 2);
    });

    it('should return 0 for black', () => {
      expect(getRelativeLuminance('#000000')).toBe(0);
    });

    it('should return correct luminance for pure colors', () => {
      // Red has less luminance than green
      const redLum = getRelativeLuminance('#ff0000');
      const greenLum = getRelativeLuminance('#00ff00');
      const blueLum = getRelativeLuminance('#0000ff');
      expect(greenLum).toBeGreaterThan(redLum);
      expect(redLum).toBeGreaterThan(blueLum);
    });
  });

  describe('isLightColor', () => {
    it('should return true for white', () => {
      expect(isLightColor('#ffffff')).toBe(true);
    });

    it('should return false for black', () => {
      expect(isLightColor('#000000')).toBe(false);
    });

    it('should return true for light colors', () => {
      expect(isLightColor('#f0f0f0')).toBe(true);
      expect(isLightColor('#ffff00')).toBe(true); // Yellow is light
    });

    it('should return false for dark colors', () => {
      expect(isLightColor('#333333')).toBe(false);
      expect(isLightColor('#0000ff')).toBe(false); // Blue is dark
    });
  });

  describe('generateDarkColors', () => {
    it('should return all required color properties', () => {
      const colors = generateDarkColors('#75a99c');

      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('primaryHover');
      expect(colors).toHaveProperty('primaryLight');
      expect(colors).toHaveProperty('secondary');
      expect(colors).toHaveProperty('accent');
      expect(colors).toHaveProperty('background');
      expect(colors).toHaveProperty('backgroundAlt');
      expect(colors).toHaveProperty('text');
      expect(colors).toHaveProperty('textMuted');
      expect(colors).toHaveProperty('border');
      expect(colors).toHaveProperty('cardBg');
      expect(colors).toHaveProperty('heroGradientFrom');
      expect(colors).toHaveProperty('heroGradientTo');
    });

    it('should return valid hex colors', () => {
      const colors = generateDarkColors('#75a99c');
      const hexRegex = /^#[0-9a-fA-F]{6}$/;

      Object.values(colors).forEach((color) => {
        expect(color).toMatch(hexRegex);
      });
    });

    it('should use standard dark backgrounds', () => {
      const colors = generateDarkColors('#75a99c');
      expect(colors.background).toBe('#111827'); // gray-900
      expect(colors.backgroundAlt).toBe('#1f2937'); // gray-800
      expect(colors.cardBg).toBe('#1f2937'); // gray-800
    });

    it('should use standard dark text colors', () => {
      const colors = generateDarkColors('#75a99c');
      expect(colors.text).toBe('#f9fafb'); // gray-50
      expect(colors.textMuted).toBe('#9ca3af'); // gray-400
    });

    it('should preserve hue from primary color', () => {
      const originalHSL = hexToHSL('#75a99c');
      const colors = generateDarkColors('#75a99c');
      const primaryHSL = hexToHSL(colors.primary);

      expect(primaryHSL.h).toBe(originalHSL.h);
    });

    it('should lighten dark primary colors', () => {
      // Very dark input color
      const colors = generateDarkColors('#1a3327'); // Dark green
      const primaryHSL = hexToHSL(colors.primary);

      // Should be lightened for visibility
      expect(primaryHSL.l).toBeGreaterThan(30);
    });

    it('should generate different variants for different inputs', () => {
      const redColors = generateDarkColors('#ff0000');
      const blueColors = generateDarkColors('#0000ff');

      expect(redColors.primary).not.toBe(blueColors.primary);
      expect(redColors.heroGradientFrom).not.toBe(blueColors.heroGradientFrom);
    });
  });

  describe('adjustColorForDarkMode', () => {
    const testColor = '#75a99c';

    it('should darken backgrounds', () => {
      const adjusted = adjustColorForDarkMode(testColor, 'background');
      const adjustedHSL = hexToHSL(adjusted);
      const originalHSL = hexToHSL(testColor);

      expect(adjustedHSL.l).toBeLessThan(originalHSL.l);
    });

    it('should lighten text colors', () => {
      const adjusted = adjustColorForDarkMode('#333333', 'text');
      const adjustedHSL = hexToHSL(adjusted);
      const originalHSL = hexToHSL('#333333');

      expect(adjustedHSL.l).toBeGreaterThan(originalHSL.l);
    });

    it('should create subtle borders', () => {
      const adjusted = adjustColorForDarkMode(testColor, 'border');
      const adjustedHSL = hexToHSL(adjusted);

      expect(adjustedHSL.l).toBe(30);
    });

    it('should make accents vibrant', () => {
      const adjusted = adjustColorForDarkMode(testColor, 'accent');
      const adjustedHSL = hexToHSL(adjusted);
      const originalHSL = hexToHSL(testColor);

      expect(adjustedHSL.s).toBeGreaterThanOrEqual(originalHSL.s);
    });

    it('should lighten dark buttons', () => {
      const darkButton = '#222222';
      const adjusted = adjustColorForDarkMode(darkButton, 'button');
      const adjustedHSL = hexToHSL(adjusted);
      const originalHSL = hexToHSL(darkButton);

      expect(adjustedHSL.l).toBeGreaterThan(originalHSL.l);
    });

    it('should not change already light buttons', () => {
      const lightButton = '#aaaaaa';
      const adjusted = adjustColorForDarkMode(lightButton, 'button');
      expect(adjusted).toBe(lightButton);
    });
  });

  describe('getContrastRatio', () => {
    it('should return 21 for black and white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 1 for same colors', () => {
      const ratio = getContrastRatio('#75a99c', '#75a99c');
      expect(ratio).toBe(1);
    });

    it('should be symmetric', () => {
      const ratio1 = getContrastRatio('#ff0000', '#0000ff');
      const ratio2 = getContrastRatio('#0000ff', '#ff0000');
      expect(ratio1).toBeCloseTo(ratio2, 10);
    });

    it('should return higher ratio for more contrasting colors', () => {
      const highContrast = getContrastRatio('#000000', '#ffffff');
      const lowContrast = getContrastRatio('#666666', '#999999');
      expect(highContrast).toBeGreaterThan(lowContrast);
    });
  });

  describe('meetsWCAGContrast', () => {
    it('should pass for black on white (normal text)', () => {
      expect(meetsWCAGContrast('#000000', '#ffffff')).toBe(true);
    });

    it('should fail for low contrast (normal text)', () => {
      expect(meetsWCAGContrast('#777777', '#999999')).toBe(false);
    });

    it('should have lower threshold for large text', () => {
      // This might pass for large text but fail for normal
      const fg = '#666666';
      const bg = '#ffffff';
      const ratio = getContrastRatio(fg, bg);

      // If ratio is between 3 and 4.5, it should pass large but fail normal
      if (ratio >= 3 && ratio < 4.5) {
        expect(meetsWCAGContrast(fg, bg, true)).toBe(true);
        expect(meetsWCAGContrast(fg, bg, false)).toBe(false);
      }
    });

    it('should pass 4.5:1 ratio for normal text', () => {
      // Gray #767676 on white is exactly 4.5:1
      expect(meetsWCAGContrast('#767676', '#ffffff')).toBe(true);
    });
  });

  describe('getContrastTextColor', () => {
    it('should return dark text for light backgrounds', () => {
      expect(getContrastTextColor('#ffffff')).toBe('#111827');
      expect(getContrastTextColor('#f0f0f0')).toBe('#111827');
    });

    it('should return light text for dark backgrounds', () => {
      expect(getContrastTextColor('#000000')).toBe('#f9fafb');
      expect(getContrastTextColor('#1a1a1a')).toBe('#f9fafb');
    });

    it('should return appropriate text for medium colors', () => {
      const result = getContrastTextColor('#75a99c');
      // Either dark or light text should be valid
      expect(['#111827', '#f9fafb']).toContain(result);
    });
  });

  describe('publicThemeVars', () => {
    it('should have all required CSS variable names', () => {
      expect(publicThemeVars.primary).toBe('--public-primary');
      expect(publicThemeVars.primaryHover).toBe('--public-primary-hover');
      expect(publicThemeVars.background).toBe('--public-bg');
      expect(publicThemeVars.text).toBe('--public-text');
      expect(publicThemeVars.border).toBe('--public-border');
    });

    it('should have unique values', () => {
      const values = Object.values(publicThemeVars);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('generateThemeCSSVariables', () => {
    it('should return light and dark color sets', () => {
      const result = generateThemeCSSVariables('#75a99c');
      expect(result).toHaveProperty('light');
      expect(result).toHaveProperty('dark');
    });

    it('should include all CSS variables in both modes', () => {
      const result = generateThemeCSSVariables('#75a99c');
      const expectedVars = Object.values(publicThemeVars);

      expectedVars.forEach((varName) => {
        expect(result.light).toHaveProperty(varName);
        expect(result.dark).toHaveProperty(varName);
      });
    });

    it('should use the primary color in light mode', () => {
      const primary = '#75a99c';
      const result = generateThemeCSSVariables(primary);
      expect(result.light[publicThemeVars.primary]).toBe(primary);
    });

    it('should use dark backgrounds in dark mode', () => {
      const result = generateThemeCSSVariables('#75a99c');
      expect(result.dark[publicThemeVars.background]).toBe('#111827');
    });

    it('should allow light color overrides', () => {
      const result = generateThemeCSSVariables('#75a99c', {
        background: '#fafafa',
      });
      expect(result.light[publicThemeVars.background]).toBe('#fafafa');
    });

    it('should return valid hex colors in all variables', () => {
      const result = generateThemeCSSVariables('#75a99c');
      const hexRegex = /^#[0-9a-fA-F]{6}$/;

      Object.values(result.light).forEach((color) => {
        expect(color).toMatch(hexRegex);
      });

      Object.values(result.dark).forEach((color) => {
        expect(color).toMatch(hexRegex);
      });
    });
  });
});
