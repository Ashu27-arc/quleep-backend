const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://aarushrathore28_db_user:lghUpDxwtQObUgc1@cluster0.r8rew84.mongodb.net/3d_object_studio';

async function checkDb() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const Model3D = mongoose.model('Model3D', new mongoose.Schema({}, { strict: false }));
  const models = await Model3D.find().sort({ createdAt: -1 }).limit(3);
  console.log(JSON.stringify(models, null, 2));
  
  process.exit(0);
}

checkDb();
