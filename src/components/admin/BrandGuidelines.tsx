import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Palette,
  Type,
  Image as ImageIcon,
  Download,
  ExternalLink,
  FileText,
  Sparkles,
} from "lucide-react";

// Exact Contrezz logo from Figma design
function ContrezztLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
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
}

export const BrandGuidelines = () => {
  const [activeSection, setActiveSection] = useState("overview");

  // Exact brand colors from Figma design
  const primaryColors = [
    {
      name: "Royal Purple",
      hex: "#7C3AED",
      rgb: "124, 58, 237",
      usage: "Primary actions, links",
    },
    {
      name: "Vibrant Violet",
      hex: "#A855F7",
      rgb: "168, 85, 247",
      usage: "Accents, highlights",
    },
    {
      name: "Deep Purple",
      hex: "#5B21B6",
      rgb: "91, 33, 182",
      usage: "Headers, emphasis",
    },
  ];

  const neutralColors = [
    {
      name: "Gray 900",
      hex: "#111827",
      rgb: "17, 24, 39",
      usage: "Primary text",
    },
    {
      name: "Gray 700",
      hex: "#374151",
      rgb: "55, 65, 81",
      usage: "Secondary text",
    },
    {
      name: "Gray 500",
      hex: "#6B7280",
      rgb: "107, 114, 128",
      usage: "Tertiary text",
    },
    {
      name: "Gray 300",
      hex: "#D1D5DB",
      rgb: "209, 213, 219",
      usage: "Borders",
    },
    {
      name: "Gray 100",
      hex: "#F3F4F6",
      rgb: "243, 244, 246",
      usage: "Backgrounds",
    },
    {
      name: "White",
      hex: "#FFFFFF",
      rgb: "255, 255, 255",
      usage: "Cards, surfaces",
    },
  ];

  const accentColors = [
    {
      name: "Success Green",
      hex: "#10B981",
      rgb: "16, 185, 129",
      usage: "Success states",
    },
    {
      name: "Warning Orange",
      hex: "#F59E0B",
      rgb: "245, 158, 11",
      usage: "Warnings",
    },
    {
      name: "Error Red",
      hex: "#EF4444",
      rgb: "239, 68, 68",
      usage: "Errors, alerts",
    },
    {
      name: "Info Blue",
      hex: "#3B82F6",
      rgb: "59, 130, 246",
      usage: "Information",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Brand Guidelines
            </h1>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              v1.0.0
            </Badge>
          </div>
          <p className="text-gray-600">
            Comprehensive guide to maintaining brand consistency across all
            Contrezz Property Management touchpoints.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://www.figma.com/make/Lojl0yoSABvelIXfxKKPHd/Brand-Guideline-Design?node-id=0-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Figma
            </a>
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Assets
          </Button>
        </div>
      </div>

      {/* Meta Information */}
      <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-sm text-gray-600 mb-1">Version</p>
              <p className="font-semibold text-gray-900">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Last Updated</p>
              <p className="font-semibold text-gray-900">December 2025</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Category</p>
              <p className="font-semibold text-gray-900">Property Tech</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logo">Logo & Brand Mark</TabsTrigger>
          <TabsTrigger value="colors">Color Palette</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <CardTitle>Brand Identity</CardTitle>
              </div>
              <CardDescription>
                The essence of Contrezz brand and what it represents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Our Mission</h3>
                <p className="text-gray-600">
                  To provide comprehensive property management solutions that
                  empower property owners, managers, and tenants with modern,
                  efficient, and transparent tools.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Brand Personality</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Professional",
                    "Modern",
                    "Trustworthy",
                    "Innovative",
                    "User-Friendly",
                    "Reliable",
                  ].map((trait) => (
                    <div key={trait} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                      <span className="text-sm text-gray-700">{trait}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Logo Concept</h3>
                <p className="text-gray-600">
                  The Contrezz logo features a modern geometric design
                  representing multiple properties and buildings, symbolizing
                  comprehensive property management solutions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logo & Brand Mark */}
        <TabsContent value="logo" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                <CardTitle>Logo Variations</CardTitle>
              </div>
              <CardDescription>
                Different versions of the Contrezz logo for various use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Primary Logo - Light Background */}
                <div className="p-12 rounded-2xl border-2 border-gray-200 bg-white">
                  <div className="text-center mb-8">
                    <span className="text-sm uppercase tracking-wider text-gray-500">
                      Primary Logo
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="bg-gradient-to-br from-purple-600 to-violet-500 p-3 rounded-xl">
                      <ContrezztLogo className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-4xl font-bold tracking-tight text-gray-900">
                      Contrezz
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    Use on light backgrounds
                  </div>
                </div>

                {/* Inverted Logo - Dark Background */}
                <div className="p-12 rounded-2xl border-2 border-gray-800 bg-gray-900">
                  <div className="text-center mb-8">
                    <span className="text-sm uppercase tracking-wider text-gray-400">
                      Inverted Logo
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="bg-gradient-to-br from-purple-400 to-violet-300 p-3 rounded-xl">
                      <ContrezztLogo className="w-8 h-8 text-gray-900" />
                    </div>
                    <div className="text-4xl font-bold tracking-tight text-white">
                      Contrezz
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-400">
                    Use on dark backgrounds
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Icon Variations */}
              <div className="space-y-4">
                <h3 className="font-semibold">Icon Mark Variations</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Icon Only */}
                  <div className="bg-white p-8 rounded-xl border-2 border-gray-200 text-center">
                    <div className="mb-6">
                      <span className="text-sm uppercase tracking-wider text-gray-500">
                        Icon Mark
                      </span>
                    </div>
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-br from-purple-600 to-violet-500 p-4 rounded-xl">
                        <ContrezztLogo className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      For small spaces & app icons
                    </div>
                  </div>

                  {/* Clear Space */}
                  <div className="bg-white p-8 rounded-xl border-2 border-gray-200 text-center">
                    <div className="mb-6">
                      <span className="text-sm uppercase tracking-wider text-gray-500">
                        Clear Space
                      </span>
                    </div>
                    <div className="flex justify-center mb-4 relative">
                      <div className="border-2 border-dashed border-purple-300 p-8">
                        <div className="bg-gradient-to-br from-purple-600 to-violet-500 p-3 rounded-xl">
                          <ContrezztLogo className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Minimum padding: 16px
                    </div>
                  </div>

                  {/* Minimum Size */}
                  <div className="bg-white p-8 rounded-xl border-2 border-gray-200 text-center">
                    <div className="mb-6">
                      <span className="text-sm uppercase tracking-wider text-gray-500">
                        Minimum Size
                      </span>
                    </div>
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-br from-purple-600 to-violet-500 p-2 rounded-lg">
                        <ContrezztLogo className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      32px × 32px minimum
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="font-semibold">Usage Guidelines</h3>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-900">Do</p>
                      <p className="text-sm text-green-700">
                        Maintain clear space around logo, use approved color
                        variations, preserve aspect ratio
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">✕</span>
                    </div>
                    <div>
                      <p className="font-medium text-red-900">Don't</p>
                      <p className="text-sm text-red-700">
                        Distort, rotate, change colors, add effects, or place on
                        busy backgrounds
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Color Palette */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-600" />
                <CardTitle>Brand Colors</CardTitle>
              </div>
              <CardDescription>
                Official color palette for Contrezz brand, designed for trust,
                professionalism, and innovation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Primary Colors */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Primary Colors</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {primaryColors.map((color) => (
                    <div
                      key={color.name}
                      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden"
                    >
                      <div
                        className="h-32"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="p-4">
                        <div className="font-medium mb-2">{color.name}</div>
                        <div className="text-sm text-gray-600 mb-1">
                          HEX: {color.hex}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          RGB: {color.rgb}
                        </div>
                        <div className="text-xs text-gray-500">
                          {color.usage}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Neutral Colors */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Neutral Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {neutralColors.map((color) => (
                    <div
                      key={color.name}
                      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden"
                    >
                      <div
                        className="h-24"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="p-3">
                        <div className="text-sm font-medium mb-1">
                          {color.name}
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          {color.hex}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {color.usage}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Accent & Semantic Colors */}
              <div>
                <h3 className="font-semibold text-lg mb-4">
                  Accent & Semantic Colors
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {accentColors.map((color) => (
                    <div
                      key={color.name}
                      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden"
                    >
                      <div
                        className="h-32"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="p-4">
                        <div className="font-medium mb-2">{color.name}</div>
                        <div className="text-sm text-gray-600 mb-1">
                          HEX: {color.hex}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          RGB: {color.rgb}
                        </div>
                        <div className="text-xs text-gray-500">
                          {color.usage}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-purple-600" />
                <CardTitle>Typography System</CardTitle>
              </div>
              <CardDescription>
                Clean, modern typeface ensuring readability across all platforms
                and devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Font Family */}
                <div className="bg-gray-50 p-8 rounded-xl border">
                  <h3 className="font-semibold mb-6">Primary Typeface</h3>
                  <div className="mb-8">
                    <div className="text-6xl font-bold mb-4">Inter</div>
                    <p className="text-gray-600">
                      Inter is our primary typeface, chosen for its excellent
                      readability and modern appearance.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl font-bold">Aa</span>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          Character Set
                        </div>
                        <div className="text-gray-900 text-sm">
                          ABCDEFGHIJKLMNOPQRSTUVWXYZ
                        </div>
                        <div className="text-gray-900 text-sm">
                          abcdefghijklmnopqrstuvwxyz
                        </div>
                        <div className="text-gray-900 text-sm">0123456789</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Font Weights */}
                <div className="bg-gray-50 p-8 rounded-xl border">
                  <h3 className="font-semibold mb-6">Font Weights</h3>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-4 pb-4 border-b border-gray-200">
                      <span className="text-sm text-gray-500 w-24">
                        Regular 400
                      </span>
                      <span className="text-2xl font-normal">
                        The quick brown fox
                      </span>
                    </div>
                    <div className="flex items-baseline gap-4 pb-4 border-b border-gray-200">
                      <span className="text-sm text-gray-500 w-24">
                        Medium 500
                      </span>
                      <span className="text-2xl font-medium">
                        The quick brown fox
                      </span>
                    </div>
                    <div className="flex items-baseline gap-4 pb-4 border-b border-gray-200">
                      <span className="text-sm text-gray-500 w-24">
                        Semibold 600
                      </span>
                      <span className="text-2xl font-semibold">
                        The quick brown fox
                      </span>
                    </div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-sm text-gray-500 w-24">
                        Bold 700
                      </span>
                      <span className="text-2xl font-bold">
                        The quick brown fox
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Type Scale */}
              <div>
                <h3 className="font-semibold mb-6">Type Scale</h3>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8 pb-6 border-b border-gray-200">
                    <span className="text-sm text-gray-500 w-32">
                      Display Large
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold">
                      Property Management Excellence
                    </h1>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8 pb-6 border-b border-gray-200">
                    <span className="text-sm text-gray-500 w-32">
                      Heading 1
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold">
                      Streamline Your Operations
                    </h2>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8 pb-6 border-b border-gray-200">
                    <span className="text-sm text-gray-500 w-32">
                      Heading 2
                    </span>
                    <h3 className="text-2xl md:text-3xl font-semibold">
                      Advanced Reporting Tools
                    </h3>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8 pb-6 border-b border-gray-200">
                    <span className="text-sm text-gray-500 w-32">
                      Heading 3
                    </span>
                    <h4 className="text-xl md:text-2xl font-semibold">
                      Key Features
                    </h4>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8 pb-6 border-b border-gray-200">
                    <span className="text-sm text-gray-500 w-32">
                      Body Large
                    </span>
                    <p className="text-lg">
                      Manage properties efficiently with real-time reporting and
                      analytics.
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8 pb-6 border-b border-gray-200">
                    <span className="text-sm text-gray-500 w-32">
                      Body Regular
                    </span>
                    <p>
                      Track maintenance requests, tenant communications, and
                      financial reports in one place.
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8">
                    <span className="text-sm text-gray-500 w-32">Caption</span>
                    <p className="text-sm text-gray-600">
                      Last updated: December 3, 2025
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">
                Need More Information?
              </p>
              <p className="text-sm text-blue-700">
                For detailed specifications, asset downloads, or questions about
                brand usage, please contact the design team or view the complete
                guidelines in Figma.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
