const mongoose = require('mongoose');

// Mock in-memory database store
global.isMongoOffline = false;
global.mockStore = {};
global.mockModels = {};

const makeMockQuery = (result) => {
  const query = {
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
    exec: () => Promise.resolve(result)
  };
  const proxy = new Proxy(query, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        return () => proxy;
      }
      return target[prop];
    }
  });
  return proxy;
};

class MockModel {
  constructor(modelName) {
    this.modelName = modelName;
    if (!global.mockStore[modelName]) {
      global.mockStore[modelName] = [];
    }
  }

  get data() {
    return global.mockStore[this.modelName];
  }

  _match(item, query) {
    if (!query) return true;
    for (const key in query) {
      const val = query[key];
      if (val && typeof val === 'object') {
        if ('$in' in val) {
          if (!val.$in.includes(item[key])) return false;
        } else if ('$nin' in val) {
          if (val.$nin.includes(item[key])) return false;
        }
      } else {
        if (String(item[key]) !== String(val)) return false;
      }
    }
    return true;
  }
}

// Override exec on Query prototype
const originalExec = mongoose.Query.prototype.exec;
mongoose.Query.prototype.exec = function(op, cb) {
  if (global.isMongoOffline) {
    const modelName = this.model.modelName;
    const opType = this.op;
    const query = this.getQuery();
    const update = this.getUpdate();
    const options = this.getOptions();

    if (!global.mockStore[modelName]) global.mockStore[modelName] = [];
    const data = global.mockStore[modelName];

    const match = (item) => {
      if (!query) return true;
      for (const key in query) {
        const val = query[key];
        if (val && typeof val === 'object') {
          if ('$in' in val) {
            const list = val.$in.map(String);
            if (!list.includes(String(item[key]))) return false;
          } else if ('$nin' in val) {
            const list = val.$nin.map(String);
            if (list.includes(String(item[key]))) return false;
          }
        } else {
          if (String(item[key]) !== String(val)) return false;
        }
      }
      return true;
    };

    let result;
    if (opType === 'find') {
      result = data.filter(match);
      if (this._mongooseOptions.populate) {
        for (const popKey in this._mongooseOptions.populate) {
          const pop = this._mongooseOptions.populate[popKey];
          const path = pop.path;
          result = result.map(item => {
            if (item[path]) {
              const refModel = path === 'role' ? 'Role' : (path === 'user' ? 'User' : '');
              if (refModel && global.mockStore[refModel]) {
                const refItem = global.mockStore[refModel].find(r => String(r._id) === String(item[path]));
                return { ...item, [path]: refItem || item[path] };
              }
            }
            return item;
          });
        }
      }
    } else if (opType === 'findOne') {
      result = data.find(match) || null;
      if (result && this._mongooseOptions.populate) {
        for (const popKey in this._mongooseOptions.populate) {
          const pop = this._mongooseOptions.populate[popKey];
          const path = pop.path;
          if (result[path]) {
            const refModel = path === 'role' ? 'Role' : (path === 'user' ? 'User' : '');
            if (refModel && global.mockStore[refModel]) {
              const refItem = global.mockStore[refModel].find(r => String(r._id) === String(result[path]));
              result = { ...result, [path]: refItem || result[path] };
            }
          }
        }
      }
    } else if (opType === 'countDocuments' || opType === 'count') {
      result = data.filter(match).length;
    } else if (opType === 'findOneAndUpdate' || opType === 'findByIdAndUpdate') {
      const idx = data.findIndex(match);
      if (idx !== -1) {
        const setVal = update.$set || update;
        result = { ...data[idx], ...setVal, updatedAt: new Date() };
        data[idx] = result;
      } else {
        result = null;
      }
    } else if (opType === 'deleteOne' || opType === 'findOneAndDelete') {
      const idx = data.findIndex(match);
      if (idx !== -1) {
        result = data[idx];
        data.splice(idx, 1);
      } else {
        result = null;
      }
    } else if (opType === 'deleteMany') {
      let count = 0;
      for (let i = data.length - 1; i >= 0; i--) {
        if (match(data[i])) {
          data.splice(i, 1);
          count++;
        }
      }
      result = { deletedCount: count };
    } else {
      result = null;
    }

    if (cb) cb(null, result);
    return Promise.resolve(result);
  }
  return originalExec.apply(this, arguments);
};

