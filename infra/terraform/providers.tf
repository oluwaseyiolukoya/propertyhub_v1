provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.env
      Project     = "Contrezz"
      ManagedBy   = "Terraform"
    }
  }
}

# Provider for us-east-1 (required for ACM certificates with CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.env
      Project     = "Contrezz"
      ManagedBy   = "Terraform"
    }
  }
}
