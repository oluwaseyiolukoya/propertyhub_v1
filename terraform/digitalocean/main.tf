# Digital Ocean Infrastructure for Contrezz
# Cost-effective alternative to AWS (~$32/month vs ~$98/month)

terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.34"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# ============================================================================
# VARIABLES
# ============================================================================

variable "do_token" {
  description = "Digital Ocean API token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "contrezz"
}

variable "environment" {
  description = "Environment (dev or prod)"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "Digital Ocean region"
  type        = string
  default     = "nyc3" # New York - change to your preferred region
}

variable "database_size" {
  description = "Database droplet size"
  type        = string
  default     = "db-s-1vcpu-1gb" # $15/month
}

variable "app_instance_size" {
  description = "App Platform instance size"
  type        = string
  default     = "basic-xxs" # $12/month
}

variable "domain_name" {
  description = "Your domain name (optional)"
  type        = string
  default     = "" # Set this if you have a domain
}

# Environment variables for backend
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "paystack_secret_key" {
  description = "Paystack secret key"
  type        = string
  sensitive   = true
}

variable "paystack_public_key" {
  description = "Paystack public key"
  type        = string
  sensitive   = true
}

# ============================================================================
# PROJECT
# ============================================================================

resource "digitalocean_project" "contrezz" {
  name        = "${var.project_name}-${var.environment}"
  description = "Contrezz Property Management Platform"
  purpose     = "Web Application"
  environment = var.environment == "prod" ? "Production" : "Development"
}

# ============================================================================
# DATABASE (PostgreSQL)
# ============================================================================

resource "digitalocean_database_cluster" "postgres" {
  name       = "${var.project_name}-db-${var.environment}"
  engine     = "pg"
  version    = "15"
  size       = var.database_size
  region     = var.region
  node_count = 1

  tags = ["${var.project_name}", var.environment, "database"]
}

# Create database
resource "digitalocean_database_db" "contrezz" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = var.environment == "prod" ? "contrezz" : "contrezz_dev"
}

# Create database user
resource "digitalocean_database_user" "contrezz" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "contrezz_user"
}

# Database firewall - allow connections from App Platform
resource "digitalocean_database_firewall" "postgres" {
  cluster_id = digitalocean_database_cluster.postgres.id

  rule {
    type  = "app"
    value = digitalocean_app.backend.id
  }

  # Allow connections from your IP for management (optional)
  # Uncomment and set your IP
  # rule {
  #   type  = "ip_addr"
  #   value = "YOUR_IP_ADDRESS"
  # }
}

# ============================================================================
# SPACES (Object Storage for Frontend)
# ============================================================================
# Temporarily commented out - requires Spaces API credentials
# Can be added later when needed

# resource "digitalocean_spaces_bucket" "frontend" {
#   name   = "${var.project_name}-frontend-${var.environment}"
#   region = var.region

#   # Enable CDN
#   acl = "public-read"

#   cors_rule {
#     allowed_headers = ["*"]
#     allowed_methods = ["GET", "HEAD"]
#     allowed_origins = ["*"]
#     max_age_seconds = 3600
#   }
# }

# ============================================================================
# APP PLATFORM (Backend)
# ============================================================================

