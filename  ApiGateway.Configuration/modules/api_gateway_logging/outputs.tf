output "api_gateway_log_group_arn" {
  description = "ARN of the created CloudWatch Log Group for API Gateway logs."
  value       = var.enabled ? aws_cloudwatch_log_group.api_gateway_logs[0].arn : null
}

output "api_gateway_log_group_name" {
  description = "Name of the created CloudWatch Log Group for API Gateway logs."
  value       = var.enabled ? aws_cloudwatch_log_group.api_gateway_logs[0].name : null
}

output "cloudwatch_role_arn_for_api_gateway" {
  description = "ARN of the IAM role for API Gateway to push logs to CloudWatch."
  value       = var.enabled ? (
    var.create_cloudwatch_role ? aws_iam_role.apigw_cloudwatch_logging_role[0].arn : var.existing_cloudwatch_role_arn
  ) : null
}

# Outputs to be consumed by api_gateway_stages module for consistent logging configuration
output "access_log_format_config" {
  description = "The configured access log format to be used by stages."
  value       = var.default_access_log_format
}

output "execution_logging_level_config" {
  description = "The configured execution logging level to be used by stages."
  value       = var.default_execution_logging_level
}

output "execution_data_trace_enabled_config" {
  description = "The configured data trace enabled flag for execution logs to be used by stages."
  value       = var.default_execution_data_trace_enabled
}

output "execution_metrics_enabled_config" {
  description = "The configured metrics enabled flag for execution logs to be used by stages."
  value       = var.default_execution_metrics_enabled
}