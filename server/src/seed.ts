import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { createClient } from 'redis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Product from './models/Product';
import { connectRedis, getRedisClient, disconnectRedis } from './config/redis';

const products = [
    {
        productId: '1',
        name: 'Hyderabadi Red Khada Dupatta',
        price: 15499,
        originalPrice: 18999,
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500',
        images: [
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500',
            'https://images.unsplash.com/photo-1610186594416-2c7c0131d8c9?w=500',
            'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500',
        ],
        category: 'Khada Dupatta',
        sizes: ['Free Size'],
        description:
            'A quintessential Hyderabadi bridal ensemble...',
        rating: 4.9,
        reviews: 156,
        isNew: true,
        isBestseller: true,
        stock: 25,
    },
    {
        productId: '2',
        name: 'Nizami Pink Zardozi Lehenga',
        price: 22999,
        originalPrice: 28999,
        image: 'https://images.unsplash.com/photo-1594736797933-d0e501ba2fe8?w=500',
        images: [
            'https://images.unsplash.com/photo-1594736797933-d0e501ba2fe8?w=500',
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500',
            'https://images.unsplash.com/photo-1610030469946-78b5ee155c96?w=500',
        ],
        category: 'Lehengas',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description:
            'Step into elegance with this breathtaking Nizami Pink Lehenga...',
        rating: 5.0,
        reviews: 89,
        isNew: false,
        isBestseller: true,
        stock: 15,
    },
    {
        productId: '3',
        name: 'Royal Blue Velvet Anarkali',
        price: 8299,
        image: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=500',
        images: [
            'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=500',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500',
            'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500',
        ],
        category: 'Anarkali',
        sizes: ['S', 'M', 'L', 'XL'],
        description:
            'This Royal Blue Velvet Anarkali suit...',
        rating: 4.8,
        reviews: 124,
        isNew: false,
        isBestseller: false,
        stock: 30,
    },
    {
        productId: '4',
        name: 'Hyderabadi Gold Tissue Saree',
        price: 12999,
        originalPrice: 15999,
        image: 'https://images.unsplash.com/photo-1610030469950-80e57e84aadd?w=500',
        images: [
            'https://images.unsplash.com/photo-1610030469950-80e57e84aadd?w=500',
            'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500',
            'https://images.unsplash.com/photo-1594736797933-d0e501ba2fe8?w=500',
        ],
        category: 'Sarees',
        sizes: ['Free Size'],
        description:
            'A symbol of timeless grace...',
        rating: 4.9,
        reviews: 78,
        isNew: true,
        isBestseller: false,
        stock: 20,
    },
    {
        productId: '5',
        name: 'Magenta Silk Sharara Set',
        price: 9799,
        image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500',
        images: [
            'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500',
            'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=500',
            'https://images.unsplash.com/photo-1594736797933-d0e501ba2fe8?w=500',
        ],
        category: 'Sharara',
        sizes: ['XS', 'S', 'M', 'L'],
        description:
            'Radiate vibrancy with this Magenta Silk Sharara set...',
        rating: 4.7,
        reviews: 92,
        isNew: false,
        isBestseller: true,
        stock: 18,
    },
    {
        productId: '6',
        name: 'Mint Green Lancha Set',
        price: 6499,
        image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500',
        images: [
            'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500',
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500',
        ],
        category: 'Lancha',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        description:
            'Embrace a fresh and youthful look...',
        rating: 4.6,
        reviews: 145,
        isNew: false,
        isBestseller: false,
        stock: 35,
    },
    {
        productId: '7',
        name: 'Pearl White Hyderabadi Salwar',
        price: 4999,
        image: 'https://images.unsplash.com/photo-1594736797933-d0e501ba2fe8?w=500',
        images: [
            'https://images.unsplash.com/photo-1594736797933-d0e501ba2fe8?w=500',
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500',
            'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=500',
        ],
        category: 'Salwar Kameez',
        sizes: ['S', 'M', 'L', 'XL'],
        description:
            'Inspired by the City of Pearls...',
        rating: 4.5,
        reviews: 62,
        isNew: true,
        isBestseller: false,
        stock: 40,
    },
    {
        productId: '8',
        name: 'Emerald Green Gharara Set',
        price: 11499,
        image: 'https://images.unsplash.com/photo-1610186594416-2c7c0131d8c9?w=500',
        images: [
            'https://images.unsplash.com/photo-1610186594416-2c7c0131d8c9?w=500',
            'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500',
            'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500',
        ],
        category: 'Gharara',
        sizes: ['XS', 'S', 'M', 'L'],
        description:
            'Make a bold statement with this Emerald Green Gharara Set...',
        rating: 4.8,
        reviews: 54,
        isNew: true,
        isBestseller: true,
        stock: 12,
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

        // Clear Redis Cache
        try {
            console.log('🔄 Connecting to Redis...');
            await connectRedis();
            const redis = getRedisClient();
            console.log('🗑️  Clearing Redis cache...');
            await redis.flushAll();
            console.log('✅ Cleared Redis cache\n');
            await disconnectRedis();
        } catch (redisError: any) {
            console.warn('⚠️  Redis cache clearing failed (optional):', redisError.message);
        }

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
