import React, { useEffect, useState } from "react";
import "./css/Classification.css";
import axios from "axios"; // ใช้ Axios สำหรับการดึงข้อมูล
import { setupClassificationAnimation } from "./JS/classification_Fun";

function Classification() {
  // กำหนดประเภทการโจมตีล่วงหน้า
  const initialCounts = {
    "Web server 400 error code.": 0,
    Unknown: 0,
  };

  const [attackCounts, setAttackCounts] = useState(initialCounts); // เก็บข้อมูลประเภทและจำนวนการโจมตี

  // ฟังก์ชันในการโหลดข้อมูลจาก localStorage
  const loadAttackCounts = () => {
    const storedCounts = localStorage.getItem("attackCounts");
    if (storedCounts) {
      try {
        console.log("Loading attack counts from localStorage:", storedCounts);
        return JSON.parse(storedCounts); // ถ้ามีค่าใน localStorage ก็โหลดขึ้นมา
      } catch (error) {
        console.error("Error parsing JSON from localStorage:", error);
      }
    }
    return initialCounts; // ถ้าไม่มีค่าหรือเกิดข้อผิดพลาด ใช้ค่าเริ่มต้น
  };

  // ฟังก์ชันในการบันทึกข้อมูลลง localStorage
  const saveAttackCounts = (newCounts) => {
    try {
      console.log("Saving attack counts to localStorage:", newCounts);
      localStorage.setItem("attackCounts", JSON.stringify(newCounts)); // บันทึกข้อมูลลง localStorage
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  useEffect(() => {
    // โหลดข้อมูลจาก localStorage เมื่อ component ถูก mount
    setAttackCounts(loadAttackCounts());
  }, []);

  useEffect(() => {
    const fetchAttackers = async () => {
      try {
        console.log("Fetching attackers data from API...");
        const response = await axios.get("http://localhost:5000/api/alerts"); // ดึงข้อมูลจาก API
        console.log("Fetched data from API:", response.data);

        const data = response.data;

        // คำนวณจำนวนการโจมตีแต่ละประเภท
        const counts = data.reduce((acc, attacker) => {
          const description =
            attacker._source?.rule?.description || "Unknown"; // ดึงข้อมูล description
          if (!acc[description]) {
            acc[description] = 0; // กำหนดค่าเริ่มต้นสำหรับประเภทใหม่
          }
          acc[description] += 1; // เพิ่มจำนวนสำหรับประเภทนี้
          return acc;
        }, {});

        console.log("Calculated attack counts:", counts);

        setAttackCounts((prevCounts) => {
          // รวมค่าจากข้อมูลใหม่เข้ากับค่าปัจจุบัน
          const updatedCounts = { ...prevCounts };
          Object.entries(counts).forEach(([description, count]) => {
            updatedCounts[description] = (prevCounts[description] || 0) + count;
          });

          // บันทึกค่าล่าสุดลง localStorage
          saveAttackCounts(updatedCounts);

          console.log("Updated attack counts:", updatedCounts);
          return updatedCounts;
        });
      } catch (error) {
        console.error("Error fetching attackers data:", error);
      }
    };

    // ดึงข้อมูลครั้งแรก
    fetchAttackers();

    // ตั้ง Interval เพื่อดึงข้อมูลทุก 10 วินาที
    const intervalId = setInterval(fetchAttackers, 5000); // ดึงข้อมูลทุก 10 วินาที

    // ล้าง Interval เมื่อ component ถูก unmount
    return () => clearInterval(intervalId);
  }, []); // useEffect จะรันเพียงครั้งเดียวในตอน mount

  // เรียกฟังก์ชัน Animation จาก classification.js
  useEffect(() => {
    setupClassificationAnimation();
  }, []);

  return (
    <div>
      <div className="border">
        <p className="Classification">Classification</p>
        <div className="container-item">
          {Object.entries(attackCounts).map(([description, count], index) => (
            <p key={index}>
              {description}: {count}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Classification;
