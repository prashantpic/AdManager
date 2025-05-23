variable "environment" {
  description = "The deployment environment (e.g., dev, staging, prod)."
  type        = string
}

variable "aws_region" {
  description = "The AWS region to deploy resources in."
  type        = string
}

variable "account_id" {
  description = "The AWS account ID."
  type        = string
}

variable "tags" {
  description = "A map of common tags to apply to all resources."
  type        = map(string)
  default     = {}
}

variable "api_name_prefix" {
  description = "Prefix for API Gateway names (e.g., 'AdManager')."
  type        = string
  default     = "App"
}

# Feature Flags
variable "enable_graphql_api" {
  description = "Feature flag to enable GraphQL API Gateway deployment."
  type        = bool
  default     = false
}

variable "enable_advanced_usage_plans" {
  description = "Feature flag to enable advanced Usage Plans and API Keys."
  type        = bool
  default     = false
}

variable "enable_custom_domain" {
  description = "Feature flag to enable Custom Domain configuration."
  type        = bool
  default     = false
}

variable "enable_api_logging" {
  description = "Feature flag to enable API Gateway logging."
  type        = bool
  default     = true
}

# Configuration for REST API Module
variable "rest_api_config" {
  description = "Configuration for the api_gateway_rest module."
  type = object({
    openapi_spec_file_path  = string
    lambda_integration_arns_map = map(string)
    http_integration_uris_map   = map(string)
    request_templates_map       = map(string) # Map of "METHOD /path/status" to VTL file path
    response_templates_map      = map(string) # Map of "METHOD /path/status" to VTL file path
    # Add other specific configs for rest api module if needed
  })
  default = {
    openapi_spec_file_path    = "modules/api_gateway_rest/openapi/api-v1.yaml" # Default path
    lambda_integration_arns_map = {}
    http_integration_uris_map   = {}
    request_templates_map       = {}
    response_templates_map      = {}
  }
}

# Configuration for Authorizers Module
variable "authorizers_config" {
  description = "Configuration for the api_gateway_authorizers module."
  type = object({
    jwt_authorizers_config = map(object({
      name                          = string
      identity_source               = string
      authorizer_credentials        = optional(string)
      authorizer_result_ttl_in_seconds = optional(number, 300)
      jwt_configuration = object({
        audience = optional(list(string))
        issuer   = optional(string)
      })
      provider_arns = optional(list(string)) # For COGNITO_USER_POOLS
      type          = optional(string, "JWT") # Or COGNITO_USER_POOLS
    }))
    lambda_authorizers_config = map(object({
      name                          = string
      type                          = optional(string, "TOKEN") # TOKEN or REQUEST
      authorizer_uri                = string # Lambda function ARN or alias/version ARN
      identity_source               = string
      authorizer_credentials        = optional(string) # IAM role ARN for API Gateway to invoke Lambda
      authorizer_result_ttl_in_seconds = optional(number, 300)
    }))
  })
  default = {
    jwt_authorizers_config    = {}
    lambda_authorizers_config = {}
  }
}

# Configuration for Stages Module (as a map)
variable "stages_config" {
  description = "Configuration for API Gateway stages. Map of stage names to their configurations."
  type = map(object({
    deployment_description       = optional(string, "Deployment for stage")
    stage_variables_map          = optional(map(string), {})
    access_log_format          = optional(string) # Required if logging enabled for stage
    cache_cluster_enabled      = optional(bool, false)
    cache_cluster_size         = optional(string) # e.g., "0.5", "1.6"
    method_settings_config = optional(list(object({
      resource_path          = string # e.g., "/*/*" or "/pets/GET"
      caching_enabled        = optional(bool, false)
      cache_data_encrypted   = optional(bool, false)
      cache_ttl_in_seconds   = optional(number, 300)
      throttling_burst_limit = optional(number)
      throttling_rate_limit  = optional(number)
      logging_level          = optional(string, "OFF") # INFO, ERROR, OFF
      data_trace_enabled     = optional(bool, false)
      metrics_enabled        = optional(bool, true)
      unauthorized_cache_control_header = optional(bool, true) # requireCredentialsForCaching
    })), [])
    stage_throttling_burst_limit = optional(number)
    stage_throttling_rate_limit  = optional(number)
  }))
  default = {
    "dev" = {
      deployment_description = "Development stage"
      access_log_format = jsonencode({
        requestId               = "$context.requestId"
        sourceIp                = "$context.identity.sourceIp"
        requestTime             = "$context.requestTime"
        httpMethod              = "$context.httpMethod"
        resourcePath            = "$context.resourcePath"
        status                  = "$context.status"
        protocol                = "$context.protocol"
        responseLength          = "$context.responseLength"
        cognitoIdentityId       = "$context.identity.cognitoIdentityId"
        user                    = "$context.authorizer.principalId"
      })
      cache_cluster_enabled = false
      method_settings_config = [{
        resource_path      = "/*/*"
        logging_level      = "INFO"
        data_trace_enabled = true
        metrics_enabled    = true
      }]
    }
  }
}

