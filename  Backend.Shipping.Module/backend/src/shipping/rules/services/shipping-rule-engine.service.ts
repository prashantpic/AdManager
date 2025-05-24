import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ShippingRuleRepository } from '../repositories/shipping-rule.repository';
import { ShipmentDetailsModel } from '../../core/models/shipment-details.model';
import { ShippingRuleEntity } from '../entities/shipping-rule.entity';
// These interfaces and enums will be defined in their respective files in a later iteration.
import {
  ShippingRuleConditionInterface,
  ConditionOperator,
} from '../interfaces/shipping-rule-condition.interface';
import { ShippingRuleConditionType } from '../../core/enums/shipping-rule-condition-type.enum';
import { ShippingProductType } from '../../core/enums/product-type.enum';


@Injectable()
export class ShippingRuleEngineService {
  private readonly logger = new Logger(ShippingRuleEngineService.name);

  constructor(
    @InjectRepository(ShippingRuleEntity)
    private readonly ruleRepository: ShippingRuleRepository,
  ) {}

  /**
   * Evaluates active shipping rules for a merchant against shipment details.
   * Returns rules that match, ordered by priority.
   */
  async evaluateRules(
    merchantId: string,
    shipmentDetails: ShipmentDetailsModel,
  ): Promise<ShippingRuleEntity[]> {
    const activeRules = await this.ruleRepository.find({
      where: { merchantId, isActive: true },
      order: { priority: 'ASC' }, // Lower number = higher priority
    });

    const matchingRules: ShippingRuleEntity[] = [];
    for (const rule of activeRules) {
      if (this.doesRuleMatch(shipmentDetails, rule)) {
        matchingRules.push(rule);
      }
    }
    return matchingRules;
  }

  private doesRuleMatch(shipmentDetails: ShipmentDetailsModel, rule: ShippingRuleEntity): boolean {
    if (!rule.conditions || rule.conditions.length === 0) {
      return true; // A rule with no conditions always matches (if active)
    }
    for (const condition of rule.conditions) {
      if (!this.isConditionSatisfied(shipmentDetails, condition)) {
        return false; // If any condition is not met, the rule doesn't match
      }
    }
    return true; // All conditions met
  }

  private isConditionSatisfied(
    shipmentDetails: ShipmentDetailsModel,
    condition: ShippingRuleConditionInterface,
  ): boolean {
    let shipmentValue: any;
    let conditionValue = condition.value; // For scalar comparisons
    const conditionValues = condition.values; // For IN/NOT_IN comparisons

    // Normalize units if necessary (e.g., convert all weights to KG for comparison)
    // This example assumes units are consistent or pre-normalized.
    // A real implementation would need robust unit conversion.

    switch (condition.type) {
      case ShippingRuleConditionType.WEIGHT:
        shipmentValue = shipmentDetails.totalWeight; // Assumes totalWeight is calculated correctly
        break;
      case ShippingRuleConditionType.DIMENSIONS: // Assuming this means total volume for simplicity
        shipmentValue = shipmentDetails.totalVolume; // Assumes totalVolume is calculated correctly
        break;
      case ShippingRuleConditionType.DESTINATION_COUNTRY:
        shipmentValue = shipmentDetails.destinationAddress.countryCode;
        break;
      case ShippingRuleConditionType.DESTINATION_STATE:
        shipmentValue = shipmentDetails.destinationAddress.stateProvince;
        break;
      case ShippingRuleConditionType.DESTINATION_POSTAL_CODE:
        shipmentValue = shipmentDetails.destinationAddress.postalCode;
        break;
      case ShippingRuleConditionType.ORDER_VALUE:
        shipmentValue = shipmentDetails.totalOrderValue;
        break;
      case ShippingRuleConditionType.PRODUCT_TYPE:
        // For product type, we check if *any* line item's product type matches the condition
        // if operator is EQ/IN, or if *none* match if operator is NE/NOT_IN.
        const productTypesInShipment = shipmentDetails.lineItems.map(item => item.productType).filter(Boolean) as ShippingProductType[];
        return this.evaluateListCondition(productTypesInShipment, condition);
      case ShippingRuleConditionType.ITEM_QUANTITY: // Assuming this refers to total quantity of all items
        shipmentValue = shipmentDetails.lineItems.reduce((sum, item) => sum + item.quantity, 0);
        break;
      // Add more cases for other ShippingRuleConditionType values
      default:
        this.logger.warn(`Unsupported condition type: ${condition.type}`);
        return false;
    }

    // Scalar comparisons
    if (conditionValue !== undefined) {
        switch (condition.operator) {
            case ConditionOperator.EQ: return shipmentValue == conditionValue; // Use '==' for potential type coercion if values are mixed
            case ConditionOperator.NE: return shipmentValue != conditionValue;
            case ConditionOperator.GT: return shipmentValue > conditionValue!;
            case ConditionOperator.LT: return shipmentValue < conditionValue!;
            case ConditionOperator.GTE: return shipmentValue >= conditionValue!;
            case ConditionOperator.LTE: return shipmentValue <= conditionValue!;
            case ConditionOperator.BETWEEN:
              return shipmentValue >= condition.minValue! && shipmentValue <= condition.maxValue!;
            case ConditionOperator.STARTS_WITH:
                 return typeof shipmentValue === 'string' && typeof conditionValue === 'string' && shipmentValue.startsWith(conditionValue);
            case ConditionOperator.ENDS_WITH:
                 return typeof shipmentValue === 'string' && typeof conditionValue === 'string' && shipmentValue.endsWith(conditionValue);
            default: // Handled by list condition below or invalid operator for scalar
                break;
        }
    }

    // List comparisons (IN, NOT_IN) for non-product-type conditions
    if (conditionValues && (condition.operator === ConditionOperator.IN || condition.operator === ConditionOperator.NOT_IN)) {
        const isInList = conditionValues.includes(shipmentValue);
        return condition.operator === ConditionOperator.IN ? isInList : !isInList;
    }


    this.logger.warn(`Unsupported operator ${condition.operator} for condition type ${condition.type} with given values.`);
    return false;
  }

  private evaluateListCondition(
    shipmentValues: (string | number | ShippingProductType)[],
    condition: ShippingRuleConditionInterface
  ): boolean {
    const { operator, value, values } = condition;

    if (operator === ConditionOperator.IN) {
        // For PRODUCT_TYPE with IN: true if any shipment product type is in condition.values
        return shipmentValues.some(sv => values?.includes(sv));
    }
    if (operator === ConditionOperator.NOT_IN) {
        // For PRODUCT_TYPE with NOT_IN: true if no shipment product type is in condition.values
        return !shipmentValues.some(sv => values?.includes(sv));
    }
     if (operator === ConditionOperator.EQ) { // A specific product type must be present
        return shipmentValues.includes(value as ShippingProductType);
    }
    if (operator === ConditionOperator.NE) { // A specific product type must NOT be present
        return !shipmentValues.includes(value as ShippingProductType);
    }

    this.logger.warn(`Unsupported list operator ${operator} for condition type ${condition.type}`);
    return false;
  }
}