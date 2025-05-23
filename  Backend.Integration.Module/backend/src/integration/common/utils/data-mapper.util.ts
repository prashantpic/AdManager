export class DataMapperUtil {
  /**
   * Transforms the keys of an object based on a provided key map.
   * If a key in the object is not found in the keyMap, it remains unchanged.
   * @param obj - The object whose keys are to be transformed.
   * @param keyMap - A record mapping original keys to new keys.
   * @returns A new object with transformed keys.
   */
  public static transformKeys(obj: any, keyMap: Record<string, string>): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => DataMapperUtil.transformKeys(item, keyMap));
    }

    return Object.keys(obj).reduce((accumulator, key) => {
      const newKey = keyMap[key] || key;
      accumulator[newKey] = DataMapperUtil.transformKeys(obj[key], keyMap); // Recursively transform nested objects
      return accumulator;
    }, {} as any);
  }

  /**
   * Converts a string from camelCase or PascalCase to snake_case.
   * @param str - The string to convert.
   * @returns The snake_case version of the string.
   */
  public static toSnakeCase(str: string): string {
    if (!str) return '';
    return str
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // Handle sequences of uppercase letters followed by an uppercase and lowercase (e.g. HTTPStatus -> HTTP_Status)
      .replace(/([a-z\d])([A-Z])/g, '$1_$2') // Handle lowercase/digit followed by uppercase (e.g. camelCase -> camel_Case)
      .toLowerCase();
  }

  /**
   * Converts a string from snake_case or kebab-case to camelCase.
   * @param str - The string to convert.
   * @returns The camelCase version of the string.
   */
  public static toCamelCase(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', ''),
      );
  }
}