// ./src/pages/login/index.js
// this the login page 
// user can login with username and password OR register with username and password

import React, { useState } from 'react';
import Axios from 'axios';
import './login.css';
import Home from '../home';


function App() {

  // Registration state variables
  
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [usernameTaken, setUsernameTaken] = useState(false); // initialize usernameTaken to false
  
  const register = () => {
    Axios.post('http://localhost:4000/register',{
      username: regUsername, 
      password: regPassword
    }).then((res) => {
      console.log(res);
      if (res.data === "Username taken") {
        setUsernameTaken(true); // set usernameTaken state to true
      } else {
        window.alert("Registration successful!"); // add success message
      }
    }).catch((err) => {
      console.log(err);
      window.alert("Registration failed!"); // add error message
    });
  };
  
  const login = () => {
    Axios.post('http://localhost:4000/login',{
      username: loginUsername, 
      password: loginPassword
    }).then((res) => {
      console.log(res);
      window.alert("Login successful!"); // add success message
      setIsLoggedIn(true); // set the isLoggedIn state to true
    }).catch((err) => {
      console.log(err);
      window.alert("Login failed!"); // add error message
    });
  };

  // Login state variables
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false); // initialize isLoggedIn to false

  // Render the login page if the user is not logged in, otherwise render the Channels page
  if (!isLoggedIn) {
    return (
      <div className="App">
  
        {/* Registration */}
        <div className="registration">
          <h1>Registration</h1>
          <label>Username</label>
          <input
            type="text"
            value={regUsername}
            onChange={(e) => {
              setRegUsername(e.target.value);
              setUsernameTaken(false); // reset usernameTaken state
            }}
          />
          {usernameTaken && <p>Username already taken</p>} {/* show message if usernameTaken state is true */}
  
          <label>Password</label>
          <input
            type="password"
            value={regPassword}
            onChange={(e) => {
              setRegPassword(e.target.value);
            }}
          />
          <button onClick={register}>Register</button>
        </div>
  
        {/* Login */}
        <div className="login">
          <h1>Login</h1>
          <label>Username</label>
          <input
            type="text"
            value={loginUsername}
            onChange={(e) => {
              setLoginUsername(e.target.value);
            }}
          />
  
          <label>Password</label>
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => {
              setLoginPassword(e.target.value);
            }}
          />
          <button onClick={login}>Login</button>
        </div>
  
      </div>
    );
  } else {
    return (
      <div className="App">
        <Home loginUsername={loginUsername}/>
        
    </div>

    );
  }
}
  

export default App;