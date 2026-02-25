import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { SalesSection } from '@/components/SalesSection';
import { FeaturedProducts } from '@/components/FeaturedProducts';
import { CategorySection } from '@/components/CategorySection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { NewsletterSection } from '@/components/NewsletterSection';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <SalesSection />
        <FeaturedProducts />
        <CategorySection />
        <TestimonialsSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
