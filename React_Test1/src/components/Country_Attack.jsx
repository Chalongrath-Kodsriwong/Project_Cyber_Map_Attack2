import React, { useState, useEffect } from "react";
import "../components/css/CountryAttack.css";
import axios from "axios";

// Map country names to image paths
const countryFlags = {
  "United States": "/flags/United States of America.png",
  Bulgaria: "/flags/bulgaria.png",
  China: "/flags/china.png",
  Singapore: "/flags/singapore.png",
  Germany: "/flags/germany.png",
  Netherlands: "/flags/netherlands.png",

  Default: "/flags/default.png", // Default flag for missing countries
};

function Country_Attack() {
  const [countries, setCountries] = useState([]);

  const fetchCountries = async () => {
    try {
      // Fetch top countries data
      const response = await axios.get(
        "http://127.0.0.1:5000/api/today-attacks"
      ); // Replace with your API URL
      const data = response.data;

      // ใช้ข้อมูลจาก API โดยตรง และจับคู่กับ countryFlags
      const formattedCountries = data.map((item) => ({
        name: item.country,
        count: item.count,
        flag: countryFlags[item.country] || countryFlags["Default"], // เลือก flag ถ้าไม่เจอใช้ Default
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
    <>
      <div className="btn_hideShow">
        <p className="text_btn"><p className="Arrow">▼</p> TARGETED COUNTRIES</p>
      </div>
      <div className="table-container">
        <strong>TOP TARGETED COUNTRIES</strong>
        <table className="country-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>COUNTRY</th>
              <th>COUNT ATTACK</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((country, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <img
                    src={country.flag}
                    alt={`${country.name} Flag`}
                    onError={(e) => (e.target.src = "/flags/default.png")}
                  />
                  {country.name}
                </td>
                <td className="Count">{country.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Country_Attack;
