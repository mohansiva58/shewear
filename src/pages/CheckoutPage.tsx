import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CreditCard, Check, AlertCircle, Plus, Pencil } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthModal } from '@/components/AuthModal';
import { useCartStore, getProductId } from '@/lib/cart';
import { useAuth } from '@/contexts/AuthContext';
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout';
import { orderService } from '@/services/orderService';
import { toast } from 'sonner';

type PaymentMethod = 'razorpay';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuth();
  const { initiatePayment } = useRazorpayCheckout();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const [savedAddress, setSavedAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const subtotal = getTotalPrice();
  const shipping = subtotal > 2000 ? 0 : 99;
  const total = subtotal + shipping;

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      // Fetch past orders to get address
      const fetchPastOrders = async () => {
        try {
          const response = await orderService.getOrders({ limit: 1 });
          // Check structure: response.orders (from backend) or response (if direct array)
          const orders = response.orders || response;

          if (Array.isArray(orders) && orders.length > 0) {
            // Sort by createdAt just in case, though backend usually returns sorted
            const lastOrder = orders[0]; // Assuming most recent first or taking the first one

            if (lastOrder && lastOrder.shippingAddress) {
              const addr = lastOrder.shippingAddress;
              setFormData({
                fullName: addr.fullName || '',
                phone: addr.phone || '',
                email: addr.email || user?.email || '',
                // Handle potential field name variations
                address: addr.address || addr.addressLine1 || '',
                city: addr.city || '',
                state: addr.state || '',
                pincode: addr.pincode || addr.postalCode || '',
              });
              setSavedAddress(true);
              setIsEditingAddress(false);
            }
          } else {
            // No previous orders, prefill email if available
            setFormData(prev => ({ ...prev, email: user?.email || '' }));
          }
        } catch (error) {
          console.error("Failed to fetch past orders", error);
        }
      };

      fetchPastOrders();
    }
  }, [isAuthenticated, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.pincode) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!policyAccepted) {
      toast.error('Please accept the return policy');
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        items: items.map(item => {
          const productId = getProductId(item.product);
          console.log('Order Item - Product:', item.product.name, 'ProductId:', productId);
          
          if (!productId) {
            console.error('Missing productId for product:', item.product);
            throw new Error(`Product ${item.product.name} missing required ID`);
          }

          return {
            productId,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image,
            size: item.size,
            quantity: item.quantity,
          };
        }),
        shippingAddress: formData,
        paymentMethod,
      };

      // Razorpay payment
      await initiatePayment({
        amount: total,
        orderData,
        onSuccess: (orderId) => {
          clearCart();
          setStep(3);
          toast.success(`Order ${orderId} placed successfully! 🎉`);
        },
        onFailure: (error) => {
          console.error('Payment failed:', error);
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="font-serif text-3xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Add some items to checkout</p>
            <Link to="/shop" className="btn-primary inline-block">
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <Link to="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft size={18} />
              Back to Cart
            </Link>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                    }`}
                >
                  {step > s ? <Check size={18} /> : s}
                </div>
                <span className={`hidden sm:inline text-sm ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Address' : s === 2 ? 'Payment' : 'Confirmation'}
                </span>
                {s < 3 && <div className="w-12 h-0.5 bg-border" />}
              </div>
            ))}
          </div>

          {/* Step 1: Address */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl font-bold">Shipping Address</h2>
                {!isEditingAddress && (
                  <button
                    onClick={() => {
                      setFormData({
                        fullName: '',
                        phone: '',
                        email: user?.email || '',
                        address: '',
                        city: '',
                        state: '',
                        pincode: '',
                      });
                      setIsEditingAddress(true);
                      setPolicyAccepted(false);
                    }}
                    className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={16} />
                    Add New Address
                  </button>
                )}
              </div>

              {!isEditingAddress ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-primary rounded-lg p-6 relative">
                    <div className="absolute top-4 right-4">
                      {/* Radio indicator to show it's selected */}
                      <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    </div>

                    <div className="pr-12">
                      <h3 className="font-semibold text-lg mb-1">{formData.fullName}</h3>
                      <p className="text-muted-foreground mb-1">{formData.phone}</p>
                      <p className="text-muted-foreground mb-1">{formData.address}</p>
                      <p className="text-muted-foreground">
                        {formData.city}, {formData.state ? `${formData.state} - ` : ''}{formData.pincode}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-800 flex justify-end">
                      <button
                        onClick={() => setIsEditingAddress(true)}
                        className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Pencil size={14} />
                        Edit Address
                      </button>
                    </div>
                  </div>

                  {/* Return Policy Checkbox for Saved Address View */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-amber-600 mt-1 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Important Policy</h3>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                          <strong>No Returns | No Exchanges</strong> - All sales are final. Please review your order carefully before proceeding.
                        </p>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={policyAccepted}
                            onChange={(e) => setPolicyAccepted(e.target.checked)}
                            className="mt-1"
                          />
                          <span className="text-sm text-amber-800 dark:text-amber-200">
                            I understand and accept the no return/no exchange policy
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!policyAccepted) {
                        toast.error('Please accept the return policy');
                        return;
                      }
                      setStep(2);
                    }}
                    className="w-full btn-primary py-4 font-semibold"
                    disabled={!policyAccepted}
                  >
                    Continue to Payment
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddressSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Return Policy Checkbox */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-amber-600 mt-1 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Important Policy</h3>
                        <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                          <strong>No Returns | No Exchanges</strong> - All sales are final. Please review your order carefully before proceeding.
                        </p>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={policyAccepted}
                            onChange={(e) => setPolicyAccepted(e.target.checked)}
                            className="mt-1"
                            required
                          />
                          <span className="text-sm text-amber-800 dark:text-amber-200">
                            I understand and accept the no return/no exchange policy
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {savedAddress && (
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="flex-1 bg-secondary text-foreground py-4 rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 btn-primary py-4 font-semibold"
                      disabled={!policyAccepted}
                    >
                      Continue to Payment
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-2xl shadow-lg p-8">
                <h2 className="font-serif text-2xl font-bold mb-6">Payment Method</h2>

                <div className="space-y-4 mb-8">
                  <label
                    className="flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all border-primary bg-primary/5"
                  >
                    <input
                      type="radio"
                      value="razorpay"
                      checked={true}
                      readOnly
                      className="w-5 h-5"
                    />
                    <CreditCard className="text-primary" size={24} />
                    <div className="flex-1">
                      <div className="font-semibold">Online Payment (Razorpay)</div>
                      <div className="text-sm text-muted-foreground">
                        Pay securely with Card, UPI, Netbanking, or Wallet
                      </div>
                    </div>
                  </label>
                </div>

                {/* Order Summary */}
                <div className="bg-secondary rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-4">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({items.length} items)</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className={shipping === 0 ? 'text-green-600' : ''}>
                        {shipping === 0 ? 'FREE' : `₹${shipping}`}
                      </span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>₹{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-4 bg-secondary rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="flex-1 btn-primary py-4 font-semibold disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Pay Now'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="bg-card rounded-2xl shadow-lg p-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="text-green-600" size={40} />
                </div>
                <h2 className="font-serif text-3xl font-bold mb-4">Order Placed Successfully!</h2>
                <p className="text-muted-foreground mb-8">
                  Thank you for your purchase. You will receive a confirmation email shortly.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link to="/shop" className="btn-secondary px-8 py-3">
                    Continue Shopping
                  </Link>
                  <Link to="/" className="btn-primary px-8 py-3">
                    Go to Home
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={showAuthModal && !isAuthenticated}
        onClose={() => setShowAuthModal(false)}
      />

      <Footer />
    </div>
  );
}
