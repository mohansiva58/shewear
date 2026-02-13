import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { useWishlistStore } from '@/lib/wishlist';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
    const { items } = useWishlistStore();

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
                            My Wishlist
                        </h1>
                        <p className="text-muted-foreground">
                            {items.length} items saved
                        </p>
                    </motion.div>

                    {items.length === 0 ? (
                        <div className="text-center py-20 bg-secondary/20 rounded-2xl">
                            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Heart size={32} className="text-muted-foreground" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
                            <p className="text-muted-foreground mb-8">
                                Save items you love to buy them later.
                            </p>
                            <Link to="/shop" className="btn-primary inline-flex">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {items.map((product, index) => (
                                <ProductCard
                                    key={(product as any).productId || product.id || (product as any)._id}
                                    product={product}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
