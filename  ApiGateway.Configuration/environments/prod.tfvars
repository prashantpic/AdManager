environment                   = "prod"
aws_region                    = "us-east-1" # Production Region
account_id                    = "987654321098" # Production Account ID
tags = {
  Environment = "Prod"
  Project     = "AdManager"
  ManagedBy   = "Terraform"
}
api_name_prefix               = "AdManager-Prod"
enable_graphql_api            = true
enable_advanced_usage_plans   = true
enable_custom_domain          = true
enable_api_logging            = true

# REST API Configuration
rest_api_openapi_spec_path    = "../modules/api_gateway_rest/openapi/api-v1.yaml"
rest_api_description          = "AdManager Production REST API"

# Lambda ARNs for REST API integrations
lambda_integration_arns = {
  "GetUserHandler"    = "arn:aws:lambda:us-east-1:987654321098:function:admanager-prod-getUser"
  "CreateUserHandler" = "arn:aws:lambda:us-east-1:987654321098:function:admanager-prod-createUser"
  # Add other NestJS module/Lambda ARNs here
}

# HTTP URIs for REST API integrations
http_integration_uris = {
  "LegacyServiceIntegration" = "https://api.legacy.example.com/v1" # Production legacy endpoint
}

# Request/Response VTL Templates for REST API
rest_api_request_templates = {}
rest_api_response_templates = {}

# GraphQL API Configuration
graphql_api_name              = "AdManager-Prod-GraphQL"
graphql_backend_uri           = "arn:aws:lambda:us-east-1:987654321098:function:admanager-prod-graphql-handler"
graphql_stage_name            = "prod"
graphql_authorizer_id         = null # Specify if a dedicated v2 authorizer is used

# Authorizers Configuration
jwt_authorizers = {
  "CognitoJWTAuthorizer" = {
    type                           = "COGNITO_USER_POOLS"
    identity_source                = "method.request.header.Authorization"
    authorizer_result_ttl_in_seconds = 300
    provider_arns                  = ["arn:aws:cognito-idp:us-east-1:987654321098:userpool/us-east-1_zzzzzzzzz"]
  }
}
lambda_authorizers = {
  "CustomLambdaAuthorizer" = {
    type                           = "TOKEN"
    authorizer_uri                 = "arn:aws:lambda:us-east-1:987654321098:function:admanager-prod-custom-authorizer"
    identity_source                = "method.request.header.Authorization"
    authorizer_credentials         = null # Optional IAM role ARN
    authorizer_result_ttl_in_seconds = 300
  }
}

# Usage Plans Configuration
usage_plans = {
  "Standard" = {
    description = "Standard production tier"
    throttle = {
      rate_limit  = 1000
      burst_limit = 2000
    }
    quota = {
      limit  = 1000000
      period = "MONTH"
      offset = 1
    }
  }
  "Enterprise" = {
    description = "Enterprise production tier"
    throttle = {
      rate_limit  = 5000
      burst_limit = 10000
    }
    quota = {
      limit  = 10000000
      period = "MONTH"
      offset = 1
    }
  }
}

api_keys = {
  "PartnerA-ProdKey" = {
    description   = "API Key for Partner A (Production)"
    enabled       = true
    # value = "--- SENSITIVE: To be managed via secrets manager or securely injected ---"
    usage_plan_names = ["Standard"]
  }
  "PartnerB-ProdKey" = {
    description   = "API Key for Partner B (Production)"
    enabled       = true
    usage_plan_names = ["Enterprise"]
  }
}

# Stage specific settings for 'prod'
prod_stage_config = {
  stage_variables = {
    backendServiceUrl = "https://api.internal.example.com" # Production internal URL
    logLevel          = "ERROR" # Higher log level for prod
  }
  cache_cluster_enabled = true
  cache_cluster_size    = "6.1" # Larger size for prod
  access_log_format_key = "json_with_context"
  # method_settings might include more conservative default throttling
  # Example:
  # method_settings = [
  #   {
  #     resource_path      = "/*"
  #     http_method        = "*"
  #     throttling_burst_limit = 1000
  #     throttling_rate_limit  = 500
  #     caching_enabled    = true
  #     cache_ttl_in_seconds = 600
  #     logging_level      = "ERROR" # ERROR level for prod
  #     metrics_enabled    = true
  #     data_trace_enabled = false # Definitely false for prod
  #   }
  # ]
}

# Custom Domain Configuration
custom_domain_name          = "api.example.com" # Production domain
custom_domain_certificate_arn = "arn:aws:acm:us-east-1:987654321098:certificate/zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz"
custom_domain_base_path     = "v1"

# Logging Configuration
api_log_group_name_prefix   = "/aws/apigateway/AdManager-Prod"
api_log_retention_in_days   = 90 # Longer retention for prod
api_access_log_format_key   = "json_with_context"
api_logging_level           = "ERROR"
api_data_trace_enabled      = false

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