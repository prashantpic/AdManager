output "rest_api_id" {
  description = "The ID of the deployed REST API."
  value       = module.api_gateway_rest.rest_api_id
}

output "rest_api_execution_arn" {
  description = "The execution ARN of the deployed REST API."
  value       = module.api_gateway_rest.execution_arn
}

output "rest_api_invoke_urls" {
  description = "Map of stage names to REST API invoke URLs."
  value = {
    for stage_name, stage_module in module.api_gateway_stages :
    stage_name => stage_module.invoke_url
  }
}

output "graphql_api_endpoint" {
  description = "GraphQL API endpoint URL (if enabled)."
  value       = var.enable_graphql_api ? module.api_gateway_graphql[0].graphql_api_endpoint : null
}

output "graphql_api_id" {
  description = "GraphQL API ID (if enabled)."
  value       = var.enable_graphql_api ? module.api_gateway_graphql[0].graphql_api_id : null
}

output "custom_domain_cloudfront_domain_name" {
  description = "The CloudFront distribution domain name associated with the custom domain (if enabled)."
  value       = var.enable_custom_domain && var.custom_domain_module_config.enabled ? module.api_gateway_domain_name[0].cloudfront_domain_name : null
}

output "api_gateway_log_group_arn" {
  description = "ARN of the CloudWatch Log Group for API Gateway access logs (if logging enabled)."
  value       = var.enable_api_logging ? module.api_gateway_logging[0].api_gateway_log_group_arn : null
}

output "api_key_ids" {
  description = "Map of API key names to their IDs (if advanced usage plans enabled)."
  value       = var.enable_advanced_usage_plans ? module.api_gateway_usage_plans[0].api_key_ids : {}
}

output "api_key_values_sensitive" {
  description = "Map of API key names to their values (handle with care, sensitive output)."
  value       = var.enable_advanced_usage_plans ? module.api_gateway_usage_plans[0].api_key_values : {}
  sensitive   = true
}

output "usage_plan_ids" {
  description = "Map of usage plan names to their IDs (if advanced usage plans enabled)."
  value       = var.enable_advanced_usage_plans ? module.api_gateway_usage_plans[0].usage_plan_ids : {}
}

output "authorizer_ids" {
  description = "Map of authorizer names to their IDs."
  value       = module.api_gateway_authorizers.authorizer_ids
}