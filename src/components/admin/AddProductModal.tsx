import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product?: any;
}

export function AddProductModal({ isOpen, onClose, onSuccess, product }: AddProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        originalPrice: '',
        category: '',
        description: '',
        stock: '100',
        isNew: false,
        isBestseller: false,
        sizes: 'XS, S, M, L, XL',
    });

    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
    const [additionalImages, setAdditionalImages] = useState<File[]>([]);
    const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData({
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice || '',
                    category: product.category,
                    description: product.description,
                    stock: product.stock,
                    isNew: product.newArrival || product.isNew || false,
                    isBestseller: product.isBestseller || false,
                    sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes,
                });
                setMainImagePreview(product.image);
                setAdditionalImagePreviews(product.images || []);
            } else {
                setFormData({
                    name: '',
                    price: '',
                    originalPrice: '',
                    category: '',
                    description: '',
                    stock: '100',
                    isNew: false,
                    isBestseller: false,
                    sizes: 'XS, S, M, L, XL',
                });
                setMainImage(null);
                setMainImagePreview(null);
                setAdditionalImages([]);
                setAdditionalImagePreviews([]);
            }
        }
    }, [isOpen, product]);

    const mainImageInputRef = useRef<HTMLInputElement>(null);
    const additionalImagesInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setMainImage(file);
            setMainImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setAdditionalImages(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeAdditionalImage = (index: number) => {
        setAdditionalImages(prev => prev.filter((_, i) => i !== index));
        setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.name.trim()) {
            toast.error('Product name is required');
            return;
        }
        if (!formData.price || Number(formData.price) <= 0) {
            toast.error('Valid price is required');
            return;
        }
        if (!formData.category) {
            toast.error('Category is required');
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Product description is required');
            return;
        }
        if (!mainImage && !product) {
            toast.error('Please select a main image');
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, String(value));
            });

            if (mainImage) {
                data.append('image', mainImage);
            }

            additionalImages.forEach(file => {
                data.append('images', file);
            });

            // Log FormData contents
            console.log('FormData being sent:');
            for (const [key, value] of data.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}:`, value.name, `(${value.size} bytes)`);
                } else {
                    console.log(`  ${key}:`, value);
                }
            }

            if (product) {
                await api.put(`/products/${product.productId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Product updated successfully');
            } else {
                const response = await api.post('/products', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                console.log('Product created:', response.data);
                toast.success('Product created successfully');
            }

            onSuccess();
            onClose();

            // Reset form
            setFormData({
                name: '',
                price: '',
                originalPrice: '',
                category: '',
                description: '',
                stock: '100',
                isNew: false,
                isBestseller: false,
                sizes: 'XS, S, M, L, XL',
            });
            setMainImage(null);
            setMainImagePreview(null);
            setAdditionalImages([]);
            setAdditionalImagePreviews([]);

        } catch (error: any) {
            console.error('Create product error:', error);
            console.error('Error response:', error.response?.data);
            
            if (error.response?.data?.details) {
                const validationErrors = error.response.data.details.map((d: any) => 
                    `${d.field}: ${d.message}`
                ).join(', ');
                toast.error(`Validation failed: ${validationErrors}`);
            } else if (error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('Failed to create product');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl bg-background rounded-xl shadow-xl my-8 flex flex-col max-h-[90vh]"
            >
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold font-serif">{product ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Product Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="e.g. Red Silk Saree"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Price (₹)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Original Price (₹)</label>
                                        <input
                                            type="number"
                                            name="originalPrice"
                                            value={formData.originalPrice}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Sarees">Sarees</option>
                                        <option value="Lehengas">Lehengas</option>
                                        <option value="Salwar Kameez">Salwar Kameez</option>
                                        <option value="Kurtas">Kurtas</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Stock</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Main Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Main Image</label>
                                    <div
                                        onClick={() => mainImageInputRef.current?.click()}
                                        className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors min-h-[150px] bg-secondary/30"
                                    >
                                        {mainImagePreview ? (
                                            <div className="relative w-full h-40">
                                                <img src={mainImagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMainImage(null);
                                                        setMainImagePreview(null);
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="text-muted-foreground mb-2" size={24} />
                                                <span className="text-sm text-muted-foreground">Click to upload main image</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            ref={mainImageInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleMainImageChange}
                                        />
                                    </div>
                                </div>

                                {/* Additional Images */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Additional Images (Optional)</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {additionalImagePreviews.map((preview, index) => (
                                            <div key={index} className="relative aspect-square border border-border rounded-lg overflow-hidden group">
                                                <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeAdditionalImage(index)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => additionalImagesInputRef.current?.click()}
                                            className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                                        >
                                            <Plus className="text-muted-foreground" size={20} />
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={additionalImagesInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={handleAdditionalImagesChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                rows={4}
                                className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Detailed product description..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Sizes (comma separated)</label>
                            <input
                                type="text"
                                name="sizes"
                                value={formData.sizes}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="XS, S, M, L, XL"
                            />
                        </div>

                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isNew"
                                    checked={formData.isNew}
                                    onChange={handleCheckboxChange}
                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                />
                                <span className="text-sm font-medium">New Arrival</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isBestseller"
                                    checked={formData.isBestseller}
                                    onChange={handleCheckboxChange}
                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                />
                                <span className="text-sm font-medium">Bestseller</span>
                            </label>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-background rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg border border-border font-medium hover:bg-secondary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary px-8 py-2 disabled:opacity-50"
                    >
                        {loading ? (product ? 'Updating...' : 'Creating...') : (product ? 'Update Product' : 'Create Product')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
