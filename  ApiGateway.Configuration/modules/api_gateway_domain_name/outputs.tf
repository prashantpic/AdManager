output "custom_domain_name_id" {
  description = "The ID of the API Gateway Custom Domain Name."
  value       = var.enabled ? aws_api_gateway_domain_name.this[0].id : null
}

output "cloudfront_domain_name" {
  description = "The CloudFront distribution domain name associated with the custom domain (for EDGE optimized endpoints)."
  value       = var.enabled && var.endpoint_type == "EDGE" ? aws_api_gateway_domain_name.this[0].cloudfront_domain_name : null
}

output "regional_domain_name" {
  description = "The regional domain name associated with the custom domain (for REGIONAL endpoints)."
  value       = var.enabled && var.endpoint_type == "REGIONAL" ? aws_api_gateway_domain_name.this[0].regional_domain_name : null
}

output "cloudfront_zone_id" {
  description = "The Route 53 Hosted Zone ID of the CloudFront distribution (for EDGE optimized endpoints)."
  value       = var.enabled && var.endpoint_type == "EDGE" ? aws_api_gateway_domain_name.this[0].cloudfront_zone_id : null
}

output "regional_zone_id" {
  description = "The Route 53 Hosted Zone ID of the regional endpoint (for REGIONAL endpoints)."
  value       = var.enabled && var.endpoint_type == "REGIONAL" ? aws_api_gateway_domain_name.this[0].regional_zone_id : null
}

output "base_path_mapping_id" {
  description = "The ID of the base path mapping."
  value       = var.enabled && var.rest_api_id != null && var.stage_name != null ? aws_api_gateway_base_path_mapping.this[0].id : null
}