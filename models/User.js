const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

// Define the User Schema
const userSchema = new mongoose.Schema({
    fullname: {
    type: String,
    required: false,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/, 'Please fill a valid email address'],
  },
  usertype: {
    type: String,
    default: 'user',
  },
  skills: {
    type: [String],
    default: [],
  },
  bio: {
    type: String,
    trim: true,
    maxLength: 500,
  },
  projects: [
    {
      title: { type: String, required: true },
      description: { type: String, default: '' },
      link: { type: String, default: '' }, // Optional project link
    },
  ],
  profilePicture: {
    type: String, // URL to profile image
    default: 'default-profile-pic.jpg',
  },
  website: {
    type: String,
    trim: true,
  },
  socialLinks: {
    facebook: { type: String, trim: true },
    twitter: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    instagram: { type: String, trim: true },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add passport-local-mongoose plugin to the schema
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', userSchema);