# Configuration for GraphQL API Module
variable "graphql_api_config" {
  description = "Configuration for the api_gateway_graphql module."
  type = object({
    backend_graphql_uri = string
    default_stage_name  = string # Stage name for the GraphQL API, e.g., matching an environment
    authorizer_name     = optional(string) # Name of an authorizer (defined in authorizers_config) to apply
    stage_variables_map = optional(map(string), {})
    # Add other specific configs for graphql api module
  })
  default = {
    backend_graphql_uri = ""
    default_stage_name  = "dev"
    authorizer_name     = null
    stage_variables_map = {}
  }
}

# Configuration for Usage Plans Module
variable "usage_plans_module_config" {
  description = "Configuration for the api_gateway_usage_plans module."
  type = object({
    usage_plans_config = map(object({
      name        = string
      description = optional(string)
      throttle_settings = optional(object({
        rate_limit  = number
        burst_limit = number
      }))
      quota_settings = optional(object({
        limit  = number
        period = string # DAY, WEEK, MONTH
        offset = optional(number, 0)
      }))
      # api_stages are automatically associated from stages_config
    }))
    api_keys_config = map(object({
      name          = string
      description   = optional(string)
      enabled       = optional(bool, true)
      value         = optional(string) # If not provided, API Gateway generates it
      usage_plan_key_name = string # The key (name) of the usage plan in usage_plans_config to associate with
    }))
  })
  default = {
    usage_plans_config = {}
    api_keys_config    = {}
  }
}

# Configuration for Custom Domain Module
variable "custom_domain_module_config" {
  description = "Configuration for the api_gateway_domain_name module."
  type = object({
    enabled            = bool
    domain_name        = string
    certificate_arn    = string
    target_stage_name  = string # Stage name from stages_config to map this domain to
    base_path          = optional(string, "(none)") # Use "(none)" for root path mapping
    endpoint_type      = optional(string, "REGIONAL") # REGIONAL or EDGE
    security_policy    = optional(string, "TLS_1_2")  # TLS_1_0 or TLS_1_2
  })
  default = {
    enabled            = false
    domain_name        = ""
    certificate_arn    = ""
    target_stage_name  = ""
    base_path          = "(none)"
    endpoint_type      = "REGIONAL"
    security_policy    = "TLS_1_2"
  }
}

# Configuration for Logging Module
variable "logging_module_config" {
  description = "Configuration for the api_gateway_logging module."
  type = object({
    log_group_name_prefix   = optional(string, "apigw-access-logs")
    log_retention_in_days = optional(number, 30)
    cloudwatch_role_name_prefix = optional(string, "ApiGatewayCloudWatchLogsRole")
    # access_log_format is now per-stage in stages_config
    # enable_execution_logging is part of method_settings_config in stages_config
    # logging_level is part of method_settings_config in stages_config
    # data_trace_enabled is part of method_settings_config in stages_config
  })
  default = {
    log_group_name_prefix   = "apigw-access-logs"
    log_retention_in_days = 30
    cloudwatch_role_name_prefix = "ApiGatewayCloudWatchLogsRole"
  }
}