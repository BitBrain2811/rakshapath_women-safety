import React, { useState, useEffect } from 'react';
import { sendOtp, verifyOtp, biometricLogin } from '../services/api';

// Multi-language translation dictionary for Auth page
const authTranslations = {
  en: {
    login: "Login 🚪",
    signup: "Register 👤",
    phoneLabel: "Phone Number 📞",
    phonePlaceholder: "Enter 10-digit number",
    sendOtp: "Send OTP Verification Code 🚀",
    sending: "Sending Request...",
    biometricTitle: "Biometric Authentication 🧬",
    biometricBtn: "Login with Face/Fingerprint 🧬",
    otpLabel: "Enter 6-Digit OTP 🔑",
    otpPlaceholder: "Enter verification code",
    verifyBtn: "Verify & Enter App 🟢",
    verifying: "Verifying...",
    backBtn: "← Go Back",
    orUseSecurePass: "or login securely with biometrics",
    fullName: "Your Full Name 👤",
    namePlaceholder: "Enter your name",
    emergencyContact: "Emergency Phone (Optional) 🚨",
    emergencyPlaceholder: "Family/friend number",
    registerBtn: "Register & Send OTP 🚀",
    registering: "Registering...",
    scanning: "Scanning fingerprint / face...",
    verified: "Authentication Successful! Welcome.",
    modalDesc: "Place your finger on scanner or look at camera to sign in",
    cancel: "Cancel ❌",
    brandSubtitle: "🛡️ Safe Route & Emergency System",
    validPhoneAlert: "Please enter a valid 10-digit phone number.",
    validOtpAlert: "Please enter the 6-digit OTP code.",
    successVerify: "Verification successful! Logging in...",
    registerFirst: "Please log in with Phone Number + OTP once first to register biometrics.",
    biometricFailed: "Biometric authentication failed. Please try again."
  },
  hi: {
    login: "प्रवेश करें 🚪",
    signup: "नया खाता 👤",
    phoneLabel: "फ़ोन नंबर 📞",
    phonePlaceholder: "10 अंकों का मोबाइल नंबर डालें",
    sendOtp: "सत्यापन कोड (OTP) भेजें 🚀",
    sending: "कोड भेजा जा रहा है...",
    biometricTitle: "फिंगरप्रिंट/चेहरा लॉक खोलें 🧬",
    biometricBtn: "फिंगरप्रिंट/चेहरे से खोलें 🧬",
    otpLabel: "6-अंकों का ओटीपी (OTP) डालें 🔑",
    otpPlaceholder: "सत्यापन कोड यहाँ भरें",
    verifyBtn: "कोड जाँचें और प्रवेश करें 🟢",
    verifying: "जाँच की जा रही है...",
    backBtn: "← पीछे जाएँ",
    orUseSecurePass: "या फिंगरप्रिंट लॉक से प्रवेश करें",
    fullName: "आपका पूरा नाम 👤",
    namePlaceholder: "अपना नाम यहाँ लिखें",
    emergencyContact: "आपातकालीन नंबर (वैकल्पिक) 🚨",
    emergencyPlaceholder: "परिवार/मित्र का मोबाइल नंबर",
    registerBtn: "नया खाता बनाएं और ओटीपी भेजें 🚀",
    registering: "रजिस्टर किया जा रहा है...",
    scanning: "अंगूठे या चेहरे की पहचान हो रही है...",
    verified: "सत्यापन सफल! आपका स्वागत है।",
    modalDesc: "अपना फिंगरप्रिंट सेंसर पर रखें या कैमरे के सामने देखें",
    cancel: "रद्द करें ❌",
    brandSubtitle: "🛡️ सुरक्षित रास्ता और आपातकालीन प्रणाली",
    validPhoneAlert: "कृपया सही 10-अंकों का फ़ोन नंबर दर्ज करें।",
    validOtpAlert: "कृपया 6-अंकों का ओटीपी कोड दर्ज करें।",
    successVerify: "सत्यापन सफल! आपका स्वागत है...",
    registerFirst: "बायोमेट्रिक्स पंजीकृत करने के लिए कृपया पहले एक बार फ़ोन नंबर + ओटीपी से लॉगिन करें।",
    biometricFailed: "पहचान विफल रही। कृपया फिर से प्रयास करें।"
  }
};

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  
  const [step, setStep] = useState(1); // 1 = Phone Input, 2 = OTP input
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error' | 'info'
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  // Multi-language state persisted in localStorage
  const [lang, setLang] = useState(localStorage.getItem('user_lang') || 'en');
  const t = authTranslations[lang];

  // Load Google Fonts for premium typography
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    localStorage.setItem('user_lang', nextLang);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber)) {
      showMessage(
        lang === 'hi' 
          ? 'कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें (जो 6-9 से शुरू हो)।' 
          : 'Please enter a valid 10-digit Indian mobile number (starting with 6-9).', 
        'error'
      );
      return;
    }

    const fullPhone = '+91' + phoneNumber;
    setLoading(true);
    try {
      const res = await sendOtp(fullPhone);
      setLoading(false);
      setStep(2);
      const msgText = lang === 'hi'
        ? 'ओटीपी आपके फ़ोन नंबर पर भेज दिया गया है'
        : 'OTP sent to your phone number';
      showMessage(msgText, 'success');
    } catch (err) {
      setLoading(false);
      showMessage(err.response?.data?.detail || 'Error sending request. Try again.', 'error');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      showMessage(t.validOtpAlert, 'error');
      return;
    }

    const fullPhone = '+91' + phoneNumber;
    setLoading(true);
    try {
      const res = await verifyOtp(fullPhone, otp);
      setLoading(false);
      showMessage(t.successVerify, 'success');
      
      // Store local user data
      localStorage.setItem('user_token', res.data.token);
      localStorage.setItem('user_phone', fullPhone);
      if (name) localStorage.setItem('user_name', name);
      if (emergencyContact) {
        const cleanEmergency = emergencyContact.replace(/\D/g, '');
        const formattedEmergency = cleanEmergency.length === 10 ? '+91 ' + cleanEmergency : emergencyContact;
        localStorage.setItem('user_emergency', formattedEmergency);
      }

      setTimeout(() => {
        onLoginSuccess();
      }, 1000);
    } catch (err) {
      setLoading(false);
      showMessage(err.response?.data?.detail || 'Incorrect OTP code.', 'error');
    }
  };

  const triggerBiometricLogin = () => {
    const savedPhone = localStorage.getItem('user_phone');
    if (!savedPhone) {
      showMessage(t.registerFirst, 'info');
      return;
    }
    
    // Set local display state phone number without country code
    setPhoneNumber(savedPhone.replace("+91", ""));
    setShowBiometricModal(true);
    setBiometricScanning(true);
    setBiometricSuccess(false);

    // Simulate high-tech biometric scan
    setTimeout(() => {
      setBiometricScanning(false);
      setBiometricSuccess(true);
      
      // Complete login after success animation
      setTimeout(async () => {
        try {
          const res = await biometricLogin(savedPhone);
          setShowBiometricModal(false);
          localStorage.setItem('user_token', res.data.token);
          onLoginSuccess();
        } catch (err) {
          setShowBiometricModal(false);
          showMessage(t.biometricFailed, 'error');
        }
      }, 1200);
    }, 2000);
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    // Auto-clear messages except dev OTP code helper
    if (type !== 'success' || (!text.includes('Dev Code') && !text.includes('सत्यापन कोड'))) {
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setStep(1);
    setPhoneNumber('');
    setOtp('');
    setMessage({ text: '', type: '' });
  };

  return (
    <div style={styles.authContainer}>
      {/* Decorative Blur Spheres */}
      <div style={styles.sphere1}></div>
      <div style={styles.sphere2}></div>

      {/* Auth Card */}
      <div style={styles.authCard}>
        {/* Language Switch Toggle at Top Right */}
        <button 
          type="button" 
          onClick={toggleLanguage} 
          style={styles.langBtn}
          title="Switch Language / भाषा बदलें"
        >
          🌐 {lang === 'en' ? 'हिन्दी' : 'English'}
        </button>

        <div style={styles.logoHeader}>
          <div style={styles.logoBadge}>🛡️</div>
          <h1 style={styles.brandTitle}>RakshaPath</h1>
          <p style={styles.brandSubtitle}>{t.brandSubtitle}</p>
        </div>

        <div style={styles.tabsContainer}>
          <button 
            style={{...styles.tabButton, ...(isLogin ? styles.activeTab : {})}} 
            onClick={() => !isLogin && toggleAuthMode()}
          >
            {t.login}
          </button>
          <button 
            style={{...styles.tabButton, ...(!isLogin ? styles.activeTab : {})}} 
            onClick={() => isLogin && toggleAuthMode()}
          >
            {t.signup}
          </button>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div style={{
            ...styles.messageBanner,
            ...(message.type === 'success' ? styles.successBanner : 
               message.type === 'error' ? styles.errorBanner : styles.infoBanner)
          }}>
            {message.text}
          </div>
        )}

        {isLogin ? (
          /* LOGIN FORM */
          step === 1 ? (
            <form onSubmit={handleSendOtp} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t.phoneLabel}</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>📞</span>
                  <span style={styles.countryPrefix}>+91</span>
                  <input
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength="10"
                    style={styles.textInput}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? t.sending : t.sendOtp}
              </button>

              <div style={styles.divider}>
                <span style={styles.dividerLine}></span>
                <span style={styles.dividerText}>{t.orUseSecurePass}</span>
                <span style={styles.dividerLine}></span>
              </div>

              {/* Biometric Trigger */}
              <button 
                type="button" 
                onClick={triggerBiometricLogin} 
                style={styles.biometricBtn}
              >
                <span style={{ fontSize: '24px', marginRight: '10px' }}>🧬</span>
                {t.biometricBtn}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t.otpLabel}</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>🔑</span>
                  <input
                    type="text"
                    placeholder={t.otpPlaceholder}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength="6"
                    style={{...styles.textInput, letterSpacing: '8px', textAlign: 'center', fontSize: '20px'}}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? t.verifying : t.verifyBtn}
              </button>

              <button 
                type="button" 
                onClick={() => setStep(1)} 
                style={styles.backBtn}
              >
                {t.backBtn}
              </button>
            </form>
          )
        ) : (
          /* SIGNUP FORM */
          step === 1 ? (
            <form onSubmit={handleSendOtp} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t.fullName}</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>👤</span>
                  <input
                    type="text"
                    placeholder={t.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.textInput}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t.phoneLabel}</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>📞</span>
                  <span style={styles.countryPrefix}>+91</span>
                  <input
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength="10"
                    style={styles.textInput}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t.emergencyContact}</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>🚨</span>
                  <input
                    type="tel"
                    placeholder={t.emergencyPlaceholder}
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value.replace(/\D/g, ''))}
                    maxLength="10"
                    style={styles.textInput}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? t.registering : t.registerBtn}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t.otpLabel}</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>🔑</span>
                  <input
                    type="text"
                    placeholder={t.otpPlaceholder}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength="6"
                    style={{...styles.textInput, letterSpacing: '8px', textAlign: 'center', fontSize: '20px'}}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? t.verifying : t.verifyBtn}
              </button>

              <button 
                type="button" 
                onClick={() => setStep(1)} 
                style={styles.backBtn}
              >
                {t.backBtn}
              </button>
            </form>
          )
        )}
      </div>

      {/* Biometric Scanning Overlay Modal */}
      {showBiometricModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>{t.biometricTitle}</h3>
            <p style={styles.modalDesc}>{t.modalDesc}</p>

            <div style={styles.scannerContainer}>
              <div style={{
                ...styles.sensorIcon,
                ...(biometricScanning ? styles.sensorIconPulsing : {}),
                ...(biometricSuccess ? styles.sensorIconSuccess : {})
              }}>
                {biometricSuccess ? '✔️' : '🧬'}
              </div>
              
              {/* Scan Line effect */}
              {biometricScanning && <div style={styles.scanLine}></div>}
            </div>

            <div style={{
              ...styles.statusText,
              ...(biometricSuccess ? { color: '#00c853' } : { color: '#ffffff' })
            }}>
              {biometricScanning ? t.scanning : t.verified}
            </div>

            <button 
              onClick={() => { setShowBiometricModal(false); setBiometricScanning(false); }} 
              style={styles.modalCloseBtn}
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Styled Inline Keyframes for scan animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(233, 30, 99, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(233, 30, 99, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(233, 30, 99, 0); }
        }
        @keyframes successPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 200, 83, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(0, 200, 83, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 200, 83, 0); }
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  authContainer: {
    fontFamily: "'Outfit', sans-serif",
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at center, #1b0728 0%, #0c0211 100%)',
    position: 'relative',
    overflow: 'hidden',
    color: '#ffffff'
  },
  sphere1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(233, 30, 99, 0.25) 0%, rgba(0,0,0,0) 70%)',
    top: '-10%',
    left: '-10%',
    zIndex: 1,
    borderRadius: '50%'
  },
  sphere2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(138, 43, 226, 0.2) 0%, rgba(0,0,0,0) 70%)',
    bottom: '-15%',
    right: '-10%',
    zIndex: 1,
    borderRadius: '50%'
  },
  authCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
    width: '440px',
    padding: '30px 40px 40px 40px',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease-in-out'
  },
  langBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '20px',
    color: '#ffffff',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    alignSelf: 'flex-end',
    marginBottom: '10px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
  },
  logoHeader: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  logoBadge: {
    fontSize: '36px',
    marginBottom: '8px',
    display: 'inline-block'
  },
  brandTitle: {
    fontSize: '28px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #e91e63 0%, #8a2be2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 5px 0',
    letterSpacing: '1px'
  },
  brandSubtitle: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: 0,
    fontWeight: '300'
  },
  tabsContainer: {
    display: 'flex',
    background: 'rgba(0, 0, 0, 0.25)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '25px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  tabButton: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  activeTab: {
    background: 'linear-gradient(135deg, rgba(233,30,99,0.2) 0%, rgba(138,43,226,0.2) 100%)',
    border: '1px solid rgba(233,30,99,0.3)',
    color: '#ffffff',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: '4px'
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '2px 14px',
    transition: 'all 0.2s ease'
  },
  inputIcon: {
    fontSize: '16px',
    marginRight: '12px',
    color: 'rgba(255,255,255,0.4)'
  },
  countryPrefix: {
    fontSize: '15px',
    color: '#ffffff',
    marginRight: '8px',
    fontWeight: '700',
    borderRight: '1px solid rgba(255, 255, 255, 0.2)',
    paddingRight: '8px',
    display: 'flex',
    alignItems: 'center'
  },
  textInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    padding: '12px 0',
    fontSize: '15px',
    fontFamily: 'inherit'
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #e91e63 0%, #8a2be2 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'transform 0.1s ease, opacity 0.2s ease',
    boxShadow: '0 8px 25px rgba(233, 30, 99, 0.3)',
    marginTop: '10px'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    padding: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '5px',
    textAlign: 'center'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '10px 0'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)'
  },
  dividerText: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.4)',
    padding: '0 12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  biometricBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    color: '#ffffff',
    padding: '14px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  messageBanner: {
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    lineHeight: '1.4',
    marginBottom: '20px',
    borderLeft: '4px solid'
  },
  successBanner: {
    background: 'rgba(0, 200, 83, 0.15)',
    color: '#69f0ae',
    borderLeftColor: '#00c853',
    border: '1px solid rgba(0, 200, 83, 0.25)'
  },
  errorBanner: {
    background: 'rgba(213, 0, 0, 0.15)',
    color: '#ff8a80',
    borderLeftColor: '#d50000',
    border: '1px solid rgba(213, 0, 0, 0.25)'
  },
  infoBanner: {
    background: 'rgba(41, 182, 246, 0.15)',
    color: '#81d4fa',
    borderLeftColor: '#29b6f6',
    border: '1px solid rgba(41, 182, 246, 0.25)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(12, 2, 17, 0.85)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  modalCard: {
    background: 'rgba(255, 255, 255, 0.07)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '24px',
    padding: '40px',
    width: '360px',
    textAlign: 'center',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 8px 0'
  },
  modalDesc: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0 0 30px 0'
  },
  scannerContainer: {
    width: '120px',
    height: '120px',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '30px'
  },
  sensorIcon: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '44px',
    transition: 'all 0.3s ease'
  },
  sensorIconPulsing: {
    animation: 'pulse 1.8s infinite ease-in-out',
    border: '2px solid #e91e63'
  },
  sensorIconSuccess: {
    animation: 'successPulse 1.8s infinite ease-in-out',
    border: '2px solid #00c853',
    background: 'rgba(0, 200, 83, 0.1)'
  },
  scanLine: {
    position: 'absolute',
    left: '10px',
    width: '100px',
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #e91e63, transparent)',
    boxShadow: '0 0 8px #e91e63',
    animation: 'scan 2s infinite linear'
  },
  statusText: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '30px',
    height: '20px'
  },
  modalCloseBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default Auth;
