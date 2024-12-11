import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import topojsonData from "../../assets/110m.json"; // Import TopoJSON
import "./css/Map.css";

const Map = () => {
  const mapRef = useRef();
  const [selfLocation] = useState({
    latitude: 13.736717, // Fixed latitude (Example: Bangkok, Thailand)
    longitude: 100.523186, // Fixed longitude (Example: Bangkok, Thailand)
  });
  const [attackData, setAttackData] = useState([]); // Real-time attack data
  const [attackColors, setAttackColors] = useState({}); // Store attack type colors

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

    const fetchAttackData = async () => {
      try {
        // Fetch data from the two APIs
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

        // Map attack types to colors dynamically
        const newAttackColors = { ...attackColors };
        combinedData.forEach((item) => {
          const attackType = item._source?.rule?.description || "Unknown";
          if (!newAttackColors[attackType]) {
            newAttackColors[attackType] = d3.schemeCategory10[
              Object.keys(newAttackColors).length % 10
            ]; // Use D3 color scheme
          }
        });

        setAttackColors(newAttackColors);

        // Filter and map the data to extract latitude and longitude
        const filteredData = combinedData
          .map((item) => {
            const geoLocation = item._source.GeoLocation || {};
            return {
              id: item._id,
              latitude: geoLocation.location?.lat,
              longitude: geoLocation.location?.lon,
              type: item._source?.rule?.description || "Unknown", // Add attack type
            };
          })
          .filter((item) => item.latitude && item.longitude); // Ensure valid latitude/longitude

        setAttackData(filteredData);
      } catch (error) {
        console.error("Error fetching attack data:", error);
      }
    };

    fetchAttackData();

    const intervalId = setInterval(fetchAttackData, 1000); // Fetch data every second

    return () => clearInterval(intervalId); // Cleanup interval
  }, [attackColors]);

  useEffect(() => {
    const svg = d3.select(mapRef.current);

    const drawCannonballWithTrail = async (data) => {
      const projection = d3
        .geoNaturalEarth1()
        .scale(150)
        .translate([960 / 2, 500 / 2]);

      for (const attack of data) {
        const { longitude, latitude, type } = attack;

        if (!longitude || !latitude || !selfLocation) continue;

        const [x, y] = projection([longitude, latitude]);
        const [selfX, selfY] = projection([
          selfLocation.longitude,
          selfLocation.latitude,
        ]);

        const attackColor = attackColors[type] || "red"; // Use color from attack type

        // Add a trail group for fading lines
        const trailGroup = svg.append("g");

        // Add the cannonball
        const cannonball = svg
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 1.5)
          .attr("fill", attackColor) // Set color dynamically
          .style("filter", "url(#glow)");

        // Create the curve trajectory
        const midX = (x + selfX) / 2;
        const midY = Math.min((y + selfY) / 2 - 100, 500); // Adjust for curve height

        await new Promise((resolve) => {
          cannonball
            .transition()
            .duration(2000)
            .ease(d3.easeQuadInOut)
            .attrTween("transform", function () {
              return function (t) {
                // Quadratic Bezier curve calculation
                const currentX =
                  (1 - t) * (1 - t) * x + 2 * (1 - t) * t * midX + t * t * selfX;
                const currentY =
                  (1 - t) * (1 - t) * y + 2 * (1 - t) * t * midY + t * t * selfY;

                // Add fading trail lines dynamically
                trailGroup
                  .append("line")
                  .attr("x1", currentX)
                  .attr("y1", currentY)
                  .attr("x2", currentX + 1)
                  .attr("y2", currentY + 1)
                  .attr("stroke", attackColor) // Use color dynamically
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

        // Delay before drawing the next cannonball
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    // Add glow effect filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    filter
      .append("feMerge")
      .selectAll("feMergeNode")
      .data(["coloredBlur", "SourceGraphic"])
      .enter()
      .append("feMergeNode")
      .attr("in", (d) => d);

    drawCannonballWithTrail(attackData);
  }, [attackData, attackColors]);

  return <svg ref={mapRef}></svg>;
};

export default Map;
