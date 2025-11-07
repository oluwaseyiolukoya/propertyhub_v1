output "app_fqdn" {
  description = "Frontend application URL"
  value       = "https://app.${var.env}.${var.domain_name}"
}

output "api_fqdn" {
  description = "Backend API URL"
  value       = "https://api.${var.env}.${var.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for frontend"
  value       = aws_cloudfront_distribution.frontend.id
}

output "s3_frontend_bucket" {
  description = "S3 bucket name for frontend"
  value       = aws_s3_bucket.frontend.id
}

output "s3_uploads_bucket" {
  description = "S3 bucket name for uploads"
  value       = aws_s3_bucket.uploads.id
}

output "ecr_repository_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.api.dns_name
}

output "route53_nameservers" {
  description = "Route 53 nameservers (if zone was created)"
  value       = var.create_route53_zone ? aws_route53_zone.main[0].name_servers : []
}

output "manual_dns_records" {
  description = "DNS records to create manually in Namecheap"
  value = var.create_route53_zone ? {} : {
    frontend = {
      type   = "CNAME"
      name   = "app.${var.env}"
      value  = aws_cloudfront_distribution.frontend.domain_name
      ttl    = 300
    }
    api = {
      type   = "CNAME"
      name   = "api.${var.env}"
      value  = aws_lb.api.dns_name
      ttl    = 300
    }
  }
}
