const connectDB = async (): Promise<void> => {
  try {
    const mongoose = await import('mongoose');
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Fix Windows DNS SRV resolution issue by using Google DNS
    const dns = await import('dns');
    dns.default.setServers(['8.8.8.8', '8.8.4.4']);

    const conn = await mongoose.default.connect(mongoURI);
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
