variable "rest_api_id" {
  description = "The ID of the REST API to create a stage for."
  type        = string
}

variable "stage_name" {
  description = "Name of the stage (e.g., \"dev\", \"staging\", \"prod\")."
  type        = string
}

variable "deployment_triggers" {
  description = "A map of arbitrary values used to force a new deployment when they change (e.g., hash of OpenAPI spec or output from REST API module like rendered_openapi_spec)."
  type        = map(string)
  default     = {}
}

variable "deployment_description" {
  description = "Optional description for the API deployment."
  type        = string
  default     = ""
}

variable "stage_variables_map" {
  description = "Key-value pairs for stage variables."
  type        = map(string)
  default     = {}
}

variable "access_log_destination_arn" {
  description = "CloudWatch Log Group ARN for access logs. If null, access logs are disabled for this stage."
  type        = string
  default     = null
}

variable "access_log_format" {
  description = "Format for access logs. Required if access_log_destination_arn is set."
  type        = string
  default     = "$context.identity.sourceIp $context.identity.caller $context.identity.user [$context.requestTime] \"$context.httpMethod $context.resourcePath $context.protocol\" $context.status $context.responseLength $context.requestId"
}

variable "cache_cluster_enabled" {
  description = "Boolean indicating if cache cluster is enabled for this stage."
  type        = bool
  default     = false
}

variable "cache_cluster_size" {
  description = "Size of the cache cluster for this stage. Required if cache_cluster_enabled is true. Valid values: 0.5, 1.6, 6.1, 13.5, 28.4, 58.2, 118, 237."
  type        = string
  default     = null # e.g. "0.5"
}

variable "method_settings_config" {
  description = "Configuration for method-level overrides (throttling, caching, logging). List of objects."
  type = list(object({
    resource_path          = string # e.g., "*/*" for all methods, or "users/POST", or "users/{userId}/GET"
    # http_method         = string # Implicit in resource_path if like "users/POST" - AWS provider uses method_path which is "resource/METHOD" or "*/*"
    metrics_enabled        = optional(bool, false)
    logging_level          = optional(string, "OFF") # "OFF", "INFO", "ERROR"
    data_trace_enabled     = optional(bool, false)
    throttling_burst_limit = optional(number)        # -1 to disable override, or specific number
    throttling_rate_limit  = optional(number)        # -1 to disable override, or specific number
    caching_enabled        = optional(bool, false)
    cache_ttl_in_seconds   = optional(number, 300)
    cache_data_encrypted   = optional(bool, false)
  }))
  default = [
    { # Default settings for all methods in the stage if not overridden by more specific paths
      resource_path          = "*/*"
      metrics_enabled        = true
      logging_level          = "INFO" # Default, can be overridden by env var
      data_trace_enabled     = false
      throttling_burst_limit = null   # Use plan/global settings unless specified
      throttling_rate_limit  = null   # Use plan/global settings unless specified
      caching_enabled        = false  # Caching is per-method and depends on cache_cluster_enabled
      cache_ttl_in_seconds   = 300
      cache_data_encrypted   = false
    }
  ]
}

variable "xray_tracing_enabled" {
  description = "Specifies whether AWS X-Ray tracing is enabled for this method. Default is false."
  type        = bool
  default     = false
}

variable "tags" {
  description = "A map of tags to assign to the stage."
  type        = map(string)
  default     = {}
}