import { Link } from 'react-router';
import { 
  FileText, 
  Zap, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  Users, 
  Clock, 
  BarChart3, 
  Lock, 
  FileCheck, 
  Download,
  Building2,
  Workflow,
  Globe,
  Award,
  TrendingUp,
  Star
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#003B5C] to-[#005580] rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-gray-900">DL Generator</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-[#003B5C] transition-colors">
                Features
              </a>
              <a href="#solutions" className="text-sm font-medium text-gray-700 hover:text-[#003B5C] transition-colors">
                Solutions
              </a>
              <a href="#security" className="text-sm font-medium text-gray-700 hover:text-[#003B5C] transition-colors">
                Security
              </a>
              <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-[#003B5C] transition-colors">
                Pricing
              </a>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link
                to="/app"
                className="px-5 py-2 bg-[#003B5C] text-white rounded-lg font-semibold hover:bg-[#002940] transition-all hover:shadow-lg hover:shadow-[#003B5C]/20 text-sm"
              >
                Launch Platform
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Completely Different Layout */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Value Prop */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#003B5C]/5 rounded-full">
                <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-[#003B5C]">Trusted by Leading Law Firms</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Automate Legal Document Generation
                <span className="block text-[#003B5C] mt-2">at Scale</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Transform your legal workflow with intelligent document automation. Generate thousands of demand letters, contracts, and legal documents in minutes—not days.
              </p>

              {/* CTA Group */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/app"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#003B5C] to-[#005580] text-white rounded-xl font-bold hover:shadow-2xl hover:shadow-[#003B5C]/30 transition-all group"
                >
                  Start Free Trial
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
                <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#003B5C] rounded-xl font-bold border-2 border-[#003B5C] hover:bg-[#003B5C] hover:text-white transition-all">
                  <Download size={20} />
                  Download Brochure
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Shield className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-gray-700">Bank-Level Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-gray-700">GDPR Compliant</span>
                </div>
              </div>
            </div>

            {/* Right: Stats Grid - Different from OpenCI's horizontal layout */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-[#003B5C] to-[#005580] rounded-xl flex items-center justify-center mb-4">
                  <FileCheck className="text-white" size={24} />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">500K+</div>
                <div className="text-sm text-gray-600">Documents Generated</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="text-white" size={24} />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">150+</div>
                <div className="text-sm text-gray-600">Law Firms</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="text-white" size={24} />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">98.7%</div>
                <div className="text-sm text-gray-600">Time Saved</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mb-4">
                  <Star className="text-white" size={24} />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">4.9/5</div>
                <div className="text-sm text-gray-600">Client Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#003B5C]/5 to-transparent -z-10"></div>
      </section>

      {/* Problem/Solution Narrative - Original Structure */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-sm font-bold mb-4">
              THE CHALLENGE
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Manual Document Creation is <span className="text-red-600">Slowing You Down</span>
            </h2>
            <p className="text-xl text-gray-600">
              Legal teams waste 15+ hours per week on repetitive document tasks. It's time for a smarter solution.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Problem Cards */}
            <div className="bg-white rounded-xl p-8 border-2 border-red-100">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <Clock className="text-red-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Wasted Time</h3>
              <p className="text-gray-600 leading-relaxed">
                Legal staff spend hours on copy-paste work, template hunting, and manual data entry for routine documents.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border-2 border-orange-100">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <FileText className="text-orange-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Inconsistent Output</h3>
              <p className="text-gray-600 leading-relaxed">
                Manual processes lead to formatting errors, missing clauses, and inconsistent branding across documents.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border-2 border-yellow-100">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="text-yellow-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Scaling Bottlenecks</h3>
              <p className="text-gray-600 leading-relaxed">
                As caseloads grow, manual document generation becomes the limiting factor in your operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities - Unique Grid Layout */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-2 bg-[#003B5C]/10 text-[#003B5C] rounded-full text-sm font-bold mb-4">
              PLATFORM CAPABILITIES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to <span className="text-[#003B5C]">Scale Legal Operations</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards - Different Icon + Layout Style */}
            <div className="group bg-gradient-to-br from-[#003B5C] to-[#005580] rounded-2xl p-8 text-white hover:shadow-2xl hover:scale-105 transition-all">
              <Zap className="mb-4 text-[#D4AF37]" size={32} />
              <h3 className="text-2xl font-bold mb-3">Bulk Generation</h3>
              <p className="text-blue-100 leading-relaxed">
                Generate 1,000+ personalized documents from Excel data in under 5 minutes. Full variable mapping and conditional logic support.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#003B5C] hover:shadow-xl transition-all">
              <FileCheck className="mb-4 text-[#003B5C]" size={32} />
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Smart Templates</h3>
              <p className="text-gray-600 leading-relaxed">
                Version-controlled templates with approval workflows. Update once, apply everywhere. DOCX and PDF output.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#003B5C] hover:shadow-xl transition-all">
              <Users className="mb-4 text-[#003B5C]" size={32} />
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Digital Signatures</h3>
              <p className="text-gray-600 leading-relaxed">
                Automated signature placement with handwritten-style date generation. Upload attorney signatures once, reuse infinitely.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#003B5C] hover:shadow-xl transition-all">
              <Workflow className="mb-4 text-[#003B5C]" size={32} />
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Lark Bot Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                Approval workflows via Lark messaging. Attorneys review and approve signature requests with one-click ALLOW/REJECT.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#003B5C] hover:shadow-xl transition-all">
              <BarChart3 className="mb-4 text-[#003B5C]" size={32} />
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Audit Trail</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete activity tracking with user attribution, timestamps, and document versioning. Full compliance reporting.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#003B5C] hover:shadow-xl transition-all">
              <Globe className="mb-4 text-[#003B5C]" size={32} />
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Area-Based Routing</h3>
              <p className="text-gray-600 leading-relaxed">
                Automatically sort and route documents by geographic area for optimized printing and courier distribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance - Different from OpenCI */}
      <section id="security" className="py-20 bg-gradient-to-br from-[#003B5C] to-[#002940] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-white/10 text-[#D4AF37] rounded-full text-sm font-bold mb-6">
                SECURITY & COMPLIANCE
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Enterprise-Grade Security for Sensitive Legal Data
              </h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Your client data deserves the highest level of protection. We're built for law firms who can't compromise on security.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">AES-256 Encryption</h4>
                    <p className="text-blue-100 text-sm">Bank-level encryption at rest and in transit. Zero-knowledge architecture.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Role-Based Access Control</h4>
                    <p className="text-blue-100 text-sm">Granular permissions. Admin and User roles with activity logging.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">GDPR & Data Privacy</h4>
                    <p className="text-blue-100 text-sm">Full compliance with international data protection regulations.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-[#D4AF37] mb-2">ISO 27001</div>
                <div className="text-sm text-blue-100">Certified Information Security</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-[#D4AF37] mb-2">SOC 2</div>
                <div className="text-sm text-blue-100">Type II Compliant</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-[#D4AF37] mb-2">99.9%</div>
                <div className="text-sm text-blue-100">Uptime SLA</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-[#D4AF37] mb-2">24/7</div>
                <div className="text-sm text-blue-100">Security Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Visualization - Unique Section */}
      <section id="solutions" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-sm font-bold mb-4">
              HOW IT WORKS
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              From Data to Delivery in <span className="text-[#003B5C]">4 Simple Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-[#003B5C] shadow-lg h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-[#003B5C] to-[#005580] rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Upload Data</h3>
                <p className="text-gray-600">
                  Import client data from Excel. Our system validates and maps fields automatically.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-[#D4AF37] rounded-full z-10"></div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 h-full">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-xl mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Select Template</h3>
                <p className="text-gray-600">
                  Choose from pre-approved templates or create custom variations with version control.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-[#D4AF37] rounded-full z-10"></div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 h-full">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-xl mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Apply Signature</h3>
                <p className="text-gray-600">
                  System applies attorney signature with auto-generated handwritten dates using font randomization.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-[#D4AF37] rounded-full z-10"></div>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 h-full">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-xl mb-6">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Generate & Print</h3>
              <p className="text-gray-600">
                Download as ZIP or print directly to area-sorted printers for courier distribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Different from OpenCI */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-2 bg-[#003B5C]/10 text-[#003B5C] rounded-full text-sm font-bold mb-4">
              CLIENT STORIES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Leading Law Firms
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="text-[#D4AF37] fill-[#D4AF37]" size={20} />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "DL Generator reduced our document processing time by 85%. We now handle 3x more cases with the same team size."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#003B5C] rounded-full flex items-center justify-center text-white font-bold">
                  MP
                </div>
                <div>
                  <div className="font-bold text-gray-900">Maria Pascual</div>
                  <div className="text-sm text-gray-600">Managing Partner, Cruz & Associates</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="text-[#D4AF37] fill-[#D4AF37]" size={20} />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "The Lark Bot approval workflow is brilliant. Attorneys can approve signatures without disrupting their workflow."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#003B5C] rounded-full flex items-center justify-center text-white font-bold">
                  JR
                </div>
                <div>
                  <div className="font-bold text-gray-900">Jaime Reyes</div>
                  <div className="text-sm text-gray-600">Senior Partner, Reyes Law Office</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="text-[#D4AF37] fill-[#D4AF37]" size={20} />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "Security and compliance features give us peace of mind. Audit trail is essential for our operations."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#003B5C] rounded-full flex items-center justify-center text-white font-bold">
                  AS
                </div>
                <div>
                  <div className="font-bold text-gray-900">Antonio Santos</div>
                  <div className="text-sm text-gray-600">Operations Director, Santos Legal Group</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Completely Different Design */}
      <section className="py-20 bg-gradient-to-r from-[#003B5C] via-[#004A6E] to-[#003B5C]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Document Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join 150+ law firms generating 500,000+ documents with DL Generator. Start your 14-day free trial—no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              to="/app"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-[#003B5C] rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all group"
            >
              Start Free Trial
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
            </Link>
            <button className="inline-flex items-center gap-3 px-10 py-5 bg-[#D4AF37] text-white rounded-xl font-bold text-lg hover:bg-[#B8941F] transition-all">
              Schedule Demo
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Compliance-Heavy */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Company */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#003B5C] rounded-lg flex items-center justify-center">
                  <FileText className="text-white" size={18} />
                </div>
                <span className="text-white font-bold text-lg">DL Generator</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Enterprise document automation for legal professionals. Secure, compliant, and scalable.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="text-green-500" size={16} />
                <span className="text-white">ISO 27001 Certified</span>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">User Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Video Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support Center</a></li>
              </ul>
            </div>

            {/* Legal & Support */}
            <div>
              <h4 className="text-white font-bold mb-4">Legal & Support</h4>
              <ul className="space-y-3 text-sm mb-6">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR Compliance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security Whitepaper</a></li>
              </ul>
              <div className="text-sm">
                <div className="text-white font-semibold mb-2">24/7 Support Hotline</div>
                <div className="text-[#D4AF37] font-bold text-lg">1-800-DL-HELP</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
              <p>© 2026 DL Generator. All rights reserved. Regulated by [Regulatory Body].</p>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
