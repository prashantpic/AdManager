resource "aws_api_gateway_api_key" "main" {
  for_each = var.api_keys_config

  name        = each.value.name
  description = lookup(each.value, "description", null)
  enabled     = lookup(each.value, "enabled", true)
  value       = lookup(each.value, "value", null) # If null, API Gateway generates the key value

  dynamic "stage_key" {
    # This block is deprecated and replaced by aws_api_gateway_usage_plan_key.
    # Keeping it for potential backward compatibility awareness or if older AWS provider versions are used.
    # However, for new configurations, aws_api_gateway_usage_plan_key is preferred.
    # If specified, it associates the key directly with stages without a usage plan.
    # This is generally NOT recommended if usage plans are being used.
    for_each = lookup(each.value, "stage_keys_direct_association", []) # This is a hypothetical variable not in current SDS
    content {
      rest_api_id = stage_key.value.rest_api_id
      stage_name  = stage_key.value.stage_name
    }
  }
  tags = merge(var.tags, lookup(each.value, "tags", {}))
}

resource "aws_api_gateway_usage_plan_key" "main" {
  # This resource creates an association between an API Key and a Usage Plan.
  # The key_id comes from an aws_api_gateway_api_key resource.
  # The usage_plan_id comes from an aws_api_gateway_usage_plan resource.

  # We need to iterate through api_keys_config and find the usage_plan_name to link to the usage_plan_id.
  # This assumes api_keys_config contains a 'usage_plan_name' field that maps to a key in var.usage_plans_config.

  for_each = {
    for k, v in var.api_keys_config : k => v
    if lookup(v, "usage_plan_name", null) != null && contains(keys(var.usage_plan_ids_map), v.usage_plan_name)
  }

  key_id        = aws_api_gateway_api_key.main[each.key].id
  key_type      = "API_KEY" # Or "SYSTEM" if applicable, usually API_KEY
  usage_plan_id = var.usage_plan_ids_map[each.value.usage_plan_name]

  depends_on = [
    aws_api_gateway_api_key.main,
    # aws_api_gateway_usage_plan.main # Implicitly handled if usage_plan_ids_map comes from usage_plans.tf output
  ]
}