import { useEffect, useState } from "react";
import { CircleMarker, Tooltip } from "react-leaflet";
import MapView from "./components/MapView";
import HeatmapLayer from "./components/HeatmapLayer";
import SafetyPanel from "./components/SafetyPanel";
import Legend from "./components/Legend";
import Auth from "./pages/Auth";
import { getSafetyScore, getHeatmap, getRoutes, saveLastLocation, getLastLocation } from "./services/api";
import { stateHelplines, detectStateFromCoordinates } from "./data/indian_states_helplines";
import { translations } from "./data/translations";

// Hindi instruction mapping for voice/text translation
const instructionTranslations = {
  "Start from your current location.": "अपनी वर्तमान स्थिति से शुरू करें।",
  "Turn right onto Guard Street (highly active & well-lit).": "गार्ड स्ट्रीट पर दाएं मुड़ें, यह रास्ता सुरक्षित और अच्छी रोशनी वाला है।",
  "Pass the local security checkpoint.": "स्थानीय सुरक्षा जांच चौकी को पार करें।",
  "Continue onto Safe Boulevard.": "सुरक्षित बुलेवार्ड पर सीधे आगे बढ़ें।",
  "Arrive at destination safely.": "सुरक्षित रूप से अपने गंतव्य पर पहुंचे।",
  "Head north along Commercial Row.": "कमर्शियल रो के साथ उत्तर दिशा में आगे बढ़ें।",
  "Turn left onto Second Avenue.": "दूसरे चौराहे से बाएं मुड़ें।",
  "Follow Bypass Road.": "बायपास मार्ग का अनुसरण करें।",
  "Arrive at destination.": "अपने गंतव्य स्थान पर पहुंचे।",
  "Enter shortcut alleyway (Caution: Poor illumination).": "शॉर्टकट पतली गली में प्रवेश करें, कृपया सावधान रहें यहां रोशनी कम है।",
  "Proceed through heavily congested underpass.": "भीड़भाड़ वाले अंडरपास सुरंग मार्ग से आगे बढ़ें।"
};

