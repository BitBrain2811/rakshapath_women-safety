import axios from "axios";

const API_BASE = window.location.origin.includes("localhost:3000") ? "http://127.0.0.1:8000" : window.location.origin;

export const getSafetyScore = (lat, lon, hour) =>
  axios.get(`${API_BASE}/safety/score`, {
    params: { lat, lon, hour }
  });

export const getHeatmap = (lat, lon, hour) =>
  axios.get(`${API_BASE}/heatmap/area`, {
    params: { lat, lon, hour }
  });

export const sendOtp = (phoneNumber) =>
  axios.post(`${API_BASE}/auth/send-otp`, { phone_number: phoneNumber });

export const verifyOtp = (phoneNumber, otp) =>
  axios.post(`${API_BASE}/auth/verify-otp`, { phone_number: phoneNumber, otp: otp });

export const biometricLogin = (phoneNumber) =>
  axios.post(`${API_BASE}/auth/biometric-login`, { phone_number: phoneNumber });

export const getRoutes = (start, end, hour) =>
  axios.post(`${API_BASE}/route/safest`, { start, end, hour });

export const saveLastLocation = (phoneNumber, lat, lon) =>
  axios.post(`${API_BASE}/safety/last-location`, { phone_number: phoneNumber, lat, lon });

export const getLastLocation = (phoneNumber) =>
  axios.get(`${API_BASE}/safety/last-location`, { params: { phone_number: phoneNumber } });

export const triggerSosAlert = (phoneNumber, lat, lon, contacts) =>
  axios.post(`${API_BASE}/alerts/sos`, {
    phone_number: phoneNumber,
    latitude: lat,
    longitude: lon,
    contacts: contacts
  });