resource "digitalocean_app" "backend" {
  spec {
    name   = "${var.project_name}-backend-${var.environment}"
    region = var.region

    # Backend service
    service {
      name               = "backend"
      instance_count     = 1
      instance_size_slug = var.app_instance_size

      # Use Docker Hub image (we'll build and push manually)
      image {
        registry_type = "DOCKER_HUB"
        registry      = "library"
        repository    = "node"
        tag           = "18-alpine"
      }

      # Build configuration
      source_dir = "/backend"

      build_command = "npm ci && npx prisma generate && npm run build"
      run_command   = "npm start"

      # Health check
      health_check {
        http_path             = "/health"
        initial_delay_seconds = 30
        period_seconds        = 10
        timeout_seconds       = 5
        success_threshold     = 1
        failure_threshold     = 3
      }

      # Environment variables
      env {
        key   = "NODE_ENV"
        value = var.environment == "prod" ? "production" : "development"
      }

      env {
        key   = "PORT"
        value = "8080"
      }

      env {
        key   = "DATABASE_URL"
        value = digitalocean_database_cluster.postgres.private_uri
        type  = "SECRET"
      }

      env {
        key   = "JWT_SECRET"
        value = var.jwt_secret
        type  = "SECRET"
      }

      env {
        key   = "PAYSTACK_SECRET_KEY"
        value = var.paystack_secret_key
        type  = "SECRET"
      }

      env {
        key   = "PAYSTACK_PUBLIC_KEY"
        value = var.paystack_public_key
        type  = "SECRET"
      }

      env {
        key   = "FRONTEND_URL"
        value = var.domain_name != "" ? "https://${var.domain_name}" : "http://localhost:5173"
      }

      env {
        key   = "CORS_ORIGIN"
        value = var.domain_name != "" ? "https://${var.domain_name}" : "http://localhost:5173"
      }

      # HTTP port
      http_port = 8080

      # Routes
      routes {
        path = "/api"
      }
    }

    # Domain configuration (optional)
    dynamic "domain" {
      for_each = var.domain_name != "" ? [1] : []
      content {
        name = "api.${var.domain_name}"
        type = "PRIMARY"
      }
    }
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "database_host" {
  description = "Database host"
  value       = digitalocean_database_cluster.postgres.host
  sensitive   = true
}

output "database_port" {
  description = "Database port"
  value       = digitalocean_database_cluster.postgres.port
}

output "database_name" {
  description = "Database name"
  value       = digitalocean_database_db.contrezz.name
}

output "database_user" {
  description = "Database user"
  value       = digitalocean_database_user.contrezz.name
}

output "database_password" {
  description = "Database password"
  value       = digitalocean_database_user.contrezz.password
  sensitive   = true
}

output "database_connection_string" {
  description = "Full database connection string"
  value       = digitalocean_database_cluster.postgres.private_uri
  sensitive   = true
}

output "backend_url" {
  description = "Backend API URL"
  value       = digitalocean_app.backend.live_url
}

# Spaces outputs - commented out temporarily
# output "spaces_bucket_name" {
#   description = "Spaces bucket name for frontend"
#   value       = digitalocean_spaces_bucket.frontend.name
# }

# output "spaces_endpoint" {
#   description = "Spaces endpoint"
#   value       = "https://${digitalocean_spaces_bucket.frontend.bucket_domain_name}"
# }

# output "spaces_cdn_endpoint" {
#   description = "Spaces CDN endpoint"
#   value       = "https://${digitalocean_spaces_bucket.frontend.bucket_domain_name}"
# }

output "project_id" {
  description = "Digital Ocean project ID"
  value       = digitalocean_project.contrezz.id
}

# Instructions for next steps
output "next_steps" {
  description = "Next steps after infrastructure is created"
  sensitive   = true
  value = <<-EOT

    ✅ Digital Ocean Infrastructure Created!

    Next Steps:

    1. DATABASE MIGRATION:
       Export from AWS:
         pg_dump -h <aws-rds-endpoint> -U <user> -d contrezz_prod > backup.sql

       Import to Digital Ocean:
         psql "${digitalocean_database_cluster.postgres.private_uri}" < backup.sql

    2. BACKEND DEPLOYMENT:
       - Connect GitHub repo in Digital Ocean App Platform UI
       - Or push code and it will auto-deploy
       - Check logs: doctl apps logs ${digitalocean_app.backend.id}

    3. FRONTEND DEPLOYMENT:
       For now, run frontend locally:
         cd frontend && npm run dev

       Or deploy to Spaces later (requires Spaces API credentials)

    4. DNS CONFIGURATION (Optional):
       Point your domain to:
         Backend: ${digitalocean_app.backend.live_url}

    5. TEST EVERYTHING:
       - Backend health: ${digitalocean_app.backend.live_url}/health
       - Database: Test connections
       - Frontend: Run locally at http://localhost:5173

    6. NEXT STEPS:
       - Restore your local database to Digital Ocean
       - Update frontend to use the new backend URL
       - Test all features

    📊 Monthly Cost: $27
       - App Platform: $12
       - PostgreSQL: $15

    💰 Savings: ~$66/month vs AWS
  EOT
}