const trafficTranslations = {
  "Clear (Fast Flow)": { en: "Clear (Fast Flow)", hi: "साफ रास्ता (तेज गति)" },
  "Moderate Traffic": { en: "Moderate Traffic", hi: "सामान्य भीड़" },
  "Heavy Congestion / Unlit Alleyway": { en: "Heavy Traffic / Unlit Alley", hi: "भारी भीड़ / अंधेरी गली" }
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user_token'));
  const [userPhone, setUserPhone] = useState(localStorage.getItem('user_phone') || '');
  const [emergencyPhone, setEmergencyPhone] = useState(localStorage.getItem('user_emergency') || '911 (Police)');
  const [safety, setSafety] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [hour, setHour] = useState(new Date().getHours());
  const [userLocation, setUserLocation] = useState(null);
  
  // Accessibility & Localization States
  const [lang, setLang] = useState(localStorage.getItem('user_lang') || "en"); // "en" or "hi"
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Security & Permissions States
  const [permissionsGranted, setPermissionsGranted] = useState(!!localStorage.getItem('permissions_granted'));

  // 🗺️ Map Engine style provider state
  const [mapStyle, setMapStyle] = useState("mapbox");

  // 🔋 Technical & Battery Optimization States
  const [trackingMode, setTrackingMode] = useState("eco"); // "high", "balanced", "eco"
  const [syncInterval, setSyncInterval] = useState("eco-interval"); // "realtime", "standard", "eco-interval"

  // Routing States
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  
  // Navigation Simulation States
  const [isNavigating, setIsNavigating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [navStepIndex, setNavStepIndex] = useState(0);

  // SOS States
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosCountdown, setSOSCountdown] = useState(5);
  const [sosActive, setSOSActive] = useState(false);

  // 📍 Phone Off & Last Location Tracking States
  const [isDeviceOff, setIsDeviceOff] = useState(false);
  const [bgTracking, setBgTracking] = useState(true);
  const [lastKnownLoc, setLastKnownLoc] = useState(null);

  // 📞 Sidebar & Contacts Navigation States
  const [activeTab, setActiveTab] = useState("route"); // "route", "safety", "contacts", "vault"
  const [personalContacts, setPersonalContacts] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [detectedState, setDetectedState] = useState("Delhi");
  const [selectedState, setSelectedState] = useState("Delhi");
  
  // Simulated Add Personal Contact Form States
  const [newContactName, setNewContactName] = useState("");
  const [newContactRelation, setNewContactRelation] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  // Simulated Call & SMS Modals States
  const [activeSimulatedCall, setActiveSimulatedCall] = useState(null); // { name, number }
  const [activeSimulatedSMS, setActiveSimulatedSMS] = useState(null); // { name, number, message }
  const [callDuration, setCallDuration] = useState(0);

  // ⌚ Smartwatch Simulation States
  const [showWatchSim, setShowWatchSim] = useState(false);
  const [watchLTEMode, setWatchLTEMode] = useState(false);
  const [watchVibrating, setWatchVibrating] = useState(false);

  const defaultLat = 26.7606;
  const defaultLon = 83.3731;

  // Shortcut Translation Query
  const t = translations[lang] || translations["en"];

  // Preset Destination Hotspots in Gorakhpur for quick testing
  const presetDestinations = [
    { name: "Gorakhpur Jn Railway Station", lat: 26.7584, lon: 83.3768 },
    { name: "Gorakhnath Temple", lat: 26.7865, lon: 83.3512 },
    { name: "Golghar Central Market", lat: 26.7592, lon: 83.3705 },
    { name: "GIDA Industrial Area Bypass", lat: 26.7212, lon: 83.2555 },
    { name: "Ramgarh Tal Lake Boulevard", lat: 26.7385, lon: 83.4024 }
  ];

  // Load last known location & personal contacts on startup
  useEffect(() => {
    const savedLoc = localStorage.getItem('last_known_location');
    if (savedLoc) {
      try { setLastKnownLoc(JSON.parse(savedLoc)); } catch (e) {}
    }

    const savedContacts = localStorage.getItem('personal_contacts');
    if (savedContacts) {
      try {
        setPersonalContacts(JSON.parse(savedContacts));
      } catch (e) {}
    } else {
      const defaults = [
        { name: "Mom", relation: "Family", phone: "+91 98765 43210" },
        { name: "Dad", relation: "Family", phone: "+91 98765 43211" }
      ];
      setPersonalContacts(defaults);
      localStorage.setItem('personal_contacts', JSON.stringify(defaults));
    }
  }, []);

  /* 🔵 REAL-TIME GPS TRACKING (LIVE LOCATION) */
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!navigator.geolocation) return;
    if (isDeviceOff) return; // Stop tracking when device is simulated OFF

    // Set initial location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isNavigating) {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        }
      },
      (err) => console.error("Initial position error:", err),
      { enableHighAccuracy: true }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isNavigating) {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        }
      },
      (err) => console.error("Location watch error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isLoggedIn, isNavigating, isDeviceOff]);

  /* 🌍 AUTO-DETECT INDIAN STATE FROM USER COORDINATES */
  useEffect(() => {
    if (userLocation) {
      const state = detectStateFromCoordinates(userLocation.lat, userLocation.lon);
      setDetectedState(state);
      setSelectedState(state);
    }
  }, [userLocation]);

  /* 🔁 AUTO SAFETY & HEATMAP UPDATE */
  useEffect(() => {
    if (!isLoggedIn) return;
    if (isDeviceOff) return; // Freeze safety updates on power off

    const lat = userLocation?.lat || defaultLat;
    const lon = userLocation?.lon || defaultLon;

    getSafetyScore(lat, lon, hour)
      .then((res) => setSafety(res.data))
      .catch(() => setSafety(null));

    getHeatmap(lat, lon, hour)
      .then((res) => setHeatmap(res.data.points || []))
      .catch(() => setHeatmap([]));
  }, [hour, userLocation, isLoggedIn, isDeviceOff]);

  /* 📍 SECURE LOCATION PERSISTENCE EFFECT */
  useEffect(() => {
    if (isLoggedIn && userPhone && userLocation && !isDeviceOff) {
      const locData = {
        lat: userLocation.lat,
        lon: userLocation.lon,
        timestamp: new Date().toLocaleTimeString()
      };
      
      localStorage.setItem('last_known_location', JSON.stringify(locData));
      setLastKnownLoc(locData);

      saveLastLocation(userPhone, userLocation.lat, userLocation.lon)
        .catch((err) => console.error("Could not sync last location with cloud server:", err));
    }
  }, [userLocation, isLoggedIn, userPhone, isDeviceOff]);

  /* 🚨 ALERT FOR UNSAFE AREAS & DYNAMIC AUDIO CAUTION */
  useEffect(() => {
    if (!isLoggedIn) return;
    if (safety && safety.safety_score < 40 && !isNavigating && !isDeviceOff) {
      console.warn("⚠️ Unsafe area detected. Please be cautious. Safety Score:", safety.safety_score);
      const msg = lang === "hi"
        ? `सावधान: इस क्षेत्र का सुरक्षा स्कोर कम है, यह मात्र ${safety.safety_score} है। कृपया सतर्क रहें।`
        : `Caution: entering a low safety area. Safety score is ${safety.safety_score}. Please be alert.`;
      speakInstruction(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safety, isLoggedIn, isNavigating, isDeviceOff, lang]);

  /* 🗺️ MAP CLICK HANDLER (SET DESTINATION) */
  const handleMapClick = (lat, lon) => {
    if (isNavigating || isDeviceOff) return; // Prevent changing route while navigating or offline
    
    const clickDest = { lat: parseFloat(lat.toFixed(6)), lon: parseFloat(lon.toFixed(6)) };
    setDestination(clickDest);
    triggerRouteCalculation(userLocation || { lat: defaultLat, lon: defaultLon }, clickDest);
  };

  /* 🚗 PRESET HOTSPOT CHANGE */
  const handlePresetChange = (e) => {
    const val = e.target.value;
    if (!val) {
      setDestination(null);
      setRoutes([]);
      return;
    }
    const selectedPreset = presetDestinations[val];
    setDestination({ lat: selectedPreset.lat, lon: selectedPreset.lon });
    triggerRouteCalculation(userLocation || { lat: defaultLat, lon: defaultLon }, selectedPreset);
  };

  /* 🧠 CALL ROUTING API */
  const triggerRouteCalculation = (start, end) => {
    getRoutes(start, end, hour)
      .then((res) => {
        setRoutes(res.data.all_routes || [res.data.safest_route]);
        setSelectedRouteIndex(0);
      })
      .catch((err) => {
        console.error("Failed to load routes from backend:", err);
      });
  };

  /* ⚡ SIMULATE DEVICE POWER OFF / SWITCH OFF */
  const toggleDevicePower = async () => {
    if (!isDeviceOff) {
      setIsDeviceOff(true);
      exitNavigation();
      setDestination(null);
      setRoutes([]);
      
      try {
        const res = await getLastLocation(userPhone);
        if (res.data && res.data.last_location) {
          setLastKnownLoc({
            lat: res.data.last_location.lat,
            lon: res.data.last_location.lon,
            timestamp: res.data.last_location.timestamp
          });
        }
      } catch (err) {
        console.warn("Using local backup:", err);
      }
      
      const voiceMsg = lang === "hi"
        ? "डिवाइस ऑफलाइन हो गया है। आपका अंतिम सुरक्षित स्थान आपके आपातकालीन संपर्कों के साथ साझा कर दिया गया है।"
        : "Device has gone offline. Your last tracked secure coordinates have been shared with your emergency contacts.";
      speakInstruction(voiceMsg);
      alert(`${t.offlineProtection}!\n\n${t.cloudDispatched} ${emergencyPhone}`);
    } else {
      setIsDeviceOff(false);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        });
      }
    }
  };

  /* ⏱️ SOS COUNTDOWN TIMER EFFECT */
  useEffect(() => {
    let timer = null;
    if (showSOSModal && sosCountdown > 0 && !sosActive) {
      timer = setTimeout(() => {
        setSOSCountdown((prev) => prev - 1);
      }, 1000);
    } else if (showSOSModal && sosCountdown === 0 && !sosActive) {
      setSOSActive(true);
    }
    return () => clearTimeout(timer);
  }, [showSOSModal, sosCountdown, sosActive]);

  /* 🔊 EMERGENCY AUDIO GUIDANCE ON ACTIVE SOS */
  useEffect(() => {
    if (sosActive) {
      const msg = lang === "hi"
        ? "आपातकालीन अलर्ट सक्रिय कर दिया गया है। आपकी लाइव स्थिति पुलिस और आपके आपातकालीन संपर्कों को भेज दी गई है। कृपया शांत रहें और किसी सुरक्षित सार्वजनिक स्थान पर जाएं।"
        : "Emergency alert activated. Your live position has been dispatched to the police and your emergency contacts. Please stay calm and move to a safe public space.";
      speakInstruction(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sosActive, lang]);

  /* 🚨 TRIGGER SOS BROADCAST */
  const triggerSOS = () => {
    if (isDeviceOff) {
      alert("Cannot trigger SOS. Device powered off.");
      return;
    }
    setSOSCountdown(5);
    setSOSActive(false);
    setShowSOSModal(true);
  };

  const cancelSOS = () => {
    setShowSOSModal(false);
    setSOSActive(false);
    setSOSCountdown(5);
  };

  /* 🚗 AUTO-START ROUTE NAVIGATION */
  const startRoute = () => {
    if (routes.length === 0) return;
    setIsNavigating(true);
    setSimulating(true);
    setNavStepIndex(0);
    
    const selectedRoute = routes[selectedRouteIndex];
    if (selectedRoute && selectedRoute.coordinates.length > 0) {
      const startCoord = selectedRoute.coordinates[0];
      setUserLocation({ lat: startCoord[0], lon: startCoord[1] });
    }
  };

  /* 🏃‍♂️ MOVEMENT SIMULATION ENGINE */
  useEffect(() => {
    let simInterval = null;
    if (isNavigating && simulating && routes[selectedRouteIndex]) {
      const activeRoute = routes[selectedRouteIndex];
      
      simInterval = setInterval(() => {
        setNavStepIndex((prevIndex) => {
          if (prevIndex >= activeRoute.coordinates.length - 1) {
            clearInterval(simInterval);
            setSimulating(false);
            setTimeout(() => {
              alert("🎉 Arrival Success!");
              exitNavigation();
            }, 500);
            return prevIndex;
          }
          const nextIndex = prevIndex + 1;
          const nextCoord = activeRoute.coordinates[nextIndex];
          setUserLocation({ lat: nextCoord[0], lon: nextCoord[1] });
          return nextIndex;
        });
      }, 2000);
    }

    return () => clearInterval(simInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNavigating, simulating, routes, selectedRouteIndex]);

  const exitNavigation = () => {
    setIsNavigating(false);
    setSimulating(false);
    setNavStepIndex(0);
    
    if (!isDeviceOff && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      });
    }
  };

  // Helper variables for turn-by-turn HUD
  const activeRoute = routes[selectedRouteIndex];
  let currentInstruction = "";
  if (isNavigating && activeRoute && activeRoute.coordinates.length > 0) {
    const totalSteps = activeRoute.coordinates.length;
    const totalInstructions = activeRoute.instructions.length;
    const instIndex = Math.min(
      totalInstructions - 1,
      Math.floor((navStepIndex / totalSteps) * totalInstructions)
    );
    currentInstruction = activeRoute.instructions[instIndex];
  }

  /* 🗣️ SPEAK VOICE GUIDANCE IN ENGLISH OR HINDI */
  const speakInstruction = (text) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel(); // Cancel previous speech
    
    // Check if Hindi voice is preferred
    const spokenText = lang === "hi" ? (instructionTranslations[text] || text) : text;
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
    
    // Fetch and assign voices
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang));
    if (voice) {
      utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Auto-speak turns as they update during active simulation
  useEffect(() => {
    if (isNavigating && voiceEnabled && currentInstruction) {
      speakInstruction(currentInstruction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInstruction, isNavigating, voiceEnabled]);

  /* 👤 ADD EMERGENCY CONTACT */
  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) {
      alert("Required!");
      return;
    }
    const contact = {
      name: newContactName,
      relation: newContactRelation || "Friend",
      phone: newContactPhone
    };
    const updated = [...personalContacts, contact];
    setPersonalContacts(updated);
    localStorage.setItem('personal_contacts', JSON.stringify(updated));
    setNewContactName("");
    setNewContactRelation("");
    setNewContactPhone("");
  };

  /* ❌ DELETE PERSONAL CONTACT */
  const handleDeleteContact = (index) => {
    const updated = personalContacts.filter((_, idx) => idx !== index);
    setPersonalContacts(updated);
    localStorage.setItem('personal_contacts', JSON.stringify(updated));
  };

  /* 📞 CALL SIMULATOR CONTROLS & DYNAMIC AUDIO ANNOUNCEMENT */
  const startSimulatedCall = (name, number) => {
    if (isDeviceOff) {
      alert("Device Offline");
      return;
    }
    const callMsg = lang === "hi"
      ? `${name} को आपातकालीन कॉल की जा रही है।`
      : `Initiating emergency call to ${name}.`;
    speakInstruction(callMsg);
    setActiveSimulatedCall({ name, number });
    setCallDuration(0);
  };

  useEffect(() => {
    let callTimer = null;
    if (activeSimulatedCall) {
      callTimer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(callTimer);
  }, [activeSimulatedCall]);

  const endSimulatedCall = () => {
    setActiveSimulatedCall(null);
    setCallDuration(0);
  };

  /* 💬 SMS SIMULATOR CONTROLS */
  const sendSimulatedSMS = (name, number) => {
    if (isDeviceOff) {
      alert("Offline");
      return;
    }
    const lat = userLocation?.lat || defaultLat;
    const lon = userLocation?.lon || defaultLon;
    const msg = `🚨 [RAKSHAPATH ALERT] - HELP! I feel unsafe at this coordinates: https://maps.google.com/?q=${lat},${lon}. Please track/contact me immediately!`;
    
    setActiveSimulatedSMS({ name, number, message: msg });
    setTimeout(() => {
      setActiveSimulatedSMS(null);
    }, 4500);
  };

  /* ⌚ SMARTWATCH SOS ACTIONS */
  const triggerWatchSOS = () => {
    if (isDeviceOff && !watchLTEMode) {
      alert("Device Offline.");
      return;
    }

    setWatchVibrating(true);
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    setTimeout(() => {
      setWatchVibrating(false);
    }, 4000);

    if (watchLTEMode) {
      const lat = userLocation?.lat || defaultLat;
      const lon = userLocation?.lon || defaultLon;
      
      saveLastLocation(userPhone, lat, lon)
        .then(() => {
          alert(`⌚ Watch LTE SOS Broadcast Active!\n\nWatch coordinates: ${lat.toFixed(5)}, ${lon.toFixed(5)}\nDispatched SMS alert to: ${emergencyPhone}`);
        })
        .catch((err) => console.error(err));
    } else {
      triggerSOS();
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setUserPhone(localStorage.getItem('user_phone') || '');
    setEmergencyPhone(localStorage.getItem('user_emergency') || '911 (Police)');
    setPermissionsGranted(!!localStorage.getItem('permissions_granted'));
  };

  const grantPermissions = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
          localStorage.setItem('permissions_granted', 'true');
          setPermissionsGranted(true);
        },
        (err) => {
          console.warn("Location prompt denied/failed, using defaults:", err);
          localStorage.setItem('permissions_granted', 'true');
          setPermissionsGranted(true);
        }
      );
    } else {
      localStorage.setItem('permissions_granted', 'true');
      setPermissionsGranted(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_phone');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_emergency');
    localStorage.removeItem('permissions_granted');
    setPermissionsGranted(false);
    setIsLoggedIn(false);
    setUserPhone('');
    setDestination(null);
    setRoutes([]);
    exitNavigation();
  };

  // Format Call duration string
  const formatCallTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentHelplineData = stateHelplines[selectedState] || stateHelplines["Delhi"];

  if (!isLoggedIn) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* 1. Header */}
      <header className="app-header">
        <h2 className="brand-title">
          {t.brandName}
        </h2>

        {/* Top Horizontal Navbar */}
        {!isNavigating && !isDeviceOff && (
          <nav className="header-nav">
            <button 
              onClick={() => setActiveTab("route")} 
              className={`nav-link ${activeTab === "route" ? "active" : ""}`}
            >
              {t.routePlanner}
            </button>
            <button 
              onClick={() => setActiveTab("safety")} 
              className={`nav-link ${activeTab === "safety" ? "active" : ""}`}
            >
              {t.safetyAnalytics}
            </button>
            <button 
              onClick={() => setActiveTab("contacts")} 
              className={`nav-link ${activeTab === "contacts" ? "active" : ""}`}
            >
              {t.emergencyHub}
            </button>
            <button 
              onClick={() => setActiveTab("vault")} 
              className={`nav-link ${activeTab === "vault" ? "active" : ""}`}
            >
              {t.powerVault}
            </button>
            <button 
              onClick={() => setActiveTab("guide")} 
              className={`nav-link ${activeTab === "guide" ? "active" : ""}`}
            >
              {t.helpGuide}
            </button>
          </nav>
        )}

        {/* Accessibility & Options Area */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 🌐 Language Switcher */}
          <button 
            onClick={() => {
              const nextLang = lang === "en" ? "hi" : "en";
              setLang(nextLang);
              localStorage.setItem('user_lang', nextLang);
            }} 
            className="btn-watch-sim-toggle"
            style={{ fontSize: "12px", border: "1px solid rgba(255,255,255,0.15)", textTransform: "uppercase" }}
            title="Switch Language"
          >
            🌐 {lang === "en" ? "Hindi (हिन्दी)" : "English"}
          </button>

          {/* ⌚ Smartwatch Simulator Button */}
          <button 
            onClick={() => setShowWatchSim(!showWatchSim)} 
            className={`btn-watch-sim-toggle ${showWatchSim ? "active" : ""}`}
            title="Open Watch Simulator"
          >
            ⌚ {t.watchSim}
          </button>
          
          <div className="user-badge">
            <span className="user-phone">👤 {userPhone}</span>
            <button onClick={handleLogout} className="btn-logout">
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Body */}
      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Active Navigation Panel during navigation */}
          {isNavigating && !isDeviceOff && (
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🧭</span>
                <h3 style={{ margin: 0 }}>{t.activeNav}</h3>
              </div>
              <p style={{ margin: 0, fontSize: 14 }}>
                {t.selectedRoute}: <b>{activeRoute?.name}</b>
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, background: "rgba(255,255,255,0.03)", padding: 10, borderRadius: 8 }}>
                <span>{t.risk}: <b style={{ color: activeRoute?.color }}>{activeRoute?.risk_level}</b></span>
                <span>{t.timeRemaining}: <b>{activeRoute?.duration_mins} mins</b></span>
              </div>
              
              <div style={{ marginTop: 10 }}>
                <label className="form-label" style={{ marginBottom: 5, display: "block" }}>{t.progress}</label>
                <div className="nav-progress-bar">
                  <div
                    className="nav-progress-fill"
                    style={{
                      width: `${((navStepIndex + 1) / activeRoute?.coordinates.length) * 100}%`,
                    }}
                  ></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                  <span>Start</span>
                  <span>Step {navStepIndex + 1} of {activeRoute?.coordinates.length}</span>
                  <span>Arrived</span>
                </div>
              </div>

              {/* Voice Guidance Readout Toggle */}
              <div className="toggle-switch-container" style={{ margin: "5px 0" }}>
                <span className="switch-label">🔊 {t.voiceGuidance}</span>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={voiceEnabled} 
                    onChange={(e) => setVoiceEnabled(e.target.checked)} 
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="nav-controls" style={{ marginTop: 10 }}>
                {simulating ? (
                  <button
                    onClick={() => setSimulating(false)}
                    className="btn-nav-action btn-nav-pause"
                  >
                    {t.pauseSim}
                  </button>
                ) : (
                  <button
                    onClick={() => setSimulating(true)}
                    className="btn-nav-action btn-nav-play"
                  >
                    {t.resumeSim}
                  </button>
                )}
                <button
                  onClick={exitNavigation}
                  className="btn-nav-action btn-nav-cancel"
                >
                  {t.stopRoute}
                </button>
              </div>
            </div>
          )}

          {/* Device Power Off Simulated Alert (Always visible if device is simulated OFF) */}
          {isDeviceOff && (
            <div className="offline-card-alert">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="pulse-dot-red"></span>
                <span style={{ fontWeight: 800, color: "#ff1744", fontSize: "14px" }}>{t.signalLost}</span>
              </div>
              <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.8)" }}>
                {t.cloudDispatched} <b>{emergencyPhone}</b>.
              </p>
              <div style={{ background: "rgba(0,0,0,0.25)", padding: 10, borderRadius: 8, fontSize: "11px", fontFamily: "monospace" }}>
                <div>{t.lastSynced}:</div>
                <div>Lat: {lastKnownLoc?.lat?.toFixed(5) || defaultLat}</div>
                <div>Lon: {lastKnownLoc?.lon?.toFixed(5) || defaultLon}</div>
                <div style={{ marginTop: 4, color: "#ff1744" }}>Timestamp: {lastKnownLoc?.timestamp || "Just now"}</div>
              </div>
            </div>
          )}

          {/* Page-wise Panels (Only rendered when device is ON and not actively navigating) */}
          {!isNavigating && !isDeviceOff && (
            <>
              {/* PAGE 1: ROUTE PLANNER */}
              {activeTab === "route" && (
                <>
                  <div className="glass-card">
                    <h3>{t.selectDest}</h3>
                    <div className="form-group" style={{ marginBottom: 15 }}>
                      <label className="form-label">Gorakhpur Hotspots Dropdown</label>
                      <select onChange={handlePresetChange} className="select-input" style={{ fontSize: "16px", padding: "14px 12px" }}>
                        <option value="">-- Choose Preset Destination --</option>
                        {presetDestinations.map((preset, idx) => (
                          <option key={idx} value={idx}>
                            {preset.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 15 }}>
                      <label className="form-label">🗺️ Map Provider / Style</label>
                      <select 
                        value={mapStyle} 
                        onChange={(e) => setMapStyle(e.target.value)} 
                        className="select-input" 
                        style={{ fontSize: "15px", padding: "10px" }}
                      >
                        <option value="mapbox">🗺️ Mapbox Dark Theme</option>
                        <option value="google">🌍 Google Maps Hybrid</option>
                        <option value="osm">🗺️ Leaflet OpenStreetMap</option>
                      </select>
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                      {t.clickMapHint}
                    </div>
                  </div>

                  {routes.length > 0 && (
                    <div className="glass-card">
                      <h3>{t.suggestedRoutes}</h3>
                      <div className="route-list">
                        {routes.map((route, idx) => {
                          const isSelected = idx === selectedRouteIndex;
                          const badgeClass = route.risk_level === "LOW" ? "badge-low" : route.risk_level === "MEDIUM" ? "badge-medium" : "badge-high";
                          
                          // Localized route name mappings with visual safety color coding
                          let routeDisplayName = route.name;
                          if (lang === "hi") {
                            if (route.name.includes("Safest")) routeDisplayName = "🟢 सबसे सुरक्षित मार्ग";
                            else if (route.name.includes("Alternative")) routeDisplayName = "🟡 वैकल्पिक मार्ग";
                            else routeDisplayName = "🔴 सबसे छोटा मार्ग (भीड़भाड़)";
                          } else {
                            if (route.name.includes("Safest")) routeDisplayName = "🟢 Safest Route (Recommended)";
                            else if (route.name.includes("Alternative")) routeDisplayName = "🟡 Alternative Route";
                            else routeDisplayName = "🔴 Shortest Path (High Risk)";
                          }

                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedRouteIndex(idx)}
                              className={`route-item ${isSelected ? "selected" : ""}`}
                              style={{ padding: "16px" }}
                            >
                              <div
                                className="route-badge-color"
                                style={{ backgroundColor: route.color }}
                              ></div>
                              <div className="route-header">
                                <span className="route-name" style={{ fontSize: "15px" }}>{routeDisplayName}</span>
                                <span className="route-time" style={{ color: route.color, fontSize: "16px" }}>
                                  {route.duration_mins}m
                                </span>
                              </div>
                              <div className="route-details" style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                                <span className={`safety-score-pill ${badgeClass}`} style={{ fontSize: "11px", padding: "4px 8px" }}>
                                  🛡️ {lang === 'hi' ? 'सुरक्षा' : 'Score'}: {route.safety_score}
                                </span>
                                <span style={{ fontWeight: "800", fontSize: "12px", color: route.color }}>
                                  {route.risk_level === "LOW" 
                                    ? (lang === 'hi' ? '🟢 सुरक्षित' : '🟢 SAFE') 
                                    : route.risk_level === "MEDIUM" 
                                      ? (lang === 'hi' ? '🟡 मध्यम चेतावनी' : '🟡 MODERATE') 
                                      : (lang === 'hi' ? '🔴 खतरा / असुरक्षित' : '🔴 HIGH RISK')
                                  }
                                </span>
                                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
                                  {trafficTranslations[route.traffic]?.[lang] || route.traffic}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={startRoute}
                        className="btn-primary"
                        style={{ marginTop: 20, padding: "18px", fontSize: "18px" }} // Accessible Large Button
                      >
                        {t.startRoute}
                      </button>
                    </div>
                  )}

                  <Legend lang={lang} />
                </>
              )}

              {/* PAGE 2: SAFETY ANALYTICS */}
              {activeTab === "safety" && (
                <>
                  <div className="glass-card">
                    <h3>{t.timeOfDay}</h3>
                    <div className="form-group" style={{ marginBottom: 15 }}>
                      <label className="form-label">{t.timeOfDay}</label>
                      <select
                        value={hour}
                        onChange={(e) => setHour(Number(e.target.value))}
                        className="select-input"
                        style={{ fontSize: "16px", padding: "12px" }}
                      >
                        <option value={10}>{t.dayTime} (10 AM)</option>
                        <option value={22}>{t.nightTime} (10 PM)</option>
                      </select>
                    </div>
                    <SafetyPanel data={safety} lang={lang} />
                  </div>
                  <Legend lang={lang} />
                </>
              )}

              {/* PAGE 3: EMERGENCY HUB */}
              {activeTab === "contacts" && (
                <>
                  <div className="glass-card">
                    <h3>{t.personalContacts}</h3>
                    <div className="contacts-section-title">{t.trustedCircle}</div>
                    <div className="personal-contacts-list">
                      {personalContacts.map((contact, idx) => (
                        <div key={idx} className="personal-contact-card" style={{ padding: "14px 16px" }}>
                          <div className="contact-info-left">
                            <div className="contact-name-txt" style={{ fontSize: "14px" }}>{contact.name} ({contact.relation})</div>
                            <div className="contact-phone-txt" style={{ fontSize: "12px" }}>{contact.phone}</div>
                          </div>
                          <div className="contact-actions-right">
                            <button 
                              onClick={() => startSimulatedCall(contact.name, contact.phone)} 
                              className="btn-contact-action"
                              title="Simulate Call"
                              style={{ width: "36px", height: "36px", fontSize: "16px" }}
                            >
                              📞
                            </button>
                            <button 
                              onClick={() => sendSimulatedSMS(contact.name, contact.phone)} 
                              className="btn-contact-action"
                              title="Simulate SMS Location"
                              style={{ width: "36px", height: "36px", fontSize: "16px" }}
                            >
                              💬
                            </button>
                            <button 
                              onClick={() => handleDeleteContact(idx)} 
                              className="btn-contact-action delete"
                              title="Delete"
                              style={{ width: "36px", height: "36px", fontSize: "16px" }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddContact} className="add-contact-form">
                      <div className="contact-row-inputs">
                        <input 
                          type="text" 
                          placeholder={t.name} 
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          className="mini-input"
                          style={{ padding: "10px", fontSize: "13px" }}
                          required
                        />
                        <input 
                          type="text" 
                          placeholder={t.relation} 
                          value={newContactRelation}
                          onChange={(e) => setNewContactRelation(e.target.value)}
                          className="mini-input"
                          style={{ padding: "10px", fontSize: "13px" }}
                        />
                      </div>
                      <input 
                        type="tel" 
                        placeholder={t.phone} 
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        className="mini-input"
                        style={{ width: "100%", padding: "10px", fontSize: "13px" }}
                        required
                      />
                      <button type="submit" className="btn-add-contact" style={{ padding: "12px", fontSize: "14px" }}>
                        {t.addContact}
                      </button>
                    </form>
                  </div>

                  <div className="glass-card">
                    <h3>{t.govHelplines}</h3>
                    <div style={{ background: "rgba(0,176,255,0.1)", border: "1px solid rgba(0,176,255,0.2)", borderRadius: 10, padding: "8px 12px", fontSize: "12px", marginBottom: 15 }}>
                      {t.detectedState}: <b>{lang === "hi" && selectedState === "Uttar Pradesh" ? "उत्तर प्रदेश" : selectedState}</b> ({t.gpsAuto})
                    </div>
                    <div className="form-group" style={{ marginBottom: 15 }}>
                      <label className="form-label">{t.manualLookup}</label>
                      <select 
                        value={selectedState} 
                        onChange={(e) => setSelectedState(e.target.value)} 
                        className="select-input"
                        style={{ fontSize: "16px", padding: "12px" }}
                      >
                        {Object.keys(stateHelplines).map((stateName, idx) => (
                          <option key={idx} value={stateName}>
                            {stateName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="contacts-section-title">{t.categories}</div>
                    <div className="gov-helpline-grid">
                      {/* Police */}
                      <div 
                        onClick={() => startSimulatedCall(currentHelplineData.police.label, currentHelplineData.police.number)} 
                        className="helpline-grid-card"
                        style={{ padding: "16px", minHeight: "85px" }}
                      >
                        <span className="helpline-icon-wrap">🚓</span>
                        <span className="helpline-name-txt">{t.police}</span>
                        <span className="helpline-num-txt" style={{ fontSize: "16px" }}>{currentHelplineData.police.number}</span>
                      </div>
                      
                      {/* Ambulance */}
                      <div 
                        onClick={() => startSimulatedCall(currentHelplineData.ambulance.label, currentHelplineData.ambulance.number)} 
                        className="helpline-grid-card"
                        style={{ padding: "16px", minHeight: "85px" }}
                      >
                        <span className="helpline-icon-wrap">🚑</span>
                        <span className="helpline-name-txt">{t.ambulance}</span>
                        <span className="helpline-num-txt" style={{ fontSize: "16px" }}>{currentHelplineData.ambulance.number}</span>
                      </div>
                      
                      {/* Women Help */}
                      <div 
                        onClick={() => startSimulatedCall(currentHelplineData.women.label, currentHelplineData.women.number)} 
                        className="helpline-grid-card"
                        style={{ padding: "16px", minHeight: "85px" }}
                      >
                        <span className="helpline-icon-wrap">👩🦰</span>
                        <span className="helpline-name-txt">{t.womenHelp}</span>
                        <span className="helpline-num-txt" style={{ fontSize: "16px" }}>{currentHelplineData.women.number}</span>
                      </div>
                      
                      {/* Fire */}
                      <div 
                        onClick={() => startSimulatedCall(currentHelplineData.fire.label, currentHelplineData.fire.number)} 
                        className="helpline-grid-card"
                        style={{ padding: "16px", minHeight: "85px" }}
                      >
                        <span className="helpline-icon-wrap">🚒</span>
                        <span className="helpline-name-txt">{t.fire}</span>
                        <span className="helpline-num-txt" style={{ fontSize: "16px" }}>{currentHelplineData.fire.number}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* PAGE 4: POWER VAULT PROTECTION */}
              {activeTab === "vault" && (
                <div className="glass-card">
                  <h3>{t.offlineProtection}</h3>
                  <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                    {t.offlineDesc}
                  </p>
                  
                  <div className="toggle-switch-container">
                    <span className="switch-label">
                      <span className="pulse-dot-green"></span>{t.bgSync}
                    </span>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={bgTracking} 
                        onChange={(e) => setBgTracking(e.target.checked)} 
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <button
                    onClick={toggleDevicePower}
                    style={{
                      width: "100%",
                      padding: "16px", // Accessible large button
                      fontSize: "14px",
                      marginTop: "15px",
                      background: isDeviceOff ? "#00c853" : "transparent",
                      color: isDeviceOff ? "white" : "#ff1744",
                      border: isDeviceOff ? "none" : "1px solid rgba(255, 23, 74, 0.3)",
                      borderRadius: "10px",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {isDeviceOff ? t.powerOnSim : t.powerOffSim}
                  </button>

                  {/* --- Battery Saver & Geolocation Optimization (Firebase & Background Services) --- */}
                  <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#00b0ff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      🔋 {lang === "hi" ? "बैटरी उपयोग अनुकूलन" : "Battery Saver Options"}
                    </h4>
                    
                    {/* Geolocation Optimization Mode */}
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        {lang === "hi" ? "स्थान सेंसर मोड (GPS Optimization)" : "GPS Accuracy & Sensor Mode"}
                      </label>
                      <select 
                        value={trackingMode} 
                        onChange={(e) => setTrackingMode(e.target.value)} 
                        className="select-input" 
                        style={{ fontSize: "14px", padding: "10px" }}
                      >
                        <option value="eco">🔋 {lang === "hi" ? "इको मोड (80% बैटरी बचत)" : "Eco Mode (Coarse Geolocation, saves 80% battery)"}</option>
                        <option value="balanced">🟡 {lang === "hi" ? "संतुलित मोड (सेंसर फ्यूजन)" : "Balanced Saver (Hybrid Network / Sensor Fusion)"}</option>
                        <option value="high">🟢 {lang === "hi" ? "उच्च प्रदर्शन (निरंतर GPS)" : "High Performance (Continuous High-Accuracy GPS)"}</option>
                      </select>
                    </div>

                    {/* Sync Interval */}
                    <div className="form-group" style={{ marginBottom: 15 }}>
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        {lang === "hi" ? "क्लाउड सिंक अंतराल" : "Background Cloud Sync Interval"}
                      </label>
                      <select 
                        value={syncInterval} 
                        onChange={(e) => setSyncInterval(e.target.value)} 
                        className="select-input" 
                        style={{ fontSize: "14px", padding: "10px" }}
                      >
                        <option value="eco-interval">⏱️ {lang === "hi" ? "बैटरी सेवर (5 मिनट)" : "Battery Saver (5 minutes interval)"}</option>
                        <option value="standard">⏱️ {lang === "hi" ? "मानक (1 मिनट)" : "Standard (1 minute interval)"}</option>
                        <option value="realtime">⚡ {lang === "hi" ? "रियल-टाइम (5 सेकंड)" : "Real-time (5 seconds interval)"}</option>
                      </select>
                    </div>

                    {/* Firebase Status indicators */}
                    <div style={{ background: "rgba(0,0,0,0.25)", padding: "12px", borderRadius: "10px", fontSize: "11px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>🔥 Firebase Firestore:</span>
                        <span style={{ color: "#00e676", fontWeight: "700" }}>🟢 {lang === "hi" ? "सिंक सक्रिय" : "Synced (Real-time)"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>🔔 FCM Push Alerts:</span>
                        <span style={{ color: "#00e676", fontWeight: "700" }}>🟢 {lang === "hi" ? "सक्रिय" : "Active (Connected)"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 5: INSTRUCTION / HELP PAGE */}
              {activeTab === "guide" && (
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px", color: "#00b0ff" }}>
                    📖 {lang === "hi" ? "ऐप का उपयोग कैसे करें" : "How to use the App"}
                  </h3>
                  
                  {/* Step 1: SOS */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h4 style={{ margin: 0, color: "#ff1744", display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                      🚨 {lang === "hi" ? "१. आपातकाल SOS का उपयोग" : "1. How to use SOS"}
                    </h4>
                    <div style={{ paddingLeft: "20px", fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: "1.4" }}>
                      <div>• {lang === "hi" ? "स्क्रीन पर नीचे दाईं ओर लाल बटन दबाएं।" : "Tap the big red SOS button on the bottom-right of your screen."}</div>
                      <div>• {lang === "hi" ? "५ सेकंड की गिनती शुरू होगी (गलती से दबने पर रद्द कर सकते हैं)।" : "A 5-second safety timer starts (allows cancellation if triggered accidentally)."}</div>
                      <div>• {lang === "hi" ? "पुलिस (११२) को कॉल शुरू होगी और परिवार को जीपीएस लोकेशन लिंक एसएमएस भेजा जाएगा।" : "Emergency dispatch dials 112 & SMS link with live coordinates is sent to contacts."}</div>
                    </div>
                  </div>

                  {/* Step 2: Location Tracking */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h4 style={{ margin: 0, color: "#00c853", display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                      🗺️ {lang === "hi" ? "२. मार्ग व स्थान ट्रैकिंग" : "2. How to track location"}
                    </h4>
                    <div style={{ paddingLeft: "20px", fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: "1.4" }}>
                      <div>• {lang === "hi" ? "नक्शे पर नीली बिंदी आपकी लाइव स्थिति दर्शाती है।" : "The pulsing blue dot on the map shows your current position."}</div>
                      <div>• {lang === "hi" ? "गंतव्य ड्रॉपडाउन से कोई स्थान चुनें या मानचित्र पर सीधे कहीं भी क्लिक करें।" : "Select a location from the dropdown menu or tap directly on the map."}</div>
                      <div>• {lang === "hi" ? "🟢 सुरक्षित मार्ग चुनें और 'यात्रा शुरू करें' (🚀) बटन पर क्लिक करें।" : "Choose the green 🟢 safe route, and click the green 'Start Route' button."}</div>
                    </div>
                  </div>

                  {/* Step 3: Emergency Calls */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h4 style={{ margin: 0, color: "#00b0ff", display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                      📞 {lang === "hi" ? "३. आपातकालीन हेल्पलाइन कॉल" : "3. How to call emergency services"}
                    </h4>
                    <div style={{ paddingLeft: "20px", fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: "1.4" }}>
                      <div>• {lang === "hi" ? "शीर्ष मेनू से 'Emergency Hub' (📞) चुनें।" : "Go to the 'Emergency Hub' tab in the top navigation menu."}</div>
                      <div>• {lang === "hi" ? "पुलिस (🚓), एम्बुलेंस (🚑), महिला (👩‍🦰) और दमकल (🚒) के नंबर देखें।" : "Find Indian state helpline numbers loaded dynamically from your location."}</div>
                      <div>• {lang === "hi" ? "कॉल करने के लिए किसी भी हेल्पलाइन कार्ड पर सीधे टैप करें।" : "Simply tap on any card to automatically place a simulated call."}</div>
                    </div>
                  </div>

                  {/* Step 4: Smartwatch */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h4 style={{ margin: 0, color: "#ffb300", display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                      ⌚ {lang === "hi" ? "४. स्मार्टवॉच सिमुलेटर" : "4. How smartwatch works"}
                    </h4>
                    <div style={{ paddingLeft: "20px", fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: "1.4" }}>
                      <div>• {lang === "hi" ? "शीर्ष बार में 'Watch Sim' दबाकर स्मार्टवॉच दिखाएं।" : "Enable the smartwatch display by clicking 'Watch Sim' in the top bar."}</div>
                      <div>• {lang === "hi" ? "🟢 Synced मोड: वॉच पर SOS दबाने से मोबाइल का मुख्य अलर्ट चालू होगा।" : "🟢 Synced Mode: Pressing SOS on watch triggers the main phone alert modal."}</div>
                      <div>• {lang === "hi" ? "🔴 Standalone (LTE) मोड: फ़ोन उपलब्ध न होने पर भी वॉच सीधी क्लाउड पर लोकेशन भेज देगी।" : "🔴 Standalone LTE: Works independently when the phone is unreachable."}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </aside>

        {/* Map Container Wrapper */}
        <div className="map-container-wrapper">
          {/* Turn-by-Turn Navigation HUD Overlay */}
          {isNavigating && activeRoute && !isDeviceOff && (
            <div className="nav-hud">
              <div className="nav-direction-card" style={{ padding: "18px 20px" }}>
                <div className="nav-icon-container" style={{ width: "54px", height: "54px", fontSize: "28px" }}>
                  {currentInstruction.includes("right") ? "➡️" : currentInstruction.includes("left") ? "⬅️" : "⬆️"}
                </div>
                <div className="nav-text-container">
                  {/* Localized instruction text */}
                  <div className="nav-instruction" style={{ fontSize: "17px" }}>
                    {lang === "hi" ? (instructionTranslations[currentInstruction] || currentInstruction) : currentInstruction}
                  </div>
                  <div className="nav-distance">Live Tracking Active • Safety Route Grid</div>
                </div>

                {/* 🔊 Manual Speak Speaker Button */}
                <button 
                  onClick={() => speakInstruction(currentInstruction)}
                  style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", marginLeft: "10px" }}
                  title="Speak direction"
                >
                  🔊
                </button>
              </div>
            </div>
          )}

          {/* Top Bar Offline Banner overlay on map */}
          {isDeviceOff && (
            <div className="offline-banner">
              <span className="pulse-dot-red"></span>
              ⚠️ DEVICE IS OFFLINE — BROADCASTING LAST TRACKED POSITION ON THE SECURE CLOUD DATABASE
            </div>
          )}

          {/* Map view */}
          <MapView
            routes={routes}
            selectedRouteIndex={selectedRouteIndex}
            destination={destination}
            userLocation={isDeviceOff ? null : userLocation}
            onMapClick={handleMapClick}
            onRouteClick={setSelectedRouteIndex}
            mapStyle={mapStyle}
          >
            {!isDeviceOff && (
              <HeatmapLayer
                points={heatmap}
                userLocation={userLocation}
              />
            )}

            {isDeviceOff && lastKnownLoc && (
              <CircleMarker
                center={[lastKnownLoc.lat, lastKnownLoc.lon]}
                radius={12}
                pathOptions={{
                  color: "#ff1744",
                  fillColor: "#ff1744",
                  fillOpacity: 0.5,
                  weight: 3,
                  dashArray: "5, 5"
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -12]}>
                  {t.lastKnownPos} ({lastKnownLoc.timestamp})
                </Tooltip>
              </CircleMarker>
            )}
          </MapView>
        </div>
      </div>

      {/* 🚨 ALWAYS-VISIBLE BIG RED SOS BUTTON (ACCESSIBLE TEXT IN HINDI/ENGLISH) */}
      <div className="sos-button-container">
        <button 
          onClick={triggerSOS} 
          className="sos-button-floating"
          style={{ 
            opacity: isDeviceOff ? 0.5 : 1, 
            cursor: isDeviceOff ? "not-allowed" : "pointer",
            width: 100, 
            height: 100, 
            fontSize: lang === "hi" ? "14px" : "20px" 
          }}
        >
          {lang === "hi" ? "आपातकाल एसओएस" : "SOS"}
        </button>
      </div>

      {/* 🚨 SOS MODAL OVERLAY */}
      {showSOSModal && (
        <div className="emergency-modal-overlay">
          <div className="emergency-modal-card">
            <span className="emergency-icon">🚨</span>
            <h2 className="emergency-title">{t.sosTitle}</h2>
            
            {!sosActive ? (
              <>
                <p className="emergency-subtitle">
                  {t.sosCountdown} <b>{sosCountdown}s</b>.
                </p>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "4px solid #ff1744",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#ff1744",
                    animation: "sosAlertPulse 1s infinite"
                  }}>
                    {sosCountdown}
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="emergency-subtitle" style={{ color: "#00e676", fontWeight: 700 }}>
                  {t.sosActive}
                </p>
                
                <div className="emergency-status-section">
                  <div className="status-step">
                    <span className="status-indicator">📡</span>
                    <div className="status-step-text">
                      <div className="status-step-title">{t.sosShared}</div>
                      <div className="status-step-desc">
                        Current: {userLocation?.lat?.toFixed(5) || defaultLat}, {userLocation?.lon?.toFixed(5) || defaultLon}
                      </div>
                    </div>
                  </div>

                  <div className="status-step">
                    <span className="status-indicator">💬</span>
                    <div className="status-step-text">
                      <div className="status-step-title">{t.sosSms}</div>
                      <div className="status-step-desc" style={{ fontStyle: "italic" }}>
                        "HELP! I feel unsafe. Track me: https://maps.google.com/?q={userLocation?.lat || defaultLat},{userLocation?.lon || defaultLon}"
                      </div>
                    </div>
                  </div>

                  <div className="status-step">
                    <span className="status-indicator">📞</span>
                    <div className="status-step-text">
                      <div className="status-step-title">{t.sosCall}</div>
                      <div className="status-step-desc">
                        Dialing Police (112) & Emergency Contact ({emergencyPhone})
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button onClick={cancelSOS} className="emergency-cancel-btn">
              {t.cancelSos}
            </button>
          </div>
        </div>
      )}

      {/* 📞 INTERACTIVE SIMULATED PHONE CALL OVERLAY */}
      {activeSimulatedCall && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "radial-gradient(circle at center, #0f2c15 0%, #030a05 100%)",
          zIndex: 200000,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "60px 40px",
          fontFamily: "'Outfit', sans-serif"
        }}>
          {/* Top header */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "16px", color: "#00e676", letterSpacing: "1.5px", fontWeight: "700", textTransform: "uppercase" }}>
              {t.secLink}
            </div>
            <h2 style={{ fontSize: "32px", color: "white", margin: "15px 0 5px 0" }}>{activeSimulatedCall.name}</h2>
            <div style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>{activeSimulatedCall.number}</div>
          </div>

          {/* Caller Animation */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative", width: 200, height: 200 }}>
            {/* Pulsing ring */}
            <div style={{
              position: "absolute",
              width: "160px",
              height: "160px",
              border: "3px solid #00e676",
              borderRadius: "50%",
              animation: "pulseGreen 2s infinite"
            }}></div>
            <div style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "rgba(0, 230, 118, 0.15)",
              border: "2px solid #00e676",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "56px"
            }}>
              📞
            </div>
          </div>

          {/* Timer and Hangup */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 30, width: "100%" }}>
            <div style={{ fontSize: "20px", color: "#00e676", fontWeight: "700", fontFamily: "monospace" }}>
              {t.calling} {formatCallTime(callDuration)}
            </div>

            <button 
              onClick={endSimulatedCall}
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                background: "#ff1744",
                border: "none",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(255, 23, 74, 0.4)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                transform: "rotate(135deg)",
                transition: "transform 0.1s ease"
              }}
            >
              📞
            </button>
          </div>
        </div>
      )}

      {/* 💬 INTERACTIVE SIMULATED SMS TOAST POPUP */}
      {activeSimulatedSMS && (
        <div style={{
          position: "fixed",
          top: "40px",
          right: "40px",
          width: "360px",
          background: "rgba(10, 20, 15, 0.9)",
          border: "1px solid #00e676",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 10px 30px rgba(0, 230, 118, 0.15)",
          zIndex: 300000,
          animation: "slideDown 0.3s ease",
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#00e676" }}>{t.smsSent}</span>
            <button 
              onClick={() => setActiveSimulatedSMS(null)}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "14px" }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "white", marginBottom: 4 }}>
            {t.recipient}: {activeSimulatedSMS.name}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", marginBottom: 10 }}>
            {t.phone}: {activeSimulatedSMS.number}
          </div>
          <div style={{
            background: "rgba(0,0,0,0.4)",
            padding: "10px 12px",
            borderRadius: "10px",
            fontSize: "12px",
            lineHeight: "1.4",
            color: "rgba(255,255,255,0.85)",
            borderLeft: "3px solid #00e676"
          }}>
            {activeSimulatedSMS.message}
          </div>
        </div>
      )}

      {/* ⌚ SMARTWATCH SIMULATOR OVERLAY */}
      {showWatchSim && (
        <div className="watch-simulator-wrapper">
          {watchVibrating && <div className="watch-vibration-waves"></div>}
          <div className={`watch-case ${watchVibrating ? "watch-vibrating" : ""}`}>
            <div className="watch-crown"></div>
            <div className="watch-screen">
              {/* Watch Header */}
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <span className="watch-header-time" style={{ color: "#ffb300", fontSize: "10px", fontWeight: "700" }}>13:56</span>
                <span style={{ fontSize: "10px" }}>📶</span>
              </div>

              {/* Watch SOS Button */}
              <button 
                onClick={triggerWatchSOS}
                className={`watch-sos-btn ${watchVibrating ? "vibrating" : ""}`}
                style={{ fontSize: lang === "hi" ? "10px" : "13px" }}
              >
                {watchVibrating ? (lang === "hi" ? "कंपन..." : "VIBRATE") : (lang === "hi" ? "एसओएस" : "SOS")}
              </button>

              {/* LTE / Offline Selector */}
              <button 
                onClick={() => setWatchLTEMode(!watchLTEMode)}
                className={`btn-watch-lte ${watchLTEMode ? "active" : ""}`}
              >
                {watchLTEMode ? `🔴 ${t.standalone}` : `🟢 ${t.synced}`}
              </button>

              {/* Watch Status footer */}
              <div className="watch-footer-status" style={{ color: watchLTEMode ? "#ff1744" : "#00e676" }}>
                {watchLTEMode ? t.watchLte : t.watchSynced}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 CLEAR SECURITY & PERMISSIONS SCREENING MODAL */}
      {!permissionsGranted && isLoggedIn && (
        <div className="emergency-modal-overlay" style={{ zIndex: 999999 }}>
          <div className="emergency-modal-card" style={{ width: "460px", border: "1px solid #00c853", boxShadow: "0 20px 60px rgba(0, 200, 83, 0.25)" }}>
            <span style={{ fontSize: "54px", display: "block", marginBottom: "15px" }}>🔐</span>
            <h2 style={{ color: "#00b0ff", fontSize: "24px", margin: "0 0 10px 0" }}>
              {lang === "hi" ? "सुरक्षा और अनुमतियाँ" : "Security & Permissions"}
            </h2>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "0 0 25px 0" }}>
              {lang === "hi" 
                ? "रक्षापथ को आपकी सुरक्षा सुनिश्चित करने के लिए निम्नलिखित अनुमतियों की आवश्यकता है। आपका डेटा पूरी तरह से सुरक्षित है।" 
                : "RakshaPath requires the following permissions to ensure your active safety. Your data is encrypted and private."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", marginBottom: "25px" }}>
              {/* Location */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "20px" }}>📍</span>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#00c853" }}>
                    {lang === "hi" ? "स्थान अनुमति (Location)" : "Location Permission"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.6)", lineHeight: "1.3" }}>
                    {lang === "hi" 
                      ? "सुरक्षित मार्गों की गणना करने और नेविगेशन ट्रैक करने के लिए आवश्यक है।" 
                      : "Required to track your position, calculate safe routes, and show safety alerts."}
                  </p>
                </div>
              </div>

              {/* SMS */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "20px" }}>💬</span>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#ffb300" }}>
                    {lang === "hi" ? "एसएमएस प्रसारण (Emergency SMS)" : "Emergency SMS Permission"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.6)", lineHeight: "1.3" }}>
                    {lang === "hi" 
                      ? "एसओएस चालू होने पर संपर्कों को आपके स्थान का लिंक भेजने के लिए आवश्यक है।" 
                      : "Required to dispatch distress coordinates links to your trusted circle."}
                  </p>
                </div>
              </div>

              {/* Calls */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "20px" }}>📞</span>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#ff1744" }}>
                    {lang === "hi" ? "आपातकालीन कॉल (Call Dialing)" : "Emergency Call Permission"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.6)", lineHeight: "1.3" }}>
                    {lang === "hi" 
                      ? "खतरे के समय पुलिस (११२) और संपर्कों को सीधे आपातकालीन कॉल करने के लिए।" 
                      : "Required to place emergency dials to Police and emergency contacts."}
                  </p>
                </div>
              </div>

              {/* Encryption Notice */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "rgba(0, 200, 83, 0.05)", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(0, 200, 83, 0.15)" }}>
                <span style={{ fontSize: "20px" }}>🛡️</span>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#00e676" }}>
                    {lang === "hi" ? "डेटा गोपनीयता और एन्क्रिप्शन" : "Privacy & Data Encryption"}
                  </h4>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.7)", lineHeight: "1.3" }}>
                    {lang === "hi" 
                      ? "आपका नाम, फ़ोन और लोकेशन एंड-टू-एंड एन्क्रिप्टेड है और कभी साझा नहीं किया जाएगा।" 
                      : "All personal contact numbers, names, and logs are encrypted locally & synced securely."}
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={grantPermissions}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "15px",
                fontWeight: "800",
                background: "linear-gradient(135deg, #00c853 0%, #00e676 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(0,200,83,0.3)",
                transition: "all 0.2s ease"
              }}
            >
              {lang === "hi" ? "सहमति दें और अनुमतियाँ चालू करें 🟢" : "Agree & Grant Permissions 🟢"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;