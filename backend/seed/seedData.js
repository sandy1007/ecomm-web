require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('../models/Product');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce';

// DEVELOPMENT ONLY — never run this script in production.
// Change these credentials immediately after seeding.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@ecomm.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

const users = [
  { name: 'Admin User', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' },
  { name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'user' },
  { name: 'Jane Smith', email: 'jane@example.com', password: 'password123', role: 'user' },
];

const products = [
  // Electronics
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'The most powerful Galaxy smartphone with a built-in S Pen, 200MP camera, and Snapdragon 8 Gen 3 processor.',
    price: 134999,
    discountPrice: 119999,
    category: 'Electronics',
    brand: 'Samsung',
    stock: 50,
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500'],
    specifications: [
      { key: 'Display', value: '6.8" Dynamic AMOLED 2X' },
      { key: 'RAM', value: '12GB' },
      { key: 'Storage', value: '256GB' },
      { key: 'Battery', value: '5000 mAh' },
    ],
    tags: ['smartphone', '5G', 'android'],
    featured: true,
  },
  {
    name: 'Apple iPhone 15 Pro',
    description: 'iPhone 15 Pro features a titanium design, A17 Pro chip, 48MP main camera system.',
    price: 134900,
    discountPrice: 124900,
    category: 'Electronics',
    brand: 'Apple',
    stock: 40,
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500'],
    specifications: [
      { key: 'Display', value: '6.1" Super Retina XDR' },
      { key: 'Chip', value: 'A17 Pro' },
      { key: 'Storage', value: '256GB' },
      { key: 'Camera', value: '48MP Main' },
    ],
    tags: ['smartphone', 'ios', 'apple'],
    featured: true,
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling with 30-hour battery life and premium audio quality.',
    price: 29990,
    discountPrice: 24990,
    category: 'Electronics',
    brand: 'Sony',
    stock: 80,
    images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500'],
    specifications: [
      { key: 'Driver Size', value: '30mm' },
      { key: 'Battery Life', value: '30 hours' },
      { key: 'Connectivity', value: 'Bluetooth 5.2' },
      { key: 'Weight', value: '250g' },
    ],
    tags: ['headphones', 'noise canceling', 'wireless'],
    featured: true,
  },
  {
    name: 'Dell XPS 15 Laptop',
    description: '15.6" OLED laptop with Intel Core i7-13700H, 32GB RAM, and 1TB SSD. Perfect for creators.',
    price: 189990,
    discountPrice: 174990,
    category: 'Electronics',
    brand: 'Dell',
    stock: 25,
    images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500'],
    specifications: [
      { key: 'Processor', value: 'Intel Core i7-13700H' },
      { key: 'RAM', value: '32GB DDR5' },
      { key: 'Storage', value: '1TB NVMe SSD' },
      { key: 'Display', value: '15.6" OLED 3.5K' },
    ],
    tags: ['laptop', 'creator', 'intel'],
    featured: false,
  },
  {
    name: 'LG 55" 4K OLED Smart TV',
    description: 'Perfect blacks with Dolby Vision, Dolby Atmos, and WebOS smart platform.',
    price: 129990,
    discountPrice: 99990,
    category: 'Electronics',
    brand: 'LG',
    stock: 15,
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=500'],
    specifications: [
      { key: 'Screen Size', value: '55 inches' },
      { key: 'Resolution', value: '4K UHD' },
      { key: 'Panel', value: 'OLED' },
      { key: 'Smart TV', value: 'WebOS' },
    ],
    tags: ['TV', '4K', 'OLED', 'smart tv'],
    featured: true,
  },

  // Clothing
  {
    name: "Levi's 501 Original Jeans",
    description: "The original blue jean since 1873. Straight fit with button fly. Made from 100% cotton denim.",
    price: 4499,
    discountPrice: 3499,
    category: 'Clothing',
    brand: "Levi's",
    stock: 200,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'],
    specifications: [
      { key: 'Material', value: '100% Cotton' },
      { key: 'Fit', value: 'Straight' },
      { key: 'Closure', value: 'Button Fly' },
      { key: 'Rise', value: 'High Rise' },
    ],
    tags: ['jeans', 'denim', 'casual'],
    featured: false,
  },
  {
    name: 'Nike Air Force 1 Sneakers',
    description: "Iconic low-top sneaker with Air cushioning. The legend lives on with the timeless silhouette.",
    price: 7495,
    discountPrice: 6495,
    category: 'Clothing',
    brand: 'Nike',
    stock: 150,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
    specifications: [
      { key: 'Upper', value: 'Leather' },
      { key: 'Sole', value: 'Rubber' },
      { key: 'Closure', value: 'Lace-up' },
      { key: 'Type', value: 'Low-top' },
    ],
    tags: ['sneakers', 'shoes', 'casual', 'nike'],
    featured: true,
  },
  {
    name: 'Allen Solly Formal Shirt',
    description: 'Premium cotton slim fit formal shirt. Perfect for office and formal occasions.',
    price: 1999,
    discountPrice: 1499,
    category: 'Clothing',
    brand: 'Allen Solly',
    stock: 300,
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500'],
    specifications: [
      { key: 'Material', value: '100% Cotton' },
      { key: 'Fit', value: 'Slim Fit' },
      { key: 'Occasion', value: 'Formal' },
      { key: 'Care', value: 'Machine Washable' },
    ],
    tags: ['shirt', 'formal', 'cotton'],
    featured: false,
  },

  // Home & Kitchen
  {
    name: 'Instant Pot Duo 7-in-1',
    description: '7-in-1 electric pressure cooker. Pressure cook, slow cook, rice cooker, steamer, sauté pan, yogurt maker & warmer.',
    price: 8999,
    discountPrice: 6999,
    category: 'Home & Kitchen',
    brand: 'Instant Pot',
    stock: 60,
    images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=500'],
    specifications: [
      { key: 'Capacity', value: '6 Quart' },
      { key: 'Functions', value: '7-in-1' },
      { key: 'Power', value: '1000W' },
      { key: 'Material', value: 'Stainless Steel' },
    ],
    tags: ['kitchen', 'cooker', 'appliance'],
    featured: true,
  },
  {
    name: 'Dyson V12 Detect Slim Vacuum',
    description: 'The most powerful Dyson cordless vacuum with laser dust detection and LCD screen.',
    price: 54900,
    discountPrice: 47900,
    category: 'Home & Kitchen',
    brand: 'Dyson',
    stock: 30,
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
    specifications: [
      { key: 'Suction', value: '150 AW' },
      { key: 'Battery', value: '60 min' },
      { key: 'Weight', value: '2.2 kg' },
      { key: 'Bin Volume', value: '0.35L' },
    ],
    tags: ['vacuum', 'cordless', 'cleaning'],
    featured: false,
  },
  {
    name: 'Philips Air Fryer XXL',
    description: 'Extra large capacity air fryer with Fat Removal Technology. Fry, bake, grill & roast.',
    price: 13995,
    discountPrice: 11995,
    category: 'Home & Kitchen',
    brand: 'Philips',
    stock: 45,
    images: ['https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=500'],
    specifications: [
      { key: 'Capacity', value: '7.3L' },
      { key: 'Power', value: '2225W' },
      { key: 'Temperature', value: '80-200°C' },
      { key: 'Timer', value: 'Up to 60 min' },
    ],
    tags: ['air fryer', 'kitchen', 'healthy cooking'],
    featured: true,
  },

  // Sports
  {
    name: 'Yonex Astrox 88D Pro Badminton Racket',
    description: 'Professional attack-type badminton racket. Used by top international players worldwide.',
    price: 8990,
    discountPrice: 7490,
    category: 'Sports',
    brand: 'Yonex',
    stock: 70,
    images: ['https://images.unsplash.com/photo-1617083934555-b2f7ad0c90e3?w=500'],
    specifications: [
      { key: 'Weight', value: '88g' },
      { key: 'Flex', value: 'Stiff' },
      { key: 'Frame', value: 'HM Graphite' },
      { key: 'Balance', value: 'Head Heavy' },
    ],
    tags: ['badminton', 'racket', 'sports'],
    featured: false,
  },
  {
    name: 'Decathlon Kiprun Running Shoes',
    description: 'Cushioned running shoes for road running. Lightweight with EVA midsole for maximum comfort.',
    price: 3999,
    discountPrice: 2999,
    category: 'Sports',
    brand: 'Decathlon',
    stock: 120,
    images: ['https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500'],
    specifications: [
      { key: 'Upper', value: 'Mesh' },
      { key: 'Midsole', value: 'EVA Foam' },
      { key: 'Weight', value: '280g' },
      { key: 'Drop', value: '10mm' },
    ],
    tags: ['running', 'shoes', 'fitness'],
    featured: false,
  },

  // Books
  {
    name: 'Atomic Habits by James Clear',
    description: "A revolutionary system for building good habits and breaking bad ones. #1 New York Times Bestseller.",
    price: 699,
    discountPrice: 499,
    category: 'Books',
    brand: 'Penguin',
    stock: 500,
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
    specifications: [
      { key: 'Author', value: 'James Clear' },
      { key: 'Pages', value: '320' },
      { key: 'Language', value: 'English' },
      { key: 'Publisher', value: 'Penguin Random House' },
    ],
    tags: ['self-help', 'habits', 'productivity', 'bestseller'],
    featured: true,
  },
  {
    name: 'The Alchemist by Paulo Coelho',
    description: "A fable about following your dreams. One of the best-selling books in history with 65 million copies sold.",
    price: 399,
    discountPrice: 299,
    category: 'Books',
    brand: 'HarperCollins',
    stock: 600,
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500'],
    specifications: [
      { key: 'Author', value: 'Paulo Coelho' },
      { key: 'Pages', value: '208' },
      { key: 'Language', value: 'English' },
      { key: 'Publisher', value: 'HarperCollins' },
    ],
    tags: ['fiction', 'philosophy', 'novel', 'bestseller'],
    featured: false,
  },
  {
    name: 'Clean Code by Robert C. Martin',
    description: "A handbook of agile software craftsmanship. Essential reading for every software developer.",
    price: 2499,
    discountPrice: 1999,
    category: 'Books',
    brand: 'Prentice Hall',
    stock: 200,
    images: ['https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=500'],
    specifications: [
      { key: 'Author', value: 'Robert C. Martin' },
      { key: 'Pages', value: '431' },
      { key: 'Language', value: 'English' },
      { key: 'Publisher', value: 'Prentice Hall' },
    ],
    tags: ['programming', 'software', 'coding', 'technical'],
    featured: true,
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany();
    await Product.deleteMany();

    const hashedUsers = await Promise.all(
      users.map(async (u) => ({ ...u, password: await bcrypt.hash(u.password, 12) }))
    );
    await User.insertMany(hashedUsers);
    console.log(`✅ Seeded ${users.length} users`);

    await Product.insertMany(products);
    console.log(`✅ Seeded ${products.length} products`);

    console.log('\n📧 Admin credentials: admin@ecomm.com / admin123');
    console.log('📧 User credentials:  john@example.com / password123\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedDB();
