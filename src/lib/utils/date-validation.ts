/**
 * Date validation utilities for the Vetify application
 *
 * This module provides robust date validation functions with proper error handling,
 * timezone normalization, and comprehensive validation rules.
 */

/**
 * Validates and normalizes a date of birth string to a UTC Date object.
 *
 * This function is designed for validating dates where:
 * - The input is expected in ISO 8601 format (YYYY-MM-DD)
 * - The date should be in the past (not in the future)
 * - The date should be reasonable (not before 1900)
 * - The time component should be normalized to UTC midnight (00:00:00.000Z)
 *
 * @param dateStr - The date string to validate, expected in YYYY-MM-DD format
 * @returns A Date object set to UTC midnight of the validated date
 * @throws {Error} If the date string is invalid, in the future, or before 1900
 *
 * @example
 * ```typescript
 * // Valid usage
 * const birthDate = validateDateOfBirth('2020-01-15');
 * console.log(birthDate.toISOString()); // "2020-01-15T00:00:00.000Z"
 *
 * // Invalid date format
 * try {
 *   validateDateOfBirth('15/01/2020'); // Throws error
 * } catch (error) {
 *   console.error(error.message); // "Invalid date format..."
 * }
 *
 * // Future date
 * try {
 *   validateDateOfBirth('2030-01-01'); // Throws error
 * } catch (error) {
 *   console.error(error.message); // "Date of birth cannot be in the future..."
 * }
 * ```
 */
export function validateDateOfBirth(dateStr: string): Date {
  // Trim whitespace to handle copy-paste scenarios
  const trimmedDate = dateStr.trim();

  // Append UTC midnight to ensure consistent timezone handling
  // This prevents "off by one day" bugs caused by timezone conversions
  const date = new Date(trimmedDate + 'T00:00:00.000Z');

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    throw new Error(
      'Invalid date format for dateOfBirth. Expected YYYY-MM-DD (ISO 8601 format).'
    );
  }

  // Define reasonable date boundaries
  const minDate = new Date('1900-01-01T00:00:00.000Z');
  const maxDate = new Date();
  maxDate.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

  // Validate date is not before 1900
  if (date < minDate) {
    throw new Error(
      'Date of birth cannot be before January 1, 1900.'
    );
  }

  // Validate date is not in the future
  if (date > maxDate) {
    throw new Error(
      'Date of birth cannot be in the future. Please enter a valid past date.'
    );
  }

  return date;
}

/**
 * Validates a date string and returns a boolean indicating validity.
 *
 * This is a non-throwing variant of validateDateOfBirth that returns
 * a boolean instead of throwing an error.
 *
 * @param dateStr - The date string to validate
 * @returns true if the date is valid, false otherwise
 *
 * @example
 * ```typescript
 * if (isValidDateOfBirth('2020-01-15')) {
 *   // Proceed with valid date
 * } else {
 *   // Handle invalid date
 * }
 * ```
 */
export function isValidDateOfBirth(dateStr: string): boolean {
  try {
    validateDateOfBirth(dateStr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a Date object to YYYY-MM-DD format suitable for HTML date inputs.
 *
 * @param date - The Date object to format
 * @returns A string in YYYY-MM-DD format
 *
 * @example
 * ```typescript
 * const date = new Date('2020-01-15T00:00:00.000Z');
 * formatDateForInput(date); // "2020-01-15"
 * ```
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Gets the maximum allowed date (today) formatted for HTML date input.
 *
 * This is useful for setting the `max` attribute on date input elements
 * to prevent users from selecting future dates.
 *
 * @returns Today's date in YYYY-MM-DD format
 *
 * @example
 * ```tsx
 * <input
 *   type="date"
 *   max={getMaxDateForInput()}
 *   // Prevents selection of future dates
 * />
 * ```
 */
export function getMaxDateForInput(): string {
  const today = new Date();
  return formatDateForInput(today);
}
