import React, { useEffect, useState } from "react";
import axios from "axios";
import "./css/Countattack.css";
import { setupCountAttackAnimation } from './JS/Count_Attack_Fun'; 


function Count_Attack() {
  const [todayAttacks, setTodayAttacks] = useState(0); // จำนวนการโจมตีวันนี้ทั้งหมด
  const [totalAttacks, setTotalAttacks] = useState(0); // จำนวนการโจมตีทั้งหมด

  useEffect(() => {
    // ฟังก์ชันดึงข้อมูลการโจมตีของวันนี้ทั้งหมด
    const fetchTodayAttacks = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/today-attacks");
        const totalToday = response.data.reduce((sum, item) => sum + item.count, 0); // รวมจำนวนการโจมตีวันนี้
        setTodayAttacks(totalToday);
      } catch (error) {
        console.error("Error fetching today's attacks:", error);
      }
    };

    // ฟังก์ชันดึงข้อมูลการโจมตีทั้งหมด
    const fetchTotalAttacks = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/top-countries");
        const total = response.data.reduce((sum, item) => sum + item.count, 0); // รวมจำนวนการโจมตีทั้งหมด
        setTotalAttacks(total);
      } catch (error) {
        console.error("Error fetching total attacks:", error);
      }
    };

    // ฟังก์ชันดึงข้อมูลทั้งสองแบบเรียลไทม์ทุก 5 วินาที
    const intervalId = setInterval(() => {
      fetchTodayAttacks();
      fetchTotalAttacks();
    }, 5000); // เรียกทุก 5 วินาที

    // ดึงข้อมูลทันทีเมื่อ Component ถูกโหลด
    fetchTodayAttacks();
    fetchTotalAttacks();

    // ล้าง interval เมื่อ component ถูก unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setupCountAttackAnimation();
    }, []);

  

  return (
    <>
      <div className="count-attack-container">
        <h2>Attack Summary</h2>
        <div className="attack-summary">
          <p><strong>Total Attacks Today:</strong> {todayAttacks}</p>
          <p><strong>Total Attacks:</strong> {totalAttacks}</p>
        </div>
      </div>
      <div className="btn-showhide">
        <p className="arrow">▼</p>
        <span className="Text_Attack">Attack Summary</span>
      </div>
    </>
  );
}

export default Count_Attack;