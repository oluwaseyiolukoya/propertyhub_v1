import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import {
  Save,
  Loader2,
  Home,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { publicAdminApi } from "../../../lib/api/publicAdminApi";
import { canEditContent } from "../../../lib/utils/adminPermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";

interface LandingPageContent {
  hero: {
    badge: string;
    headline: string;
    highlightText?: string;
    subheadline: string;
    primaryCTA: string;
    secondaryCTA: string;
  };
  stats: Array<{
    value: string;
    label: string;
  }>;
  features: Array<{
    title: string;
    description: string;
    color: string;
  }>;
  testimonials: Array<{
    name: string;
    company: string;
    role: string;
    text: string;
    rating: number;
  }>;
  cta: {
    headline: string;
    description: string;
    primaryCTA: string;
    secondaryCTA: string;
  };
}

export function HomePageEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);
  const [content, setContent] = useState<LandingPageContent>({
    hero: {
      badge: "For Property Managers & Developers",
      headline: "Stop Chasing Rent. Start Growing Your Portfolio.",
      highlightText: "All in One Platform.",
      subheadline:
        "The only property management platform built for Nigeria. Automate rent collection, track construction budgets, manage tenants, and scale your business—without the stress.",
      primaryCTA: "Start Free Trial",
      secondaryCTA: "Schedule Demo",
    },
    stats: [
      { value: "₦7.5B+", label: "Portfolio Value Managed" },
      { value: "20+ Hours", label: "Saved Weekly Per User" },
      { value: "500+", label: "Property Professionals" },
    ],
    features: [
      {
        title: "Property & Portfolio Management",
        description:
          "See everything at a glance. Manage unlimited properties, track occupancy rates, monitor construction progress, and get instant insights that help you make smarter decisions—all from one powerful dashboard.",
        color: "blue",
      },
      {
        title: "Tenant & Stakeholder Management",
        description:
          "Turn tenant management from a headache into a breeze. Streamline applications, automate lease agreements, keep everyone informed, and build better relationships with tenants and investors.",
        color: "green",
      },
      {
        title: "Automated Payment Collection",
        description:
          "Get paid on time, every time. Automated rent reminders, multiple payment options, and instant notifications mean you'll never chase another payment. Property managers see 97% on-time collection rates.",
        color: "purple",
      },
      {
        title: "Smart Access Control",
        description:
          "Revolutionary keycard system that automatically grants or revokes access based on payment status. No more changing locks, lost keys, or unauthorized access. Your properties stay secure, automatically.",
        color: "orange",
      },
      {
        title: "Project & Maintenance Tracking",
        description:
          "Never miss a deadline or maintenance request again. Track construction milestones, assign vendors, monitor progress in real-time, and keep your team aligned—all from one place.",
        color: "red",
      },
      {
        title: "Bank-Level Security & Compliance",
        description:
          "Your data is protected with enterprise-grade security. SSL encryption, automated backups, and full NDPR compliance ensure your business and tenant information stays safe and compliant.",
        color: "indigo",
      },
    ],
    testimonials: [
      {
        name: "Adebayo Oladipo",
        company: "Skyline Properties Lagos",
        role: "Managing Director | 45 Properties",
        rating: 5,
        text: "Before Contrezz, I spent 3 days every month chasing rent payments. Now, 98% of my tenants pay on time thanks to automated reminders. The keycard system is genius—no more changing locks when tenants leave!",
      },
      {
        name: "Olumide Balogun",
        company: "Balogun Developments",
        role: "CEO | ₦2.3B in Active Projects",
        rating: 5,
        text: "Managing 8 construction projects simultaneously was a nightmare. Contrezz's developer dashboard gives me real-time visibility into budgets, timelines, and vendor performance. We've reduced cost overruns by 15%.",
      },
      {
        name: "Chioma Nwosu",
        company: "Prime Estates Nigeria",
        role: "Operations Manager | 60 Properties",
        rating: 5,
        text: "We manage properties across Lagos and Abuja. Contrezz cut our admin time by 70% and increased our on-time rent collection from 65% to 97%. The ROI was immediate—we recovered the subscription cost in the first month.",
      },
    ],
    cta: {
      headline: "Ready to Transform Your Property Business?",
      description:
        "Join 500+ property professionals who've automated their operations, increased on-time rent collection to 97%, and saved 20+ hours per week. Start your free 14-day trial today—no credit card required.",
      primaryCTA: "Start My Free 14-Day Trial",
      secondaryCTA: "Sign In",
    },
  });

  useEffect(() => {
    loadHomePage();
  }, []);

  const loadHomePage = async () => {
    try {
      setLoading(true);
      console.log("[HomePageEditor] Loading home page...");
      // Try to get home page by slug first
      try {
        const response = await publicAdminApi.landingPages.getBySlug("home");
        console.log("[HomePageEditor] Slug route response:", {
          hasPage: !!response.page,
          pageId: response.page?.id,
          hasContent: !!response.page?.content,
          contentType: typeof response.page?.content,
        });
        if (response.page) {
          setPageId(response.page.id);
          // Parse content if it exists
          if (
            response.page.content &&
            typeof response.page.content === "object"
          ) {
            console.log("[HomePageEditor] Setting content from database:", {
              hero: response.page.content.hero?.headline,
              statsCount: response.page.content.stats?.length,
              featuresCount: response.page.content.features?.length,
            });
            setContent(response.page.content as LandingPageContent);
          } else {
            console.log("[HomePageEditor] No valid content found in response");
          }
          return; // Successfully loaded
        }
      } catch (slugError: any) {
        // If slug route fails (404, connection error, etc.), try to find in the list
        console.log(
          "[HomePageEditor] Slug route failed, trying list...",
          slugError?.error || slugError?.message || slugError
        );
        try {
          const listResponse = await publicAdminApi.landingPages.list();
          const homePage = listResponse.pages?.find(
            (p: any) => p.slug === "home"
          );
          if (homePage) {
            console.log("[HomePageEditor] Found home page in list:", {
              pageId: homePage.id,
              hasContent: !!homePage.content,
              contentType: typeof homePage.content,
            });
            setPageId(homePage.id);
            if (homePage.content && typeof homePage.content === "object") {
              console.log("[HomePageEditor] Setting content from list:", {
                hero: homePage.content.hero?.headline,
                statsCount: homePage.content.stats?.length,
                featuresCount: homePage.content.features?.length,
              });
              setContent(homePage.content as LandingPageContent);
            }
            return; // Successfully loaded from list
          }
          // If still not found, that's fine - we'll create on save
          console.log(
            "[HomePageEditor] Home page not found, will create on first save"
          );
        } catch (listError: any) {
          console.error(
            "[HomePageEditor] List route also failed:",
            listError?.error || listError?.message || listError
          );
          // If both routes fail, just use default content
          // The user can still edit and save, which will create/update the page
        }
      }
    } catch (error: any) {
      console.error("[HomePageEditor] Error loading home page:", error);
      // Don't show error toast for 404 - it's expected if page doesn't exist
      if (error.error && !error.error.includes("not found")) {
        toast.error("Failed to load home page content");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log("[HomePageEditor] Saving home page...", {
        pageId,
        hasContent: !!content,
        contentKeys: content ? Object.keys(content) : [],
        heroHeadline: content?.hero?.headline,
      });

      const pageData = {
        slug: "home",
        title: "Home",
        subtitle: "Main Landing Page",
        content: content,
        published: true, // Always publish the home page
      };

      // If we have a pageId, update it
      if (pageId) {
        console.log("[HomePageEditor] Updating existing page:", pageId);
        const response = await publicAdminApi.landingPages.update(
          pageId,
          pageData
        );
        console.log("[HomePageEditor] Update response:", {
          message: response.message,
          pageId: response.page?.id,
          hasContent: !!response.page?.content,
        });
        toast.success("Home page updated successfully");
        // Reload the page to get the latest data
        await loadHomePage();
        return;
      }

      // Try to find existing page by listing all pages
      try {
        const listResponse = await publicAdminApi.landingPages.list();
        const existingPage = listResponse.pages?.find(
          (p: any) => p.slug === "home"
        );

        if (existingPage) {
          // Update existing page
          console.log(
            "[HomePageEditor] Found existing page, updating:",
            existingPage.id
          );
          setPageId(existingPage.id);
          const response = await publicAdminApi.landingPages.update(
            existingPage.id,
            pageData
          );
          console.log("[HomePageEditor] Update response:", {
            message: response.message,
            pageId: response.page?.id,
            hasContent: !!response.page?.content,
          });
          toast.success("Home page updated successfully");
          // Reload the page to get the latest data
          await loadHomePage();
        } else {
          // Create new page
          console.log("[HomePageEditor] Creating new page...");
          const response = await publicAdminApi.landingPages.create(pageData);
          console.log("[HomePageEditor] Create response:", {
            pageId: response.page?.id,
            hasContent: !!response.page?.content,
          });
          setPageId(response.page.id);
          toast.success("Home page created successfully");
          // Reload the page to get the latest data
          await loadHomePage();
        }
      } catch (createError: any) {
        // If create fails with "already exists" error, try to find and update
        if (createError.error?.includes("already exists")) {
          const listResponse = await publicAdminApi.landingPages.list();
          const existingPage = listResponse.pages?.find(
            (p: any) => p.slug === "home"
          );
          if (existingPage) {
            console.log(
              "[HomePageEditor] Found existing page after create error, updating:",
              existingPage.id
            );
            setPageId(existingPage.id);
            const response = await publicAdminApi.landingPages.update(
              existingPage.id,
              pageData
            );
            console.log("[HomePageEditor] Update response:", {
              message: response.message,
              pageId: response.page?.id,
              hasContent: !!response.page?.content,
            });
            toast.success("Home page updated successfully");
            // Reload the page to get the latest data
            await loadHomePage();
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.error || error.message || "Failed to save home page");
    } finally {
      setSaving(false);
    }
  };

  const updateHero = (
    field: keyof LandingPageContent["hero"],
    value: string | undefined
  ) => {
    setContent((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }));
  };

  const updateStat = (
    index: number,
    field: "value" | "label",
    value: string
  ) => {
    setContent((prev) => ({
      ...prev,
      stats: prev.stats.map((stat, i) =>
        i === index ? { ...stat, [field]: value } : stat
      ),
    }));
  };

  const addStat = () => {
    setContent((prev) => ({
      ...prev,
      stats: [...prev.stats, { value: "", label: "" }],
    }));
  };

  const removeStat = (index: number) => {
    setContent((prev) => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index),
    }));
  };

  const updateFeature = (
    index: number,
    field: "title" | "description" | "color",
    value: string
  ) => {
    setContent((prev) => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? { ...feature, [field]: value } : feature
      ),
    }));
  };

  const addFeature = () => {
    setContent((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { title: "", description: "", color: "blue" },
      ],
    }));
  };

  const removeFeature = (index: number) => {
    setContent((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const moveFeature = (index: number, direction: "up" | "down") => {
    setContent((prev) => {
      const newFeatures = [...prev.features];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newFeatures.length) return prev;
      [newFeatures[index], newFeatures[newIndex]] = [
        newFeatures[newIndex],
        newFeatures[index],
      ];
      return { ...prev, features: newFeatures };
    });
  };

  const updateTestimonial = (
    index: number,
    field: "name" | "company" | "role" | "text" | "rating",
    value: string | number
  ) => {
    setContent((prev) => ({
      ...prev,
      testimonials: prev.testimonials.map((testimonial, i) =>
        i === index ? { ...testimonial, [field]: value } : testimonial
      ),
    }));
  };

  const addTestimonial = () => {
    setContent((prev) => ({
      ...prev,
      testimonials: [
        ...prev.testimonials,
        {
          name: "",
          company: "",
          role: "",
          text: "",
          rating: 5,
        },
      ],
    }));
  };

  const removeTestimonial = (index: number) => {
    setContent((prev) => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== index),
    }));
  };

  const updateCTA = (field: keyof LandingPageContent["cta"], value: string) => {
    setContent((prev) => ({
      ...prev,
      cta: { ...prev.cta, [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Home Page Editor</h2>
          <p className="text-gray-500 mt-1">
            {canEditContent()
              ? "Manage the content of your main landing page"
              : "View the content of your main landing page (read-only)"}
          </p>
        </div>
        {canEditContent() && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="cta">CTA</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Hero Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hero-badge">Badge Text</Label>
                <Input
                  id="hero-badge"
                  value={content.hero.badge}
                  onChange={(e) => updateHero("badge", e.target.value)}
                  placeholder="For Property Managers & Developers"
                  disabled={!canEditContent()}
                  readOnly={!canEditContent()}
                />
              </div>
              <div>
                <Label htmlFor="hero-headline">Headline</Label>
                <Input
                  id="hero-headline"
                  value={content.hero.headline}
                  onChange={(e) => updateHero("headline", e.target.value)}
                  placeholder="Stop Chasing Rent. Start Growing Your Portfolio."
                  disabled={!canEditContent()}
                  readOnly={!canEditContent()}
                />
              </div>
              <div>
                <Label htmlFor="hero-highlight-text">Highlight Text (e.g., "All in One Platform.")</Label>
                <Input
                  id="hero-highlight-text"
                  value={content.hero.highlightText || ""}
                  onChange={(e) => updateHero("highlightText", e.target.value)}
                  placeholder="All in One Platform."
                  disabled={!canEditContent()}
                  readOnly={!canEditContent()}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This text appears after the headline with gradient styling
                </p>
              </div>
              <div>
                <Label htmlFor="hero-subheadline">Subheadline</Label>
                <Textarea
                  id="hero-subheadline"
                  value={content.hero.subheadline}
                  onChange={(e) => updateHero("subheadline", e.target.value)}
                  placeholder="The only property management platform built for Nigeria..."
                  rows={4}
                  disabled={!canEditContent()}
                  readOnly={!canEditContent()}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hero-primary-cta">Primary CTA</Label>
                  <Input
                    id="hero-primary-cta"
                    value={content.hero.primaryCTA}
                    onChange={(e) => updateHero("primaryCTA", e.target.value)}
                    placeholder="Start Free Trial"
                    disabled={!canEditContent()}
                    readOnly={!canEditContent()}
                  />
                </div>
                <div>
                  <Label htmlFor="hero-secondary-cta">Secondary CTA</Label>
                  <Input
                    id="hero-secondary-cta"
                    value={content.hero.secondaryCTA}
                    onChange={(e) => updateHero("secondaryCTA", e.target.value)}
                    placeholder="Schedule Demo"
                    disabled={!canEditContent()}
                    readOnly={!canEditContent()}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Section */}
        <TabsContent value="stats" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Statistics</CardTitle>
                {canEditContent() && (
                  <Button onClick={addStat} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stat
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.stats.map((stat, index) => (
                <Card key={index} className="border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant="outline">Stat {index + 1}</Badge>
                      {canEditContent() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStat(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Value</Label>
                        <Input
                          value={stat.value}
                          onChange={(e) =>
                            updateStat(index, "value", e.target.value)
                          }
                          placeholder="₦7.5B+"
                          disabled={!canEditContent()}
                          readOnly={!canEditContent()}
                        />
                      </div>
                      <div>
                        <Label>Label</Label>
                        <Input
                          value={stat.label}
                          onChange={(e) =>
                            updateStat(index, "label", e.target.value)
                          }
                          placeholder="Portfolio Value Managed"
                          disabled={!canEditContent()}
                          readOnly={!canEditContent()}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Section */}
        <TabsContent value="features" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Features</CardTitle>
                {canEditContent() && (
                  <Button onClick={addFeature} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.features.map((feature, index) => (
                <Card key={index} className="border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant="outline">Feature {index + 1}</Badge>
                      {canEditContent() && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveFeature(index, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveFeature(index, "down")}
                            disabled={index === content.features.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeature(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={feature.title}
                          onChange={(e) =>
                            updateFeature(index, "title", e.target.value)
                          }
                          placeholder="Property & Portfolio Management"
                          disabled={!canEditContent()}
                          readOnly={!canEditContent()}
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={feature.description}
                          onChange={(e) =>
                            updateFeature(index, "description", e.target.value)
                          }
                          placeholder="See everything at a glance..."
                          rows={4}
                          disabled={!canEditContent()}
                          readOnly={!canEditContent()}
                        />
                      </div>
                      <div>
                        <Label>Color</Label>
                        <select
                          value={feature.color}
                          onChange={(e) =>
                            updateFeature(index, "color", e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-md"
                          disabled={!canEditContent()}
                        >
                          <option value="blue">Blue</option>
                          <option value="green">Green</option>
                          <option value="purple">Purple</option>
                          <option value="orange">Orange</option>
                          <option value="red">Red</option>
                          <option value="indigo">Indigo</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Section */}
        <TabsContent value="testimonials" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Testimonials</CardTitle>
                {canEditContent() && (
                  <Button onClick={addTestimonial} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Testimonial
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.testimonials.map((testimonial, index) => (
                <Card key={index} className="border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant="outline">Testimonial {index + 1}</Badge>
                      {canEditContent() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestimonial(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={testimonial.name}
                            onChange={(e) =>
                              updateTestimonial(index, "name", e.target.value)
                            }
                            placeholder="Adebayo Oladipo"
                            disabled={!canEditContent()}
                            readOnly={!canEditContent()}
                          />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={testimonial.company}
                            onChange={(e) =>
                              updateTestimonial(
                                index,
                                "company",
                                e.target.value
                              )
                            }
                            placeholder="Skyline Properties Lagos"
                            disabled={!canEditContent()}
                            readOnly={!canEditContent()}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Input
                          value={testimonial.role}
                          onChange={(e) =>
                            updateTestimonial(index, "role", e.target.value)
                          }
                          placeholder="Managing Director | 45 Properties"
                          disabled={!canEditContent()}
                          readOnly={!canEditContent()}
                        />
                      </div>
                      <div>
                        <Label>Testimonial Text</Label>
                        <Textarea
                          value={testimonial.text}
                          onChange={(e) =>
                            updateTestimonial(index, "text", e.target.value)
                          }
                          placeholder="Before Contrezz, I spent 3 days..."
                          rows={4}
                          disabled={!canEditContent()}
                          readOnly={!canEditContent()}
                        />
                      </div>
                      <div>
                        <Label>Rating (1-5)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={testimonial.rating}
                          onChange={(e) =>
                            updateTestimonial(
                              index,
                              "rating",
                              parseInt(e.target.value) || 5
                            )
                          }
                          disabled={!canEditContent()}
                          readOnly={!canEditContent()}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTA Section */}
        <TabsContent value="cta" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Call-to-Action Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cta-headline">Headline</Label>
                <Input
                  id="cta-headline"
                  value={content.cta.headline}
                  onChange={(e) => updateCTA("headline", e.target.value)}
                  placeholder="Ready to Transform Your Property Business?"
                  disabled={!canEditContent()}
                  readOnly={!canEditContent()}
                />
              </div>
              <div>
                <Label htmlFor="cta-description">Description</Label>
                <Textarea
                  id="cta-description"
                  value={content.cta.description}
                  onChange={(e) => updateCTA("description", e.target.value)}
                  placeholder="Join 500+ property professionals..."
                  rows={4}
                  disabled={!canEditContent()}
                  readOnly={!canEditContent()}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cta-primary">Primary CTA</Label>
                  <Input
                    id="cta-primary"
                    value={content.cta.primaryCTA}
                    onChange={(e) => updateCTA("primaryCTA", e.target.value)}
                    placeholder="Start My Free 14-Day Trial"
                    disabled={!canEditContent()}
                    readOnly={!canEditContent()}
                  />
                </div>
                <div>
                  <Label htmlFor="cta-secondary">Secondary CTA</Label>
                  <Input
                    id="cta-secondary"
                    value={content.cta.secondaryCTA}
                    onChange={(e) => updateCTA("secondaryCTA", e.target.value)}
                    placeholder="Sign In"
                    disabled={!canEditContent()}
                    readOnly={!canEditContent()}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
