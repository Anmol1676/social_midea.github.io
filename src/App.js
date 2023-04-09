import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/login';
import Home from './pages/home';
import Search from './pages/search';

import Feed from './pages/feed';

import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleLogin = (username) => {
    setLoginUsername(username);
    setIsLoggedIn(true);
  };

  const goToSearch = () => {
    setShowSearch(true);
  };

  const backToChannelsFromSearch = () => {
    setShowSearch(false);
  };

  return (
    <Router>
      <div className="App">
        {!isLoggedIn && <Login handleLogin={handleLogin} />}
        {isLoggedIn && !showSearch && (
          <Routes>
            <Route path="/channels" element={<Home loginUsername={loginUsername} goToSearch={goToSearch} />} />
            <Route
              path="/channels/:channelId/feed"
              element={<Feed loginUsername={loginUsername} />}
            />
          </Routes>
        )}
        {isLoggedIn && showSearch && (
          <Search backToChannelsFromSearch={backToChannelsFromSearch} />
        )}
      </div>
    </Router>
  );
}

export default App;
