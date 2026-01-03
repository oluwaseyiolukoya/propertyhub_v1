import prisma from '../lib/db';

/**
 * Seed email templates into the database
 * This function creates default email templates if they don't exist
 */
export async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');

  // Import the templates array from the seed script
  // For now, we'll define a minimal set of essential templates
  const templates = [
    {
      name: 'Account Activation',
      type: 'activation',
      category: 'Onboarding',
      subject: '🎉 Your {{companyName}} Account is Now Active!',
      body_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Activated - Contrezz Platform</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🎉 Your Account is Active!</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Welcome to Contrezz Platform</p>
    </div>
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi <strong>{{customerName}}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        Great news! Your <strong>{{applicationType}}</strong> account for <strong>{{companyName}}</strong> has been activated and is ready to use.
      </p>
      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
        <h2 style="color: #667eea; margin: 0 0 15px; font-size: 18px; font-weight: 600;">Your Login Credentials</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 40%;">Email:</td>
            <td style="padding: 8px 0;">
              <span style="background-color: #f3f4f6; color: #333333; padding: 6px 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 500;">{{customerEmail}}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Temporary Password:</td>
            <td style="padding: 8px 0;">
              <span style="background-color: #f3f4f6; color: #333333; padding: 6px 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 500;">{{temporaryPassword}}</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Login to Your Account</a>
      </div>
      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
        For security reasons, please change your password after your first login.
      </p>
    </div>
    <div style="text-align: center; padding: 20px; color: #999999; font-size: 12px;">
      <p style="margin: 0;">This email was sent from Contrezz Property Management Platform.</p>
    </div>
  </div>
</body>
</html>`,
      body_text: `Hi {{customerName}},

Great news! Your {{applicationType}} account for {{companyName}} has been activated and is ready to use.

Your Login Credentials:
Email: {{customerEmail}}
Temporary Password: {{temporaryPassword}}

Login to your account: {{loginUrl}}

For security reasons, please change your password after your first login.

This email was sent from Contrezz Property Management Platform.`,
      variables: [
        { name: 'customerName', description: 'Name of the customer', required: true },
        { name: 'companyName', description: 'Company name', required: true },
        { name: 'customerEmail', description: 'Customer email address', required: true },
        { name: 'temporaryPassword', description: 'Temporary password for first login', required: true },
        { name: 'applicationType', description: 'Type of application (e.g., Property Owner, Developer)', required: true },
        { name: 'loginUrl', description: 'URL to login page', required: true },
      ],
      is_system: true,
      is_active: true,
    },
    {
      name: 'Password Reset',
      type: 'password_reset',
      category: 'Security',
      subject: '🔐 Reset Your Password - {{companyName}}',
      body_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Contrezz Platform</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🔐 Reset Your Password</h1>
    </div>
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi <strong>{{userName}}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        We received a request to reset your password for your {{companyName}} account. Click the button below to create a new password.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{resetUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Reset Password</a>
      </div>
      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
        This link will expire in 24 hours. If you didn't request a password reset, please ignore this email.
      </p>
    </div>
    <div style="text-align: center; padding: 20px; color: #999999; font-size: 12px;">
      <p style="margin: 0;">This email was sent from Contrezz Property Management Platform.</p>
    </div>
  </div>
</body>
</html>`,
      body_text: `Hi {{userName}},

We received a request to reset your password for your {{companyName}} account. Click the link below to create a new password.

Reset Password: {{resetUrl}}

This link will expire in 24 hours. If you didn't request a password reset, please ignore this email.

This email was sent from Contrezz Property Management Platform.`,
      variables: [
        { name: 'userName', description: 'Name of the user', required: true },
        { name: 'companyName', description: 'Company name', required: true },
        { name: 'resetUrl', description: 'URL to reset password page', required: true },
      ],
      is_system: true,
      is_active: true,
    },
    {
      name: 'Welcome Email',
      type: 'welcome',
      category: 'Onboarding',
      subject: 'Welcome to {{companyName}} - Contrezz Platform',
      body_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome - Contrezz Platform</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Contrezz!</h1>
    </div>
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi <strong>{{userName}}</strong>,
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
        Welcome to {{companyName}}! We're excited to have you on board.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
      </div>
    </div>
    <div style="text-align: center; padding: 20px; color: #999999; font-size: 12px;">
      <p style="margin: 0;">This email was sent from Contrezz Property Management Platform.</p>
    </div>
  </div>
</body>
</html>`,
      body_text: `Hi {{userName}},

Welcome to {{companyName}}! We're excited to have you on board.

Go to Dashboard: {{dashboardUrl}}

This email was sent from Contrezz Property Management Platform.`,
      variables: [
        { name: 'userName', description: 'Name of the user', required: true },
        { name: 'companyName', description: 'Company name', required: true },
        { name: 'dashboardUrl', description: 'URL to dashboard', required: true },
      ],
      is_system: true,
      is_active: true,
    },
  ];

  let createdCount = 0;
  let updatedCount = 0;

  for (const template of templates) {
    try {
      // Check if template already exists
      const existing = await prisma.email_templates.findUnique({
        where: { type: template.type },
      });

      if (existing) {
        // Update existing template
        await prisma.email_templates.update({
          where: { type: template.type },
          data: {
            name: template.name,
            subject: template.subject,
            body_html: template.body_html,
            body_text: template.body_text,
            variables: template.variables,
            category: template.category,
            version: existing.version + 1,
            updated_at: new Date(),
          },
        });
        updatedCount++;
        console.log(`✅ Updated template: ${template.name}`);
      } else {
        // Create new template
        await prisma.email_templates.create({
          data: {
            ...template,
            version: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        createdCount++;
        console.log(`✅ Created template: ${template.name}`);
      }
    } catch (error: any) {
      console.error(`❌ Error processing template "${template.name}":`, error.message);
    }
  }

  console.log(`✅ Email templates seeding completed! Created: ${createdCount}, Updated: ${updatedCount}`);
  
  return {
    success: true,
    created: createdCount,
    updated: updatedCount,
    total: templates.length,
  };
}

