import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiShield, FiAlertTriangle, FiMap, FiFileText, FiUser, FiHome,
  FiCheckCircle, FiUsers, FiTrendingUp, FiSearch, FiStar, FiAward,
  FiMapPin, FiCamera, FiMessageCircle, FiArrowRight, FiPlay
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { 
  ScrollReveal, 
  StaggerReveal, 
  ParallaxContainer, 
  FadeIn,
  ScaleIn 
} from '../components/ParallaxEffect';

// Animated Counter Component
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({ 
  end, suffix = '', duration = 2000 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    requestAnimationFrame(animateCount);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const problemPoints = [
    { icon: <FiAlertTriangle />, text: "Fake reviews manipulated by brokers" },
    { icon: <FiAlertTriangle />, text: "Hidden safety hazards discovered too late" },
    { icon: <FiAlertTriangle />, text: "No accountability for property owners" },
    { icon: <FiAlertTriangle />, text: "Food poisoning & water quality issues" },
  ];

  const howItWorks = [
    {
      step: "1",
      icon: <FiSearch className="h-8 w-8" />,
      title: "Search Location",
      description: "Find accommodations near your college with our interactive safety map"
    },
    {
      step: "2",
      icon: <FiShield className="h-8 w-8" />,
      title: "Check Trust Score",
      description: "View verified safety ratings from 0-100 based on real student reports"
    },
    {
      step: "3",
      icon: <FiFileText className="h-8 w-8" />,
      title: "Read Reports",
      description: "Access detailed safety reports with evidence from verified residents"
    },
    {
      step: "4",
      icon: <FiCheckCircle className="h-8 w-8" />,
      title: "Decide Safely",
      description: "Make informed decisions backed by data, not fake reviews"
    }
  ];

  const features = [
    {
      icon: <FiMap className="h-10 w-10" />,
      title: "Interactive Safety Map",
      description: "Search any location and instantly see safe (🟢), caution (🟡), and unsafe (🔴) accommodations within your preferred radius.",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <FiShield className="h-10 w-10" />,
      title: "Dynamic Trust Scores",
      description: "Our algorithm calculates real-time safety scores (0-100) based on verified reports, resolutions, and student feedback.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <FiCamera className="h-10 w-10" />,
      title: "Evidence-Based Reports",
      description: "Students upload photos and documents as proof. No more 'he said, she said' – only verified evidence.",
      color: "from-purple-500 to-violet-600"
    },
    {
      icon: <FiMessageCircle className="h-10 w-10" />,
      title: "Resolution Tracking",
      description: "Owners must resolve issues with proof. Students verify fixes. Complete accountability loop.",
      color: "from-orange-500 to-red-600"
    }
  ];

  const testimonials = [
    {
      quote: "Found water quality issues in 3 PGs near my college BEFORE signing any lease. This platform saved me from a nightmare.",
      author: "Priya S.",
      role: "Engineering Student, Hyderabad",
      rating: 5
    },
    {
      quote: "As a parent, I can now verify my daughter's accommodation safety from 500km away. Peace of mind is priceless.",
      author: "Rajesh K.",
      role: "Parent, Chennai",
      rating: 5
    },
    {
      quote: "Our trust score improved from 62 to 94 after we fixed reported issues. Good for students AND honest owners.",
      author: "Venkat R.",
      role: "PG Owner, Bangalore",
      rating: 5
    }
  ];

  const stakeholderBenefits = [
    {
      icon: <FiUsers className="h-12 w-12" />,
      title: "For Students",
      benefits: [
        "Report issues anonymously but verifiably",
        "Search safe accommodations near any location",
        "See real photos and evidence, not stock images",
        "Verify if owners actually fix problems"
      ],
      color: "blue",
      cta: "Report an Issue",
      link: "/register"
    },
    {
      icon: <FiHome className="h-12 w-12" />,
      title: "For Parents",
      benefits: [
        "Verify safety before your child moves in",
        "Compare accommodations side-by-side",
        "Track safety scores over time",
        "Real reports from real students"
      ],
      color: "green",
      cta: "Search Accommodations",
      link: "/accommodations"
    },
    {
      icon: <FiAward className="h-12 w-12" />,
      title: "For Good Owners",
      benefits: [
        "Build genuine reputation with verified reviews",
        "Respond to concerns and show improvements",
        "Stand out from low-quality competitors",
        "Attract safety-conscious tenants"
      ],
      color: "purple",
      cta: "Register Property",
      link: "/owner/register"
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      
      {/* ================= HERO SECTION with PARALLAX ================= */}
      <ParallaxContainer speed={0.3} className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            
            {/* Trust Badge */}
            <FadeIn delay={0}>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8">
                <FiShield className="h-4 w-4 mr-2 text-green-400" />
                <span>Trusted by 10,000+ Students Across India</span>
              </div>
            </FadeIn>

            {/* Main Headline */}
            <ScrollReveal delay={100} distance={40}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
                Your Safety.
                <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-transparent bg-clip-text">
                  Their Accountability.
                </span>
                <span className="block text-blue-300 text-3xl sm:text-4xl lg:text-5xl mt-2 font-bold">
                  Zero Compromise.
                </span>
              </h1>
            </ScrollReveal>

            {/* Subheadline */}
            <ScrollReveal delay={200} distance={30}>
              <p className="text-lg sm:text-xl lg:text-2xl text-blue-100/80 mb-10 max-w-3xl mx-auto leading-relaxed">
                Don't gamble with your living situation. See <span className="text-white font-semibold">verified safety reports</span>, 
                <span className="text-green-400 font-semibold"> real trust scores</span>, and 
                <span className="text-yellow-400 font-semibold"> evidence-backed reviews</span> before you sign that lease.
              </p>
            </ScrollReveal>
            
            {/* CTA Buttons */}
            <ScrollReveal delay={300} distance={20}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                {user ? (
                  <Link
                    to={user.role === 'owner' ? '/owner/dashboard' : user.role === 'admin' ? '/admin' : '/dashboard'}
                    className="group inline-flex items-center px-8 py-4 text-lg font-bold rounded-xl text-slate-900 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl shadow-orange-500/25"
                  >
                    Go to Dashboard
                    <FiArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/accommodations"
                      className="group inline-flex items-center px-8 py-4 text-lg font-bold rounded-xl text-slate-900 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl shadow-orange-500/25"
                    >
                      <FiMap className="mr-2 h-5 w-5" />
                      Search Safe Accommodations
                      <FiArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/register"
                      className="group inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl text-white border-2 border-white/30 hover:bg-white/10 active:scale-95 backdrop-blur-sm transition-all duration-200"
                    >
                      Report a Safety Issue
                      <FiAlertTriangle className="ml-2 h-5 w-5" />
                    </Link>
                  </>
                )}
              </div>
            </ScrollReveal>

            {/* Trust Indicators */}
            <StaggerReveal stagger={150} className="flex flex-wrap justify-center items-center gap-8 text-white/60 text-sm">
              <div className="flex items-center">
                <FiCheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <span>100% Verified Reports</span>
              </div>
              <div className="flex items-center">
                <FiShield className="h-5 w-5 text-blue-400 mr-2" />
                <span>Anonymous & Secure</span>
              </div>
              <div className="flex items-center">
                <FiMapPin className="h-5 w-5 text-red-400 mr-2" />
                <span>50+ Cities Covered</span>
              </div>
            </StaggerReveal>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </ParallaxContainer>

      {/* ================= PROBLEM SECTION ================= */}
      <div className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <FadeIn delay={0}>
              <span className="inline-block px-4 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold mb-4">
                THE PROBLEM
              </span>
            </FadeIn>
            <ScrollReveal delay={100}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Students Are <span className="text-red-600">Gambling</span> With Their Safety
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Every year, thousands of students face these issues — and most discover them AFTER signing the lease.
              </p>
            </ScrollReveal>
          </div>

          <StaggerReveal stagger={100} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🎭", title: "Fake Reviews", desc: "Manipulated by brokers and paid reviewers" },
              { icon: "🦠", title: "Food Poisoning", desc: "Poor kitchen hygiene discovered too late" },
              { icon: "💧", title: "Water Issues", desc: "Contaminated or irregular water supply" },
              { icon: "🔓", title: "Security Gaps", desc: "Broken locks, no CCTV, unsafe premises" }
            ].map((problem, i) => (
              <div key={i} className="bg-red-50 border border-red-100 rounded-2xl p-6 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out">
                <div className="text-4xl mb-4">{problem.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{problem.title}</h3>
                <p className="text-gray-600 text-sm">{problem.desc}</p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </div>

      {/* ================= STATS SECTION ================= */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerReveal stagger={150} className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: 10000, suffix: "+", label: "Students Protected", icon: <FiUsers className="h-8 w-8" /> },
              { value: 500, suffix: "+", label: "Verified PGs & Hostels", icon: <FiHome className="h-8 w-8" /> },
              { value: 2500, suffix: "+", label: "Safety Reports Filed", icon: <FiFileText className="h-8 w-8" /> },
              { value: 95, suffix: "%", label: "Issues Resolved", icon: <FiCheckCircle className="h-8 w-8" /> }
            ].map((stat, i) => (
              <div key={i} className="text-white">
                <div className="flex justify-center mb-3 opacity-80">{stat.icon}</div>
                <div className="text-4xl lg:text-5xl font-bold mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-blue-200 font-medium">{stat.label}</div>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </div>

      {/* ================= HOW IT WORKS SECTION ================= */}
      <div className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <FadeIn delay={0}>
              <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
                HOW IT WORKS
              </span>
            </FadeIn>
            <ScrollReveal delay={100}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Find Safe Accommodation in <span className="text-blue-600">4 Simple Steps</span>
              </h2>
            </ScrollReveal>
          </div>

          <StaggerReveal stagger={120} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="relative">
                {/* Connector Line */}
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-transparent z-0"></div>
                )}
                
                <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-out border border-gray-100 z-10">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-lg">
                    {step.step}
                  </div>
                  
                  <div className="flex justify-center text-blue-600 mb-4 mt-2">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2 text-center">{step.title}</h3>
                  <p className="text-gray-600 text-sm text-center">{step.description}</p>
                </div>
              </div>
            ))}
          </StaggerReveal>

          {/* CTA */}
          <ScrollReveal delay={0}>
            <div className="text-center mt-12">
              <Link
                to="/accommodations"
                className="inline-flex items-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl"
              >
                <FiSearch className="mr-2 h-5 w-5" />
                Start Searching Now
                <FiArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ================= FEATURES SECTION ================= */}
      <div className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <FadeIn delay={0}>
              <span className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4">
                POWERFUL FEATURES
              </span>
            </FadeIn>
            <ScrollReveal delay={100}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need for <span className="text-green-600">Safe Decisions</span>
              </h2>
            </ScrollReveal>
          </div>

          <StaggerReveal stagger={120} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-transparent hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-out overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </div>

      {/* ================= TRUST SCORE EXPLAINER ================= */}
      <div className="py-16 lg:py-24 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <FadeIn delay={0}>
                <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-white/90 text-sm font-semibold mb-4">
                  TRUST SCORE SYSTEM
                </span>
              </FadeIn>
              <ScrollReveal delay={100} direction="right">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                  Every Accommodation Gets a
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                    Dynamic Safety Score
                  </span>
                </h2>
                <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                  Our algorithm calculates a 0-100 trust score based on verified reports, 
                  issue severity, resolution speed, and student feedback. No manipulation. 
                  Pure data.
                </p>
              </ScrollReveal>
              
              {/* Score Legend */}
              <StaggerReveal stagger={100} className="space-y-4">
                {[
                  { range: "80-100", label: "Safe", color: "bg-green-500", desc: "Minimal issues, quick resolutions" },
                  { range: "50-79", label: "Caution", color: "bg-yellow-500", desc: "Some concerns, check reports" },
                  { range: "0-49", label: "Unsafe", color: "bg-red-500", desc: "Multiple unresolved issues" }
                ].map((score, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                    <div className={`w-4 h-4 rounded-full ${score.color}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{score.range}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-300 font-medium">{score.label}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{score.desc}</p>
                    </div>
                  </div>
                ))}
              </StaggerReveal>
            </div>

            {/* Visual Score Display */}
            <ScrollReveal delay={200} direction="left">
              <div className="flex justify-center">
                <div className="relative">
                  {/* Outer Glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-blue-500 blur-2xl opacity-30"></div>
                  
                  {/* Score Circle */}
                  <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 border-4 border-green-500/50 flex items-center justify-center shadow-2xl">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-white mb-2">87</div>
                      <div className="text-green-400 font-semibold text-lg">SAFE</div>
                      <div className="text-gray-400 text-sm mt-1">Sample Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* ================= STAKEHOLDER BENEFITS ================= */}
      <div className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <FadeIn delay={0}>
              <span className="inline-block px-4 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-4">
                FOR EVERYONE
              </span>
            </FadeIn>
            <ScrollReveal delay={100}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Built for <span className="text-purple-600">Students, Parents & Owners</span>
              </h2>
            </ScrollReveal>
          </div>

          <StaggerReveal stagger={150} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {stakeholderBenefits.map((stakeholder, i) => (
              <div 
                key={i} 
                className={`bg-white rounded-2xl p-8 shadow-lg border-t-4 ${
                  stakeholder.color === 'blue' ? 'border-blue-500' :
                  stakeholder.color === 'green' ? 'border-green-500' : 'border-purple-500'
                } hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-out`}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
                  stakeholder.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  stakeholder.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  {stakeholder.icon}
                </div>
                
                <h3 className="font-bold text-gray-900 text-xl mb-4">{stakeholder.title}</h3>
                
                <ul className="space-y-3 mb-6">
                  {stakeholder.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <FiCheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        stakeholder.color === 'blue' ? 'text-blue-500' :
                        stakeholder.color === 'green' ? 'text-green-500' : 'text-purple-500'
                      }`} />
                      <span className="text-gray-600 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  to={stakeholder.link}
                  className={`inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                    stakeholder.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                    stakeholder.color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' : 
                    'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {stakeholder.cta}
                  <FiArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </div>

      {/* ================= TESTIMONIALS ================= */}
      <div className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <FadeIn delay={0}>
              <span className="inline-block px-4 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold mb-4">
                TESTIMONIALS
              </span>
            </FadeIn>
            <ScrollReveal delay={100}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Real Stories from <span className="text-yellow-600">Real Users</span>
              </h2>
            </ScrollReveal>
          </div>

          <StaggerReveal stagger={150} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <ScaleIn key={i} delay={i * 150} scale={0.9}>
                <div className="bg-gray-50 rounded-2xl p-6 relative h-full">
                  {/* Quote Mark */}
                  <div className="absolute -top-4 left-6 text-6xl text-blue-200 font-serif">"</div>
                  
                  <div className="relative z-10">
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <FiStar key={j} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <p className="text-gray-700 mb-6 leading-relaxed italic">
                      "{testimonial.quote}"
                    </p>
                    
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.author}</div>
                      <div className="text-gray-500 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </ScaleIn>
            ))}
          </StaggerReveal>
        </div>
      </div>

      {/* ================= FINAL CTA SECTION ================= */}
      <div className="py-16 lg:py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal delay={0}>
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Don't Let Your Next Home
              <span className="block text-yellow-300">Become a Nightmare</span>
            </h2>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join 10,000+ students who made informed decisions. Your safety is too important to leave to chance.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/accommodations"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-indigo-700 bg-white hover:bg-gray-100 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl"
              >
                <FiSearch className="mr-2 h-5 w-5" />
                Search Safe Accommodations
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white border-2 border-white/50 hover:bg-white/10 active:scale-95 transition-all duration-200"
              >
                <FiAlertTriangle className="mr-2 h-5 w-5" />
                Report a Safety Issue
              </Link>
            </div>
          </ScrollReveal>

          <FadeIn delay={300}>
            <p className="text-blue-200 mt-8 text-sm">
              100% Free • No Hidden Charges • Verified Reports Only
            </p>
          </FadeIn>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal delay={0}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <FiShield className="h-8 w-8 text-blue-500" />
                  <span className="text-xl font-bold text-white">Student Safety Platform</span>
                </div>
                <p className="text-gray-400 mb-4 max-w-md">
                  Empowering students to make safe accommodation choices through verified reports and transparent ratings.
                </p>
                <p className="text-sm text-gray-500">
                  Made with ❤️ for student safety and welfare
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link to="/accommodations" className="hover:text-white transition-colors">Search Accommodations</Link></li>
                  <li><Link to="/register" className="hover:text-white transition-colors">Report an Issue</Link></li>
                  <li><Link to="/login" className="hover:text-white transition-colors">Student Login</Link></li>
                  <li><Link to="/owner/login" className="hover:text-white transition-colors">Owner Login</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-4">Contact</h4>
                <ul className="space-y-2">
                  <li>support@studentsafety.in</li>
                  <li>+91 8309589175</li>
                  <li>Hyderabad, India</li>
                </ul>
              </div>
            </div>
          </ScrollReveal>
          
          <FadeIn delay={200}>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
              <p>© 2024 Student Accommodation Safety Platform. All rights reserved.</p>
            </div>
          </FadeIn>
        </div>
      </footer>
    </div>
  );
};