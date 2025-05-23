variable "enabled" {
  description = "Flag to enable/disable the creation of API Gateway logging resources."
  type        = bool
  default     = false
}

variable "log_group_name_prefix" {
  description = "Prefix for the CloudWatch Log Group name. A common pattern is `/aws/apigateway/your-api-name`."
  type        = string
  default     = "/aws/apigateway/AdManagerDefault" # Should be customized
}

variable "log_retention_in_days" {
  description = "Number of days to retain API Gateway logs in CloudWatch. 0 for indefinite."
  type        = number
  default     = 30
}

variable "log_group_kms_key_id" {
  description = "Optional: The ARN of the KMS Key to use for encrypting the log group."
  type        = string
  default     = null
}

variable "create_cloudwatch_role" {
  description = "Whether to create an IAM role for API Gateway to write to CloudWatch Logs."
  type        = bool
  default     = true
}

variable "cloudwatch_role_name_prefix" {
  description = "Prefix for the IAM role name created for API Gateway CloudWatch logging. Used if create_cloudwatch_role is true."
  type        = string
  default     = "admanager"
}

variable "existing_cloudwatch_role_arn" {
  description = "ARN of an existing IAM role for API Gateway to write to CloudWatch Logs. Used if create_cloudwatch_role is false."
  type        = string
  default     = null
}

# Variables that define logging configurations to be OUTPUT by this module
# and consumed by the api_gateway_stages module.
variable "default_access_log_format" {
  description = "Default access log format string to be output by this module for stages to use."
  type        = string
  default     = "$context.identity.sourceIp $context.identity.caller $context.identity.user [$context.requestTime] \"$context.httpMethod $context.resourcePath $context.protocol\" $context.status $context.responseLength $context.requestId"
}

variable "default_execution_logging_level" {
  description = "Default execution logging level (e.g., 'INFO', 'ERROR', 'OFF') to be output for stages."
  type        = string
  default     = "INFO"
  validation {
    condition     = contains(["INFO", "ERROR", "OFF"], var.default_execution_logging_level)
    error_message = "Logging level must be INFO, ERROR, or OFF."
  }
}

variable "default_execution_data_trace_enabled" {
  description = "Default for whether to log full request/response data for execution logs, to be output for stages."
  type        = bool
  default     = false
}

variable "default_execution_metrics_enabled" {
  description = "Default for whether to enable detailed CloudWatch metrics for execution logs, to be output for stages."
  type        = bool
  default     = true
}

variable "tags" {
  description = "A map of tags to assign to resources created by this module."
  type        = map(string)
  default     = {}
}