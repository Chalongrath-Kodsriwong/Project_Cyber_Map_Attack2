import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import topojsonData from "../assets/110m.json"; // Import TopoJSON
import "./css/Map.css";

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
      label: "Thailand",
      color: "#FFA500", // สีส้ม
    },
    {
      latitude: 1.290270,
      longitude: 103.851959,
      label: "Singapore",
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
    "": "", // สี
    Unknown: "#F8DE22", // สีเหลือง
  };

  useEffect(() => {
    const width = 960;
    const height = 500;

    const svg = d3
      .select(mapRef.current)
      .attr("viewBox", `0 40 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("background-color", "#0a0f1c");

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
      .style("background-color", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("padding", "5px")
      .style("pointer-events", "none")
      .style("opacity", 0);

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
          .html(`<strong>Country:</strong> ${d.properties.name}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .style("color", "red");

        d3.select(this).attr("fill", "#FFCC00"); // Highlight color on hover
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
        .attr("cx", fixedX)
        .attr("cy", fixedY)
        .attr("r", 3)
        .attr("fill", position.color) // Use specified color
        .attr("stroke", "#FFFFFF")
        .attr("stroke-width", 0);

      // Add label
      svg
        .append("text")
        .attr("x", fixedX + 7)
        .attr("y", fixedY)
        .text(position.label)
        .attr("fill", "#FFFFFF")
        .style("font-size", "12px");
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

        const latestData = await latestResponse.json();
        const mitreData = await mitreResponse.json();

        const combinedData = [...latestData, ...mitreData];

        const filteredData = combinedData
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

    const intervalId = setInterval(fetchAttackData, 1000); // Fetch data every second

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

        // Add a trail group for fading lines
        const trailGroup = svg.append("g");

        // Add the source radiating circle
        const sourceCircle = svg
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 0)
          .attr("fill", attackColor)
          .attr("opacity", 0.5)
          .transition()
          .duration(1000)
          .attr("r", 20)
          .attr("opacity", 0)
          .remove();

        // Add the cannonball
        const cannonball = svg
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 1.5)
          .attr("fill", attackColor)
          .style("filter", "url(#glow)");

        // Create the curve trajectory
        const midX = (x + targetX) / 2;
        const midY = (y + targetY) / 2 - 100;

        await new Promise((resolve) => {
          cannonball
            .transition()
            .duration(2000)
            .ease(d3.easeQuadInOut)
            .attrTween("transform", function () {
              return function (t) {
                const currentX =
                  (1 - t) * (1 - t) * x + 2 * (1 - t) * t * midX + t * t * targetX;
                const currentY =
                  (1 - t) * (1 - t) * y + 2 * (1 - t) * t * midY + t * t * targetY;

                // Add fading trail lines dynamically
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
                  .on("end", function () {
                    d3.select(this).remove();
                  });

                return `translate(${currentX - x}, ${currentY - y})`;
              };
            })
            .on("end", () => {
              // Add the target radiating circle
              svg
                .append("circle")
                .attr("cx", targetX)
                .attr("cy", targetY)
                .attr("r", 0)
                .attr("fill", attackColor)
                .attr("opacity", 0.5)
                .transition()
                .duration(1000)
                .attr("r", 20)
                .attr("opacity", 0)
                .remove();

              cannonball.transition().duration(500).attr("r", 0).remove();
              resolve();
            });
        });

        // Cleanup trail after animation
        trailGroup.transition().delay(1000).remove();

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    drawCannonballWithTrail(attackData);
  }, [attackData]);

  return <svg ref={mapRef}></svg>;
};

export default Map;