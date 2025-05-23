variable "enabled" {
  description = "Flag to enable/disable the creation of custom domain resources."
  type        = bool
  default     = false
}

variable "custom_domain_name" {
  description = "The custom domain name."
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the domain. Required for EDGE endpoint type. For REGIONAL, use regional_certificate_arn."
  type        = string
  default     = null
}

variable "regional_certificate_arn" {
  description = "ACM certificate ARN in the same region as the API Gateway. Required for REGIONAL endpoint type."
  type        = string
  default     = null
}

variable "rest_api_id" {
  description = "The ID of the REST API to map to this domain name. Can be null if mapping API Gateway v2 HTTP API."
  type        = string
  default     = null
}

variable "stage_name" {
  description = "The stage name of the REST API to map. Can be null if mapping API Gateway v2 HTTP API."
  type        = string
  default     = null
}

# For API Gateway v2 HTTP APIs, use these variables instead of rest_api_id and stage_name for base path mapping
# variable "http_api_id" {
#   description = "The ID of the HTTP API (API Gateway v2) to map."
#   type        = string
#   default     = null
# }

# variable "http_api_stage_name" {
#   description = "The stage name of the HTTP API (API Gateway v2) to map."
#   type        = string
#   default     = null
# }

variable "base_path" {
  description = "The base path mapping for the API (e.g., \"v1\", \"api\"). Empty string or null for root path mapping."
  type        = string
  default     = "" # API Gateway treats empty string as an error for base_path, use null for root or omit.
}

variable "endpoint_type" {
  description = "Endpoint type for the custom domain name ('EDGE' or 'REGIONAL')."
  type        = string
  default     = "REGIONAL"
  validation {
    condition     = contains(["EDGE", "REGIONAL"], var.endpoint_type)
    error_message = "Endpoint type must be either 'EDGE' or 'REGIONAL'."
  }
}

variable "security_policy" {
  description = "The Transport Layer Security (TLS) version of the security policy for the custom domain name. Defaults to TLS_1_2."
  type        = string
  default     = "TLS_1_2" # Options: TLS_1_0, TLS_1_2
}

variable "tags" {
  description = "A map of tags to assign to the domain name resource."
  type        = map(string)
  default     = {}
}

# Route 53 specific variables
variable "create_route53_record" {
  description = "Whether to create a Route 53 alias record for the custom domain name."
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "The ID of the Route 53 hosted zone to create the record in."
  type        = string
  default     = null
}