import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Shield,
  Building2,
  CheckCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PasswordSetup } from "./PasswordSetup";
import { Footer } from "./Footer";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { login, setupPassword } from "../lib/api";

// Exact Contrezz logo from Figma Brand Guidelines
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

interface LoginPageProps {
  onLogin: (userType: string, userData: any) => void;
  onBackToHome: () => void;
  onNavigateToScheduleDemo?: () => void;
}

export function LoginPage({
  onLogin,
  onBackToHome,
  onNavigateToScheduleDemo,
}: LoginPageProps) {
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    twoFactorCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [error, setError] = useState<string>("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);

  // Check for invitation parameters and messages on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invitationToken = urlParams.get("invitation");
    const email = urlParams.get("email");
    const message = urlParams.get("message");

    // Handle account cancellation message
    if (message === "account_cancelled") {
      toast.error(
        "Your subscription has been cancelled and your account has been deactivated.",
        {
          duration: 5000,
        }
      );
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (invitationToken && email) {
      // Mock customer data lookup based on invitation token
      const mockCustomerData = {
        name: "John Smith",
        email: decodeURIComponent(email),
        company: "Metro Properties LLC",
        plan: "Professional",
        token: invitationToken,
      };

      setInvitationData(mockCustomerData);
      setShowPasswordSetup(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // No need to send userType - backend will automatically detect from database
      const response = await login({
        email: loginForm.email,
        password: loginForm.password,
        twoFactorCode: loginForm.twoFactorCode || undefined,
      });

      if (response.error) {
        const code = response.error.statusCode;
        const errorCode = (response.error as any)?.code;
        console.log("🔐 Login error response:", {
          statusCode: code,
          errorCode,
          fullError: response.error,
        });
        if (errorCode === "TWO_FACTOR_CODE_REQUIRED") {
          setTwoFactorRequired(true);
          setError(""); // Clear any previous error - this is not a failure
          toast.success("Password verified! Please enter your 2FA code.");
          setIsLoading(false);
          return;
        }

        if (errorCode === "INVALID_TWO_FACTOR_CODE") {
          setTwoFactorRequired(true);
          setError("Invalid two-factor authentication code.");
          toast.error("Invalid two-factor authentication code.");
          setIsLoading(false);
          return;
        }

        let message = response.error.error || "Login failed";
        if (code === 401) {
          message = "Invalid email or password.";
        } else if (code === 403) {
          message =
            "Your account has been deactivated. Please contact your administrator.";
        } else if (code === 400) {
          message = "Please select your role and fill all fields.";
        } else if (code && code >= 500) {
          message = "Server error. Please try again shortly.";
        }
        setError(message);
        toast.error(message);
        setIsLoading(false);
        return;
      }

      if (response.data) {
        toast.success("Login successful!");
        // Backend auto-detects userType from database - no need for frontend mapping
        const resolvedUserType = response.data.user.userType || "owner";

        console.log("📡 LoginPage - Backend Response (Auto-detected):");
        console.log(
          "   - Auto-detected userType:",
          response.data.user.userType
        );
        console.log("   - User role from DB:", response.data.user.role);
        console.log("   - Resolved userType:", resolvedUserType);
        console.log("   - Calling onLogin with:", {
          type: resolvedUserType,
          user: response.data.user,
        });

        onLogin(resolvedUserType, response.data.user);
        setTwoFactorRequired(false);
        setLoginForm((prev) => ({
          ...prev,
          twoFactorCode: "",
        }));
      }
    } catch (err: any) {
      const errorMessage =
        err?.message === "Failed to connect to the server"
          ? "Network error. Please check your connection and try again."
          : err?.message || "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSetup = async (newPassword: string) => {
    try {
      const response = await setupPassword({
        email: invitationData?.email,
        password: newPassword,
        token: invitationData?.token,
      });

      if (response.error) {
        toast.error(response.error.error || "Failed to setup password");
        return;
      }

      toast.success("Password setup successful! Please login.");

      // Clear invitation from URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Reset to login form
      setShowPasswordSetup(false);
      setInvitationData(null);
      setLoginForm({
        email: invitationData?.email || "",
        password: "",
        twoFactorCode: "",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to setup password");
    }
  };

  // Show password setup if invitation is detected
  if (showPasswordSetup && invitationData) {
    return (
      <PasswordSetup
        customerData={invitationData}
        onPasswordSet={handlePasswordSetup}
      />
    );
  }

  const features = [
    {
      icon: Building2,
      title: "Property Management",
      description: "Manage unlimited properties with ease",
    },
    {
      icon: TrendingUp,
      title: "Financial Tracking",
      description: "Real-time revenue and expense reports",
    },
    {
      icon: Users,
      title: "Tenant Portal",
      description: "Seamless communication & payments",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Brand Section with Inverted Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#111827] relative overflow-hidden">
        {/* Background Pattern - Subtle Purple Gradients */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#A855F7] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#7C3AED] rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#5B21B6] rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo & Brand */}
          <div>
            <button
              onClick={onBackToHome}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] p-3 rounded-xl">
                <ContrezztLogo className="w-8 h-8 text-[#111827]" />
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">
                Contrezz
              </span>
            </button>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-white leading-tight mb-4">
                Welcome back to
                <br />
                <span className="text-white/90">Property Excellence</span>
              </h1>
              <p className="text-xl text-white/70 max-w-md">
                Sign in to manage your properties, track finances, and connect
                with tenants - all in one powerful platform.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors duration-200"
                >
                  <div className="p-2 bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-lg">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/70">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
            <div>
              <p className="text-3xl font-bold text-white">10K+</p>
              <p className="text-sm text-white/60">Properties Managed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-sm text-white/60">Happy Tenants</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">99.9%</p>
              <p className="text-sm text-white/60">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
        {/* Mobile Header - Inverted Brand Color */}
        <header className="lg:hidden bg-[#111827] border-b border-white/10 px-4 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] p-2 rounded-lg">
                <ContrezztLogo className="w-6 h-6 text-[#111827]" />
              </div>
              <span className="text-xl font-bold text-white">Contrezz</span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToHome}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Home
            </Button>
          </div>
        </header>

        {/* Desktop Back Button */}
        <div className="hidden lg:block p-6">
          <Button
            variant="ghost"
            onClick={onBackToHome}
            className="text-gray-600 hover:text-[#7C3AED] hover:bg-[#7C3AED]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Login Form */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-600">
                Enter your credentials to access your dashboard
              </p>
            </div>

            <Card className="shadow-xl border-0 bg-white">
              <CardContent className="p-8">
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">
                          Login Failed
                        </p>
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Email & Password (hidden when 2FA is required) */}
                  {!twoFactorRequired && (
                    <>
                      {/* Email Input */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-sm font-medium text-gray-700"
                        >
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={loginForm.email}
                            onChange={(e) =>
                              setLoginForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            className="pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#7C3AED] focus:ring-[#7C3AED] transition-colors"
                            required
                          />
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="password"
                            className="text-sm font-medium text-gray-700"
                          >
                            Password
                          </Label>
                          <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto text-sm text-[#7C3AED] hover:text-[#5B21B6]"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginForm.password}
                            onChange={(e) =>
                              setLoginForm((prev) => ({
                                ...prev,
                                password: e.target.value,
                              }))
                            }
                            className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#7C3AED] focus:ring-[#7C3AED] transition-colors"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 2: Two-Factor Authentication */}
                  {twoFactorRequired && (
                    <div className="space-y-4">
                      {/* User info reminder */}
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="h-10 w-10 bg-[#7C3AED]/10 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-[#7C3AED]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {loginForm.email}
                          </p>
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Password verified
                          </p>
                        </div>
                      </div>

                      {/* 2FA Code Input */}
                      <div className="space-y-3 p-5 bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-xl">
                        <div className="flex items-center gap-2 text-[#7C3AED]">
                          <Shield className="h-5 w-5" />
                          <span className="font-semibold">
                            Two-Factor Authentication
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Enter the 6-digit code from your authenticator app.
                        </p>
                        <Input
                          id="twoFactorCode"
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={6}
                          placeholder="000000"
                          value={loginForm.twoFactorCode}
                          onChange={(e) =>
                            setLoginForm((prev) => ({
                              ...prev,
                              twoFactorCode: e.target.value.replace(/\D/g, ""),
                            }))
                          }
                          className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-white border-[#7C3AED]/30 focus:border-[#7C3AED] focus:ring-[#7C3AED]"
                          autoFocus
                        />
                      </div>

                      {/* Back button */}
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-gray-600 hover:text-gray-900"
                        onClick={() => {
                          setTwoFactorRequired(false);
                          setLoginForm((prev) => ({
                            ...prev,
                            twoFactorCode: "",
                          }));
                        }}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Use a different account
                      </Button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-200"
                    disabled={
                      isLoading ||
                      !loginForm.email ||
                      !loginForm.password ||
                      (twoFactorRequired &&
                        loginForm.twoFactorCode.length !== 6)
                    }
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        {twoFactorRequired ? "Verifying..." : "Signing in..."}
                      </>
                    ) : twoFactorRequired ? (
                      <>
                        <Shield className="h-5 w-5 mr-2" />
                        Verify & Sign In
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <p className="text-center text-sm text-gray-600 mt-8">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-[#7C3AED] hover:text-[#5B21B6] font-semibold"
                onClick={onNavigateToScheduleDemo || onBackToHome}
              >
                Contact sales
              </Button>
            </p>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
              <Shield className="h-4 w-4" />
              <span className="text-xs">
                Secured with 256-bit SSL encryption
              </span>
            </div>
          </div>
        </main>

        {/* Footer - Full on desktop, copyright only on mobile */}
        <div className="hidden lg:block">
          <Footer />
        </div>
        <div className="lg:hidden py-6 text-center border-t bg-white">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Contrezz. All rights reserved.
          </p>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
}
