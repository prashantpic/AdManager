import { randomBytes } from 'crypto';

/**
 * @description Collection of common string manipulation utility functions.
 */
export class StringUtils {
  /**
   * Capitalizes the first letter of a string.
   * @param str - The input string.
   * @returns The capitalized string.
   */
  public static capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Truncates a string to a specified length, appending a suffix if truncated.
   * @param str - The input string.
   * @param length - The maximum length of the string.
   * @param suffix - The suffix to append if the string is truncated. Defaults to '...'.
   * @returns The truncated string.
   */
  public static truncate(str: string, length: number, suffix = '...'): string {
    if (!str || str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }

  /**
   * Generates a random string of a specified length.
   * @param length - The desired length of the random string.
   * @param characters - A string of characters to choose from. Defaults to alphanumeric characters.
   * @returns A random string.
   */
  public static generateRandomString(
    length: number,
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ): string {
    if (length <= 0) return '';
    let result = '';
    const charactersLength = characters.length;
    const randomValues = randomBytes(length);

    for (let i = 0; i < length; i++) {
      result += characters.charAt(randomValues[i] % charactersLength);
    }
    return result;
  }

  /**
   * Checks if a string is null, undefined, or empty.
   * @param str - The string to check.
   * @returns True if the string is null, undefined, or empty; false otherwise.
   */
  public static isNullOrEmpty(str: string | null | undefined): boolean {
    return str === null || str === undefined || str.trim() === '';
  }

  /**
   * Converts a string from camelCase to snake_case.
   * @param str The input camelCase string.
   * @returns The snake_case version of the string.
   */
  public static camelToSnakeCase(str: string): string {
    if (!str) return '';
    return str
      .replace(/[\w]([A-Z])/g, (m) => m[0] + '_' + m[1])
      .toLowerCase();
  }

  /**
   * Converts a string from snake_case to camelCase.
   * @param str The input snake_case string.
   * @returns The camelCase version of the string.
   */
  public static snakeToCamelCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().replace(/([-_][a-z])/g, (group) =>
      group
        .toUpperCase()
        .replace('-', '')
        .replace('_', ''),
    );
  }
}