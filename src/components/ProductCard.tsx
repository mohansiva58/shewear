import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/products';
import { useWishlistStore } from '@/lib/wishlist';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { addItem, removeItem, isInWishlist } = useWishlistStore();

  const productId = (product as any).productId || product.id || (product as any)._id;
  const isWishlisted = isInWishlist(productId);
  const isNew = product.newArrival || product.isNew;


  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail
    e.stopPropagation();

    if (isWishlisted) {
      removeItem(productId);
      // toast.success('Removed from wishlist');
    } else {
      addItem(product);
      // toast.success('Added to wishlist');
    }
  };

  const handleImageError = () => {
    console.error('Image failed to load:', product.image);
    setImageError(true);
  };

  // Debug: log image URL
  if (!product.image) {
    console.warn('Product missing image URL:', product.name);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-product">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary rounded-lg">
          <Link to={`/product/${productId}`}>
            {!imageError ? (
              <motion.img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                animate={{ scale: isHovered ? 1.08 : 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Image not available</p>
                </div>
              </div>
            )}
          </Link>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isNew && (
              <span className="px-3 py-1 bg-foreground text-background text-xs font-medium rounded-full">
                NEW
              </span>
            )}
            {product.isBestseller && (
              <span className="px-3 py-1 bg-gold text-background text-xs font-medium rounded-full">
                BESTSELLER
              </span>
            )}
            {product.originalPrice && (
              <span className="px-3 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded-full">
                SALE
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          {/* Wishlist Button Removed from top-right */}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-4 right-4 flex gap-2"
          >
            <Link
              to={`/product/${productId}`}
              className="flex-1 py-3 bg-background/95 backdrop-blur-sm text-foreground text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg"
            >
              <Eye size={16} />
              Quick View
            </Link>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlistToggle}
              className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
            </motion.button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {product.category}
          </p>
          <Link to={`/product/${productId}`}>
            <h3 className="font-serif text-base font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-sm text-foreground">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${i < Math.floor(product.rating) ? 'text-gold' : 'text-muted'
                    }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
