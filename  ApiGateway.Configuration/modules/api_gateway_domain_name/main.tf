resource "aws_api_gateway_domain_name" "this" {
  count = var.enabled ? 1 : 0

  domain_name              = var.custom_domain_name
  certificate_arn          = var.certificate_arn
  regional_certificate_arn = var.regional_certificate_arn # Use if endpoint_configuration type is REGIONAL
  endpoint_configuration {
    types = [var.endpoint_type] # e.g., "REGIONAL" or "EDGE"
  }
  security_policy = var.security_policy # e.g., "TLS_1_2"

  tags = var.tags
}

resource "aws_api_gateway_base_path_mapping" "this" {
  count = var.enabled && var.rest_api_id != null && var.stage_name != null ? 1 : 0

  domain_name = aws_api_gateway_domain_name.this[0].domain_name
  api_id      = var.rest_api_id
  stage_name  = var.stage_name
  base_path   = var.base_path != "" ? var.base_path : null # API Gateway treats empty string as an error, null means root.
}

# Optional: Route 53 record for the custom domain name
resource "aws_route53_record" "this" {
  count = var.enabled && var.create_route53_record && var.route53_zone_id != null ? 1 : 0

  zone_id = var.route53_zone_id
  name    = aws_api_gateway_domain_name.this[0].domain_name
  type    = "A"

  alias {
    name                   = var.endpoint_type == "EDGE" ? aws_api_gateway_domain_name.this[0].cloudfront_domain_name : aws_api_gateway_domain_name.this[0].regional_domain_name
    zone_id                = var.endpoint_type == "EDGE" ? aws_api_gateway_domain_name.this[0].cloudfront_zone_id : aws_api_gateway_domain_name.this[0].regional_zone_id
    evaluate_target_health = false
  }
}