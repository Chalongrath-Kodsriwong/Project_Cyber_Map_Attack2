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

  useEffect(() => {
    const width = 960;
    const height = 500;

    const svg = d3
      .select(mapRef.current)
      .attr("viewBox", `0 40 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

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
      .attr("fill", "#f5f5f5")
      .attr("stroke", "#e0e0e0")
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

    const drawLine = (data) => {
      const projection = d3
        .geoNaturalEarth1()
        .scale(150)
        .translate([960 / 2, 500 / 2]);

      data.forEach((attack) => {
        const { longitude, latitude } = attack;

        if (!longitude || !latitude || !selfLocation) return;

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
        pathElement
          .transition()
          .duration(1500)
          .ease(d3.easeQuadInOut)
          .attr("stroke-dashoffset", 0)
          .on("end", () => {
            // Fade out and remove the path after animation
            pathElement
              .transition()
              .duration(1000)
              .style("opacity", 0)
              .on("end", () => {
                pathElement.remove();
              });
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
      });
    };

    drawLine(attackData);
  }, [attackData]);

  return <svg ref={mapRef}></svg>;
};

export default Map;