import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { PublicLayout } from "./PublicLayout";
import {
  MessageSquare,
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Award,
  Heart,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface NewDiscussionPageProps {
  onBackToCommunity: () => void;
  onNavigateToHome?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToGetStarted?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToScheduleDemo?: () => void;
  onNavigateToAPIDocumentation?: () => void;
  onNavigateToIntegrations?: () => void;
  onNavigateToCareers?: () => void;
  onNavigateToHelpCenter?: () => void;
}

export function NewDiscussionPage({
  onBackToCommunity,
  onNavigateToHome,
  onNavigateToLogin,
  onNavigateToGetStarted,
  onNavigateToAbout,
  onNavigateToBlog,
  onNavigateToContact,
  onNavigateToScheduleDemo,
  onNavigateToAPIDocumentation,
  onNavigateToIntegrations,
  onNavigateToCareers,
  onNavigateToHelpCenter
}: NewDiscussionPageProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'general', name: 'General', icon: MessageCircle, color: 'green' },
    { id: 'feature-requests', name: 'Feature Requests', icon: Lightbulb, color: 'purple' },
    { id: 'best-practices', name: 'Best Practices', icon: Award, color: 'orange' },
    { id: 'support', name: 'Support', icon: Heart, color: 'red' }
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error('Please enter a title for your discussion');
      return;
    }

    if (title.trim().length < 10) {
      toast.error('Title must be at least 10 characters long');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter the discussion content');
      return;
    }

    if (content.trim().length < 20) {
      toast.error('Content must be at least 20 characters long');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Discussion posted successfully!');

      // Reset form
      setTitle('');
      setCategory('general');
      setContent('');
      setTags([]);
      setTagInput('');

      // Navigate back to community after a short delay
      setTimeout(() => {
        onBackToCommunity();
      }, 1000);
    } catch (error) {
      toast.error('Failed to post discussion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === category);
  const CategoryIcon = selectedCategory?.icon || MessageCircle;

  return (
    <PublicLayout
      currentPage="home"
      onNavigateToHome={onNavigateToHome}
      onNavigateToLogin={onNavigateToLogin}
      onNavigateToGetStarted={onNavigateToGetStarted}
      onNavigateToAbout={onNavigateToAbout}
      onNavigateToCareers={onNavigateToCareers}
      onNavigateToBlog={onNavigateToBlog}
      onNavigateToContact={onNavigateToContact}
      onNavigateToScheduleDemo={onNavigateToScheduleDemo}
      onNavigateToAPIDocumentation={onNavigateToAPIDocumentation}
      onNavigateToIntegrations={onNavigateToIntegrations}
      onNavigateToHelpCenter={onNavigateToHelpCenter}
    >
      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 border-b">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <Button
            variant="ghost"
            onClick={onBackToCommunity}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>

          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <MessageSquare className="h-3 w-3 mr-1" /> New Discussion
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Start a
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> New Discussion</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Share your thoughts, ask questions, or start a conversation with the community
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <MessageSquare className="h-6 w-6 mr-2 text-blue-600" />
                    Discussion Details
                  </CardTitle>
                  <CardDescription>
                    Provide clear and detailed information to help others understand your topic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-base font-semibold">
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="e.g., Best practices for managing multiple properties"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-base border-2 focus:border-blue-500"
                        maxLength={150}
                      />
                      <p className="text-sm text-gray-500">
                        {title.length}/150 characters (minimum 10)
                      </p>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-base font-semibold">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {categories.map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setCategory(cat.id)}
                              className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                                category === cat.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <Icon className={`h-5 w-5 ${category === cat.id ? 'text-blue-600' : 'text-gray-600'}`} />
                                <span className={`font-semibold ${category === cat.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {cat.name}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <Label htmlFor="content" className="text-base font-semibold">
                        Content <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="content"
                        placeholder="Share your thoughts, questions, or insights with the community..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[200px] text-base border-2 focus:border-blue-500"
                        maxLength={5000}
                      />
                      <p className="text-sm text-gray-500">
                        {content.length}/5000 characters (minimum 20)
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label htmlFor="tags" className="text-base font-semibold">
                        Tags (Optional)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="tags"
                          placeholder="Add a tag (press Enter)"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 border-2 focus:border-blue-500"
                          disabled={tags.length >= 5}
                        />
                        <Button
                          type="button"
                          onClick={handleAddTag}
                          disabled={!tagInput.trim() || tags.length >= 5}
                          variant="outline"
                          className="border-2"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Add up to 5 tags to help others find your discussion
                      </p>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-2 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base py-6"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Posting...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Post Discussion
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onBackToCommunity}
                        disabled={isSubmitting}
                        className="border-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Preview */}
              <Card className="border-2 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <CategoryIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Category</p>
                    <Badge className="bg-blue-600 text-white">
                      {selectedCategory?.name || 'General'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Title</p>
                    <p className="text-sm text-blue-800">
                      {title || 'Your discussion title will appear here'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Content Preview</p>
                    <p className="text-sm text-blue-800 line-clamp-3">
                      {content || 'Your discussion content will appear here'}
                    </p>
                  </div>
                  {tags.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Guidelines */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                    Posting Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Be respectful and professional</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Use clear and descriptive titles</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Provide context and details</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Stay on topic</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>No spam or self-promotion</span>
                  </div>
                </CardContent>
              </Card>

              {/* Help */}
              <Card className="border-2 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-purple-900">
                    <Heart className="h-5 w-5 mr-2" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-purple-800 mb-3">
                    Not sure how to format your discussion? Check out our community guidelines.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-purple-300"
                    onClick={onNavigateToHelpCenter}
                  >
                    View Guidelines
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

