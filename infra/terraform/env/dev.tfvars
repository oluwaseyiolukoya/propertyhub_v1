# Environment Configuration
env        = "dev"
aws_region = "us-east-1"

# Domain Configuration (Namecheap DNS)
domain_name         = "contrezz.com"
create_route53_zone = false

# Database Configuration
db_instance_class    = "db.t4g.micro"
db_allocated_storage = 20
db_name              = "contrezz"
db_username          = "dbadmin"
db_password          = "D3RqzEg=XE86D3-DMZr"

# ECS Configuration (optimized for cost)
ecs_task_cpu       = "256"  # Reduced from 512 (saves ~$7/month)
ecs_task_memory    = "512"  # Reduced from 1024 (saves ~$7/month)
ecs_desired_count  = 1

# Secrets (leave empty for auto-generated JWT, add Paystack keys later)
jwt_secret          = ""
paystack_public_key = ""
paystack_secret_key = ""
