import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="container">
          <h1>HRMS CME</h1>
          <div className="nav-links">
            <Link to="/login" className="btn btn-primary">Login</Link>
          </div>
        </div>
      </nav>

      <main className="hero-section">
        <div className="container">
          <h2>Selamat Datang di HRMS CME</h2>
          <p>Sistem Manajemen Sumber Daya Manusia Terintegrasi</p>
          <div className="features">
            <div className="feature-card">
              <h3>Kehadiran</h3>
              <p>Clock in/out dengan foto dan lokasi</p>
            </div>
            <div className="feature-card">
              <h3>Jadwal Kerja</h3>
              <p>Manajemen jadwal kerja yang fleksibel</p>
            </div>
            <div className="feature-card">
              <h3>Live Streaming</h3>
              <p>Manajemen akun live streaming terintegrasi</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 HRMS CME. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 