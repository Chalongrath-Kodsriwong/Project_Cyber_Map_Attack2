import React, { useEffect, useState } from "react";
import "./css/Data_Attack.css";
import axios from "axios";
import { setupDataAttackerAnimation } from "./JS/data_attackerFun";

// Map Attack Type to Colors
const attackTypeColors = {
  "Web server 400 error code.": "#DCFFB7", // สีเหลือง
  "CMS (WordPress or Joomla) login attempt.": "#00DFA2", // สีเขียว
  "Botnet Activity Detected and Blocked": "#FF204E", // สีแดงเข้ม
  "High amount of POST requests in a small period of time (likely bot).":
    "#FF8D29", // สีส้ม
  "Multiple web server 400 error codes from same source ip.": "#F35588", // สีชมพู
  "WAF Alert: Request Blocked.": "#C2FFD9", // สีมิ้น
  "pure-ftpd: Multiple connection attempts from same source.": "#12CAD6", // สีฟ้าสดใส
  "pure-ftpd: FTP Authentication success.": "#0FABBC", // สีฟ้าสว่าง
  "Query cache denied (probably config error).": "#5628B4", // สีม่วงเข้ม
  "Simple shell.php command execution.": "#204969", // สีน้ำเงินเข้้ม
  "SQL injection attempt.": "#A4F6A5", // สีเขียวอ่อน
  "sshd Attempt to login using a non-existent user": "#FF0000", // สีแดง
  "Dovecot Authentication Success.": "#15F5BA", // สีเขียว
  "Common web attack.": "grey", // สีเขียว
  "URL too long. Higher than allowed on most browsers. Possible attack.":
    "#640D5F", // สีม่วง
  "Integrity checksum changed.": "#9ABF80", // สีเขียวขี้ม้า
  "XSS (Cross Site Scripting) attempt.": "#8D0B41", // สีแดงเลือดหมู
  Unknown: "#FFFFFF", // Default สีขาว
};

function Data_Attack() {
  const [attackers, setAttackers] = useState([]);

  useEffect(() => {
    const fetchAttackers = async () => {
      try {
        // เรียก API ด้วย Axios
        const response = await axios.get("http://localhost:5000/api/alerts");
        console.log(response.data); // Debug ข้อมูลที่ได้รับจาก API
        setAttackers(response.data); // ตั้งค่าข้อมูล attackers จาก response
      } catch (error) {
        console.error("Error fetching updated attackers data:", error);
      }
    };

    fetchAttackers();

    // ตั้ง Interval เพื่อดึงข้อมูลทุก 1 วินาที
    const intervalId = setInterval(fetchAttackers, 2000);

    // ล้าง Interval เมื่อ component ถูก unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setupDataAttackerAnimation();
  }, []);

  return (
    <div className="On_container">
      <p className="DataAttacker_log">Data_Attacker_Log</p>
      <div className="tableContainer">
        <div className="table">
          <div className="header">
            <div className="fa timestamp">Timestamp</div>
            <div className="fa description">Attack Type</div>
            <div className="fa country_name">Attack Country</div>
            <div className="fa agent_id">Agent ID</div>
            <div className="fa agent_ip">Agent IP</div>
            <div className="fa target_server">Target Server</div>
          </div>
          <div className="data">
            {attackers.map((attacker, index) => {
              const source = attacker._source || {};
              const geoLocation = source.GeoLocation || {};
              const agent = source.agent || {};
              const agentIP = source.data || {};
              const rule = source.rule || {};
              const attackType = rule.description || "Unknown";

              return (
                <div key={index} className="row">
                  <div className="fa timestamp">
                    {addHours(source["@timestamp"], 7)}
                  </div>

                  {/* Attack Description */}
                  <div className="fa description">
                    {rule.description || "N/A"}
                  </div>

                  {/* GeoLocation: Country */}
                  <div className="fa country_name">
                    {geoLocation.country_name || "N/A"}
                  </div>

                  {/* Agent ID */}
                  <div className="fa agent_id">{agent.id || "N/A"}</div>

                  {/* Agent IP */}
                  <div className="fa agent_ip">{agent.ip || "N/A"}</div>

                  {/* Target Server */}
                  <div className="fa target_server">{agent.name || "N/A"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Data_Attack;
