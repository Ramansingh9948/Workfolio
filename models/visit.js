const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  totalVisits: { type: Number, default: 0 }, // Total number of visits
  uniqueVisitors: { type: Number, default: 0 }, // Number of unique IP addresses
  visitors: { type: [String], default: [] }, // List of unique visitor IPs
});

module.exports = mongoose.model("Visit", visitSchema);
