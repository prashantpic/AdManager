export enum ShippingRuleConditionType {
  WEIGHT = 'WEIGHT', // Total shipment weight or parcel weight
  DIMENSIONS_VOLUME = 'DIMENSIONS_VOLUME', // Total shipment volume or parcel volume
  DIMENSIONS_MAX_SINGLE = 'DIMENSIONS_MAX_SINGLE', // Max single dimension (length, width, or height)
  DESTINATION_COUNTRY = 'DESTINATION_COUNTRY',
  DESTINATION_STATE_PROVINCE = 'DESTINATION_STATE_PROVINCE',
  DESTINATION_POSTAL_CODE = 'DESTINATION_POSTAL_CODE',
  ORDER_VALUE = 'ORDER_VALUE',
  PRODUCT_TYPE_INCLUDES = 'PRODUCT_TYPE_INCLUDES', // Checks if any item has one of the specified product types
  PRODUCT_TYPE_ALL_MATCH = 'PRODUCT_TYPE_ALL_MATCH', // Checks if all items have one of the specified product types
  PRODUCT_TYPE_EXCLUDES = 'PRODUCT_TYPE_EXCLUDES', // Checks if no item has one of the specified product types
  ORIGIN_COUNTRY = 'ORIGIN_COUNTRY',
  ORIGIN_STATE_PROVINCE = 'ORIGIN_STATE_PROVINCE',
  ORIGIN_POSTAL_CODE = 'ORIGIN_POSTAL_CODE',
  NUMBER_OF_ITEMS = 'NUMBER_OF_ITEMS', // Number of unique line items
  TOTAL_QUANTITY_OF_ITEMS = 'TOTAL_QUANTITY_OF_ITEMS', // Sum of quantities of all line items
}