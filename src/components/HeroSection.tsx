import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import heroImage from '@/assets/hero-model.jpg';
import { useState } from 'react';

export function HeroSection() {
  const [heroImageError, setHeroImageError] = useState(false);
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-background via-secondary to-blush-light">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-24 lg:pt-0">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6"
            >
              <Sparkles size={16} />
              New Spring Collection 2026
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6"
            >
              Elegance in{' '}
              <span className="text-gradient-gold italic">Every</span>{' '}
              <br className="hidden sm:block" />
              Wear
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-8"
            >
              Discover timeless pieces crafted for the modern woman. 
              Premium quality, effortless style, unforgettable moments.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link to="/shop">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary flex items-center gap-2 group"
                >
                  Shop Now
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link to="/shop?filter=new">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 border-2 border-foreground text-foreground rounded-full font-medium hover:bg-foreground hover:text-background transition-all duration-300"
                >
                  New Arrivals
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center justify-center lg:justify-start gap-8 mt-12"
            >
              {[
                { value: '10K+', label: 'Happy Customers' },
                { value: '500+', label: 'Unique Styles' },
                { value: '4.9★', label: 'Rating' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-serif text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative z-10">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <img
                  src={heroImage}
                  alt="She Wear Collection - Elegant Fashion"
                  className="w-full max-w-lg mx-auto rounded-3xl shadow-2xl"
                  onError={() => setHeroImageError(true)}
                />
                {heroImageError && (
                  <div className="w-full max-w-lg mx-auto rounded-3xl shadow-2xl bg-secondary flex items-center justify-center h-96">
                    <div className="text-center text-muted-foreground">
                      <AlertCircle className="mx-auto mb-2" />
                      <p>Image not available</p>
                    </div>
                  </div>
                )}
                {/* Floating Elements */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                  className="absolute -top-4 -right-4 lg:-right-8 bg-background rounded-2xl p-4 shadow-lg"
                >
                  <p className="font-serif text-lg font-semibold">✦ Premium Quality</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                  className="absolute -bottom-4 -left-4 lg:-left-8 bg-primary rounded-2xl px-6 py-4 shadow-lg"
                >
                  <p className="font-serif text-lg font-semibold text-primary-foreground">Latest Designs</p>
                </motion.div>
              </motion.div>
            </div>
            
            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-primary/20 to-gold/10 rounded-full blur-3xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
