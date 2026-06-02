import React, { useState } from 'react';

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        <h1 style={{ color: '#E91E63', marginBottom: '10px' }}>RakhshaPath </h1>
        <p style={{ color: '#666' }}>{isLogin ? 'Welcome back, stay safe.' : 'Join the safety network.'}</p>
        
        <div style={styles.form}>
          <input type="text" placeholder="User ID / Email" style={styles.input} />
          <input type="password" placeholder="Password" style={styles.input} />
          {!isLogin && <input type="text" placeholder="Emergency Contacts (Optional)" style={styles.input} />}
          
          <button onClick={onLoginSuccess} style={styles.primaryBtn}>
            {isLogin ? 'Login' : 'Register Now'}
          </button>
        </div>

        <p onClick={() => setIsLogin(!isLogin)} style={styles.toggleText}>
          {isLogin ? "Don't have an account? Sign Up" : "Already registered? Login"}
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%)' },
  glassCard: { background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center', width: '380px' },
  input: { width: '100%', padding: '12px', margin: '10px 0', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' },
  primaryBtn: { width: '100%', padding: '14px', background: '#E91E63', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' },
  toggleText: { marginTop: '20px', color: '#880E4F', cursor: 'pointer', fontSize: '14px' }
};

export default Auth;
