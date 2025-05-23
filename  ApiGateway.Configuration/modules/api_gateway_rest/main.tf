locals {
  # Render the OpenAPI spec, substituting variables
  openapi_spec_rendered = templatefile(var.openapi_spec_file_path, {
    lambda_integrations = var.lambda_integration_arns_map
    http_integrations   = var.http_integration_uris_map
    # Pass other variables needed by the OpenAPI template, e.g., authorizer names/ids if referenced directly
    # Example: authorizer_jwt_id = var.authorizer_ids["jwtAuth"]
    # Ensure your OpenAPI spec uses these variables like ${lambda_integrations.GetUserHandler}
  })
}

resource "aws_api_gateway_rest_api" "this" {
  name        = var.api_name
  description = var.api_description
  body        = local.openapi_spec_rendered

  endpoint_configuration {
    types = ["REGIONAL"] # Or "EDGE" or "PRIVATE"
  }

  tags = var.tags
}

# The OpenAPI body should define resources, methods, integrations, models, and authorizer attachments.
# If specific overrides or configurations not expressible in OpenAPI are needed,
# they can be defined here using aws_api_gateway_resource, aws_api_gateway_method,
# aws_api_gateway_integration, aws_api_gateway_method_response, etc.
# For example, to explicitly set a binary media type (though often handled by OpenAPI extensions or `binary_media_types` on the REST API resource):
# binary_media_types = ["application/octet-stream", "image/jpeg"]

# According to the spec, this module creates a deployment.
# This is somewhat unusual as deployments are often managed by the stages module.
# This deployment can be seen as a "base" or "latest definition" deployment.
resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  description = var.deployment_description != "" ? var.deployment_description : "Deployment triggered by REST API module"

  # Triggers: A change in the OpenAPI spec (which changes the rest_api body)
  # should ideally trigger a new deployment. The `aws_api_gateway_rest_api.this.body`
  # attribute reflects the evaluated template, so changes to the template or its variables
  # will change this.
  # Using the `id` of the rest_api resource can also serve as a trigger, as a new API version
  # would get a new ID if the old one is destroyed and recreated.
  # A more direct trigger would be the content of the rendered OpenAPI spec.
  triggers = {
    redeployment = sha1(local.openapi_spec_rendered)
  }

  lifecycle {
    create_before_destroy = true
  }
  # Note: Stage name is NOT set here. This is a deployment, not a stage.
  # Stages will point to this deployment's ID.
}