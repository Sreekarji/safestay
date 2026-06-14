const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load .env from server root
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Accommodation = require('../models/Accommodation');

const OWNER = {
  name: 'Rajesh Kumar',
  email: 'owner@test.com',
  password: 'TestOwner123!',
  phone: '9876543210',
  role: 'owner',
  isVerified: true,
  ownerVerificationStatus: 'verified',
  propertyName: 'Kumar Residences',
  propertyCount: '2',
  businessAddress: '123 MG Road, Hyderabad, Telangana 500001',
};

const ACCOMMODATIONS = [
  {
    name: 'Kumar PG for Boys',
    address: '123 MG Road, Near Metro Station',
    city: 'Hyderabad',
    description:
      'A well-maintained paying guest accommodation for boys with modern amenities, 24/7 security, and homely food. Located close to IT hubs and public transport.',
    amenities: ['WiFi', 'Food', 'Laundry', 'AC', 'Power Backup', 'Security', 'Parking'],
    totalRooms: 30,
    occupiedRooms: 22,
    pricePerMonth: 8500,
    contactPhone: '9876543210',
    isVerified: true,
    trustScore: 85,
    trustScoreLabel: 'Safe',
    trustScoreColor: 'green',
    location: { type: 'Point', coordinates: [78.4867, 17.385] },
    latitude: 17.385,
    longitude: 78.4867,
  },
  {
    name: 'Kumar Ladies Hostel',
    address: '456 Banjara Hills Road No. 3',
    city: 'Hyderabad',
    description:
      'Premium hostel for working women and students with round-the-clock security, CCTV surveillance, and nutritious meals. Safe neighborhood with easy access to shopping and transit.',
    amenities: ['WiFi', 'Food', 'Laundry', 'AC', 'Power Backup', 'CCTV', 'Gym'],
    totalRooms: 20,
    occupiedRooms: 15,
    pricePerMonth: 10000,
    contactPhone: '9876543211',
    isVerified: true,
    trustScore: 92,
    trustScoreLabel: 'Safe',
    trustScoreColor: 'green',
    location: { type: 'Point', coordinates: [78.4018, 17.4156] },
    latitude: 17.4156,
    longitude: 78.4018,
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.\n');

    // --- Owner ---
    const existingOwner = await User.findOne({ email: OWNER.email });
    if (existingOwner) {
      console.log(`Owner "${OWNER.email}" already exists — skipping creation.`);
      var owner = existingOwner;
    } else {
      const hashedPassword = await bcrypt.hash(OWNER.password, 10);
      owner = await User.create({ ...OWNER, password: hashedPassword });
      console.log('Owner created:', owner.name, `(${owner.email})`);
    }

    // --- Accommodations ---
    for (const acc of ACCOMMODATIONS) {
      const exists = await Accommodation.findOne({ name: acc.name });
      if (exists) {
        console.log(`  Accommodation "${acc.name}" already exists — skipping.`);
        continue;
      }
      await Accommodation.create({ ...acc, owner: owner._id });
      console.log(`  Accommodation created: ${acc.name}`);
    }

    console.log('\n========================================');
    console.log('  LOGIN CREDENTIALS');
    console.log('========================================');
    console.log(`  Email    : ${OWNER.email}`);
    console.log(`  Password : ${OWNER.password}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
