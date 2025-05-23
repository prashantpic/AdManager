resource "aws_api_gateway_usage_plan" "main" {
  for_each = var.usage_plans_config

  name         = each.value.name
  description  = lookup(each.value, "description", null)

  dynamic "api_stages" {
    for_each = lookup(each.value, "api_stages", [])
    content {
      api_id = api_stages.value.api_id
      stage  = api_stages.value.stage
      dynamic "throttle" {
        for_each = lookup(api_stages.value, "throttle", [])
        content {
          path   = throttle.value.path
          rate_limit = lookup(throttle.value, "rate_limit", null)
          burst_limit = lookup(throttle.value, "burst_limit", null)
        }
      }
    }
  }

  dynamic "quota_settings" {
    for_each = lookup(each.value, "quota_settings", null) != null ? [each.value.quota_settings] : []
    content {
      limit  = quota_settings.value.limit
      period = quota_settings.value.period # "DAY", "WEEK", or "MONTH"
      offset = lookup(quota_settings.value, "offset", null)
    }
  }

  dynamic "throttle_settings" {
    for_each = lookup(each.value, "throttle_settings", null) != null ? [each.value.throttle_settings] : []
    content {
      burst_limit = throttle_settings.value.burst_limit
      rate_limit  = throttle_settings.value.rate_limit
    }
  }

  product_code = lookup(each.value, "product_code", null)
  tags         = merge(var.tags, lookup(each.value, "tags", {}))
}