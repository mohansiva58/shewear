const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

// MongoDB Product Schema
const ProductSchema = new mongoose.Schema(
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
        isNew: { type: Boolean, default: false },
        isBestseller: { type: Boolean, default: false },
        stock: { type: Number, default: 100, min: 0 },
        cloudinaryId: { type: String },
    },
    { timestamps: true }
);

const Product = mongoose.model('Product', ProductSchema);

const products = [
    {
        productId: '1',
        name: 'Royal Red Silk Saree',
        price: 5499,
        originalPrice: 7999,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500',
        images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500',
            'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500',
            'https://images.unsplash.com/photo-1610030469946-78b5ee155c96?w=500',
        ],
        category: 'Sarees',
        sizes: ['Free Size'],
        description:
            'Exquisite red silk saree with intricate gold zari border. Handwoven by master craftsmen, this timeless piece features traditional motifs perfect for weddings and festive occasions.',
        rating: 4.9,
        reviews: 156,
        isNew: true,
        isBestseller: false,
        stock: 25,
    },
    {
        productId: '2',
        name: 'Blush Pink Bridal Lehenga',
        price: 12999,
        originalPrice: 18999,
        image: 'https://images.unsplash.com/photo-1583391733981-2ae01ba45e96?w=500',
        images: [
            'https://images.unsplash.com/photo-1583391733981-2ae01ba45e96?w=500',
            'https://images.unsplash.com/photo-1610030469940-3ce03a6c5bee?w=500',
            'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500',
        ],
        category: 'Lehengas',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description:
            'Stunning blush pink bridal lehenga with heavy silver embroidery and delicate sequin work. Comes with matching choli and dupatta. Perfect for your special day.',
        rating: 5.0,
        reviews: 89,
        isNew: false,
        isBestseller: true,
        stock: 15,
    },
    {
        productId: '3',
        name: 'Royal Blue Anarkali Suit',
        price: 4299,
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500',
        images: [
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500',
            'https://images.unsplash.com/photo-1610030470942-d90b9ddb2f3e?w=500',
            'https://images.unsplash.com/photo-1583391733981-0f18e9deb00d?w=500',
        ],
        category: 'Anarkali',
        sizes: ['S', 'M', 'L', 'XL'],
        description:
            'Gorgeous royal blue Anarkali suit with traditional gold embroidery. Features a flowing silhouette with intricate border work. Ideal for festivals and celebrations.',
        rating: 4.8,
        reviews: 124,
        isNew: false,
        isBestseller: false,
        stock: 30,
    },
    {
        productId: '4',
        name: 'Golden Banarasi Silk Saree',
        price: 8999,
        originalPrice: 11999,
        image: 'https://images.unsplash.com/photo-1610030469950-80e57e84aadd?w=500',
        images: [
            'https://images.unsplash.com/photo-1610030469950-80e57e84aadd?w=500',
            'https://images.unsplash.com/photo-1610030470952-0764f4e29e1e?w=500',
            'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500',
        ],
        category: 'Sarees',
        sizes: ['Free Size'],
        description:
            'Luxurious cream and gold Banarasi silk saree with traditional brocade work. A masterpiece of Indian weaving heritage, perfect for weddings and pujas.',
        rating: 4.9,
        reviews: 78,
        isNew: true,
        isBestseller: false,
        stock: 20,
    },
    {
        productId: '5',
        name: 'Magenta Sharara Set',
        price: 6799,
        image: 'https://images.unsplash.com/photo-1593560708940-55a319ae6d32?w=500',
        images: [
            'https://images.unsplash.com/photo-1593560708940-55a319ae6d32?w=500',
            'https://images.unsplash.com/photo-1610030469947-3f41c5eff4e9?w=500',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500',
        ],
        category: 'Sharara',
        sizes: ['XS', 'S', 'M', 'L'],
        description:
            'Elegant magenta pink sharara set with heavy gold zardozi embroidery. Features a stunning kurta with matching flared sharara and dupatta. Perfect for sangeet and mehendi.',
        rating: 4.7,
        reviews: 92,
        isNew: false,
        isBestseller: true,
        stock: 18,
    },
    {
        productId: '6',
        name: 'Mint Chikankari Palazzo Set',
        price: 3499,
        image: 'https://images.unsplash.com/photo-1583391733981-2ae01ba45e96?w=500',
        images: [
            'https://images.unsplash.com/photo-1583391733981-2ae01ba45e96?w=500',
            'https://images.unsplash.com/photo-1610030469940-3ce03a6c5bee?w=500',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500',
        ],
        category: 'Kurta Sets',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        description:
            'Elegant mint green palazzo kurta set with delicate Lucknowi chikankari embroidery. Perfect for casual ethnic wear and everyday elegance.',
        rating: 4.6,
        reviews: 145,
        isNew: false,
        isBestseller: false,
        stock: 35,
    },
];

const seedProducts = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in environment variables');
        }

        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        console.log('🗑️  Clearing existing products...');
        await Product.deleteMany({});
        console.log('✅ Cleared existing products\n');

        console.log('📦 Seeding products...');
        const createdProducts = await Product.insertMany(products);
        console.log(`✅ Successfully seeded ${createdProducts.length} products\n`);

        console.log('📊 Summary:');
        createdProducts.forEach((product) => {
            console.log(`   - ${product.name} (₹${product.price})`);
        });

        console.log('\n✨ Database seeding completed successfully!');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedProducts();
