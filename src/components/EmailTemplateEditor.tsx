import React, { useState, useEffect } from 'react';
import { type EmailTemplate } from '../lib/api/email-templates';
import { EmailTemplateWYSIWYGEditor } from './EmailTemplateWYSIWYGEditor';
import { EmailTemplateHTMLEditor } from './EmailTemplateHTMLEditor';
import { EmailTemplateVariableHelper } from './EmailTemplateVariableHelper';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';
import { ArrowLeft, Save, Eye, Code, Type } from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplateEditorProps {
  template?: EmailTemplate | null;
  onSave: (data: any) => Promise<boolean>;
  onCancel: () => void;
}

export function EmailTemplateEditor({
  template,
  onSave,
  onCancel,
}: EmailTemplateEditorProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('custom');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'html'>('wysiwyg');
  const [variables, setVariables] = useState<Array<{ name: string; description: string; required?: boolean }>>([]);

  // Template types
  const templateTypes = [
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'activation', label: 'Activation' },
    { value: 'password_reset', label: 'Password Reset' },
    { value: 'invitation', label: 'Invitation' },
    { value: 'welcome', label: 'Welcome' },
    { value: 'custom', label: 'Custom' },
  ];

  // Initialize form with template data
  useEffect(() => {
    if (template) {
      setName(template.name);
      setType(template.type);
      setCategory(template.category || '');
      setSubject(template.subject);
      setBodyHtml(template.body_html);
      setBodyText(template.body_text || '');
      setIsActive(template.is_active);
      setVariables((template.variables as any) || []);
    }
  }, [template]);

  // Extract variables from template
  useEffect(() => {
    const extractVariables = (text: string): string[] => {
      const regex = /\{\{(\w+)\}\}/g;
      const vars: string[] = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (!vars.includes(match[1])) {
          vars.push(match[1]);
        }
      }
      return vars;
    };

    const subjectVars = extractVariables(subject);
    const htmlVars = extractVariables(bodyHtml);
    const textVars = bodyText ? extractVariables(bodyText) : [];
    const allVars = [...new Set([...subjectVars, ...htmlVars, ...textVars])];

    // Update variables list
    const newVars = allVars.map((varName) => {
      const existing = variables.find((v) => v.name === varName);
      return existing || {
        name: varName,
        description: `Variable: ${varName}`,
        required: false,
      };
    });

    setVariables(newVars);
  }, [subject, bodyHtml, bodyText]);

  // Handle save
  const handleSave = async () => {
    if (!name || !type || !subject || !bodyHtml) {
      toast.error('Please fill in all required fields');
      return;
    }

    const templateData = {
      name,
      type,
      category: category || undefined,
      subject,
      body_html: bodyHtml,
      body_text: bodyText || undefined,
      variables,
      is_active: isActive,
    };

    const success = await onSave(templateData);
    if (success) {
      // Editor will close on success
    }
  };

  // Handle variable insertion
  const handleInsertVariable = (varName: string) => {
    const variable = `{{${varName}}}`;
    if (editorMode === 'wysiwyg') {
      // For WYSIWYG, we'll need to handle this in the editor component
      setBodyHtml((prev) => prev + variable);
    } else {
      // For HTML editor, insert at cursor
      setBodyHtml((prev) => prev + variable);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {template ? 'Edit Template' : 'Create Template'}
            </h1>
            <p className="text-gray-600 mt-1">
              {template ? 'Update email template' : 'Create a new email template'}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Account Activation Email"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Template Type *</Label>
                  <Select value={type} onValueChange={setType} disabled={template?.is_system}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Onboarding"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="is-active">Template is active</Label>
              </div>
            </CardContent>
          </Card>

          {/* Subject */}
          <Card>
            <CardHeader>
              <CardTitle>Email Subject *</CardTitle>
              <CardDescription>
                Use variables like {'{{customerName}}'} for dynamic content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Welcome {{customerName}}!"
              />
            </CardContent>
          </Card>

          {/* Body Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Body *</CardTitle>
                  <CardDescription>
                    Switch between WYSIWYG and HTML editing modes
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={editorMode === 'wysiwyg' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorMode('wysiwyg')}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    WYSIWYG
                  </Button>
                  <Button
                    variant={editorMode === 'html' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorMode('html')}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    HTML
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editorMode === 'wysiwyg' ? (
                <EmailTemplateWYSIWYGEditor
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  onInsertVariable={handleInsertVariable}
                />
              ) : (
                <EmailTemplateHTMLEditor
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  onInsertVariable={handleInsertVariable}
                />
              )}
            </CardContent>
          </Card>

          {/* Plain Text (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle>Plain Text Version (Optional)</CardTitle>
              <CardDescription>
                Plain text fallback for email clients that don't support HTML
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[200px] p-3 border rounded-md font-mono text-sm"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Plain text version of the email..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Variable Helper */}
        <div className="lg:col-span-1">
          <EmailTemplateVariableHelper
            templateType={type}
            variables={variables}
            onInsertVariable={handleInsertVariable}
          />
        </div>
      </div>
    </div>
  );
}

