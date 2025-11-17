import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Save, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function HomepageSettings() {
  const [saving, setSaving] = useState(false);

  // Placeholder for homepage content
  // In production, this would load from an API or database
  const [settings, setSettings] = useState({
    hero: {
      title: 'Welcome to Contrezz',
      subtitle: 'The all-in-one property management solution',
      ctaText: 'Get Started',
      ctaLink: '/get-started',
      backgroundImage: '',
    },
    features: [
      { title: 'Property Management', description: 'Manage all your properties in one place', icon: 'building' },
      { title: 'Financial Reports', description: 'Track income and expenses', icon: 'chart' },
      { title: 'Tenant Portal', description: 'Modern tenant experience', icon: 'users' },
    ],
    testimonials: [
      { name: 'John Doe', company: 'Acme Properties', quote: 'Game changer for our business!' },
    ],
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: API call to save homepage settings
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Homepage settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>Main landing page hero content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero-title">Title</Label>
            <Input
              id="hero-title"
              value={settings.hero.title}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hero: { ...settings.hero, title: e.target.value },
                })
              }
              placeholder="Main headline"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-subtitle">Subtitle</Label>
            <Textarea
              id="hero-subtitle"
              value={settings.hero.subtitle}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hero: { ...settings.hero, subtitle: e.target.value },
                })
              }
              placeholder="Supporting text"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cta-text">CTA Button Text</Label>
              <Input
                id="cta-text"
                value={settings.hero.ctaText}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hero: { ...settings.hero, ctaText: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta-link">CTA Link</Label>
              <Input
                id="cta-link"
                value={settings.hero.ctaLink}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hero: { ...settings.hero, ctaLink: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-image">Background Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="hero-image"
                value={settings.hero.backgroundImage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    hero: { ...settings.hero, backgroundImage: e.target.value },
                  })
                }
                placeholder="https://..."
              />
              <Button variant="outline" size="icon">
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Features</CardTitle>
            <CardDescription>Key features to highlight</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.features.map((feature, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <Input
                      value={feature.title}
                      onChange={(e) => {
                        const newFeatures = [...settings.features];
                        newFeatures[index].title = e.target.value;
                        setSettings({ ...settings, features: newFeatures });
                      }}
                      placeholder="Feature title"
                    />
                    <Textarea
                      value={feature.description}
                      onChange={(e) => {
                        const newFeatures = [...settings.features];
                        newFeatures[index].description = e.target.value;
                        setSettings({ ...settings, features: newFeatures });
                      }}
                      placeholder="Feature description"
                      rows={2}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testimonials Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Testimonials</CardTitle>
            <CardDescription>Customer success stories</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.testimonials.map((testimonial, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={testimonial.name}
                        onChange={(e) => {
                          const newTestimonials = [...settings.testimonials];
                          newTestimonials[index].name = e.target.value;
                          setSettings({ ...settings, testimonials: newTestimonials });
                        }}
                        placeholder="Name"
                      />
                      <Input
                        value={testimonial.company}
                        onChange={(e) => {
                          const newTestimonials = [...settings.testimonials];
                          newTestimonials[index].company = e.target.value;
                          setSettings({ ...settings, testimonials: newTestimonials });
                        }}
                        placeholder="Company"
                      />
                    </div>
                    <Textarea
                      value={testimonial.quote}
                      onChange={(e) => {
                        const newTestimonials = [...settings.testimonials];
                        newTestimonials[index].quote = e.target.value;
                        setSettings({ ...settings, testimonials: newTestimonials });
                      }}
                      placeholder="Testimonial quote"
                      rows={2}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

