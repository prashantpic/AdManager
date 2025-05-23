/**
 * @file Collection of common string manipulation utility functions.
 * @namespace AdManager.Platform.Backend.Core.Common.Utils
 */

export class StringUtils {
  /**
   * Capitalizes the first letter of a string.
   * @param str The string to capitalize.
   * @returns The capitalized string.
   */
  public static capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Truncates a string to a maximum length and appends a suffix.
   * @param str The string to truncate.
   * @param maxLength The maximum length of the truncated string (including suffix).
   * @param suffix The suffix to append if truncation occurs (default is '...').
   * @returns The truncated string.
   */
  public static truncate(
    str: string,
    maxLength: number,
    suffix = '...',
  ): string {
    if (!str || str.length <= maxLength) return str;
    return str.slice(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Generates a random string of a given length.
   * @param length The desired length of the random string.
   * @param characters The set of characters to use for generation (default is alphanumeric).
   * @returns A random string.
   */
  public static generateRandomString(
    length: number,
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ): string {
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  /**
   * Converts a string to camelCase.
   * @param str The string to convert.
   * @returns The camelCased string.
   */
  public static toCamelCase(str: string): string {
    if (!str) return '';
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^(.)/, (match) => match.toLowerCase());
  }

  /**
   * Converts a string to PascalCase.
   * @param str The string to convert.
   * @returns The PascalCased string.
   */
  public static toPascalCase(str: string): string {
    if (!str) return '';
    const camelCase = StringUtils.toCamelCase(str);
    return StringUtils.capitalize(camelCase);
  }

  /**
   * Converts a string to snake_case.
   * @param str The string to convert.
   * @returns The snake_cased string.
   */
  public static toSnakeCase(str: string): string {
    if (!str) return '';
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/[^a-zA-Z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  }
}