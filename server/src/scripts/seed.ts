import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Accommodation } from '../models/Accommodation.js';
import { Report } from '../models/Report.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/safestay';

// Demo data
const users = [
  // Students
  {
    email: 'rahul@iiit.ac.in',
    password: 'Password123!',
    name: 'Rahul Kumar',
    phone: '+919876543210',
    role: 'student',
    college: 'IIIT Hyderabad',
    studentId: 'IIIT2023001',
    isVerified: true,
  },
  {
    email: 'priya@iitb.ac.in',
    password: 'Password123!',
    name: 'Priya Sharma',
    phone: '+919876543211',
    role: 'student',
    college: 'IIT Bombay',
    studentId: 'IITB2023002',
    isVerified: true,
  },
  {
    email: 'amit@vit.ac.in',
    password: 'Password123!',
    name: 'Amit Patel',
    phone: '+919876543212',
    role: 'student',
    college: 'VIT Vellore',
    studentId: 'VIT2023003',
    isVerified: true,
  },

  // Owners
  {
    email: 'owner1@example.com',
    password: 'Password123!',
    name: 'Rajesh Reddy',
    phone: '+919876543213',
    role: 'owner',
    isVerified: true,
    ownerVerification: {
      status: 'verified',
      verifiedAt: new Date(),
    },
  },
  {
    email: 'owner2@example.com',
    password: 'Password123!',
    name: 'Sunita Devi',
    phone: '+919876543214',
    role: 'owner',
    isVerified: true,
    ownerVerification: {
      status: 'verified',
      verifiedAt: new Date(),
    },
  },

  // Admin
  {
    email: 'admin@safestay.com',
    password: 'Admin123!',
    name: 'SafeStay Admin',
    phone: '+919876543215',
    role: 'admin',
    isVerified: true,
  },
];

const accommodations = [
  {
    name: 'Green Valley PG',
    type: 'pg',
    address: '123, Ameerpet Main Road',
    area: 'Ameerpet',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500016',
    location: { type: 'Point', coordinates: [78.3848, 17.4401] },
    ssi: 85,
    amenities: ['WiFi', 'AC', 'Laundry', 'Meals'],
    capacity: 50,
    currentOccupancy: 42,
    monthlyRent: 8000,
    contactPhone: '+919876543213',
    contactEmail: 'owner1@example.com',
    reportCount: 3,
    verifiedReportCount: 2,
  },
  {
    name: 'Sunshine Hostel',
    type: 'hostel',
    address: '456, Madhapur Road',
    area: 'Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    location: { type: 'Point', coordinates: [78.3983, 17.4933] },
    ssi: 45,
    amenities: ['WiFi', 'Meals'],
    capacity: 100,
    currentOccupancy: 85,
    monthlyRent: 6000,
    contactPhone: '+919876543214',
    contactEmail: 'owner2@example.com',
    reportCount: 8,
    verifiedReportCount: 6,
  },
  {
    name: 'City Lights Apartment',
    type: 'apartment',
    address: '789, Banjara Hills',
    area: 'Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
    location: { type: 'Point', coordinates: [78.4018, 17.4156] },
    ssi: 92,
    amenities: ['WiFi', 'AC', 'Gym', 'Parking'],
    capacity: 30,
    currentOccupancy: 25,
    monthlyRent: 15000,
    contactPhone: '+919876543213',
    contactEmail: 'owner1@example.com',
    reportCount: 1,
    verifiedReportCount: 1,
  },
  {
    name: 'Student Inn',
    type: 'pg',
    address: '321, Kukatpally',
    area: 'Kukatpally',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500072',
    location: { type: 'Point', coordinates: [78.3489, 17.4845] },
    ssi: 68,
    amenities: ['WiFi', 'Meals', 'Laundry'],
    capacity: 40,
    currentOccupancy: 35,
    monthlyRent: 7000,
    contactPhone: '+919876543214',
    contactEmail: 'owner2@example.com',
    reportCount: 5,
    verifiedReportCount: 4,
  },
  {
    name: 'Safe Stay Residency',
    type: 'pg',
    address: '654, Gachibowli',
    area: 'Gachibowli',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500032',
    location: { type: 'Point', coordinates: [78.3489, 17.4400] },
    ssi: 78,
    amenities: ['WiFi', 'AC', 'Meals'],
    capacity: 60,
    currentOccupancy: 52,
    monthlyRent: 9000,
    contactPhone: '+919876543213',
    contactEmail: 'owner1@example.com',
    reportCount: 4,
    verifiedReportCount: 3,
  },
  {
    name: 'Metro Hostel',
    type: 'hostel',
    address: '987, Dilsukhnagar',
    area: 'Dilsukhnagar',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500060',
    location: { type: 'Point', coordinates: [78.5244, 17.3686] },
    ssi: 35,
    amenities: ['WiFi'],
    capacity: 80,
    currentOccupancy: 70,
    monthlyRent: 5000,
    contactPhone: '+919876543214',
    contactEmail: 'owner2@example.com',
    reportCount: 10,
    verifiedReportCount: 8,
  },
  {
    name: 'Royal Residency',
    type: 'apartment',
    address: '456, Jubilee Hills',
    area: 'Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    location: { type: 'Point', coordinates: [78.4018, 17.4326] },
    ssi: 88,
    amenities: ['WiFi', 'AC', 'Gym', 'Parking', 'Security'],
    capacity: 20,
    currentOccupancy: 18,
    monthlyRent: 18000,
    contactPhone: '+919876543213',
    contactEmail: 'owner1@example.com',
    reportCount: 2,
    verifiedReportCount: 2,
  },
  {
    name: 'Budget PG',
    type: 'pg',
    address: '123, Uppal',
    area: 'Uppal',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500039',
    location: { type: 'Point', coordinates: [78.5510, 17.3970] },
    ssi: 55,
    amenities: ['WiFi', 'Meals'],
    capacity: 30,
    currentOccupancy: 28,
    monthlyRent: 4500,
    contactPhone: '+919876543214',
    contactEmail: 'owner2@example.com',
    reportCount: 6,
    verifiedReportCount: 5,
  },
  {
    name: 'Comfort Homes',
    type: 'pg',
    address: '789, Miyapur',
    area: 'Miyapur',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500049',
    location: { type: 'Point', coordinates: [78.3549, 17.5174] },
    ssi: 72,
    amenities: ['WiFi', 'AC', 'Meals', 'Laundry'],
    capacity: 45,
    currentOccupancy: 40,
    monthlyRent: 7500,
    contactPhone: '+919876543213',
    contactEmail: 'owner1@example.com',
    reportCount: 3,
    verifiedReportCount: 2,
  },
  {
    name: 'Elite Stay',
    type: 'apartment',
    address: '321, HITEC City',
    area: 'HITEC City',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    location: { type: 'Point', coordinates: [78.3898, 17.4933] },
    ssi: 95,
    amenities: ['WiFi', 'AC', 'Gym', 'Parking', 'Security', 'CCTV'],
    capacity: 25,
    currentOccupancy: 22,
    monthlyRent: 20000,
    contactPhone: '+919876543213',
    contactEmail: 'owner1@example.com',
    reportCount: 0,
    verifiedReportCount: 0,
  },
];

