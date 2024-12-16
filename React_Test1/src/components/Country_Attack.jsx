import React, { useState, useEffect } from "react";
import "../components/css/CountryAttack.css";
import axios from "axios";

// Map country names to image paths
const countryFlags = {
  Thailand: "/flags/Thailand.png",
  "United States": "/flags/United States of America.png",
  Bulgaria: "flags/bulgaria.png"
  // Japan: "/flags/japan.png",
  // Germany: "/flags/germany.png",
  // France: "/flags/france.png",
  // Add more countries as needed
};

function Country_Attack() {
  const [countries, setCountries] = useState([]);

  const fetchCountries = async () => {
    try {
      // Fetch top countries data
      const response = await axios.get("http://127.0.0.1:5000/api/today-attacks"); // Replace with your API URL
      const data = response.data;

      // Combine attack count and flag
      const formattedCountries = data.map((item) => ({
        name: item.country,
        count: item.count,
        flag: countryFlags[item.country] || "/flags/placeholder.png", // Use placeholder if no match
      }));

      setCountries(formattedCountries);
    } catch (error) {
      console.error("Error fetching country data:", error);
    }
  };

  useEffect(() => {
    fetchCountries(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchCountries(); // Fetch data every 1 minute
    }, 1000); // 60 seconds interval

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  return (
    <div className="flag-grid-container">
      <p className="dropdown-title">TOP TARGETED COUNTRIES</p>
      <div className="flag-grid">
        {countries.length > 0 ? (
          countries.map((country, index) => (
            <div key={index} className="flag-item">
              <img
                src={country.flag}
                alt={`${country.name} Flag`}
                className="flag-img"
                onError={(e) => {
                  e.target.src = "/flags/placeholder.png"; // Fallback for missing images
                }}
              />
              <p className="flag-count">
                {country.count.toLocaleString()} Attacks
              </p>
            </div>
          ))
        ) : (
          <p className="loading-text">Loading data...</p> // Show this while data is being fetched
        )}
      </div>
    </div>
  );
}

export default Country_Attack;
