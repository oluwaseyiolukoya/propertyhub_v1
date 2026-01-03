import React, { useState, useEffect } from 'react';
import { type EmailTemplate } from '../lib/api/email-templates';
import { previewEmailTemplate } from '../lib/api/email-templates';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Mail, Monitor, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplatePreviewProps {
  template: EmailTemplate;
  onBack: () => void;
}

export function EmailTemplatePreview({
  template,
  onBack,
}: EmailTemplatePreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewData, setPreviewData] = useState<{
    subject: string;
    body_html: string;
    body_text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [variables, setVariables] = useState<Record<string, any>>({});

  // Default sample variables based on template type
  const getDefaultVariables = () => {
    const defaults: Record<string, Record<string, any>> = {
      activation: {
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        companyName: 'Acme Corporation',
        temporaryPassword: 'TempPass123!',
        loginUrl: 'https://app.contrezz.com/signin',
        applicationType: 'Developer',
      },
      onboarding: {
        customerName: 'Jane Smith',
        customerEmail: 'jane.smith@example.com',
        companyName: 'Tech Solutions Inc',
      },
      password_reset: {
        customerName: 'John Doe',
        resetToken: 'abc123xyz',
        resetUrl: 'https://app.contrezz.com/reset-password?token=abc123xyz',
      },
      invitation: {
        customerName: 'John Doe',
        invitationLink: 'https://app.contrezz.com/accept-invitation?token=xyz789',
        inviterName: 'Admin User',
      },
      welcome: {
        customerName: 'John Doe',
        companyName: 'Acme Corporation',
        loginUrl: 'https://app.contrezz.com/signin',
      },
    };

    return defaults[template.type] || {
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
    };
  };

  useEffect(() => {
    setVariables(getDefaultVariables());
  }, [template.type]);

  // Load preview
  const loadPreview = async () => {
    try {
      setLoading(true);
      const response = await previewEmailTemplate(template.id, { variables });
      if (response.error) {
        toast.error(response.error.error || 'Failed to load preview');
      } else if (response.data) {
        setPreviewData(response.data);
      }
    } catch (error) {
      toast.error('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (template && Object.keys(variables).length > 0) {
      loadPreview();
    }
  }, [variables, template.id]);

  // Extract variable names from template
  const templateVars = (template.variables as Array<{ name: string; description: string }>) || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Preview Template</h1>
            <p className="text-gray-600 mt-1">{template.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview Variables */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Preview Variables</CardTitle>
              <CardDescription>
                Edit variable values to see how the template renders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templateVars.length > 0 ? (
                templateVars.map((varDef) => (
                  <div key={varDef.name}>
                    <Label htmlFor={varDef.name}>{varDef.name}</Label>
                    <Input
                      id={varDef.name}
                      value={variables[varDef.name] || ''}
                      onChange={(e) =>
                        setVariables((prev) => ({
                          ...prev,
                          [varDef.name]: e.target.value,
                        }))
                      }
                      placeholder={varDef.description}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No variables defined for this template
                </p>
              )}
              <Button onClick={loadPreview} className="w-full" disabled={loading}>
                {loading ? 'Loading...' : 'Refresh Preview'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="html" className="space-y-4">
            <TabsList>
              <TabsTrigger value="html">HTML Preview</TabsTrigger>
              <TabsTrigger value="text">Plain Text</TabsTrigger>
              <TabsTrigger value="source">Source</TabsTrigger>
            </TabsList>

            <TabsContent value="html">
              <Card>
                <CardHeader>
                  <CardTitle>Email Preview</CardTitle>
                  <CardDescription>
                    Subject: {previewData?.subject || template.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading preview...</div>
                  ) : previewData ? (
                    <div
                      className={`border rounded-lg overflow-auto bg-white ${
                        previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                      }`}
                      style={{
                        minHeight: '500px',
                        maxHeight: '800px',
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: previewData.body_html }}
                        style={{
                          padding: '20px',
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Click "Refresh Preview" to generate preview
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text">
              <Card>
                <CardHeader>
                  <CardTitle>Plain Text Version</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading preview...</div>
                  ) : previewData ? (
                    <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded border">
                      {previewData.body_text}
                    </pre>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Click "Refresh Preview" to generate preview
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="source">
              <Card>
                <CardHeader>
                  <CardTitle>HTML Source</CardTitle>
                </CardHeader>
                <CardContent>
                  {previewData ? (
                    <pre className="whitespace-pre-wrap font-mono text-xs p-4 bg-gray-50 rounded border overflow-auto max-h-[600px]">
                      {previewData.body_html}
                    </pre>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Click "Refresh Preview" to generate preview
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

