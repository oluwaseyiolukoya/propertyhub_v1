import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Info } from 'lucide-react';

interface EmailTemplateVariableHelperProps {
  templateType: string;
  variables: Array<{ name: string; description: string; required?: boolean }>;
  onInsertVariable: (varName: string) => void;
}

// Default variables for each template type
const DEFAULT_VARIABLES: Record<string, Array<{ name: string; description: string; required?: boolean }>> = {
  activation: [
    { name: 'customerName', description: 'Customer full name', required: true },
    { name: 'customerEmail', description: 'Customer email address', required: true },
    { name: 'companyName', description: 'Company/business name', required: true },
    { name: 'temporaryPassword', description: 'Temporary password for login', required: true },
    { name: 'loginUrl', description: 'Login page URL', required: true },
    { name: 'applicationType', description: 'Type of account (Developer, Property Owner, etc.)', required: false },
  ],
  onboarding: [
    { name: 'customerName', description: 'Customer full name', required: true },
    { name: 'customerEmail', description: 'Customer email address', required: true },
    { name: 'companyName', description: 'Company/business name', required: false },
  ],
  password_reset: [
    { name: 'customerName', description: 'Customer full name', required: true },
    { name: 'resetToken', description: 'Password reset token', required: true },
    { name: 'resetUrl', description: 'Password reset URL', required: true },
  ],
  invitation: [
    { name: 'customerName', description: 'Invited user name', required: true },
    { name: 'invitationLink', description: 'Invitation acceptance link', required: true },
    { name: 'inviterName', description: 'Name of person sending invitation', required: false },
  ],
  welcome: [
    { name: 'customerName', description: 'Customer full name', required: true },
    { name: 'companyName', description: 'Company/business name', required: false },
    { name: 'loginUrl', description: 'Login page URL', required: true },
  ],
  custom: [
    { name: 'customerName', description: 'Customer full name', required: false },
    { name: 'customerEmail', description: 'Customer email address', required: false },
  ],
};

export function EmailTemplateVariableHelper({
  templateType,
  variables,
  onInsertVariable,
}: EmailTemplateVariableHelperProps) {
  // Get available variables for this template type
  const availableVars = DEFAULT_VARIABLES[templateType] || DEFAULT_VARIABLES.custom;

  // Merge with template's custom variables
  const allVariables = [
    ...availableVars,
    ...variables.filter(
      (v) => !availableVars.some((av) => av.name === v.name)
    ),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Available Variables
        </CardTitle>
        <CardDescription>
          Click a variable to insert it into your template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {allVariables.length === 0 ? (
          <p className="text-sm text-gray-500">No variables available for this template type</p>
        ) : (
          allVariables.map((varDef) => (
            <div
              key={varDef.name}
              className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-purple-600">
                      {`{{${varDef.name}}}`}
                    </code>
                    {varDef.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{varDef.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onInsertVariable(varDef.name)}
                  className="ml-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> Variables use the format {'{{variableName}}'}. They will be
            replaced with actual values when the email is sent.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

