output "rest_api_id" {
  description = "ID of the created REST API."
  value       = aws_api_gateway_rest_api.this.id
}

output "root_resource_id" {
  description = "ID of the root resource (`/`) of the REST API."
  value       = aws_api_gateway_rest_api.this.root_resource_id
}

output "execution_arn" {
  description = "Execution ARN of the REST API."
  value       = aws_api_gateway_rest_api.this.execution_arn
}

output "rest_api_deployment_id" {
  description = "ID of the latest deployment created by this module (used as a trigger for stages)."
  value       = aws_api_gateway_deployment.this.id
}

output "rendered_openapi_spec" {
  description = "The OpenAPI specification content after templating."
  value       = local.openapi_spec_rendered
  sensitive   = true # Potentially sensitive if ARNs/URIs are embedded
}