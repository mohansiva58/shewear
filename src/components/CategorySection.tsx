import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import product1 from '@/assets/product-1.jpg';
import product2 from '@/assets/product-2.jpg';
import product3 from '@/assets/product-3.jpg';

const categories = [
  { name: 'Dresses', image: product1, count: 48 },
  { name: 'Tops', image: product2, count: 36 },
  { name: 'Skirts', image: product3, count: 24 },
];

export function CategorySection() {
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-2">
            Browse By
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
            Shop Categories
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/shop?category=${category.name}`}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="relative group overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                    <h3 className="font-serif text-2xl font-bold text-background mb-1">
                      {category.name}
                    </h3>
                    <p className="text-background/80 text-sm">
                      {category.count} Products
                    </p>
                    <motion.div
                      initial={{ width: 0 }}
                      whileHover={{ width: '3rem' }}
                      className="h-0.5 bg-primary mx-auto mt-3 rounded-full"
                    />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
