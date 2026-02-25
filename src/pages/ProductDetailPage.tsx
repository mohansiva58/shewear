import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Minus, Plus, Ban, CreditCard, ShoppingBag, Star, Truck, RotateCcw, Shield, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductGallery } from '@/components/ProductGallery';
import { AuthModal } from '@/components/AuthModal';
import { Product } from '@/lib/products';
import { useCartStore } from '@/lib/cart';
import { useAuth } from '@/contexts/AuthContext';
import { productService } from '@/services/productService';
import { saleService } from '@/services/saleService';
import { useWishlistStore } from '@/lib/wishlist';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = product ? isInWishlist((product as any).productId || product.id || (product as any)._id) : false;
  const [showAuthModal, setShowAuthModal] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        let data: Product | null = null;
        
        // Try to fetch as a regular product first
        try {
          data = await productService.getProductById(id);
        } catch (productError: any) {
          // If product fetch fails with 404, try to fetch as a sale item
          if (productError?.response?.status === 404) {
            console.log('Product not found, checking if it\'s a sale item...');
            try {
              const saleData = await saleService.getSaleById(id);
              // Convert sale to product format
              data = {
                ...saleData,
                productId: (saleData as any).saleId || (saleData as any)._id,
                id: (saleData as any)._id,
              } as Product;
            } catch (saleError) {
              console.error('Failed to fetch as sale item:', saleError);
              throw productError; // Throw original product error
            }
          } else {
            throw productError;
          }
        }

        if (!data) return;
        
        setProduct(data);

        // Fetch related products based on category
        try {
          // Fetch all products to ensure we have enough suggestions
          const allProducts = await productService.getAllProducts();

          // Filter out current product
          const candidates = allProducts.filter((p: Product) =>
            (p as any).productId !== id && p.id !== id && (p as any)._id !== id
          );

          // Prioritize same category
          const sameCategory = candidates.filter((p: Product) => p.category === data.category);
          const others = candidates.filter((p: Product) => p.category !== data.category);

          // Combine: Same category first, then others to fill the gap
          const suggestions = [...sameCategory, ...others].slice(0, 4);

          setRelatedProducts(suggestions);
        } catch (relatedError) {
          console.error('Failed to fetch related products:', relatedError);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        // toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-xl text-muted-foreground mb-4">Product not found</p>
          <Link to="/shop" className="text-primary hover:underline">Return to Shop</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (product?.stock !== undefined && product.stock <= 0) {
      toast.error('This product is out of stock');
      return;
    }
    const success = addItem(product!, selectedSize, quantity);
    if (success) {
      toast.success('Added to cart! ✨');
    } else {
      toast.error('Unable to add item to cart. Please check stock availability.');
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (product?.stock !== undefined && product.stock <= 0) {
      toast.error('This product is out of stock');
      return;
    }

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const success = addItem(product!, selectedSize, quantity);
    if (success) {
      navigate('/checkout');
    } else {
      toast.error('Unable to process. Please check stock availability.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <Link to="/shop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft size={18} />
              Back to Shop
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <ProductGallery
                images={product.images && product.images.length > 0 ? product.images : [product.image]}
                productName={product.name}
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {(product.isNew || (product as any).newArrival) && (
                  <span className="px-3 py-1 bg-foreground text-background text-xs font-medium rounded-full">
                    NEW
                  </span>
                )}
                {product.isBestseller && (
                  <span className="px-3 py-1 bg-gold text-background text-xs font-medium rounded-full">
                    BESTSELLER
                  </span>
                )}
              </div>

              {/* Wishlist */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (product) {
                    const productId = (product as any).productId || product.id || (product as any)._id;
                    if (isWishlisted) {
                      removeFromWishlist(productId);
                      toast.success('Removed from wishlist');
                    } else {
                      addToWishlist(product);
                      toast.success('Added to wishlist');
                    }
                  }
                }}
                className="absolute top-4 right-4 w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-lg z-10"
              >
                <Heart
                  size={22}
                  className={isWishlisted ? 'fill-primary text-primary' : 'text-foreground'}
                />
              </motion.button>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              <div>
                <p className="text-primary text-sm font-medium tracking-widest uppercase mb-2">
                  {product.category}
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < Math.floor(product.rating) ? 'fill-gold text-gold' : 'text-muted'}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-foreground">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                      <span className="px-2 py-1 bg-destructive/10 text-destructive text-sm font-medium rounded">
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Stock Status */}
                {product.stock !== undefined && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${
                    product.stock > 0
                      ? 'bg-green-50/30 border border-green-200/30'
                      : 'bg-destructive/10 border border-destructive/20'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-destructive'}`} />
                    <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-700' : 'text-destructive'}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Size Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Select Size</h3>
                  <button className="text-primary text-sm hover:underline">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <motion.button
                      key={size}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(size)}
                      className={`w-14 h-14 rounded-full text-sm font-medium transition-all ${selectedSize === size
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-secondary hover:bg-primary/20 border border-border'
                        }`}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <h3 className="font-semibold mb-3">Quantity</h3>
                <div className="inline-flex items-center gap-4 bg-secondary rounded-full p-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Minus size={18} />
                  </motion.button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Plus size={18} />
                  </motion.button>
                </div>
              </div>

              {/* Out of Stock Message */}
              {product?.stock !== undefined && product.stock <= 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4 flex items-center gap-3">
                  <Ban className="text-destructive" size={20} />
                  <p className="text-destructive font-medium">This product is currently out of stock</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={product?.stock !== undefined && product.stock > 0 ? { scale: 1.02 } : {}}
                  whileTap={product?.stock !== undefined && product.stock > 0 ? { scale: 0.98 } : {}}
                  onClick={handleAddToCart}
                  disabled={product?.stock !== undefined && product.stock <= 0}
                  className="flex-1 py-4 bg-secondary text-foreground rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag size={20} />
                  Add to Cart
                </motion.button>
                <motion.button
                  whileHover={product?.stock !== undefined && product.stock > 0 ? { scale: 1.02 } : {}}
                  whileTap={product?.stock !== undefined && product.stock > 0 ? { scale: 0.98 } : {}}
                  onClick={handleBuyNow}
                  disabled={product?.stock !== undefined && product.stock <= 0}
                  className="flex-1 btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </motion.button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="text-center">
                  <Truck className="mx-auto text-primary mb-2" size={24} />
                  <p className="text-xs text-muted-foreground">Free Shipping</p>
                </div>
                <div className="text-center">
                  <Ban className="mx-auto text-primary mb-2" size={24} />
                  <p className="text-xs text-muted-foreground">No Returns</p>
                </div>
                <div className="text-center">
                  <CreditCard className="mx-auto text-primary mb-2" size={24} />
                  <p className="text-xs text-muted-foreground">No COD</p>
                </div>


                <div className="text-center">
                  <Shield className="mx-auto text-primary mb-2" size={24} />
                  <p className="text-xs text-muted-foreground">Secure Payment</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-20"
            >
              <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
                You May Also Like
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((product, index) => (
                  <ProductCard key={(product as any).productId || product.id} product={product} index={index} />
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          if (product) {
            addItem(product, selectedSize!, quantity);
            navigate('/checkout'); // Changed from /cart to /checkout for Buy Now
          }
        }}
      />

      <Footer />
    </div>
  );
}
