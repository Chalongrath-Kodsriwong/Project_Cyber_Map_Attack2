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
  const [attackData, setAttackData] = useState([]); // Real-time attack data

  useEffect(() => {
    const width = 960;
    const height = 500;

    const svg = d3
      .select(mapRef.current)
      .attr("viewBox", `0 40 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("background-color", "#0a0f1c") // Dark background
      .style("background-image", "radial-gradient(circle at center, #0a0f1c, #000)")
      .style("background-size", "cover");

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
      .attr("fill", "transparent")
      .attr("stroke", "#1e2a38")
      .attr("stroke-width", 0.5);

    const fetchAttackData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/alerts");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log("Fetched Attackers Data:", data);

        const filteredData = data
          .map((item) => {
            const geoLocation = item._source.GeoLocation || {};
            return {
              id: item._id,
              latitude: geoLocation.location?.lat,
              longitude: geoLocation.location?.lon,
            };
          })
          .filter((item) => item.latitude && item.longitude); // Ensure valid latitude/longitude

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

    const drawBeam = async (data) => {
      const projection = d3
        .geoNaturalEarth1()
        .scale(150)
        .translate([960 / 2, 500 / 2]);

      for (const attack of data) {
        const { longitude, latitude } = attack;

        if (!longitude || !latitude || !selfLocation) continue;

        const [x, y] = projection([longitude, latitude]);
        const [selfX, selfY] = projection([
          selfLocation.longitude,
          selfLocation.latitude,
        ]);

        // Add glow dots at the source and destination
        svg
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 4)
          .attr("fill", "cyan")
          .attr("opacity", 0.8)
          .transition()
          .duration(2000)
          .style("opacity", 0)
          .remove();

        svg
          .append("circle")
          .attr("cx", selfX)
          .attr("cy", selfY)
          .attr("r", 6)
          .attr("fill", "cyan")
          .attr("opacity", 0.8)
          .transition()
          .duration(2000)
          .style("opacity", 0)
          .remove();

        // Draw the beam (line with glow effect)
        const line = svg
          .append("line")
          .attr("x1", x)
          .attr("y1", y)
          .attr("x2", x)
          .attr("y2", y)
          .attr("stroke", "cyan")
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.8)
          .style("filter", "url(#glow)");

        line
          .transition()
          .duration(2000)
          .ease(d3.easeQuadInOut)
          .attr("x2", selfX)
          .attr("y2", selfY)
          .on("end", () => {
            line
              .transition()
              .duration(500)
              .style("opacity", 0)
              .remove();
          });

        // Delay before drawing the next beam
        await new Promise((resolve) => setTimeout(resolve, 500));
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

    drawBeam(attackData);
  }, [attackData]);

  return <svg ref={mapRef}></svg>;
};

export default Map;
