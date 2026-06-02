// import React from 'react';

// export default function App() {
//   return (
//     <div>
//       App
//     </div>
//   );
// }



import React, { useState } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Auth onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

export default App;