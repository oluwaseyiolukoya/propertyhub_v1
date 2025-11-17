# Production Email Debug Commands

Since the diagnostic script isn't in the production workspace, run these commands directly in the DigitalOcean console:

## Command 1: Check Recent Onboarding Submissions
```bash
pm2 logs backend --lines 100 --nostream | grep -i "\[Onboarding\]"
```

## Command 2: Check for Email Sending Attempts
```bash
pm2 logs backend --lines 100 --nostream | grep -i "confirmation email"
```

## Command 3: Check for Email Errors
```bash
pm2 logs backend --lines 100 --nostream | grep -i "email error\|failed to send"
```

## Command 4: Check SMTP Configuration Logs
```bash
pm2 logs backend --lines 200 --nostream | grep -i "smtp"
```

## Command 5: Check Your Specific Submission
```bash
pm2 logs backend --lines 300 --nostream | grep -i "olukoyaseyifunmi"
```

## All-in-One Command
```bash
echo "=== Recent Onboarding Logs ===" && \
pm2 logs backend --lines 200 --nostream | grep -A 5 -B 2 "\[Onboarding\]" | tail -50
```

