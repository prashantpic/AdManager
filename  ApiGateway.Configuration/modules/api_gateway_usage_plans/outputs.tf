output "usage_plan_ids" {
  description = "Map of usage plan names to their IDs."
  value       = { for k, v in aws_api_gateway_usage_plan.this : k => v.id }
}

output "api_key_ids" {
  description = "Map of API key names to their IDs."
  value       = { for k, v in aws_api_gateway_api_key.this : k => v.id }
}

output "api_key_names_and_ids" {
  description = "Map of API key names to their actual names (which are IDs in this case if not specified)."
  value       = { for k, v in aws_api_gateway_api_key.this : k => v.name }
}


output "api_key_values" {
  description = "Map of API key names to their values. Sensitive."
  value       = { for k, v in aws_api_gateway_api_key.this : k => v.value }
  sensitive   = true
}

output "usage_plan_key_associations" {
  description = "Details of API key to usage plan associations."
  value       = aws_api_gateway_usage_plan_key.this
}