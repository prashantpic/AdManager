environment                   = "staging"
aws_region                    = "us-east-1"
account_id                    = "123456789012" # Staging Account ID if different
tags = {
  Environment = "Staging"
  Project     = "AdManager"
  ManagedBy   = "Terraform"
}
api_name_prefix               = "AdManager-Staging"
enable_graphql_api            = true
enable_advanced_usage_plans   = true
enable_custom_domain          = true
enable_api_logging            = true

# REST API Configuration
rest_api_openapi_spec_path    = "../modules/api_gateway_rest/openapi/api-v1.yaml"
rest_api_description          = "AdManager Staging REST API"

# Lambda ARNs for REST API integrations
lambda_integration_arns = {
  "GetUserHandler"    = "arn:aws:lambda:us-east-1:123456789012:function:admanager-staging-getUser"
  "CreateUserHandler" = "arn:aws:lambda:us-east-1:123456789012:function:admanager-staging-createUser"
  # Add other NestJS module/Lambda ARNs here
}

# HTTP URIs for REST API integrations
http_integration_uris = {
  "LegacyServiceIntegration" = "https://api.staging.legacy.example.com/v1"
}

# Request/Response VTL Templates for REST API
rest_api_request_templates = {}
rest_api_response_templates = {}

# GraphQL API Configuration
graphql_api_name              = "AdManager-Staging-GraphQL"
graphql_backend_uri           = "arn:aws:lambda:us-east-1:123456789012:function:admanager-staging-graphql-handler"
graphql_stage_name            = "staging"
graphql_authorizer_id         = null

# Authorizers Configuration
jwt_authorizers = {
  "CognitoJWTAuthorizer" = {
    type                           = "COGNITO_USER_POOLS"
    identity_source                = "method.request.header.Authorization"
    authorizer_result_ttl_in_seconds = 300
    provider_arns                  = ["arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_yyyyyyyyy"]
  }
}
lambda_authorizers = {
  "CustomLambdaAuthorizer" = {
    type                           = "TOKEN"
    authorizer_uri                 = "arn:aws:lambda:us-east-1:123456789012:function:admanager-staging-custom-authorizer"
    identity_source                = "method.request.header.Authorization"
    authorizer_result_ttl_in_seconds = 300
  }
}

# Usage Plans Configuration
usage_plans = {
  "BasicTier" = {
    description = "Basic tier for staging"
    throttle = {
      rate_limit  = 50
      burst_limit = 100
    }
    quota = {
      limit  = 5000
      period = "MONTH"
      offset = 1
    }
  }
  "PremiumTier" = {
    description = "Premium tier for staging"
    throttle = {
      rate_limit  = 200
      burst_limit = 400
    }
    quota = {
      limit  = 20000
      period = "MONTH"
      offset = 1
    }
  }
}

api_keys = {
  "StagingTestClient1" = {
    description   = "API Key for Staging Test Client 1"
    enabled       = true
    usage_plan_names = ["BasicTier"]
  }
}

# Stage specific settings for 'staging'
staging_stage_config = {
  stage_variables = {
    backendServiceUrl = "https://api.staging.internal"
    logLevel          = "INFO"
  }
  cache_cluster_enabled = true
  cache_cluster_size    = "1.6" # Medium size for staging
  access_log_format_key = "json_with_context"
}

# Custom Domain Configuration
custom_domain_name          = "api.staging.example.com"
custom_domain_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
custom_domain_base_path     = "v1"

# Logging Configuration
api_log_group_name_prefix   = "/aws/apigateway/AdManager-Staging"
api_log_retention_in_days   = 30
api_access_log_format_key   = "json_with_context"
api_logging_level           = "INFO"
api_data_trace_enabled      = false # Typically false for staging/prod unless debugging

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