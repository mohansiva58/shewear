import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { productService } from '@/services/productService';
import { Product } from '@/lib/products';

export function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const products = await productService.getFeaturedProducts();
        console.log('Featured products fetched:', products);
        console.log('Featured products count:', products.length);
        setFeaturedProducts(products.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-56 bg-secondary/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-2">
            Curated For You
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Featured Collection
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover our handpicked selection of elegant pieces designed to make you feel confident and beautiful.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product, index) => (
              <ProductCard key={(product as any).productId || product.id || (product as any)._id} product={product} index={index} />
            ))
          ) : (
            <div className="col-span-4 text-center text-muted-foreground">
              No featured products found.
            </div>
          )}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to="/shop">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-3 border-2 border-foreground text-foreground rounded-full font-medium hover:bg-foreground hover:text-background transition-all duration-300 group"
            >
              View All Products
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

