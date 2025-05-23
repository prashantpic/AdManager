terraform {
  required_version = ">= 1.6.4"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Configure your S3 backend here
    # bucket         = "your-terraform-state-bucket"
    # key            = "api-gateway/terraform.tfstate"
    # region         = "your-aws-region"
    # encrypt        = true
    # dynamodb_table = "your-terraform-locks"
  }
}

provider "aws" {
  region  = var.aws_region
  default_tags {
    tags = var.tags
  }
}

locals {
  rest_api_name   = "${var.api_name_prefix}-REST-API-${var.environment}"
  graphql_api_name = var.enable_graphql_api ? "${var.api_name_prefix}-GraphQL-API-${var.environment}" : null
  log_group_name  = var.enable_api_logging ? coalescelist(try(var.logging_module_config.log_group_name_prefix, null), ["${var.api_name_prefix}-apigw"])[0] : null
  api_stages_for_usage_plans = [
    for stage_name, stage_config in var.stages_config : {
      api_id     = module.api_gateway_rest.rest_api_id
      stage_name = stage_name
    } if module.api_gateway_rest != null # Ensure rest_api_id is available
  ]
}

module "api_gateway_logging" {
  count  = var.enable_api_logging ? 1 : 0
  source = "./modules/api_gateway_logging"

  log_group_name_prefix   = local.log_group_name
  log_retention_in_days   = var.logging_module_config.log_retention_in_days
  # rest_api_stage_map is complex if stages are dynamic.
  # Assuming this module primarily sets up the account role and a general log group.
  # Stage-specific logging is configured in the stages module using this setup.
  # For simplicity, the SDS for logging module implies it can update stages which is tricky.
  # Here, we'll assume it sets up general resources.
  # The `aws_api_gateway_account` resource to set the CloudWatch role ARN is key here.
  # This module is simplified to provide the log group ARN. The stages module will use it.
  # And this module sets the account-wide CloudWatch role for API Gateway.
  cloudwatch_role_name_prefix = var.logging_module_config.cloudwatch_role_name_prefix
  tags                        = var.tags
}

module "api_gateway_rest" {
  source = "./modules/api_gateway_rest"

  api_name                = local.rest_api_name
  api_description         = "REST API for ${var.api_name_prefix} (${var.environment})"
  openapi_spec_file_path  = var.rest_api_config.openapi_spec_file_path
  # authorizer_ids is problematic due to cyclic dependency if authorizers module needs rest_api_id.
  # Assuming OpenAPI spec handles authorizer definitions or references them by name.
  # authorizer_ids          = var.enable_advanced_usage_plans ? module.api_gateway_authorizers.authorizer_ids : {} # Incorrect dependency
  lambda_integration_arns_map = var.rest_api_config.lambda_integration_arns_map
  http_integration_uris_map   = var.rest_api_config.http_integration_uris_map
  request_templates_map       = var.rest_api_config.request_templates_map
  response_templates_map      = var.rest_api_config.response_templates_map
  tags                        = var.tags
  # Pass any other necessary variables from var.rest_api_config
}

module "api_gateway_authorizers" {
  source = "./modules/api_gateway_authorizers"

  rest_api_id             = module.api_gateway_rest.rest_api_id
  jwt_authorizers_config  = var.authorizers_config.jwt_authorizers_config
  lambda_authorizers_config = var.authorizers_config.lambda_authorizers_config
  tags                      = var.tags
  # Ensure that authorizer names in the config match names used in OpenAPI securitySchemes
}

module "api_gateway_stages" {
  source   = "./modules/api_gateway_stages"
  for_each = var.stages_config

  rest_api_id            = module.api_gateway_rest.rest_api_id
  stage_name             = each.key
  deployment_triggers    = {
    # Trigger redeployment if the REST API definition changes
    redeployment = module.api_gateway_rest.rest_api_deployment_id
  }
  deployment_description = each.value.deployment_description
  stage_variables_map    = each.value.stage_variables_map

  access_log_destination_arn = var.enable_api_logging ? module.api_gateway_logging[0].api_gateway_log_group_arn : null
  access_log_format          = var.enable_api_logging ? each.value.access_log_format : null # Format from stage config

  cache_cluster_enabled      = each.value.cache_cluster_enabled
  cache_cluster_size         = each.value.cache_cluster_size
  method_settings_config     = each.value.method_settings_config
  stage_throttling_burst_limit = each.value.stage_throttling_burst_limit
  stage_throttling_rate_limit  = each.value.stage_throttling_rate_limit
  tags                         = var.tags
}

module "api_gateway_graphql" {
  count  = var.enable_graphql_api ? 1 : 0
  source = "./modules/api_gateway_graphql"

  graphql_api_name    = local.graphql_api_name
  backend_graphql_uri = var.graphql_api_config.backend_graphql_uri
  # GraphQL stages might be simpler, e.g., one per environment matching REST stage names
  # This example assumes a single default stage for GraphQL for simplicity, or stage needs to be passed.
  # For multiple stages, this module would need a for_each or similar stage config input.
  stage_name          = var.graphql_api_config.default_stage_name # e.g., var.environment
  # authorizer_id might reference an authorizer from api_gateway_authorizers module if applicable to GraphQL (HTTP API based)
  # authorizer_id       = var.graphql_api_config.authorizer_name != null ? module.api_gateway_authorizers.authorizer_ids[var.graphql_api_config.authorizer_name] : null
  stage_variables_map = var.graphql_api_config.stage_variables_map
  tags                = var.tags
}

module "api_gateway_usage_plans" {
  count  = var.enable_advanced_usage_plans ? 1 : 0
  source = "./modules/api_gateway_usage_plans"

  api_stages_to_associate = local.api_stages_for_usage_plans
  usage_plans_config      = var.usage_plans_module_config.usage_plans_config
  api_keys_config         = var.usage_plans_module_config.api_keys_config
  tags                    = var.tags
}

module "api_gateway_domain_name" {
  count  = var.enable_custom_domain && var.custom_domain_module_config.enabled ? 1 : 0
  source = "./modules/api_gateway_domain_name"

  custom_domain_name = var.custom_domain_module_config.domain_name
  certificate_arn    = var.custom_domain_module_config.certificate_arn
  rest_api_id        = module.api_gateway_rest.rest_api_id
  stage_name         = var.custom_domain_module_config.target_stage_name # Ensure this stage exists
  base_path          = var.custom_domain_module_config.base_path
  endpoint_type      = var.custom_domain_module_config.endpoint_type
  security_policy    = var.custom_domain_module_config.security_policy
  tags               = var.tags
}