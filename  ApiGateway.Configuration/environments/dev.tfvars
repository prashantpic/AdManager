environment                   = "dev"
aws_region                    = "us-east-1"
account_id                    = "123456789012"
tags = {
  Environment = "Dev"
  Project     = "AdManager"
  ManagedBy   = "Terraform"
}
api_name_prefix               = "AdManager-Dev"
enable_graphql_api            = true
enable_advanced_usage_plans   = true
enable_custom_domain          = true
enable_api_logging            = true

# REST API Configuration
rest_api_openapi_spec_path    = "../modules/api_gateway_rest/openapi/api-v1.yaml" # Relative to the module consuming it, or root. Assuming root for now.
rest_api_description          = "AdManager Development REST API"

# Lambda ARNs for REST API integrations (example)
lambda_integration_arns = {
  "GetUserHandler"    = "arn:aws:lambda:us-east-1:123456789012:function:admanager-dev-getUser"
  "CreateUserHandler" = "arn:aws:lambda:us-east-1:123456789012:function:admanager-dev-createUser"
  # Add other NestJS module/Lambda ARNs here
}

# HTTP URIs for REST API integrations (example)
http_integration_uris = {
  "LegacyServiceIntegration" = "https://api.dev.legacy.example.com/v1"
}

# Request/Response VTL Templates for REST API (paths relative to api_gateway_rest module)
rest_api_request_templates = {
  # "application/json_POST_/users" = "templates/request_transform_example.vtl"
}
rest_api_response_templates = {
  # "application/json_200_GET_/users/{userId}" = "templates/response_transform_example.vtl"
}

# GraphQL API Configuration (if enable_graphql_api = true)
graphql_api_name              = "AdManager-Dev-GraphQL"
graphql_backend_uri           = "arn:aws:lambda:us-east-1:123456789012:function:admanager-dev-graphql-handler" # Example: Lambda integration target URI
# For HTTP_PROXY to a NestJS service: "http://internal-dev-alb/graphql"
graphql_stage_name            = "dev"
graphql_authorizer_id         = null # Or specify API Gateway v2 Authorizer ID if used

# Authorizers Configuration
jwt_authorizers = {
  "CognitoJWTAuthorizer" = {
    type                           = "COGNITO_USER_POOLS"
    identity_source                = "method.request.header.Authorization"
    authorizer_result_ttl_in_seconds = 300
    provider_arns                  = ["arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_xxxxxxxxx"]
    # jwt_configuration field is not used for COGNITO_USER_POOLS type directly in aws_api_gateway_authorizer
    # For 'JWT' type:
    # jwt_configuration = {
    #   audience = ["yourAudience"]
    #   issuer   = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxxxxxx"
    # }
  }
}
lambda_authorizers = {
  "CustomLambdaAuthorizer" = {
    type                           = "TOKEN"
    authorizer_uri                 = "arn:aws:lambda:us-east-1:123456789012:function:admanager-dev-custom-authorizer"
    identity_source                = "method.request.header.Authorization"
    authorizer_credentials         = null # Optional: ARN of an IAM role for API Gateway to invoke the authorizer
    authorizer_result_ttl_in_seconds = 60
  }
}

# Usage Plans Configuration (if enable_advanced_usage_plans = true)
usage_plans = {
  "BasicTier" = {
    description = "Basic tier for development"
    throttle = {
      rate_limit  = 10
      burst_limit = 20
    }
    quota = {
      limit  = 1000
      period = "MONTH"
      offset = 1
    }
    # API stages are associated in the root main.tf or usage_plans module based on API ID and stage name
  }
  "PremiumTier" = {
    description = "Premium tier for development"
    throttle = {
      rate_limit  = 100
      burst_limit = 200
    }
    quota = {
      limit  = 10000
      period = "MONTH"
      offset = 1
    }
  }
}

api_keys = {
  "DevTestClient1" = {
    description   = "API Key for Dev Test Client 1"
    enabled       = true
    # value         = "your-pre-generated-api-key-value" # Optional: If not provided, AWS generates it
    usage_plan_names = ["BasicTier"] # Names of usage plans to associate this key with
  }
  "DevTestClient2" = {
    description   = "API Key for Dev Test Client 2"
    enabled       = true
    usage_plan_names = ["PremiumTier"]
  }
}

# Stages Configuration (example for one stage, root module will create for "dev", "staging", "prod")
# This example shows settings for the 'dev' stage if configured directly.
# The root module will iterate through stage names and apply specific configurations.
# For this dev.tfvars, we are primarily setting global flags and configs that the root module then uses for the "dev" stage.

# Stage specific settings for 'dev' (passed to api_gateway_stages module)
dev_stage_config = {
  stage_variables = {
    backendServiceUrl = "https://api.dev.internal"
    logLevel          = "INFO"
  }
  cache_cluster_enabled = true
  cache_cluster_size    = "0.5" # Smallest size for dev
  access_log_format     = "json_with_context" # Example format key
  # method_settings will be specific, defined as per api_gateway_stages module variable
  # Example:
  # method_settings = [
  #   {
  #     resource_path      = "/*"
  #     http_method        = "*"
  #     throttling_burst_limit = 5
  #     throttling_rate_limit  = 2
  #     caching_enabled    = true
  #     cache_ttl_in_seconds = 300
  #     logging_level      = "INFO"
  #     metrics_enabled    = true
  #     data_trace_enabled = false
  #   }
  # ]
}

# Custom Domain Configuration (if enable_custom_domain = true)
custom_domain_name          = "api.dev.example.com"
custom_domain_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
custom_domain_base_path     = "v1" # Optional base path mapping

# Logging Configuration (if enable_api_logging = true)
api_log_group_name_prefix   = "/aws/apigateway/AdManager-Dev"
api_log_retention_in_days   = 7
api_access_log_format_key   = "json_with_context" # Predefined format name or actual format string
api_logging_level           = "INFO"
api_data_trace_enabled      = false
# cloudwatch_role_arn_for_api_gateway will be set in main.tf, or passed if pre-existing

# Example of mapping predefined log formats if using keys like "json_with_context"
# This would be used by the root module to resolve the actual format string for the logging module.
access_log_formats = {
  "clf" = "$context.identity.sourceIp $context.identity.caller $context.identity.user [$context.requestTime] \"$context.httpMethod $context.resourcePath $context.protocol\" $context.status $context.responseLength $context.requestId"
  "json_with_context" = <<EOF
{
    "requestId": "$context.requestId",
    "ip": "$context.identity.sourceIp",
    "caller": "$context.identity.caller",
    "user": "$context.identity.user",
    "requestTime": "$context.requestTime",
    "httpMethod": "$context.httpMethod",
    "resourcePath": "$context.resourcePath",
    "status": "$context.status",
    "protocol": "$context.protocol",
    "responseLength": "$context.responseLength",
    "integrationLatency": "$context.integration.latency",
    "integrationStatus": "$context.integration.status",
    "authorizerPrincipalId": "$context.authorizer.principalId"
}
EOF
}