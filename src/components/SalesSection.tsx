import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { saleService } from '@/services/saleService';
import { Sale, SaleMode } from '@/services/saleService';

export function SalesSection() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleMode, setSaleMode] = useState<SaleMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        
        // First, check if there's an active sale mode
        const activeSaleMode = await saleService.getActiveSaleMode();
        setSaleMode(activeSaleMode);
        
        // If there's an active sale mode, fetch active sales
        if (activeSaleMode && activeSaleMode.isActive) {
          const activeSales = await saleService.getActiveSales();
          console.log('Active sales fetched:', activeSales);
          
          if (!Array.isArray(activeSales) || activeSales.length === 0) {
            setSales([]);
            setError('No sale items available at the moment.');
          } else {
            setSales(activeSales.slice(0, 4));
            setError(null);
          }
        } else {
          // No active sale mode, so don't show sales section
          setSales([]);
        }
      } catch (error) {
        console.error('Failed to fetch sales data:', error);
        setError('Failed to load sales. Please try again later.');
        setSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  // If no active sale mode, don't render the section
  if (!saleMode?.isActive) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-red-50 to-background">
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
    <section className="py-20 bg-gradient-to-b from-red-50 to-background relative overflow-hidden">
      {/* Decorative flame background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <Flame className="absolute top-10 right-10 w-32 h-32 text-red-500" />
        <Flame className="absolute bottom-20 left-10 w-40 h-40 text-red-500" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="w-6 h-6 text-red-500 animate-pulse" />
            <p className="text-red-600 text-sm font-medium tracking-widest uppercase">
              {saleMode?.saleName || 'Special Offer'}
            </p>
            <Flame className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Sales & Deals
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {saleMode?.description || 'Limited time offers on our exclusive collection. Don\'t miss out!'}
          </p>
        </motion.div>

        {/* Sales Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {error ? (
            <div className="col-span-4 text-center text-destructive bg-destructive/10 p-4 rounded-lg">
              {error}
            </div>
          ) : sales.length > 0 ? (
            sales.map((sale, index) => (
              <motion.div
                key={sale.saleId}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Convert Sale to Product format for ProductCard */}
                <ProductCard
                  key={sale.saleId}
                  product={{
                    ...sale,
                    productId: sale.saleId,
                    id: sale._id,
                  } as any}
                  index={index}
                />
                {/* Discount Badge */}
                {sale.discount && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-sm shadow-lg"
                  >
                    -{sale.discount}%
                  </motion.div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-4 text-center text-muted-foreground">
              No sale items available right now. Check back soon!
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
