// SIMPLE VERSION - No MongoDB needed
const connectDB = async () => {
  console.log('✅ Using local storage (no MongoDB)');
  // Just return success - no actual connection
  return true;
};

module.exports = connectDB;