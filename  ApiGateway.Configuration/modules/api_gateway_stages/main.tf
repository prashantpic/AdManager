resource "aws_api_gateway_deployment" "this" {
  rest_api_id = var.rest_api_id
  description = var.deployment_description != "" ? var.deployment_description : "Deployment for stage ${var.stage_name}"

  # Triggers for a new deployment. This should be based on changes to the API definition.
  # Examples: hash of the OpenAPI spec, or specific outputs from the REST API module.
  triggers = var.deployment_triggers

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "this" {
  stage_name    = var.stage_name
  rest_api_id   = var.rest_api_id
  deployment_id = aws_api_gateway_deployment.this.id
  description   = "Stage ${var.stage_name} for API ${var.rest_api_id}"

  variables = var.stage_variables_map
  tags      = var.tags

  cache_cluster_enabled = var.cache_cluster_enabled
  cache_cluster_size    = var.cache_cluster_enabled ? var.cache_cluster_size : null

  dynamic "access_log_settings" {
    for_each = var.access_log_destination_arn != null ? [1] : []
    content {
      destination_arn = var.access_log_destination_arn
      format          = var.access_log_format
    }
  }

  # Default method settings for all methods in this stage ( * / * )
  # These can be overridden by more specific settings in method_settings_config
  # Note: The aws_api_gateway_method_settings resource is more flexible for multiple path/method settings
  # However, the stage resource itself has a `default_method_settings` block (not directly in TF provider)
  # and individual `method_settings` can be specified which applies to `*/*`.
  # The provider uses `aws_api_gateway_method_settings` for path-specific settings.
  # If var.method_settings_config is provided, it implies using aws_api_gateway_method_settings.

  # X-Ray Tracing
  xray_tracing_enabled = var.xray_tracing_enabled

  # Default throttling applied to all methods in the stage, can be overridden by usage plans or method settings
  # These are not directly part of aws_api_gateway_stage but rather through method_settings.
  # The spec mentions "throttling_settings" for the stage resource, but it's typically per method.
  # Let's assume these are global settings for * / * unless overridden by method_settings_config.
}

# Configure method-specific settings
resource "aws_api_gateway_method_settings" "this" {
  for_each = { for idx, setting in var.method_settings_config : idx => setting }

  rest_api_id = var.rest_api_id
  stage_name  = aws_api_gateway_stage.this.stage_name
  method_path = each.value.resource_path # e.g., "*/*" for all, or "specificPath/GET"

  settings {
    metrics_enabled        = lookup(each.value, "metrics_enabled", false)
    logging_level          = lookup(each.value, "logging_level", "OFF") # "OFF", "INFO", "ERROR"
    data_trace_enabled     = lookup(each.value, "data_trace_enabled", false)
    throttling_burst_limit = lookup(each.value, "throttling_burst_limit", -1) # -1 to disable, or a number
    throttling_rate_limit  = lookup(each.value, "throttling_rate_limit", -1)  # -1 to disable, or a number
    caching_enabled        = lookup(each.value, "caching_enabled", false) && var.cache_cluster_enabled
    cache_ttl_in_seconds   = lookup(each.value, "caching_enabled", false) && var.cache_cluster_enabled ? lookup(each.value, "cache_ttl_in_seconds", 300) : null
    cache_data_encrypted   = lookup(each.value, "caching_enabled", false) && var.cache_cluster_enabled ? lookup(each.value, "cache_data_encrypted", false) : null
    # require_authorization_for_cache_control = # bool
    # unauthorized_cache_control_header_strategy = # "FAIL_WITH_403", "SUCCEED_WITH_RESPONSE_HEADER", "SUCCEED_WITHOUT_RESPONSE_HEADER"
  }
}