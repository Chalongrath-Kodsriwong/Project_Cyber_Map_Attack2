import React, { useEffect, useState } from "react";
import "./css/Classification.css";
import axios from "axios"; // ใช้ Axios สำหรับการดึงข้อมูล
import { setupClassificationAnimation } from "./JS/classification_Fun";

function Classification() {
  const [mitreCounts, setMitreCounts] = useState([]);

  useEffect(() => {
    const fetchMitreTechniques = async () => {
      try {
        console.log("Fetching MITRE techniques...");
        const response = await axios.get("http://localhost:5000/api/mitre_techniques");

        const mitreData = response.data;
        console.log("Fetched MITRE techniques:", mitreData);

        setMitreCounts(mitreData);
      } catch (error) {
        console.error("Error fetching MITRE techniques data:", error);
      }
    };

    fetchMitreTechniques();
    const intervalId = setInterval(fetchMitreTechniques, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setupClassificationAnimation();
  }, []);

  return (
    <div>
      <div className="border">
        <p className="Classification">Classification<span className="Arrow1">▼</span></p>
        <div className="container-item">
          {mitreCounts.map((item, index) => (
            <p key={index}>
              {item.key}: {item.doc_count}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Classification;
