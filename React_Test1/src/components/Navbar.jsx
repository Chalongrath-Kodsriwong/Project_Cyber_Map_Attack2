import React from 'react';
import { Link } from 'react-router-dom';
import './css/Navbar.css';
import logo from '../assets/image.png';
import Count_Attack from './Count_Attack';

function Navbar() {
  return (
    <div className="navbar">
      {/* Logo Section */}
      <div className="navbar-logo">
        <a href="https://ruk-com.cloud/">
          <img src={logo} alt="Ruk-Com Logo"/>
        </a>
      </div>
      <div className="middle_sec" style={{display: "grid", gap: "4px"}}>
        <h1>Cyber Map Attacker</h1>
        < Count_Attack />
      </div>

      {/* Menu Section */}
      <div className="menu">
        <Link to="/">Home</Link>
        <Link to="/Analytic">Analytic</Link>
        <a href="https://ruk-com.cloud/" target="_blank" rel="noopener noreferrer">
          Ruk-Com Site
        </a>
      </div>
    </div>
  );
}

export default Navbar;
