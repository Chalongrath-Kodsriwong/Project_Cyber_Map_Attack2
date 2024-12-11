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

    const intervalId = setInterval(fetchAttackData, 2000); // Fetch data every 2 seconds

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
        const [selfX, selfY] = projection([
          selfLocation.longitude,
          selfLocation.latitude,
        ]);

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

        // Fade out and remove the path after animation
        pathElement
          .transition()
          .duration(1000)
          .style("opacity", 0)
          .on("end", () => {
            pathElement.remove();
          });

        // Add a red dot for the attacker's location
        const circle = svg
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 2)
          .attr("fill", "red")
          .attr("opacity", 1);

        // Fade out the dot after animation
        circle
          .transition()
          .duration(1500)
          .style("opacity", 0)
          .on("end", () => {
            circle.remove();
          });

        // Delay before drawing the next line
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    };

    drawCannonballWithTrail(attackData);
  }, [attackData]);

  return <svg ref={mapRef}></svg>;
};

export default Map;
