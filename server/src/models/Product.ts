import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    productId: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    images: string[];
    category: string;
    sizes: string[];
    description: string;
    rating: number;
    reviews: number;
    newArrival: boolean;
    isBestseller: boolean;
    stock: number;
    cloudinaryId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        productId: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, min: 0 },
        image: { type: String, required: true },
        images: [{ type: String }],
        category: { type: String, required: true, index: true },
        sizes: [{ type: String, required: true }],
        description: { type: String, required: true },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviews: { type: Number, default: 0, min: 0 },
        newArrival: { type: Boolean, default: false },
        isBestseller: { type: Boolean, default: false },
        stock: { type: Number, default: 100, min: 0 },
        cloudinaryId: { type: String },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ newArrival: 1, isBestseller: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<IProduct>('Product', ProductSchema);
