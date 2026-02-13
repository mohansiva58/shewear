import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { categories, priceRanges, sizes, Product } from '@/lib/products';
import { productService } from '@/services/productService';

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  const filterParam = searchParams.get('filter');
  const categoryParam = searchParams.get('category');
  const search = searchParams.get('search');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAllProducts();
        console.log('Fetched products:', data);
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Apply filter param
    if (filterParam === 'new') {
      result = result.filter((p) => p.isNew || p.newArrival);
    } else if (filterParam === 'bestseller') {
      result = result.filter((p) => p.isBestseller);
    }

    // Apply category param or selected category
    const category = categoryParam || selectedCategory;
    if (category && category !== 'All') {
      result = result.filter((p) => p.category === category);
    }

    // Apply price range
    if (selectedPriceRange) {
      const range = priceRanges.find((r) => r.label === selectedPriceRange);
      if (range) {
        result = result.filter((p) => p.price >= range.min && p.price < range.max);
      }
    }

    // Apply size filter
    if (selectedSize) {
      result = result.filter((p) => p.sizes.includes(selectedSize));
    }

    // Apply search filter
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // featured - keep original order
        break;
    }

    return result;
  }, [products, filterParam, categoryParam, selectedCategory, selectedPriceRange, selectedSize, sortBy]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedPriceRange(null);
    setSelectedSize(null);
  };

  const activeFiltersCount = [
    selectedCategory !== 'All' ? 1 : 0,
    selectedPriceRange ? 1 : 0,
    selectedSize ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
              {search ? `Search results for "${search}"` : filterParam === 'new' ? 'New Arrivals' : filterParam === 'bestseller' ? 'Bestsellers' : 'Shop All'}
            </h1>
            <p className="text-muted-foreground">
              {filteredProducts.length} products
            </p>
          </motion.div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm font-medium"
              >
                <SlidersHorizontal size={16} />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-primary rounded-full text-primary-foreground text-xs flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </motion.button>

              {/* Desktop Category Pills */}
              <div className="hidden lg:flex items-center gap-2">
                {categories.map((category) => (
                  <motion.button
                    key={category}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground hover:bg-primary/20'
                      }`}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 bg-secondary rounded-full text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-28 space-y-8">
                {/* Price Range */}
                <div>
                  <h3 className="font-serif text-lg font-semibold mb-4">Price Range</h3>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <button
                        key={range.label}
                        onClick={() => setSelectedPriceRange(selectedPriceRange === range.label ? null : range.label)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedPriceRange === range.label
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary'
                          }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <h3 className="font-serif text-lg font-semibold mb-4">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${selectedSize === size
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-primary/20'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-2 text-primary text-sm font-medium hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </aside>

            {/* Mobile Filter Panel */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  className="fixed inset-0 z-50 lg:hidden"
                >
                  <div className="absolute inset-0 bg-foreground/50" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute left-0 top-0 bottom-0 w-80 bg-background p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-serif text-xl font-semibold">Filters</h2>
                      <button onClick={() => setIsFilterOpen(false)}>
                        <X size={24} />
                      </button>
                    </div>

                    {/* Categories */}
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Category</h3>
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === category
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-secondary'
                              }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Price Range</h3>
                      <div className="space-y-2">
                        {priceRanges.map((range) => (
                          <button
                            key={range.label}
                            onClick={() => setSelectedPriceRange(selectedPriceRange === range.label ? null : range.label)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedPriceRange === range.label
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-secondary'
                              }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size */}
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Size</h3>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                            className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${selectedSize === size
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-primary/20'
                              }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="w-full btn-primary mt-4"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-[3/4] bg-secondary/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product, index) => (
                    <ProductCard key={(product as any).productId || product.id || (product as any)._id} product={product} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg mb-4">No products found</p>
                  <button
                    onClick={clearFilters}
                    className="text-primary font-medium hover:underline"
                  >
                    Clear filters
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Refresh Page
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
