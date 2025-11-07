# DNS Setup for Namecheap

## Step 1: Add SSL Certificate Validation Records

Log into Namecheap → Domain List → `contrezz.com` → Advanced DNS

Add these 2 CNAME records:

### Record 1 (Frontend Certificate):
- **Type**: CNAME Record
- **Host**: `_f926e66cdedae49f681e5ff15a410448.app.dev`
- **Value**: `_d01cb8e94d157ff7f7b5c3f99619931b.jkddzztszm.acm-validations.aws.`
- **TTL**: Automatic

### Record 2 (API Certificate):
- **Type**: CNAME Record
- **Host**: `_7d20cc4f16f3042a3cd799342cf13cd3.api.dev`
- **Value**: `_c6f7003baf8e74c51f52c60662850dbd.jkddzztszm.acm-validations.aws.`
- **TTL**: Automatic

**Important**: 
- Remove the trailing `.contrezz.com` from the Host field (Namecheap adds it automatically)
- Keep the trailing `.` in the Value field

## Step 2: Wait for DNS Propagation

After adding the records:
1. Wait 5-10 minutes for DNS to propagate
2. Verify with: `dig _f926e66cdedae49f681e5ff15a410448.app.dev.contrezz.com`

## Step 3: Re-run Terraform

Once DNS records are added and propagated:

```bash
cd /Users/oluwaseyio/test_ui_figma_and_cursor/infra/terraform
terraform init -upgrade
terraform apply -var-file=env/dev.tfvars
```

## Step 4: Add Application DNS Records (After Terraform Completes)

After Terraform finishes, get the DNS values:

```bash
terraform output manual_dns_records
```

Then add these 2 CNAME records in Namecheap:

### Record 3 (Frontend):
- **Type**: CNAME Record
- **Host**: `app.dev`
- **Value**: `[CloudFront domain from output]`
- **TTL**: 300 (5 minutes)

### Record 4 (API):
- **Type**: CNAME Record
- **Host**: `api.dev`
- **Value**: `[ALB domain from output]`
- **TTL**: 300 (5 minutes)

## Troubleshooting

### Certificate validation stuck?
```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:679763318339:certificate/9e841389-18fb-46ac-a141-c1d916f29532 \
  --region us-east-1 \
  --query 'Certificate.Status'
```

### DNS not propagating?
```bash
# Check DNS records
dig _f926e66cdedae49f681e5ff15a410448.app.dev.contrezz.com CNAME
dig _7d20cc4f16f3042a3cd799342cf13cd3.api.dev.contrezz.com CNAME
```

## Summary

1. ✅ Add 2 SSL validation CNAME records
2. ⏳ Wait 5-10 minutes
3. ✅ Run `terraform apply`
4. ✅ Add 2 application CNAME records
5. 🎉 Done!

