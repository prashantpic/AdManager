resource "aws_api_gateway_usage_plan" "this" {
  for_each = var.usage_plans_config

  name        = each.value.name
  description = lookup(each.value, "description", null)

  dynamic "api_stages" {
    for_each = lookup(each.value, "associated_api_stages", [])
    content {
      api_id = api_stages.value.api_id
      stage  = api_stages.value.stage
      dynamic "throttle" {
        for_each = lookup(api_stages.value, "throttle", null) != null ? [api_stages.value.throttle] : []
        content {
          path        = throttle.value.path # e.g., "/*" or "/pets/GET"
          burst_limit = lookup(throttle.value, "burst_limit", null)
          rate_limit  = lookup(throttle.value, "rate_limit", null)
        }
      }
    }
  }

  dynamic "throttle_settings" {
    for_each = lookup(each.value, "throttle_settings", null) != null ? [each.value.throttle_settings] : []
    content {
      burst_limit = lookup(throttle_settings.value, "burst_limit", null)
      rate_limit  = lookup(throttle_settings.value, "rate_limit", null)
    }
  }

  dynamic "quota_settings" {
    for_each = lookup(each.value, "quota_settings", null) != null ? [each.value.quota_settings] : []
    content {
      limit  = quota_settings.value.limit
      offset = lookup(quota_settings.value, "offset", null)
      period = quota_settings.value.period # "DAY", "WEEK", or "MONTH"
    }
  }

  tags = var.tags
}

resource "aws_api_gateway_api_key" "this" {
  for_each = var.api_keys_config

  name        = each.value.name
  description = lookup(each.value, "description", null)
  enabled     = lookup(each.value, "enabled", true)
  value       = lookup(each.value, "value", null) # If null, API Gateway generates the key value.

  tags = merge(var.tags, lookup(each.value, "tags", {}))
}

resource "aws_api_gateway_usage_plan_key" "this" {
  # Create a flattened list of {api_key_name, usage_plan_name}
  # Then iterate over it, looking up IDs.
  locals {
    key_to_plan_associations = flatten([
      for key_name, key_config in var.api_keys_config : [
        for plan_name in lookup(key_config, "associated_usage_plan_names", []) : {
          key_name  = key_name
          plan_name = plan_name
        } if aws_api_gateway_api_key.this[key_name] != null && aws_api_gateway_usage_plan.this[plan_name] != null
      ]
    ])
  }

  for_each = { for assoc in local.key_to_plan_associations : "${assoc.key_name}-${assoc.plan_name}" => assoc }

  key_id        = aws_api_gateway_api_key.this[each.value.key_name].id
  usage_plan_id = aws_api_gateway_usage_plan.this[each.value.plan_name].id

  # Ensure this resource depends on both the key and the plan it links
  depends_on = [
    aws_api_gateway_api_key.this,
    aws_api_gateway_usage_plan.this
  ]
}