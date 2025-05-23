variable "api_name" {
  description = "Name for the REST API."
  type        = string
}

variable "api_description" {
  description = "Description for the REST API."
  type        = string
  default     = ""
}

variable "openapi_spec_file_path" {
  description = "Path to the main OpenAPI YAML/JSON file. This file can be a template."
  type        = string
}

variable "authorizer_ids" {
  description = "Map of authorizer names to IDs, provided from the api_gateway_authorizers module. Used if OpenAPI references authorizers by ID or if explicit method authorizers are set here."
  type        = map(string)
  default     = {}
}

variable "lambda_integration_arns_map" {
  description = "Map defining which Lambda ARN maps to which integration key/name used in the OpenAPI template (e.g., for x-amazon-apigateway-integration uri)."
  type        = map(string)
  default     = {}
}

variable "http_integration_uris_map" {
  description = "Map defining which HTTP endpoint URI maps to which integration key/name used in the OpenAPI template."
  type        = map(string)
  default     = {}
}

variable "request_templates_map" {
  description = "Map of content-type to VTL file paths for request transformation, keyed by method and path if needed for explicit aws_api_gateway_integration."
  type        = map(string)
  default     = {}
}

variable "response_templates_map" {
  description = "Map of content-type to VTL file paths for response transformation, keyed by method, path, and status code if needed for explicit aws_api_gateway_integration_response."
  type        = map(string)
  default     = {}
}

variable "deployment_description" {
  description = "Description for the API deployment created by this module."
  type        = string
  default     = "Initial deployment by REST API module"
}

variable "tags" {
  description = "A map of tags to assign to the REST API."
  type        = map(string)
  default     = {}
}