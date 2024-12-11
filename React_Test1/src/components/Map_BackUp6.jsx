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
    "Web server 400 error code.": "#FF0000", // สีแดง
    "CMS (WordPress or Joomla) login attempt.": "#00FF00", // สีเขียว
    "Botnet Activity Detected and Blocked": "#0000FF", // สีน้ำเงิน
    Unknown: "#FFFF00", // สีเหลือง
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

    // Draw the world map
    svg
      .selectAll("path")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#1e2a38")
      .attr("stroke", "#35495e")
      .attr("stroke-width", 0.5);

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

        // Add the cannonball
        const cannonball = svg
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 1.5)
          .attr("fill", attackColor)
          .style("filter", "url(#glow)");

        // Create a radiating circle from the origin
        const radiatingCircle = svg
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 1)
          .attr("fill", "none")
          .attr("stroke", attackColor)
          .attr("stroke-width", 1)
          .style("opacity", 1);

        radiatingCircle
          .transition()
          .duration(1500)
          .attr("r", 15) // Increase radius for effect
          .style("opacity", 0) // Fade out
          .on("end", () => radiatingCircle.remove());

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