// Override save on Model prototype
const originalSave = mongoose.Model.prototype.save;
mongoose.Model.prototype.save = function(options, cb) {
  if (global.isMongoOffline) {
    const modelName = this.constructor.modelName;
    if (!global.mockStore[modelName]) global.mockStore[modelName] = [];
    const data = global.mockStore[modelName];

    let doc = typeof this.toObject === 'function' ? this.toObject() : this;
    if (!doc._id) {
      doc._id = new mongoose.Types.ObjectId().toString();
    }
    const idx = data.findIndex(item => String(item._id) === String(doc._id));
    if (idx !== -1) {
      data[idx] = { ...data[idx], ...doc, updatedAt: new Date() };
      doc = data[idx];
    } else {
      doc.createdAt = new Date();
      doc.updatedAt = new Date();
      data.push(doc);
    }

    this._id = doc._id;
    this.createdAt = doc.createdAt;
    this.updatedAt = doc.updatedAt;

    if (cb) cb(null, this);
    return Promise.resolve(this);
  }
  return originalSave.apply(this, arguments);
};

// Override static Model.create
const originalCreate = mongoose.Model.create;
mongoose.Model.create = function(doc, options) {
  if (global.isMongoOffline) {
    const modelName = this.modelName;
    if (!global.mockStore[modelName]) global.mockStore[modelName] = [];
    const data = global.mockStore[modelName];

    const makeDocObj = (d) => {
      let plain = d;
      if (d && typeof d.toObject === 'function') {
        plain = d.toObject();
      }
      const newDoc = {
        _id: plain._id || new mongoose.Types.ObjectId().toString(),
        createdAt: plain.createdAt || new Date(),
        updatedAt: plain.updatedAt || new Date(),
        ...plain
      };
      newDoc.save = function() { return Promise.resolve(this); };
      newDoc.toObject = function() { return this; };
      return newDoc;
    };

    if (Array.isArray(doc)) {
      const docs = doc.map(makeDocObj);
      data.push(...docs);
      return Promise.resolve(docs);
    } else {
      const newDoc = makeDocObj(doc);
      data.push(newDoc);
      return Promise.resolve(newDoc);
    }
  }
  return originalCreate.apply(this, arguments);
};

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/interviewai';
  
  const options = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000 // fail fast if whitelisted/blocked
  };

  try {
    await mongoose.connect(mongoURI, options);
    console.log('MongoDB Connected Successfully.');
    
    // Seed initial roles and default admin user
    await seedDatabase();
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    console.log('Database connection failed. Falling back to local in-memory database mode.');
    global.isMongoOffline = true;
    await seedDatabase();
  }
};

const seedDatabase = async () => {
  try {
    const Role = mongoose.model('Role');
    const User = mongoose.model('User');
    const bcrypt = require('bcryptjs');

    // 1. Seed Roles
    const rolesToSeed = ['admin', 'candidate'];
    for (const roleName of rolesToSeed) {
      const exists = await Role.findOne({ name: roleName });
      if (!exists) {
        await Role.create({ name: roleName, description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role` });
        console.log(`Role seeded: ${roleName}`);
      }
    }

    // 2. Seed Admin User
    const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@interviewai.com').toLowerCase().trim();
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPass123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminRole = await Role.findOne({ name: 'admin' });
    if (adminRole) {
      let adminUser = await User.findOne({ email: adminEmail });
      if (!adminUser) {
        await User.create({
          name: process.env.DEFAULT_ADMIN_NAME || 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          role: adminRole._id,
          status: 'active',
          isVerified: true,
          skills: ['Management', 'System Architecture'],
          experience: 5
        });
        console.log(`Default admin user seeded: ${adminEmail}`);
      } else {
        adminUser.password = hashedPassword;
        adminUser.status = 'active';
        adminUser.isVerified = true;
        await adminUser.save();
        console.log(`Default admin user credentials updated & activated: ${adminEmail}`);
      }
    }

    // 3. Seed Candidate User
    const candidateEmail = 'candidate@interviewai.com';
    const candidateRole = await Role.findOne({ name: 'candidate' });
    if (candidateRole) {
      let candidateUser = await User.findOne({ email: candidateEmail });
      const candidateHashedPass = await bcrypt.hash('CandidatePass123!', salt);
      if (!candidateUser) {
        await User.create({
          name: 'Demo Candidate',
          email: candidateEmail,
          password: candidateHashedPass,
          role: candidateRole._id,
          status: 'active',
          isVerified: true,
          skills: ['JavaScript', 'Angular', 'Node.js'],
          experience: 3
        });
        console.log(`Default candidate user seeded: ${candidateEmail}`);
      } else {
        candidateUser.password = candidateHashedPass;
        candidateUser.status = 'active';
        candidateUser.isVerified = true;
        await candidateUser.save();
      }
    }
  } catch (err) {
    console.error(`Database seeding failed: ${err.message}`);
  }
};

module.exports = connectDB;
