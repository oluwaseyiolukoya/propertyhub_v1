import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PublicLayout } from "./PublicLayout";
import {
  Search,
  MapPin,
  Clock,
  Briefcase,
  Users,
  Heart,
  Zap,
  TrendingUp,
  Globe,
  Coffee,
  Laptop,
  DollarSign,
  Calendar,
  Award,
  Target,
  Lightbulb,
  Shield,
  Rocket,
  ArrowRight,
} from "lucide-react";
import {
  getPublicCareerPostings,
  getCareerFilterOptions,
  type CareerPosting,
} from "../lib/api/careers";
import { toast } from "sonner";

interface CareersPageProps {
  onBackToHome: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToGetStarted?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToScheduleDemo?: () => void;
  onNavigateToAPIDocumentation?: () => void;
  onNavigateToIntegrations?: () => void;
  onNavigateToHelpCenter?: () => void;
}

export function CareersPage({
  onBackToHome,
  onNavigateToLogin,
  onNavigateToGetStarted,
  onNavigateToAbout,
  onNavigateToBlog,
  onNavigateToContact,
  onNavigateToScheduleDemo,
  onNavigateToAPIDocumentation,
  onNavigateToIntegrations,
  onNavigateToHelpCenter,
}: CareersPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [jobOpenings, setJobOpenings] = useState<CareerPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    departments: [] as string[],
    locations: [] as string[],
    types: [] as string[],
    remoteOptions: [] as string[],
    experienceLevels: [] as string[],
  });

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCareerPostings();
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [selectedDepartment, selectedLocation, searchQuery]);

  const loadCareerPostings = async () => {
    try {
      setLoading(true);
      const filters: any = {
        page: 1,
        limit: 50,
      };

      if (selectedDepartment !== "all") {
        filters.department = selectedDepartment;
      }

      if (selectedLocation !== "all") {
        filters.location = selectedLocation;
      }

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      const response = await getPublicCareerPostings(filters);
      if (response.data?.data) {
        setJobOpenings(response.data.data.postings || []);
      } else if (response.error) {
        toast.error("Failed to load career postings");
        setJobOpenings([]);
      }
    } catch (error: any) {
      console.error("Failed to load career postings:", error);
      toast.error("Failed to load career postings");
      setJobOpenings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const response = await getCareerFilterOptions();
      if (response.data?.data) {
        setFilterOptions(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load filter options:", error);
    }
  };

  // Legacy mock data structure for reference (will be removed)
  const mockJobOpenings = [
    {
      id: 1,
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "Full-time",
      remote: "Hybrid",
      experience: "Senior",
      description:
        "Build scalable features for our property management platform using React, Node.js, and PostgreSQL.",
      requirements: [
        "5+ years experience",
        "React & Node.js",
        "PostgreSQL",
        "AWS",
      ],
      salary: "$150k - $200k",
    },
    {
      id: 2,
      title: "Product Designer",
      department: "Design",
      location: "San Francisco, CA",
      type: "Full-time",
      remote: "Hybrid",
      experience: "Mid-level",
      description:
        "Design intuitive user experiences for property managers and tenants across web and mobile platforms.",
      requirements: [
        "3+ years experience",
        "Figma",
        "User research",
        "Design systems",
      ],
      salary: "$120k - $160k",
    },
    {
      id: 3,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote",
      type: "Full-time",
      remote: "Remote",
      experience: "Mid-level",
      description:
        "Help property management companies succeed with Contrezz through onboarding, training, and ongoing support.",
      requirements: [
        "2+ years in SaaS",
        "Property management knowledge",
        "Excellent communication",
      ],
      salary: "$80k - $110k",
    },
    {
      id: 4,
      title: "DevOps Engineer",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "Full-time",
      remote: "Remote",
      experience: "Senior",
      description:
        "Manage and optimize our cloud infrastructure, CI/CD pipelines, and monitoring systems.",
      requirements: [
        "4+ years experience",
        "AWS/GCP",
        "Docker/Kubernetes",
        "Terraform",
      ],
      salary: "$140k - $180k",
    },
    {
      id: 5,
      title: "Sales Development Representative",
      department: "Sales",
      location: "New York, NY",
      type: "Full-time",
      remote: "Hybrid",
      experience: "Entry-level",
      description:
        "Generate qualified leads and schedule demos for our sales team in the property management space.",
      requirements: [
        "1+ years in sales",
        "Strong communication",
        "Self-motivated",
      ],
      salary: "$60k - $80k + commission",
    },
    {
      id: 6,
      title: "Content Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      remote: "Remote",
      experience: "Mid-level",
      description:
        "Create compelling content that educates property managers and drives organic growth.",
      requirements: [
        "3+ years in content marketing",
        "SEO knowledge",
        "B2B SaaS experience",
      ],
      salary: "$90k - $120k",
    },
    {
      id: 7,
      title: "Backend Engineer",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "Full-time",
      remote: "Hybrid",
      experience: "Mid-level",
      description:
        "Design and implement robust APIs and backend services for our property management platform.",
      requirements: [
        "3+ years experience",
        "Node.js/Python",
        "Database design",
        "API development",
      ],
      salary: "$130k - $170k",
    },
    {
      id: 8,
      title: "Product Manager",
      department: "Product",
      location: "San Francisco, CA",
      type: "Full-time",
      remote: "Hybrid",
      experience: "Senior",
      description:
        "Define product strategy and roadmap for our tenant management features.",
      requirements: [
        "5+ years in product",
        "B2B SaaS",
        "Data-driven",
        "Stakeholder management",
      ],
      salary: "$140k - $180k",
    },
  ];

  // Build departments list from filter options and current postings
  const departments = [
    { id: "all", name: "All Departments", count: jobOpenings.length },
    ...filterOptions.departments.map((dept) => ({
      id: dept,
      name: dept,
      count: jobOpenings.filter((j) => j.department === dept).length,
    })),
  ];

  // Build locations list from filter options
  const locations = [
    { id: "all", name: "All Locations" },
    ...filterOptions.locations.map((loc) => ({
      id: loc,
      name: loc,
    })),
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description:
        "Comprehensive medical, dental, and vision insurance for you and your family",
      color: "red",
    },
    {
      icon: DollarSign,
      title: "Competitive Salary",
      description:
        "Industry-leading compensation with equity options and performance bonuses",
      color: "green",
    },
    {
      icon: Calendar,
      title: "Unlimited PTO",
      description:
        "Take the time you need to recharge with our flexible time-off policy",
      color: "blue",
    },
    {
      icon: Laptop,
      title: "Remote Flexibility",
      description: "Work from home or our beautiful offices - your choice",
      color: "purple",
    },
    {
      icon: Rocket,
      title: "Career Growth",
      description:
        "Learning budget, mentorship programs, and clear advancement paths",
      color: "orange",
    },
    {
      icon: Coffee,
      title: "Office Perks",
      description:
        "Free meals, snacks, and drinks in our modern, collaborative spaces",
      color: "yellow",
    },
  ];

  const values = [
    {
      icon: Target,
      title: "Customer First",
      description:
        "We obsess over our customers' success and build products they love",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description:
        "We embrace new ideas and aren't afraid to challenge the status quo",
    },
    {
      icon: Users,
      title: "Collaboration",
      description:
        "We work together, support each other, and celebrate wins as a team",
    },
    {
      icon: Shield,
      title: "Integrity",
      description: "We do the right thing, even when no one is watching",
    },
  ];

  // Jobs are already filtered by the API based on selectedDepartment, selectedLocation, and searchQuery
  // No need for additional client-side filtering
  const filteredJobs = jobOpenings;

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      red: "from-red-500 to-red-600",
      green: "from-green-500 to-green-600",
      blue: "from-blue-500 to-blue-600",
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600",
      yellow: "from-yellow-500 to-yellow-600",
    };
    return colors[color] || colors.blue;
  };

  return (
    <PublicLayout
      currentPage="careers"
      onNavigateToHome={onBackToHome}
      onNavigateToLogin={onNavigateToLogin}
      onNavigateToGetStarted={onNavigateToGetStarted}
      onNavigateToAbout={onNavigateToAbout}
      onNavigateToCareers={onBackToHome}
      onNavigateToBlog={onNavigateToBlog}
      onNavigateToContact={onNavigateToContact}
      onNavigateToScheduleDemo={onNavigateToScheduleDemo}
      onNavigateToAPIDocumentation={onNavigateToAPIDocumentation}
      onNavigateToIntegrations={onNavigateToIntegrations}
      onNavigateToHelpCenter={onNavigateToHelpCenter}
    >
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 animate-bounce">
            <Briefcase className="h-3 w-3 mr-1" /> Join Our Team
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Build the Future of
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Property Management
            </span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
            Join a passionate team that's transforming how properties are
            managed. We're looking for talented individuals who want to make a
            real impact.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {jobOpenings.length}
              </div>
              <div className="text-sm text-gray-600">Open Positions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">50+</div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">$50M</div>
              <div className="text-sm text-gray-600">Series A Funding</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search positions by title, department, or keyword..."
                className="pl-12 pr-4 py-6 text-lg border-2 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-y">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Department Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department
              </label>
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => (
                  <Button
                    key={dept.id}
                    variant={
                      selectedDepartment === dept.id ? "default" : "outline"
                    }
                    size="sm"
                    className={
                      selectedDepartment === dept.id
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : ""
                    }
                    onClick={() => setSelectedDepartment(dept.id)}
                  >
                    {dept.name}
                    <Badge variant="secondary" className="ml-2">
                      {dept.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <div className="flex flex-wrap gap-2">
                {locations.map((loc) => (
                  <Button
                    key={loc.id}
                    variant={
                      selectedLocation === loc.id ? "default" : "outline"
                    }
                    size="sm"
                    className={
                      selectedLocation === loc.id
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : ""
                    }
                    onClick={() => setSelectedLocation(loc.id)}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    {loc.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Open Positions ({filteredJobs.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="group border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl cursor-pointer"
                >
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-2xl group-hover:text-blue-600 transition-colors">
                            {job.title}
                          </CardTitle>
                          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 ml-2">
                            {job.department}
                          </Badge>
                        </div>
                        <CardDescription className="text-base leading-relaxed">
                          {job.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-purple-600" />
                        {job.type}
                      </div>
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-1 text-green-600" />
                        {job.remote}
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1 text-orange-600" />
                        {job.experience}
                      </div>
                      {job.salary && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-emerald-600" />
                          {job.salary}
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">
                        Requirements:
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.requirements.map((req, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {req}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                        Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No positions found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filters to find what you're looking
                for.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDepartment("all");
                  setSelectedLocation("all");
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Award className="h-3 w-3 mr-1" /> Benefits & Perks
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Work at Contrezz?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We invest in our team's success with comprehensive benefits and a
              supportive culture
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={index}
                  className="border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2"
                >
                  <CardHeader>
                    <div
                      className={`h-14 w-14 bg-gradient-to-br ${getColorClasses(
                        benefit.color
                      )} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Heart className="h-3 w-3 mr-1" /> Our Values
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What We Believe In
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card
                  key={index}
                  className="text-center border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl"
                >
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <Zap className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Don't See the Right Role?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            We're always looking for talented people. Send us your resume and
            tell us why you'd be a great fit for Contrezz.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
          >
            Send General Application
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
