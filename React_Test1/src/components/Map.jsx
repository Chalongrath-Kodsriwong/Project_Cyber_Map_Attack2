import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import topojsonData from "../assets/110m.json"; // Import TopoJSON
import "./css/Map.css";
import { setupMapAnimation } from "./JS/map_Fun.js";

const Map = () => {
  const mapRef = useRef();
  const [selfLocation] = useState({
    latitude: 13.736717, // Fixed latitude (Example: Bangkok, Thailand)
    longitude: 100.523186, // Fixed longitude (Example: Bangkok, Thailand)
  });
  const [attackData, setAttackData] = useState([]);

  // Fixed Positions for Thailand and Singapore
  const fixedPositions = [
    {
      latitude: 13.736717,
      longitude: 100.523186,
      label: "TH",
      color: "#FFA500", // สีส้ม
    },
    {
      latitude: 1.290270,
      longitude: 103.851959,
      label: "SG",
      color: "#FF4500", // สีแดงส้ม
    },
  ];

  // Colors for attack types
  const attackTypeColors = {
    "Web server 400 error code.": "#DCFFB7", // สีเหลือง
    "CMS (WordPress or Joomla) login attempt.": "#00DFA2", // สีเขียว
    "Botnet Activity Detected and Blocked": "#FF204E", // สีแดงเข้ม
    "High amount of POST requests in a small period of time (likely bot).": "#FF8D29", // สีส้ม
    "Multiple web server 400 error codes from same source ip.": "#F35588", // สีชมพู
    "WAF Alert: Request Blocked.": "#C2FFD9", // สีมิ้น
    "pure-ftpd: Multiple connection attempts from same source.": "#12CAD6", // สีฟ้าสดใส
    "pure-ftpd: FTP Authentication success.": "#0FABBC", // สีฟ้าสว่าง
    "Query cache denied (probably config error).": "#5628B4", // สีม่วงเข้ม
    "Simple shell.php command execution.": "#204969", // สีน้ำเงินเข้้ม
    "SQL injection attempt.": "#A4F6A5", // สีเขียวอ่อน
    "sshd Attempt to login using a non-existent user": "#FF0000", // สีแดง
    "Dovecot Authentication Success.": "#15F5BA", // สีเขียว
    Unknown: "#F8DE22", // สีเหลือง
  };


  useEffect(() => {
    const width = 960;
    const height = 500;

    const svg = d3
      .select(mapRef.current)
      .attr("viewBox", `0 40 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      // .style("background-color", "#0a0f1c");

    const projection = d3
      .geoNaturalEarth1()
      .scale(150)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const countries = feature(topojsonData, topojsonData.objects.countries);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "#161D6F")
      .style("border-radius", "4px")
      .style("padding", "2px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 22);

    // Draw the world map
    svg
      .selectAll("path")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#9AA6B2")
      .attr("stroke", "#35495e")
      .attr("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        tooltip
          .style("opacity", 1)
          .html(`${d.properties.name}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .style("color", "#39B5E0");

        d3.select(this).attr("fill", "#84F2D6"); // Highlight color on hover
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
        d3.select(this).attr("fill", "#9AA6B2"); // Reset color
      });

    // Add fixed positions for Thailand and Singapore
    fixedPositions.forEach((position) => {
      const [fixedX, fixedY] = projection([position.longitude, position.latitude]);
    
      // Add marker (circle)
      svg
        .append("circle")
        .attr("class", "marker-circle") // Add CSS class
        .attr("cx", fixedX)
        .attr("cy", fixedY)
        .attr("r", 3.5) // Slightly larger for emphasis
        .style("z-index", "21")
        .attr("fill", position.color)
    
      // Add text with background rectangle
      const textPadding = 6; // Padding around the text
      const fontSize = 8; // Font size for the text
    
      // Measure text dimensions
      const textWidth = position.label.length * fontSize * 1; // Approximate text width
      const textHeight = fontSize + textPadding; // Text height including padding
    
      // Add background rectangle
      const bgRect = svg
        .append("rect")
        .attr("class", "bg_textLo")
        .attr("x", fixedX + 10) // Offset to the right of the circle
        .attr("y", fixedY - textHeight / 2.5) // Center the rectangle vertically with the circle
        .attr("width", textWidth + textPadding)
        .attr("height", textHeight)
        .attr("rx", 5) // Rounded corners
        .attr("ry", 5)
        .attr("fill", "#1D3557") // Background color
        .attr("opacity", 0.8) // Slight transparency
        .style("cursor", "pointer") // Add pointer cursor on hover
        .style("z-index", "99")
        .style("transition", "0.5s")
        .on("mouseenter", () => {
          textLabel.text(`RUKCOM Server ${position.label}`); // Add "s" to text
          bgRect
          .attr("width", 78 + 8)
        })
        .on("mouseleave", () => {
          textLabel.text(position.label); // Revert to original text
          bgRect
          .attr("width", textWidth + textPadding)
        });
    
      // Add text label
      const textLabel = svg
      .append("text")
      .attr("class", "text_Lo")
      .attr("x", fixedX + 15)
      .attr("y", fixedY + 4)
      .attr("fill", "#50c3e9")
      .style("font-size", `${fontSize}px`)
      .style("font-family", "Arial, sans-serif")
      .text(position.label)
      .style("cursor", "pointer") // Add pointer cursor on hover
      .style("z-index", "99")
      .on("mouseenter", () => {
        textLabel.text(`RUKCOM Server ${position.label}`); // Add "s" to text
        bgRect
          .attr("width", 78 + 8)
      })
      .on("mouseleave", () => {
        textLabel.text(position.label); // Revert to original text
        bgRect
          .attr("width", textWidth + textPadding)
      });
    
    });
    

    const fetchAttackData = async () => {
      try {
        const [latestResponse, mitreResponse] = await Promise.all([
          fetch("http://localhost:5000/api/latest_alert"),
          fetch("http://localhost:5000/api/mitre_alert"),
        ]);

        if (!latestResponse.ok || !mitreResponse.ok) {
          throw new Error("Error fetching API data");
        }
        const data = await response.json();

        const filteredData = data
          .map((item) => {
            const geoLocation = item._source.GeoLocation || {};
            const agentName = item._source.agent?.name || "";
            const target = agentName.startsWith("sg")
              ? fixedPositions[1] // Singapore
              : fixedPositions[0]; // Default to Thailand

            return {
              id: item._id,
              latitude: geoLocation.location?.lat,
              longitude: geoLocation.location?.lon,
              type: item._source?.rule?.description || "Unknown",
              targetLatitude: target.latitude,
              targetLongitude: target.longitude,
            };
          })
          .filter((item) => item.latitude && item.longitude);

        setAttackData(filteredData);
      } catch (error) {
        console.error("Error fetching attack data:", error);
      }
    };

    fetchAttackData();

    const intervalId = setInterval(fetchAttackData, 1000); // Fetch data every 2 seconds

    return () => clearInterval(intervalId); // Cleanup interval
  }, []);

  useEffect(() => {
    const svg = d3.select(mapRef.current);

    const drawCannonballWithTrail = async (data) => {
      const projection = d3
        .geoNaturalEarth1()
        .scale(150)
        .translate([960 / 2, 500 / 2]);

      for (const attack of data) {
        const { longitude, latitude, type, targetLatitude, targetLongitude } = attack;

        if (!longitude || !latitude) continue;

        const [x, y] = projection([longitude, latitude]);
        const [targetX, targetY] = projection([targetLongitude, targetLatitude]);

        const attackColor = attackTypeColors[type] || "#FFFFFF"; // Default to white if type not found

        // Create a curved line
        const curve = d3
          .line()
          .x((d) => d[0])
          .y((d) => d[1])
          .curve(d3.curveBasis);

        const midX = (x + selfX) / 2;
        const midY = (y + selfY) / 2 - 50;

        const lineData = [
          [x, y],
          [midX, midY],
          [selfX, selfY],
        ];

        const pathElement = svg
          .append("path")
          .datum(lineData)
          .attr("d", curve)
          .attr("stroke", "red")
          .attr("stroke-width", 1)
          .attr("fill", "none")
          .attr("stroke-linecap", "round")
          .attr("stroke-dasharray", function () {
            return this.getTotalLength();
          })
          .attr("stroke-dashoffset", function () {
            return this.getTotalLength();
          });

        // Animate the line
        await new Promise((resolve) => {
          pathElement
            .transition()
            .duration(1500)
            .ease(d3.easeQuadInOut)
            .attr("stroke-dashoffset", 0)
            .on("end", resolve);
        });

        // Add the cannonball
        const cannonball = svg
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 1.5)
          .attr("fill", "red")
          .style("filter", "url(#glow)");

        // Create the curve trajectory
        const midX = (x + selfX) / 2;
        const midY = Math.min((y + selfY) / 2 - 100, 500); // Adjust for curve height

        await new Promise((resolve) => {
          cannonball
            .transition()
            .duration(2000)
            .ease(d3.easeQuadInOut)
            .attrTween("cx", function () {
              return function (t) {
                // Quadratic Bezier curve calculation
                const currentX =
                  (1 - t) * (1 - t) * x + 2 * (1 - t) * t * midX + t * t * selfX;
                const currentY =
                  (1 - t) * (1 - t) * y + 2 * (1 - t) * t * midY + t * t * selfY;

                // Add fading trail lines
                trailGroup
                  .append("line")
                  .attr("x1", currentX)
                  .attr("y1", currentY)
                  .attr("x2", currentX + 1)
                  .attr("y2", currentY + 1)
                  .attr("stroke", attackColor)
                  .attr("stroke-width", 0.5)
                  .transition()
                  .duration(200)
                  .style("opacity", 0)
                  .style("z-index", "21")
                  .on("end", function () {
                    d3.select(this).remove(); // Remove line after fading
                  });

                return currentX;
              };
            })
            .attrTween("cy", function () {
              return function (t) {
                return y + (selfY - y) * t;
              };
            })
            .on("end", () => {
              // Add the target radiating circle
              // วงกลมกระจายที่ตำแหน่ง server ที่โดนโจมตี
              svg
                .append("circle")
                .attr("cx", targetX)
                .attr("cy", targetY)
                .attr("r", 0)
                .attr("fill", attackColor)
                .attr("opacity", 0.5)
                .transition()
                .duration(1000)
                .attr("r", 15)
                .attr("opacity", 0)
                .style("z-index", "21")
                .remove();

              cannonball.transition().duration(500).attr("r", 0).remove();
              resolve();
            });
        });

        // Cleanup trail after animation
        trailGroup.transition().delay(1000).remove();

        // Delay before drawing the next cannonball
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    drawCannonballWithTrail(attackData);
  }, [attackData]);

  return <svg ref={mapRef}></svg>;
};

export default Map;
