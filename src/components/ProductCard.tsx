import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye } from 'lucide-react';
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

  const productId =
    (product as any).productId || product.id || (product as any)._id;

  const isWishlisted = isInWishlist(productId);
  const isNew = product.newArrival || product.isNew;
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishlisted) {
      removeItem(productId);
    } else {
      addItem(product);
    }
  };

  const handleImageError = () => {
    console.error('Image failed to load:', product.image);
    setImageError(true);
  };

  if (!product.image) {
    console.warn('Product missing image URL:', product.name);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-product">
        {/* Image Container */}
        <div className="relative aspect-[4/4.5] overflow-hidden bg-secondary rounded-lg">
          <Link to={`/product/${productId}`}>
            {!imageError ? (
              <motion.img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <p className="text-xs text-muted-foreground">
                  Image not available
                </p>
              </div>
            )}
          </Link>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isOutOfStock && (
              <span className="px-3 py-1 bg-destructive text-destructive-foreground text-[11px] font-bold rounded-full">
                OUT OF STOCK
              </span>
            )}
            {isNew && (
              <span className="px-2 py-0.5 bg-foreground text-background text-[10px] font-medium rounded-full">
                NEW
              </span>
            )}
            {product.isBestseller && (
              <span className="px-2 py-0.5 bg-gold text-background text-[10px] font-medium rounded-full">
                BESTSELLER
              </span>
            )}
            {product.originalPrice && (
              <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full">
                SALE
              </span>
            )}
          </div>
          
          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <p className="text-white font-bold text-lg">Out of Stock</p>
            </div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{
              opacity: isHovered && !isOutOfStock ? 1 : 0,
              y: isHovered && !isOutOfStock ? 0 : 15,
            }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-3 left-3 right-3 flex gap-2"
          >
            <Link
              to={`/product/${productId}`}
              className="flex-1 py-2 bg-background/95 backdrop-blur-sm text-foreground text-xs font-medium rounded-full flex items-center justify-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors shadow-md"
            >
              <Eye size={14} />
              View
            </Link>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlistToggle}
              className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center transition-transform shadow-md"
            >
              <Heart
                size={16}
                className={isWishlisted ? 'fill-current' : ''}
              />
            </motion.button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="p-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            {product.category}
          </p>

          <Link to={`/product/${productId}`}>
            <h3 className="font-serif text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-xs text-foreground">
              ₹{product.price.toLocaleString()}
            </span>

            {product.originalPrice && (
              <span className="text-[10px] text-muted-foreground line-through">
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
                  className={`text-[10px] ${
                    i < Math.floor(product.rating)
                      ? 'text-gold'
                      : 'text-muted'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}