import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  IndianRupee,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Upload,
  Flame
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { api } from '@/services/api';
import { AddProductModal } from '@/components/admin/AddProductModal';
import { AddSaleModal } from '@/components/admin/AddSaleModal';
import { saleService, Sale, SaleMode } from '@/services/saleService';
import { toast } from 'sonner';

// Stat interface
interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
}

// Order interface (aligned with backend)
interface Order {
  orderId: string;
  userId: { displayName: string; email: string } | string;
  userEmail: string;
  items: any[];
  total: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  shippingAddress: { fullName: string; city: string };
}

const statusColors: Record<string, string> = {
  Delivered: 'bg-green-100 text-green-800',
  Shipped: 'bg-blue-100 text-blue-800',
  Processing: 'bg-yellow-100 text-yellow-800',
  Pending: 'bg-gray-100 text-gray-800',
};

type TabType = 'dashboard' | 'orders' | 'products' | 'sales';

// Interface for Product from API
interface Product {
  _id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  newArrival: boolean;
  isBestseller: boolean;
  stock: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleModes, setSaleModes] = useState<SaleMode[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [editingSale, setEditingSale] = useState<Sale | undefined>(undefined);
  const [newSaleMode, setNewSaleMode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Add cache-busting parameter to force fresh data
      const response = await api.get(`/products?_=${Date.now()}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await saleService.getAllSales();
      setSales(response);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleModes = async () => {
    try {
      const response = await saleService.getAllSaleModes();
      setSaleModes(response);
    } catch (error) {
      console.error('Failed to fetch sale modes:', error);
      toast.error('Failed to load sale modes');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders(); // Refresh
      fetchStats();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update order status');
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'sales') {
      fetchSales();
      fetchSaleModes();
    } else if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) {
          toast.error('Invalid format. File must contain an array of products.');
          return;
        }

        const loadingToast = toast.loading('Uploading products...');

        await api.post('/products/bulk', json);

        toast.dismiss(loadingToast);
        toast.success(`Successfully uploaded ${json.length} products`);
        fetchProducts();
      } catch (error) {
        console.error('Bulk upload error:', error);
        toast.error('Failed to process bulk upload. Ensure valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('Are you sure you want to delete this sale item?')) return;

    try {
      await saleService.deleteSale(saleId);
      toast.success('Sale item deleted successfully');
      fetchSales();
    } catch (error) {
      console.error('Delete sale error:', error);
      toast.error('Failed to delete sale item');
    }
  };

  const handleToggleSaleMode = async (saleName: string) => {
    try {
      await saleService.toggleSaleMode(saleName);
      toast.success('Sale mode toggled successfully');
      fetchSaleModes();
    } catch (error) {
      console.error('Toggle sale mode error:', error);
      toast.error('Failed to toggle sale mode');
    }
  };

  const handleCreateSaleMode = async () => {
    if (!newSaleMode.trim()) {
      toast.error('Please enter a sale name');
      return;
    }

    try {
      await saleService.createOrUpdateSaleMode({
        saleName: newSaleMode,
        isActive: false,
      });
      toast.success('Sale mode created successfully');
      setNewSaleMode('');
      fetchSaleModes();
    } catch (error) {
      console.error('Create sale mode error:', error);
      toast.error('Failed to create sale mode');
    }
  };

  const handleDeleteSaleMode = async (saleName: string) => {
    if (!confirm('Are you sure you want to delete this sale mode?')) return;

    try {
      await saleService.deleteSaleMode(saleName);
      toast.success('Sale mode deleted successfully');
      fetchSaleModes();
    } catch (error) {
      console.error('Delete sale mode error:', error);
      toast.error('Failed to delete sale mode');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your store, orders, and products
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'sales', label: 'Sales', icon: Flame },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-primary/20'
                  }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', value: stats ? `₹${stats.totalRevenue.toLocaleString()}` : '-', icon: IndianRupee, color: 'text-green-600' },
                  { label: 'Total Orders', value: stats ? stats.totalOrders : '-', icon: ShoppingCart, color: 'text-blue-600' },
                  { label: 'Total Users', value: stats ? stats.totalUsers : '-', icon: Users, color: 'text-purple-600' },
                  { label: 'Total Products', value: products.length || '-', icon: Package, color: 'text-orange-600' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <stat.icon size={24} className="text-primary" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h3>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="font-serif text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => { setActiveTab('products'); setEditingProduct(undefined); setIsAddModalOpen(true); }}
                    className="btn-primary flex items-center gap-2 px-6 py-3"
                  >
                    <Plus size={18} /> Add New Product
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="px-6 py-3 border border-border rounded-full hover:bg-secondary flex items-center gap-2"
                  >
                    <ShoppingCart size={18} /> View Orders
                  </button>
                </div>
              </div>

            </motion.div>
          )}

          {/* Orders Tab - Placeholder for now until we connect fully */}
          {activeTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold">Manage Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Order ID</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Customer</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Total</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((order) => (
                      <tr key={order.orderId} className="hover:bg-secondary/50">
                        <td className="px-6 py-4 font-mono text-sm">{order.orderId}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">{order.shippingAddress?.fullName || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{order.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium">₹{order.total.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' : order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {order.orderStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            className="text-sm border border-border rounded px-2 py-1 bg-background"
                            value={order.orderStatus}
                            onChange={(e) => handleUpdateOrderStatus(order.orderId, e.target.value)}
                            disabled={order.orderStatus === 'cancelled' || order.orderStatus === 'delivered'}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && !loading && (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No orders found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-secondary rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-secondary flex items-center gap-2 transition-colors"
                    >
                      <Upload size={18} /> Bulk Upload (JSON)
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleBulkUpload}
                      className="hidden"
                      accept=".json"
                    />

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setEditingProduct(undefined); setIsAddModalOpen(true); }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Add Product
                    </motion.button>
                  </div>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-muted-foreground">Loading products...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Product</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Price</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Rating</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredProducts.map((product) => (
                          <tr key={product._id} className="hover:bg-secondary/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-14 rounded-lg overflow-hidden bg-secondary">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="font-medium text-sm">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{product.category}</td>
                            <td className="px-6 py-4 text-sm font-medium">₹{product.price.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm">⭐ {product.rating}</td>
                            <td className="px-6 py-4">
                              {product.newArrival && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mr-1">
                                  New
                                </span>
                              )}
                              {product.isBestseller && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                  Bestseller
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => { setEditingProduct(product); setIsAddModalOpen(true); }}
                                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.productId)}
                                  className="p-2 hover:bg-secondary rounded-lg transition-colors text-destructive"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-muted-foreground">
                              No products found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Sale Modes Management */}
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-bold mb-4">Manage Sale Modes</h2>
                  <div className="flex gap-3 flex-wrap">
                    {saleModes.map((mode) => (
                      <div key={mode._id} className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
                        <span className="font-medium text-sm">{mode.saleName}</span>
                        <button
                          onClick={() => handleToggleSaleMode(mode.saleName)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            mode.isActive ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              mode.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteSaleMode(mode.saleName)}
                          className="p-1 hover:bg-destructive/20 rounded transition-colors text-destructive ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 border-t border-border">
                  <label className="block text-sm font-medium mb-2">Create New Sale Mode</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSaleMode}
                      onChange={(e) => setNewSaleMode(e.target.value)}
                      placeholder="e.g., Summer Sale, Diwali Sale"
                      className="flex-1 px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateSaleMode()}
                    />
                    <button
                      onClick={handleCreateSaleMode}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus size={18} /> Create
                    </button>
                  </div>
                </div>
              </div>

              {/* Sale Items Management */}
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="text"
                      placeholder="Search sale items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-secondary rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setEditingSale(undefined); setIsAddSaleModalOpen(true); }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Sale Item
                  </motion.button>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-muted-foreground">Loading sales...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Item</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Price</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Discount</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Stock</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sales.filter(s =>
                          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.category.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((sale) => (
                          <tr key={sale._id} className="hover:bg-secondary/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-14 rounded-lg overflow-hidden bg-secondary">
                                  <img
                                    src={sale.image}
                                    alt={sale.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="font-medium text-sm">{sale.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{sale.category}</td>
                            <td className="px-6 py-4 text-sm font-medium">₹{sale.price.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm">
                              {sale.discount ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                  -{sale.discount}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm">{sale.stock}</td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => { setEditingSale(sale); setIsAddSaleModalOpen(true); }}
                                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSale(sale.saleId)}
                                  className="p-2 hover:bg-secondary rounded-lg transition-colors text-destructive"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {sales.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-muted-foreground">
                              No sale items found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
                            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingProduct(undefined); }}
        onSuccess={() => fetchProducts()}
        product={editingProduct}
      />

      <AddSaleModal
        isOpen={isAddSaleModalOpen}
        onClose={() => { setIsAddSaleModalOpen(false); setEditingSale(undefined); }}
        onSuccess={() => fetchSales()}
        sale={editingSale}
      />
    </div>
  );
}
