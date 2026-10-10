const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/warehouse_tracker';

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PackageSchema = new mongoose.Schema({
  packageId: { type: String, default: () => Math.random().toString(36).substr(2, 9).toUpperCase() },
  description: String,
  sender: String,
  receiver: String,
  location: String,
  status: { type: String, default: 'received' },
  date: { type: Date, default: Date.now },
  mobile: String,
  weight: String,
  notes: String
});

const Package = mongoose.model('Package', PackageSchema);

// Routes
app.get('/api/packages', async (req, res) => {
  try {
    const packages = await Package.find().sort({ date: -1 });
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/packages', async (req, res) => {
  try {
    // Ensure required fields have values
    const packageData = {
      ...req.body,
      status: req.body.status || 'received',
      date: req.body.date || new Date()
    };

    console.log('Received package data:', packageData);
    const pkg = new Package(packageData);
    await pkg.save();
    console.log('Package saved successfully:', pkg);
    res.json(pkg);
  } catch (err) {
    console.error('Error saving package:', err);
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/packages/:id', async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(pkg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/packages/:id', async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
