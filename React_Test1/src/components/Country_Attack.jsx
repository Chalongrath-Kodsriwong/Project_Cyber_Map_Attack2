import React, { useState, useEffect } from "react";
import "../components/css/CountryAttack.css";
import "../components/JS/CountryAttack_Fun.js"; // Import ไว้เพื่อให้ใช้ jQuery ฟังก์ชัน
import { setupCountryAttackAnimation } from "../components/JS/CountryAttack_Fun.js"; // เพิ่มฟังก์ชันที่ export
import axios from "axios";

// Map country names to image paths
const countryFlags = {
  "United States": "/flags/United States of America.png",
  Bulgaria: "/flags/bulgaria.png",
  China: "/flags/china.png",
  Singapore: "/flags/singapore.png",
  Germany: "/flags/germany.png",
  Netherlands: "/flags/netherlands.png",
  Default: "/flags/default.png",
};

function Country_Attack() {
  const [countries, setCountries] = useState([]);

  const fetchCountries = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/today-attacks");
      const data = response.data;

      const formattedCountries = data.map((item) => ({
        name: item.country,
        count: item.count,
        flag: countryFlags[item.country] || countryFlags["Default"],
      }));

      setCountries(formattedCountries);
    } catch (error) {
      console.error("Error fetching country data:", error);
    }
  };

  useEffect(() => {
    fetchCountries();

    const intervalId = setInterval(() => {
      fetchCountries();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setupCountryAttackAnimation(); // เรียกใช้ฟังก์ชันที่ import มา
  }, []);

  return (
    <>
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
      <div className="btn_hideShow">
        <p className="TextCountry">CountryAttacker</p>
        <p className="Arrow3">▼</p>
      </div>
    </>
  );
}

export default Country_Attack;