const reports = [
  // Green Valley PG reports
  {
    accommodationIndex: 0,
    userIndex: 0,
    category: 'fire_safety',
    severity: 7,
    title: 'Broken Fire Extinguisher',
    description: 'The fire extinguisher on the 2nd floor is expired and not functional. This is a serious safety hazard.',
    status: 'ai_verified',
    aiVerification: {
      consensus: 'accept',
      overallConfidence: 0.92,
    },
  },
  {
    accommodationIndex: 0,
    userIndex: 1,
    category: 'water_quality',
    severity: 5,
    title: 'Chlorine Smell in Water',
    description: 'The tap water has a strong chlorine smell. Might be over-chlorinated.',
    status: 'approved',
    aiVerification: {
      consensus: 'accept',
      overallConfidence: 0.88,
    },
  },
  {
    accommodationIndex: 0,
    userIndex: 2,
    category: 'hygiene',
    severity: 3,
    title: 'Common Area Cleanliness',
    description: 'The common area could be cleaned more frequently. Some dust accumulation.',
    status: 'resolved',
    aiVerification: {
      consensus: 'accept',
      overallConfidence: 0.85,
    },
    ownerResponse: {
      response: 'We have increased cleaning frequency to twice daily.',
      proofImages: [],
      respondedAt: new Date(),
    },
    studentVerification: {
      isResolved: true,
      feedback: 'Issue has been fixed. Area is much cleaner now.',
      verifiedAt: new Date(),
    },
  },

  // Sunshine Hostel reports
  {
    accommodationIndex: 1,
    userIndex: 0,
    category: 'security',
    severity: 9,
    title: 'Broken Main Gate Lock',
    description: 'The main gate lock has been broken for a week. Anyone can enter the premises.',
    status: 'ai_verified',
    aiVerification: {
      consensus: 'accept',
      overallConfidence: 0.95,
    },
  },
  {
    accommodationIndex: 1,
    userIndex: 1,
    category: 'electrical',
    severity: 8,
    title: 'Frequent Power Outages',
    description: 'Power goes out multiple times a day. The backup generator takes 10+ minutes to start.',
    status: 'approved',
    aiVerification: {
      consensus: 'accept',
      overallConfidence: 0.90,
    },
  },
  {
    accommodationIndex: 1,
    userIndex: 2,
    category: 'hygiene',
    severity: 7,
    title: 'Cockroach Infestation',
    description: 'Found cockroaches in the kitchen and dining area. Health hazard for residents.',
    status: 'pending',
  },
  {
    accommodationIndex: 1,
    userIndex: 0,
    category: 'food_safety',
    severity: 8,
    title: 'Food Quality Issues',
    description: 'The food served is often stale. Found expired ingredients in the kitchen.',
    status: 'rejected',
    aiVerification: {
      consensus: 'reject',
      overallConfidence: 0.35,
    },
  },

  // Metro Hostel reports
  {
    accommodationIndex: 5,
    userIndex: 0,
    category: 'structural',
    severity: 9,
    title: 'Cracks in Walls',
    description: 'Large cracks visible in the bathroom walls. Possible structural damage.',
    status: 'ai_verified',
    aiVerification: {
      consensus: 'accept',
      overallConfidence: 0.93,
    },
  },
  {
    accommodationIndex: 5,
    userIndex: 1,
    category: 'fire_safety',
    severity: 10,
    title: 'No Fire Exit',
    description: 'The building has no clearly marked fire exit. Emergency escape route blocked.',
    status: 'approved',
    aiVerification: {
      consensus: 'accept',
      overallConfidence: 0.98,
    },
  },
  {
    accommodationIndex: 5,
    userIndex: 2,
    category: 'water_quality',
    severity: 6,
    title: 'Low Water Pressure',
    description: 'Water pressure is very low during peak hours. Hard to take showers.',
    status: 'pending',
  },

  // More reports for various accommodations
  {
    accommodationIndex: 3,
    userIndex: 0,
    category: 'hygiene',
    severity: 4,
    title: 'Bathroom Cleaning',
    description: 'Bathrooms need more frequent deep cleaning.',
    status: 'ai_verified',
    aiVerification: {
      consensus: 'accept',
      overallConfidence: 0.87,
    },
  },
  {
    accommodationIndex: 4,
    userIndex: 1,
    category: 'security',
    severity: 5,
    title: 'CCTV Not Working',
    description: 'CCTV cameras in the parking area are not functional.',
    status: 'resolved',
    aiVerification: {
      consensus: 'accept',
      overallConfidence: 0.89,
    },
    ownerResponse: {
      response: 'CCTV cameras have been repaired and are now operational.',
      proofImages: [],
      respondedAt: new Date(),
    },
  },
  {
    accommodationIndex: 7,
    userIndex: 2,
    category: 'electrical',
    severity: 6,
    title: 'Faulty Wiring',
    description: 'Visible sparking from a socket in Room 12. Potential fire hazard.',
    status: 'pending',
  },
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Accommodation.deleteMany({});
    await Report.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create users
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create accommodations with owner references
    const ownerIds = [
      createdUsers[3]._id, // Rajesh Reddy
      createdUsers[4]._id, // Sunita Devi
    ];

    const accommodationDocs = accommodations.map((acc, index) => ({
      ...acc,
      ownerId: ownerIds[index % 2],
    }));

    const createdAccommodations = await Accommodation.create(accommodationDocs);
    console.log(`✅ Created ${createdAccommodations.length} accommodations`);

    // Create reports
    const reportDocs = reports.map((report) => ({
      accommodationId: createdAccommodations[report.accommodationIndex]._id,
      userId: createdUsers[report.userIndex]._id,
      category: report.category,
      severity: report.severity,
      title: report.title,
      description: report.description,
      status: report.status,
      aiVerification: report.aiVerification || undefined,
      ownerResponse: report.ownerResponse || undefined,
      studentVerification: report.studentVerification || undefined,
    }));

    const createdReports = await Report.create(reportDocs);
    console.log(`✅ Created ${createdReports.length} reports`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Accommodations: ${createdAccommodations.length}`);
    console.log(`   Reports: ${createdReports.length}`);

    console.log('\n🔑 Demo Accounts:');
    console.log('   Student: rahul@iiit.ac.in / Password123!');
    console.log('   Owner: owner1@example.com / Password123!');
    console.log('   Admin: admin@safestay.com / Admin123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
