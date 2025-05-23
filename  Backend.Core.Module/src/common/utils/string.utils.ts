/**
 * @class StringUtils
 * @description Provides utility functions for common string operations.
 */
export class StringUtils {
  /**
   * Capitalizes the first letter of a string.
   * @param str The input string.
   * @returns The capitalized string, or an empty string if input is null/undefined.
   */
  static capitalize(str: string | null | undefined): string {
    if (!str) {
      return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Truncates a string to a specified length and appends an ellipsis if truncated.
   * @param str The input string.
   * @param length The maximum length of the string.
   * @param ellipsis The ellipsis string to append (default: '...').
   * @returns The truncated string.
   */
  static truncate(str: string | null | undefined, length: number, ellipsis = '...'): string {
    if (!str) {
      return '';
    }
    if (str.length <= length) {
      return str;
    }
    return str.substring(0, length - ellipsis.length) + ellipsis;
  }

  /**
   * Generates a random alphanumeric string of a specified length.
   * @param length The desired length of the random string.
   * @returns A random alphanumeric string.
   */
  static generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  /**
   * Checks if a string is null, undefined, or empty.
   * @param str The string to check.
   * @returns True if the string is null, undefined, or empty; false otherwise.
   */
  static isEmpty(str: string | null | undefined): boolean {
    return str === null || str === undefined || str.trim() === '';
  }

  /**
   * Checks if a string is null, undefined, or consists only of whitespace.
   * @param str The string to check.
   * @returns True if the string is null, undefined, or consists only of whitespace; false otherwise.
   */
  static isBlank(str: string | null | undefined): boolean {
    return str === null || str === undefined || /^\s*$/.test(str);
  }

  /**
   * Converts a string from camelCase to snake_case.
   * Example: "camelCaseString" -> "camel_case_string"
   * @param str The camelCase string.
   * @returns The snake_case string.
   */
  static camelToSnakeCase(str: string): string {
    if (!str) return '';
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Converts a string from snake_case to camelCase.
   * Example: "snake_case_string" -> "snakeCaseString"
   * @param str The snake_case string.
   * @returns The camelCase string.
   */
  static snakeToCamelCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().replace(/([-_][a-z])/g, (group) =>
      group
        .toUpperCase()
        .replace('-', '')
        .replace('_', ''),
    );
  }
}