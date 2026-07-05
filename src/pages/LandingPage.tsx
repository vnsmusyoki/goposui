import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import {
  ArrowRight,
  Check,
  Menu,
  X,
  Zap,
  Shield,
  Users,
  ShoppingCart,
  BarChart3,
  Clock,
  Star,
  Play,
  Globe,
  Database,
  TrendingUp,
  Activity,
} from 'lucide-react';

const LandingPage = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Testimonial auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const highlights = [
    { label: '50,000+', text: 'merchants trust FlowPOS', icon: Users },
    { label: '99.99%', text: 'uptime across devices', icon: Activity },
    { label: '2 min', text: 'average setup time', icon: Clock },
  ];

  const featureCards = [
    {
      icon: Zap,
      title: 'Lightning Fast Checkout',
      text: 'Process transactions in under 3 seconds with our optimized POS flow. Keep queues moving and customers happy.',
      color: 'from-blue-500 to-cyan-400'
    },
    {
      icon: Database,
      title: 'Smart Inventory Control',
      text: 'Real-time stock tracking, automated reordering, and multi-location sync. Never miss a sale due to stockouts.',
      color: 'from-purple-500 to-pink-400'
    },
    {
      icon: Users,
      title: 'Team Management',
      text: 'Role-based permissions, shift scheduling, and performance analytics. Onboard new staff in minutes.',
      color: 'from-green-500 to-emerald-400'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      text: 'Detailed insights into sales, customer behavior, and product performance. Make data-driven decisions.',
      color: 'from-orange-500 to-red-400'
    },
    {
      icon: Globe,
      title: 'Multi-Channel Sales',
      text: 'Sell in-store, online, and through social media. Unified dashboard for all your sales channels.',
      color: 'from-indigo-500 to-purple-400'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      text: 'PCI compliant, end-to-end encryption, and real-time fraud detection. Your data is always safe.',
      color: 'from-teal-500 to-cyan-400'
    },
  ];

  const testimonials = [
    {
      quote: "FlowPOS transformed our retail operations. We've seen a 40% increase in checkout efficiency and our staff love the intuitive interface.",
      author: "Sarah Johnson",
      role: "CEO, Urban Boutique",
      rating: 5,
      avatar: "SJ"
    },
    {
      quote: "The inventory management alone is worth the price. We reduced stockouts by 60% in the first month. Absolutely game-changing.",
      author: "Michael Chen",
      role: "Owner, Tech Haven",
      rating: 5,
      avatar: "MC"
    },
    {
      quote: "Best POS system we've ever used. The analytics dashboard gives us insights we never had before. Customer support is outstanding.",
      author: "Emily Rodriguez",
      role: "Operations Manager, Fresh Market",
      rating: 5,
      avatar: "ER"
    },
  ];

  const steps = [
    { 
      step: '01', 
      title: 'Set up your store', 
      text: 'Choose your industry template, connect payment providers, and customize your brand identity in minutes.',
      icon: ShoppingCart 
    },
    { 
      step: '02', 
      title: 'Add products & staff', 
      text: 'Import your product catalog, set pricing, add staff members with role-based permissions.',
      icon: Users 
    },
    { 
      step: '03', 
      title: 'Start selling & grow', 
      text: 'Launch your POS, process orders, and watch your business grow with real-time analytics.',
      icon: TrendingUp 
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$29',
      description: 'Perfect for small businesses just getting started',
      features: [
        'Basic POS features',
        'Up to 500 products',
        '3 staff accounts',
        'Basic analytics',
        'Email support'
      ],
      popular: false,
      buttonText: 'Start Free Trial',
      buttonColor: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
    },
    {
      name: 'Growth',
      price: '$59',
      description: 'For growing businesses with multiple locations',
      features: [
        'Advanced POS features',
        'Unlimited products',
        '10 staff accounts',
        'Advanced analytics',
        'Priority support',
        'Multi-location sync',
        'Inventory management'
      ],
      popular: true,
      buttonText: 'Start Free Trial',
      buttonColor: 'bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-lg'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large businesses with complex needs',
      features: [
        'Everything in Growth',
        'Unlimited staff',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 phone support',
        'API access',
        'White-label options'
      ],
      popular: false,
      buttonText: 'Contact Sales',
      buttonColor: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
    },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={`${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-300 overflow-x-hidden">
      
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                FlowPOS
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
                How It Works
              </a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
                Testimonials
              </a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
                Pricing
              </a>
            </div>

            {/* Right Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? '☀️' : '🌙'}
              </button>
              <Link
                to="/login"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-semibold"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-semibold"
              >
                Start Free Trial
                <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col space-y-3">
                <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
                <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">How It Works</a>
                <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Testimonials</a>
                <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-semibold"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold"
                >
                  Start Free Trial
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 dark:from-primary/10 dark:to-accent/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl opacity-30 dark:opacity-20" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-primary/10 to-accent/10 rounded-full blur-3xl opacity-20 dark:opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 rounded-full border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm font-semibold text-primary">#1 POS for growing teams</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  One POS platform
                </span>
                <br />
                <span>for sales, stock, and staff.</span>
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
                Run your business from a single modern interface with a design system that adapts to both light and dark modes.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                >
                  Get started free
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Play size={18} />
                  See features
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                {highlights.map((item, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-primary">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Dashboard Mockup */}
            <div className="relative animate-on-scroll opacity-0 translate-y-10 transition-all duration-700 delay-200">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
                {/* Dashboard Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Today's Revenue</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">+18.2%</span>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Sales</div>
                      <div className="text-3xl font-bold">$14,250</div>
                    </div>
                    <div className="bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full text-sm font-semibold text-primary">
                      Live
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Orders</div>
                      <div className="text-2xl font-bold">328</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Low Stock</div>
                      <div className="text-2xl font-bold text-orange-500">04</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: 'Premium Coffee Beans', status: 'In Stock', color: 'text-green-500' },
                      { name: 'Wireless Scanner', status: 'Low Stock', color: 'text-orange-500' },
                      { name: 'Receipt Paper Rolls', status: 'In Stock', color: 'text-green-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <span className="font-medium">{item.name}</span>
                        <span className={`text-sm ${item.color}`}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-bounce">
                ⚡ 3 second checkout
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">Trusted by thousands of businesses worldwide</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {['Stripe', 'Shopify', 'Square', 'QuickBooks', 'Xero', 'WooCommerce'].map((brand) => (
              <div
                key={brand}
                className="flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm hover:border-primary/50 transition-colors"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">
              Everything you need to sell with{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">confidence</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Powerful features designed to help you manage your business efficiently and grow faster.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:shadow-xl transition-all duration-300 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">
              Get set up in{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">three simple steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:shadow-xl transition-all duration-300 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-primary" />
                )}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">{step.step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">
              What our{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">customers say</span>
            </h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-1 mb-4">{renderStars(testimonial.rating)}</div>
                      <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">"{testimonial.quote}"</p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <div className="font-semibold">{testimonial.author}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeTestimonial === index
                      ? 'w-8 bg-primary'
                      : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">
              Choose the plan that{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">fits your business</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white dark:bg-gray-900 rounded-2xl border ${
                  plan.popular
                    ? 'border-primary shadow-2xl shadow-primary/20 scale-105'
                    : 'border-gray-200 dark:border-gray-800'
                } p-8 transition-all duration-300 hover:shadow-xl animate-on-scroll opacity-0 translate-y-10 transition-all duration-700`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-gray-500 dark:text-gray-400 ml-1">/mo</span>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check size={16} className="text-primary flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.buttonText === 'Contact Sales' ? (
                  <a
                    href="#"
                    className={`block text-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${plan.buttonColor}`}
                  >
                    {plan.buttonText}
                  </a>
                ) : (
                  <Link
                    to="/register"
                    className={`block text-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${plan.buttonColor}`}
                  >
                    {plan.buttonText}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 dark:from-primary/20 dark:via-accent/10 dark:to-primary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-700">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to transform your business?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of merchants who trust FlowPOS to run their business smoothly.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight size={18} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-8 py-4 border border-gray-300 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Learn More
              </a>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
              No credit card required • Free 14-day trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  FlowPOS
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Modern POS platform for growing retail teams. Sell smarter, faster, better.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2026 FlowPOS. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== CUSTOM SCROLLBAR ===== */}
      <style>{`
        .animate-on-scroll {
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        html {
          scroll-behavior: smooth;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .dark ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
