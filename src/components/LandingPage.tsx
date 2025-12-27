import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Building,
  Star,
  ArrowRight,
  Building2,
  Users,
  Key,
  CreditCard,
  Wrench,
  Shield,
  CheckCircle,
  Zap,
  TrendingUp,
  Hammer,
  Sparkles,
} from "lucide-react";
import {
  ADD_ONS,
  formatCurrency,
  type UserType,
  type PricingPlan,
} from "../types/pricing";

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToGetStarted?: () => void;
  onNavigateToAPIDocumentation?: () => void;
  onNavigateToIntegrations?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToScheduleDemo?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToCareers?: () => void;
  onNavigateToHelpCenter?: () => void;
  onNavigateToCommunity?: () => void;
  onNavigateToStatus?: () => void;
  onNavigateToSecurity?: () => void;
}

export function LandingPage({
  onNavigateToLogin,
  onNavigateToGetStarted,
  onNavigateToAPIDocumentation,
  onNavigateToIntegrations,
  onNavigateToAbout,
  onNavigateToContact,
  onNavigateToScheduleDemo,
  onNavigateToBlog,
  onNavigateToCareers,
  onNavigateToHelpCenter,
  onNavigateToCommunity,
  onNavigateToStatus,
  onNavigateToSecurity,
}: LandingPageProps) {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedUserType, setSelectedUserType] =
    useState<UserType>("property-owner");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [ownerPlans, setOwnerPlans] = useState<PricingPlan[]>([]);
  const [developerPlans, setDeveloperPlans] = useState<PricingPlan[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Dynamic landing page content from database
  const [dynamicContent, setDynamicContent] = useState<{
    hero?: {
      badge: string;
      headline: string;
      subheadline: string;
      primaryCTA: string;
      secondaryCTA: string;
    };
    stats?: Array<{ value: string; label: string }>;
    features?: Array<{ title: string; description: string; color: string }>;
    testimonials?: Array<{
      name: string;
      company: string;
      role: string;
      text: string;
      rating: number;
    }>;
    cta?: {
      headline: string;
      description: string;
      primaryCTA: string;
      secondaryCTA: string;
    };
  } | null>(null);
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch dynamic landing page content from database
  useEffect(() => {
    async function loadLandingPageContent() {
      try {
        setContentLoading(true);
        console.log(
          "[LandingPage] Fetching dynamic content from /api/landing-pages/slug/home"
        );

        const timestamp = new Date().getTime();
        // Use same pattern as other API clients
        const apiUrl =
          import.meta.env.VITE_PUBLIC_API_URL ||
          (import.meta.env.DEV
            ? "http://localhost:5001/api"
            : "https://api.contrezz.com/api");
        const response = await fetch(
          `${apiUrl}/landing-pages/slug/home?_t=${timestamp}`,
          {
            cache: "no-cache",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            console.log(
              "[LandingPage] No dynamic content found, using default"
            );
            setDynamicContent(null);
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.page?.content) {
          console.log("[LandingPage] Loaded dynamic content:", {
            hasHero: !!result.page.content.hero,
            hasStats: !!result.page.content.stats,
            hasFeatures: !!result.page.content.features,
            hasTestimonials: !!result.page.content.testimonials,
            hasCTA: !!result.page.content.cta,
          });
          setDynamicContent(result.page.content);
        } else {
          console.log(
            "[LandingPage] No valid content in response, using default"
          );
          setDynamicContent(null);
        }
      } catch (error: any) {
        console.error("[LandingPage] Failed to load dynamic content:", error);
        // Use default content on error
        setDynamicContent(null);
      } finally {
        setContentLoading(false);
      }
    }

    loadLandingPageContent();
  }, []);

  // Fetch pricing plans for landing page from public API (database is source of truth)
  useEffect(() => {
    async function loadPricing() {
      try {
        setPricingLoading(true);
        setPricingError(null);
        console.log(
          "[LandingPage] Fetching pricing plans from /api/public/plans"
        );

        const timestamp = new Date().getTime();
        const response = await fetch(`/api/public/plans?_t=${timestamp}`, {
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error("Invalid pricing response");
        }

        const plans = result.data as any[];

        // Backend already filters isActive=true, so no need to check p.isActive here
        const owner: PricingPlan[] = plans
          .filter((p) => p.category === "property_management")
          .sort((a, b) => a.monthlyPrice - b.monthlyPrice)
          .map((p) => convertDbPlanToPricingPlan(p, "property-owner"));

        const developers: PricingPlan[] = plans
          .filter((p) => p.category === "development")
          .sort((a, b) => a.monthlyPrice - b.monthlyPrice)
          .map((p) => convertDbPlanToPricingPlan(p, "property-developer"));

        console.log("[LandingPage] Loaded pricing plans:", {
          owner: owner.map((p) => ({ name: p.name, price: p.price })),
          developers: developers.map((p) => ({ name: p.name, price: p.price })),
        });

        setOwnerPlans(owner);
        setDeveloperPlans(developers);
      } catch (error: any) {
        console.error("[LandingPage] Failed to load pricing plans:", error);
        setPricingError(error.message || "Failed to load pricing plans");
        setOwnerPlans([]);
        setDeveloperPlans([]);
      } finally {
        setPricingLoading(false);
      }
    }

    loadPricing();
  }, []);

  // Map database plan shape to landing page PricingPlan shape
  const convertDbPlanToPricingPlan = (
    dbPlan: any,
    userType: UserType
  ): PricingPlan => {
    const features = Array.isArray(dbPlan.features)
      ? dbPlan.features.map((text: string) => ({ text, included: true }))
      : [];

    const storageGB =
      typeof dbPlan.storageLimit === "number"
        ? dbPlan.storageLimit >= 999999
          ? "Unlimited"
          : `${Math.floor(dbPlan.storageLimit / 1024)}GB`
        : "0GB";

    const plan: PricingPlan = {
      id: dbPlan.id,
      name: dbPlan.name,
      description: dbPlan.description || "",
      price: dbPlan.monthlyPrice,
      annualPrice: dbPlan.annualPrice,
      currency: dbPlan.currency || "NGN",
      billingPeriod: "month",
      userType,
      popular: dbPlan.isPopular || false,
      limits: {
        properties: dbPlan.propertyLimit || 0,
        units: dbPlan.propertyLimit ? dbPlan.propertyLimit * 20 : 0,
        projects: dbPlan.projectLimit || 0,
        users: dbPlan.userLimit >= 999 ? -1 : dbPlan.userLimit,
        storage: storageGB,
      },
      features,
      cta: {
        text:
          dbPlan.monthlyPrice > 50000 ? "Contact Sales" : "Start Free Trial",
        action: dbPlan.monthlyPrice > 50000 ? "contact" : "signup",
      },
    };

    return plan;
  };

  const features = [
    {
      icon: Building2,
      title: "Property & Portfolio Management",
      description:
        "See everything at a glance. Manage unlimited properties, track occupancy rates, monitor construction progress, and get instant insights that help you make smarter decisions—all from one powerful dashboard.",
      color: "blue",
    },
    {
      icon: Users,
      title: "Tenant & Stakeholder Management",
      description:
        "Turn tenant management from a headache into a breeze. Streamline applications, automate lease agreements, keep everyone informed, and build better relationships with tenants and investors.",
      color: "green",
    },
    {
      icon: CreditCard,
      title: "Automated Payment Collection",
      description:
        "Get paid on time, every time. Automated rent reminders, multiple payment options, and instant notifications mean you'll never chase another payment. Property managers see 97% on-time collection rates.",
      color: "purple",
    },
    {
      icon: Key,
      title: "Smart Access Control",
      description:
        "Revolutionary keycard system that automatically grants or revokes access based on payment status. No more changing locks, lost keys, or unauthorized access. Your properties stay secure, automatically.",
      color: "orange",
    },
    {
      icon: Wrench,
      title: "Project & Maintenance Tracking",
      description:
        "Never miss a deadline or maintenance request again. Track construction milestones, assign vendors, monitor progress in real-time, and keep your team aligned—all from one place.",
      color: "red",
    },
    {
      icon: Shield,
      title: "Bank-Level Security & Compliance",
      description:
        "Your data is protected with enterprise-grade security. SSL encryption, automated backups, and full NDPR compliance ensure your business and tenant information stays safe and compliant.",
      color: "indigo",
    },
  ];

  const defaultStats = [
    { value: "₦7.5B+", label: "Portfolio Value Managed", icon: TrendingUp },
    { value: "20+ Hours", label: "Saved Weekly Per User", icon: Zap },
    { value: "500+", label: "Property Professionals", icon: Building2 },
  ];

  // Merge dynamic stats with icons from default stats
  const stats = dynamicContent?.stats
    ? dynamicContent.stats.map((stat, index) => ({
        ...stat,
        icon: defaultStats[index]?.icon || TrendingUp,
      }))
    : defaultStats;

  // Merge dynamic features with icons from default features
  const mergedFeatures = dynamicContent?.features
    ? dynamicContent.features.map((feature, index) => ({
        ...feature,
        icon: features[index]?.icon || Building2,
      }))
    : features;

  const testimonials = [
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
  ];

  // ContrezztLogo component (brand guideline compliant)
  const ContrezztLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="4"
        y="16"
        width="12"
        height="20"
        rx="2"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <rect
        x="20"
        y="8"
        width="12"
        height="28"
        rx="2"
        fill="currentColor"
        fillOpacity="1"
      />
      <rect
        x="12"
        y="4"
        width="8"
        height="14"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.7"
      />
      <circle cx="10" cy="22" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="10" cy="28" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="26" cy="14" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="26" cy="20" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="26" cy="26" r="1.5" fill="white" fillOpacity="0.6" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="bg-gradient-to-br from-purple-600 to-violet-600 p-1.5 rounded-lg">
                <ContrezztLogo className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Contrezz</h1>
              <Badge variant="secondary" className="ml-2">
                SaaS
              </Badge>
            </button>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-gray-900"
              >
                Testimonials
              </a>
              <Button onClick={onNavigateToLogin}>Sign In</Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 lg:pt-40 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div
              className={`transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white border-0 animate-bounce">
                <Building2 className="h-3 w-3 mr-1" />{" "}
                {dynamicContent?.hero?.badge ||
                  "For Property Managers & Developers"}
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {dynamicContent?.hero?.headline ||
                  "Stop Chasing Rent. Start Growing Your Portfolio."}
                {!dynamicContent?.hero?.headline && (
                  <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    {" "}
                    All in One Platform.
                  </span>
                )}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {dynamicContent?.hero?.subheadline ||
                  "The only property management platform built for Nigeria. Automate rent collection, track construction budgets, manage tenants, and scale your business—without the stress."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="text-lg px-8 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  onClick={onNavigateToGetStarted || onNavigateToLogin}
                >
                  {dynamicContent?.hero?.primaryCTA || "Start Free Trial"}{" "}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onNavigateToScheduleDemo}
                  className="text-lg px-8 border-2 hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
                >
                  {dynamicContent?.hero?.secondaryCTA || "Schedule Demo"}
                </Button>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-8">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`text-center transform transition-all duration-700 delay-${
                      index * 200
                    } ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10"
                    }`}
                  >
                    {stat.icon && (
                      <div className="flex items-center justify-center mb-2">
                        <stat.icon className="h-6 w-6 text-purple-600 mr-2" />
                      </div>
                    )}
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-gray-600 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`relative transition-all duration-1000 delay-300 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-10"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-violet-600 rounded-3xl transform rotate-6 animate-pulse"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 hover:shadow-3xl transition-shadow duration-300">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 transition-colors duration-200 group">
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold flex items-center">
                        Property Portfolio
                        <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      </div>
                      <div className="text-sm text-gray-600">
                        Manage all properties in one place
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 transition-colors duration-200 group">
                    <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold flex items-center">
                        Tenant Management
                        <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      </div>
                      <div className="text-sm text-gray-600">
                        Streamlined tenant operations
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 transition-colors duration-200 group">
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <CreditCard className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold flex items-center">
                        Payment Processing
                        <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                      </div>
                      <div className="text-sm text-gray-600">
                        Automated rent collection
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-gradient-to-b from-white to-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-200">
              <Building2 className="h-3 w-3 mr-1" /> Built for Managers &
              Developers
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Property Business—From One
              Dashboard
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're managing rentals or building new properties, get
              all the tools you need to save time, reduce costs, and grow
              faster. No more juggling spreadsheets, chasing payments, or losing
              track of projects.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mergedFeatures.map((feature, index) => {
              const colorClasses = {
                blue: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
                green:
                  "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
                purple:
                  "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
                orange:
                  "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
                red: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
                indigo:
                  "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
              };

              return (
                <Card
                  key={index}
                  className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      colorClasses[feature.color as keyof typeof colorClasses]
                    } opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  ></div>
                  <CardHeader className="relative">
                    <div
                      className={`h-14 w-14 bg-gradient-to-br ${
                        colorClasses[feature.color as keyof typeof colorClasses]
                      } rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      {feature.icon && (
                        <feature.icon className="h-7 w-7 text-white" />
                      )}
                    </div>
                    <CardTitle className="text-xl group-hover:text-gray-900 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-4 flex items-center text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-sm font-semibold">Learn more</span>
                      <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Zap className="h-3 w-3 mr-1" /> Flexible Pricing
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Pricing That Grows With Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, scale as you grow. All plans include a 14-day free
              trial—no credit card required. Cancel anytime.
            </p>
          </div>

          {/* User Type Tabs */}
          <Tabs
            value={selectedUserType}
            onValueChange={(value) => setSelectedUserType(value as UserType)}
            className="w-full"
          >
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-2 h-14">
                <TabsTrigger
                  value="property-owner"
                  className="flex items-center gap-2 text-base"
                >
                  <Building2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Property</span> Owners
                </TabsTrigger>
                <TabsTrigger
                  value="property-developer"
                  className="flex items-center gap-2 text-base"
                >
                  <Hammer className="w-5 h-5" />
                  <span className="hidden sm:inline">Property</span> Developers
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Property Owner Plans */}
            <TabsContent value="property-owner" className="mt-0">
              <div className="mb-8 text-center">
                <p className="text-lg text-gray-600 font-semibold">
                  For Property Owners & Managers
                </p>
                <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
                  Perfect for landlords, property managers, and facility
                  management companies. Stop spending hours on admin work.
                  Automate rent collection, streamline tenant management, and
                  track maintenance—so you can focus on growing your portfolio.
                </p>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                      billingCycle === "monthly"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                      billingCycle === "annual"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Annual
                    <span className="ml-2 text-xs text-green-600 font-semibold">
                      Save 17%
                    </span>
                  </button>
                </div>
              </div>

              {pricingLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
                </div>
              ) : ownerPlans.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    No pricing plans are available yet. Please create plans in
                    the Admin dashboard.
                  </p>
                  {pricingError && (
                    <p className="text-sm text-red-500 mt-2">{pricingError}</p>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {ownerPlans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`relative flex flex-col ${
                        plan.popular
                          ? "border-orange-500 border-2 shadow-xl scale-105"
                          : "border-gray-200"
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1">
                            <Sparkles className="w-3 h-3 mr-1 inline" />
                            Most Popular
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pb-8">
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <p className="text-gray-600 text-base mt-2">
                          {plan.description}
                        </p>
                        <div className="mt-6">
                          <div className="flex items-baseline">
                            <span className="text-4xl font-bold text-gray-900">
                              {billingCycle === "annual" && plan.annualPrice
                                ? formatCurrency(plan.annualPrice)
                                : formatCurrency(plan.price)}
                            </span>
                            <span className="text-gray-600 ml-2">
                              /{billingCycle === "annual" ? "year" : "month"}
                            </span>
                          </div>
                          {billingCycle === "annual" && plan.annualPrice && (
                            <p className="text-sm text-green-600 mt-2">
                              Save{" "}
                              {formatCurrency(
                                plan.price * 12 - plan.annualPrice
                              )}{" "}
                              per year
                            </p>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1">
                        <ul className="space-y-3">
                          {plan.features.slice(0, 6).map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              {feature.included ? (
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <span className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              )}
                              <span
                                className={`text-sm ${
                                  feature.included
                                    ? "text-gray-700"
                                    : "text-gray-400"
                                }`}
                              >
                                {feature.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>

                      <div className="p-6 pt-0">
                        <Button
                          className={`w-full ${
                            plan.popular
                              ? "bg-orange-500 hover:bg-orange-600"
                              : "bg-gray-900 hover:bg-gray-800"
                          }`}
                          size="lg"
                          onClick={
                            plan.cta.action === "contact"
                              ? onNavigateToContact
                              : onNavigateToGetStarted || onNavigateToLogin
                          }
                        >
                          {plan.cta.text}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Property Developer Plans */}
            <TabsContent value="property-developer" className="mt-0">
              <div className="mb-8 text-center">
                <p className="text-lg text-gray-600 font-semibold">
                  For Property Developers & Builders
                </p>
                <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
                  Built for developers, construction companies, and real estate
                  investors. Keep projects on budget and on schedule. Track
                  expenses, manage vendors, monitor milestones, and deliver
                  projects faster—without the spreadsheets.
                </p>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                      billingCycle === "monthly"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                      billingCycle === "annual"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Annual
                    <span className="ml-2 text-xs text-green-600 font-semibold">
                      Save 17%
                    </span>
                  </button>
                </div>
              </div>

              {pricingLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
                </div>
              ) : developerPlans.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    No developer plans are available yet. Please create plans in
                    the Admin dashboard.
                  </p>
                  {pricingError && (
                    <p className="text-sm text-red-500 mt-2">{pricingError}</p>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {developerPlans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`relative flex flex-col ${
                        plan.popular
                          ? "border-orange-500 border-2 shadow-xl scale-105"
                          : "border-gray-200"
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1">
                            <Sparkles className="w-3 h-3 mr-1 inline" />
                            Most Popular
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pb-8">
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <p className="text-gray-600 text-base mt-2">
                          {plan.description}
                        </p>
                        <div className="mt-6">
                          <div className="flex items-baseline">
                            <span className="text-4xl font-bold text-gray-900">
                              {billingCycle === "annual" && plan.annualPrice
                                ? formatCurrency(plan.annualPrice)
                                : formatCurrency(plan.price)}
                            </span>
                            <span className="text-gray-600 ml-2">
                              /{billingCycle === "annual" ? "year" : "month"}
                            </span>
                          </div>
                          {billingCycle === "annual" && plan.annualPrice && (
                            <p className="text-sm text-green-600 mt-2">
                              Save{" "}
                              {formatCurrency(
                                plan.price * 12 - plan.annualPrice
                              )}{" "}
                              per year
                            </p>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1">
                        <ul className="space-y-3">
                          {plan.features.slice(0, 6).map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              {feature.included ? (
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <span className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              )}
                              <span
                                className={`text-sm ${
                                  feature.included
                                    ? "text-gray-700"
                                    : "text-gray-400"
                                }`}
                              >
                                {feature.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>

                      <div className="p-6 pt-0">
                        <Button
                          className={`w-full ${
                            plan.popular
                              ? "bg-orange-500 hover:bg-orange-600"
                              : "bg-gray-900 hover:bg-gray-800"
                          }`}
                          size="lg"
                          onClick={
                            plan.cta.action === "contact"
                              ? onNavigateToContact
                              : onNavigateToGetStarted || onNavigateToLogin
                          }
                        >
                          {plan.cta.text}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Add-ons Section */}
          <div className="mt-24">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Add-Ons & Extras
              </h3>
              <p className="text-lg text-gray-600">
                Customize your plan with additional features
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ADD_ONS.filter((addon) =>
                addon.userTypes.includes(selectedUserType)
              ).map((addon) => (
                <Card
                  key={addon.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{addon.name}</CardTitle>
                    <p className="text-gray-600 text-sm">{addon.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(addon.price)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {addon.unit}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Frequently Asked Questions
            </h3>
            <div className="space-y-6">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    How quickly can I get started?
                  </h4>
                  <p className="text-gray-600">
                    You can be up and running in minutes. Sign up for your free
                    14-day trial, add your properties, and start managing
                    immediately. No setup fees, no credit card required, no long
                    onboarding process.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Can I change plans later?
                  </h4>
                  <p className="text-gray-600">
                    Absolutely! Upgrade or downgrade anytime as your business
                    grows. Changes take effect immediately, and we'll
                    automatically prorate the difference—no hassle, no
                    penalties.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    What payment methods do you accept?
                  </h4>
                  <p className="text-gray-600">
                    We accept all major credit cards, debit cards, and bank
                    transfers through Paystack—Nigeria's most trusted payment
                    processor. All transactions are secure and encrypted.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Is my data safe?
                  </h4>
                  <p className="text-gray-600">
                    Yes. We use bank-level security with SSL encryption,
                    automated backups, and full NDPR compliance. Your data is
                    protected 24/7, and we never share it with third parties.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    What if I need help?
                  </h4>
                  <p className="text-gray-600">
                    We're here for you. Get instant help from our knowledge
                    base, join our community of property professionals, or
                    contact our support team. We respond within 24 hours,
                    usually much faster.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white border-0">
              <Star className="h-3 w-3 mr-1 fill-current" /> Rated 4.9/5 by
              Property Professionals
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Join 500+ Property Professionals Who've Transformed Their Business
            </h2>
            <p className="text-xl text-gray-600">
              See how property managers and developers across Nigeria are saving
              time, increasing revenue, and scaling faster with Contrezz
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm"
              >
                <CardContent className="pt-6">
                  <div className="flex mb-4 space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current transform group-hover:scale-110 transition-transform duration-200"
                        style={{ transitionDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.company}
                      </div>
                      {"role" in testimonial && (
                        <div className="text-xs text-gray-400">
                          {testimonial.role}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 bg-[length:200%_100%] animate-gradient overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-20 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm animate-bounce">
            <CheckCircle className="h-3 w-3 mr-1" /> No Credit Card Required
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {dynamicContent?.cta?.headline ||
              "Ready to Transform Your Property Business?"}
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            {dynamicContent?.cta?.description ||
              "Join 500+ property professionals who've automated their operations, increased on-time rent collection to 97%, and saved 20+ hours per week. Start your free 14-day trial today—no credit card required."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-10 py-6 bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-2xl"
              onClick={onNavigateToGetStarted || onNavigateToLogin}
            >
              {dynamicContent?.cta?.primaryCTA || "Start My Free 14-Day Trial"}{" "}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-6 bg-white/10 text-white border-2 border-white hover:bg-white hover:text-purple-600 transform hover:scale-105 transition-all duration-200 backdrop-blur-sm"
              onClick={onNavigateToLogin}
            >
              {dynamicContent?.cta?.secondaryCTA || "Sign In"}
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-8 text-white/90">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-6 w-6" />
                <span className="font-bold">Contrezz</span>
              </div>
              <p className="text-gray-400">
                Contrezz is Nigeria's leading property management and
                development platform. Trusted by over 500 property professionals
                to automate operations, increase revenue, and scale their
                businesses—all from one powerful platform.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <button
                    onClick={onNavigateToAPIDocumentation}
                    className="hover:text-white transition-colors text-left"
                  >
                    API Documentation
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToIntegrations}
                    className="hover:text-white transition-colors text-left"
                  >
                    Integrations
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button
                    onClick={onNavigateToAbout}
                    className="hover:text-white transition-colors text-left"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToBlog}
                    className="hover:text-white transition-colors text-left"
                  >
                    Blog
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToCareers}
                    className="hover:text-white transition-colors text-left"
                  >
                    Careers
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToContact}
                    className="hover:text-white transition-colors text-left"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button
                    onClick={onNavigateToHelpCenter}
                    className="hover:text-white transition-colors text-left"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToCommunity}
                    className="hover:text-white transition-colors text-left"
                  >
                    Community
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToStatus}
                    className="hover:text-white transition-colors text-left"
                  >
                    Status
                  </button>
                </li>
                <li>
                  <button
                    onClick={onNavigateToSecurity}
                    className="hover:text-white transition-colors text-left"
                  >
                    Security
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Contrezz. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
