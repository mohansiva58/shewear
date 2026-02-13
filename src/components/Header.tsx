import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, X, Heart, User, LogOut, Truck, Home, ShoppingCart, ChevronDown } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useCartStore } from '@/lib/cart';
import { useWishlistStore } from '@/lib/wishlist';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { user, isAuthenticated, signOut } = useAuth();

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync search query with URL parameter
  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchQuery(query);
      setIsSearchOpen(true);
    }
  }, [searchParams]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle outside click for search
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (!isSearchOpen) return;
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsSearchOpen(false);
    }
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isSearchOpen]);

  // Handle outside click for user menu
  useEffect(() => {
    function handleUserMenuClick(e: MouseEvent) {
      if (!showUserMenu) return;
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleUserMenuClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleUserMenuClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showUserMenu]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim() && isSearchOpen) {
      navigate(`/shop?search=${encodeURIComponent(debouncedQuery)}`);
    }
  }, [debouncedQuery, navigate, isSearchOpen]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    if (location.pathname === '/shop' && searchParams.get('search')) {
      navigate('/shop');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <>
      {/* Toast/Floating Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-3 md:pt-4 px-3 md:px-6">
        <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/50 px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">

            {/* LEFT - Logo on Desktop */}
            <div className="hidden lg:flex items-center gap-2 z-10 flex-shrink-0">
              <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="shewear" className="h-16 w-auto" />
              </Link>
            </div>

            {/* CENTER - Logo on Mobile */}
            <div className="absolute left-1/2 -translate-x-1/2 lg:hidden">
              <Link to="/" className="flex items-center">
                <img src={logo} alt="shewear" className="h-14 w-auto" />
              </Link>
            </div>

            {/* CENTER - Navigation Menu (Desktop Only) */}
            <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-6">
                <Link
                  to="/"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/shop"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/shop' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Shop
                </Link>
                <Link
                  to="/about"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/about' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  About
                </Link>
                  <Link
                  to="/admin"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/about' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Admin
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/orders"
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === '/orders' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    My Orders
                  </Link>
                  
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors outline-none">
                    Collection
                    <ChevronDown size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/shop?filter=new" className="cursor-pointer">
                        New Arrivals
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/shop?filter=bestseller" className="cursor-pointer">
                        Best Sellers
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/shop?category=sarees" className="cursor-pointer">
                        Sarees
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/shop?category=dresses" className="cursor-pointer">
                        Dresses
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/shop?category=tops" className="cursor-pointer">
                        Tops & Tunics
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </nav>

            {/* RIGHT - Icons with Inline Search */}
            <div className="flex items-center gap-3 md:gap-4 z-10 ml-auto lg:ml-0">
              {/* Inline Expanding Search */}
              <div ref={searchWrapperRef} className="relative flex items-center">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                  aria-label="Search"
                >
                  <Search size={18} className="md:w-5 md:h-5 text-gray-700 hover:text-gray-900" />
                </button>

                <div className="flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className={`transition-all duration-200 ease-in-out text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                      isSearchOpen
                        ? 'w-48 md:w-64 px-4 py-1.5 border border-gray-300 ml-2 opacity-100'
                        : 'w-0 px-0 py-0 border-0 opacity-0'
                    }`}
                    aria-label="Search products"
                  />
                  {searchQuery && isSearchOpen && (
                    <button
                      onClick={handleClearSearch}
                      className="ml-2 p-1 hover:bg-gray-100 rounded-full transition"
                      aria-label="Clear search"
                    >
                      <X size={14} className="text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Link to="/wishlist" className="hidden lg:flex p-2 hover:bg-gray-100 rounded-full transition relative">
                  <Heart size={20} className="text-gray-700 hover:text-gray-900 transition-colors" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] font-medium w-5 h-5 rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Link to="/cart" className="relative hidden lg:flex p-2 hover:bg-gray-100 rounded-full transition">
                  <ShoppingBag size={20} className="text-gray-700 hover:text-gray-900 transition-colors" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] font-medium w-5 h-5 rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </motion.div>

              {/* User Menu/Avatar */}
              {isAuthenticated ? (
                <div ref={userMenuRef} className="relative hidden lg:block">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-1 hover:bg-gray-100 rounded-full transition"
                    aria-label="Account"
                  >
                    <Avatar className="h-8 w-8 border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors">
                      <AvatarImage src={user?.photoURL || ""} />
                      <AvatarFallback className="bg-pink-100 text-pink-700 font-semibold text-sm">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "M"}
                      </AvatarFallback>
                    </Avatar>
                  </motion.button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.displayName || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        to="/orders"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Truck size={16} />
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart size={16} />
                        Wishlist
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAuthModal(true)}
                  className="hidden lg:flex p-2 hover:bg-gray-100 rounded-full transition"
                  aria-label="Login"
                >
                  <User size={20} className="text-gray-700 hover:text-gray-900 transition-colors" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">

          {/* Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center min-w-[60px] transition-colors ${location.pathname === "/"
              ? "text-gray-900"
              : "text-gray-500"
              }`}
          >
            <Home size={22} strokeWidth={1.5} />
            <span className="text-[11px] mt-1 font-medium">Home</span>
          </Link>

          {/* Shop */}
          <Link
            to="/shop"
            className={`flex flex-col items-center justify-center min-w-[60px] transition-colors ${location.pathname === "/shop"
              ? "text-gray-900"
              : "text-gray-500"
              }`}
          >
            <ShoppingBag size={22} strokeWidth={1.5} />
            <span className="text-[11px] mt-1 font-medium">Shop</span>
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center relative min-w-[60px] transition-colors ${location.pathname === "/cart"
              ? "text-gray-900"
              : "text-gray-500"
              }`}
          >
            <div className="relative">
              <ShoppingCart size={22} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-3 bg-gray-900 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 font-medium">Cart</span>
          </Link>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className={`flex flex-col items-center justify-center relative min-w-[60px] transition-colors ${location.pathname === "/wishlist"
              ? "text-gray-900"
              : "text-gray-500"
              }`}
          >
            <div className="relative">
              <Heart size={22} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-gray-900 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 font-medium">Wishlist</span>
          </Link>

          {/* Profile */}
          <button
            onClick={() =>
              isAuthenticated ? navigate("/orders") : setShowAuthModal(true)
            }
            className={`flex flex-col items-center justify-center min-w-[60px] transition-colors ${location.pathname === "/orders" ||
              location.pathname === "/profile"
              ? "text-gray-900"
              : "text-gray-500"
              }`}
          >
            {isAuthenticated ? (
              <Avatar className="h-6 w-6 border border-gray-300">
                <AvatarImage src={user?.photoURL || ""} />
                <AvatarFallback className="text-[10px] bg-pink-100 text-pink-700 font-semibold">
                  {user?.displayName?.charAt(0) ||
                    user?.email?.charAt(0) ||
                    "M"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User size={22} strokeWidth={1.5} />
            )}
            <span className="text-[11px] mt-1 font-medium">Profile</span>
          </button>

        </div>
      </div>
    </>
  );
}
