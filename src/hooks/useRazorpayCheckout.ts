import { useAuth } from '@/contexts/AuthContext';
import { paymentService } from '@/services/paymentService';
import { orderService, CreateOrderData } from '@/services/orderService';
import { toast } from 'sonner';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface RazorpayCheckoutProps {
    amount: number;
    orderData: CreateOrderData;
    onSuccess: (orderId: string) => void;
    onFailure: (error: any) => void;
}

export const useRazorpayCheckout = () => {
    const { user } = useAuth();

    const initiatePayment = async ({ amount, orderData, onSuccess, onFailure }: RazorpayCheckoutProps) => {
        try {
            if (!user) {
                throw new Error('Please login to continue');
            }

            // Create Razorpay order
            const razorpayOrder = await paymentService.createRazorpayOrder(amount);

            const options = {
                key: razorpayOrder.keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'She Wear Collection',
                description: 'Purchase Order',
                order_id: razorpayOrder.orderId,
                prefill: {
                    name: orderData.shippingAddress.fullName,
                    email: orderData.shippingAddress.email || user.email || '',
                    contact: orderData.shippingAddress.phone,
                },
                theme: {
                    color: '#D946EF',
                },
                handler: async function (response: any) {
                    try {
                        // Verify payment
                        await paymentService.verifyPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        // Create order in database
                        const order = await orderService.createOrder({
                            ...orderData,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        toast.success('Payment successful! Order placed.');
                        onSuccess(order.order.orderId);
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        toast.error('Payment verification failed');
                        onFailure(error);
                    }
                },
                modal: {
                    ondismiss: function () {
                        toast.info('Payment cancelled');
                        onFailure(new Error('Payment cancelled by user'));
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Razorpay error:', error);
            toast.error('Failed to initiate payment');
            onFailure(error);
        }
    };

    return { initiatePayment };
};
