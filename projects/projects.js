import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

async function initProjects() {
  const projects = await fetchJSON('../lib/projects.json');
  const projectsContainer = document.querySelector('.projects');
  const projectsTitle = document.querySelector('.projects-title');
  if (projectsTitle) {
    projectsTitle.textContent = `Projects (${projects.length})`;
  }
  renderProjects(projects, projectsContainer, 'h2');

  // Roll up project data by year using d3.rollups
  let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year
  );

  // Convert rolled data to pie chart format
  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // D3 pie chart with project data
  let sliceGenerator = d3.pie().value((d) => d.value);
  let slices = sliceGenerator(data);

  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let arcs = slices.map((d) => arcGenerator(d));

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Append pie chart paths
  arcs.forEach((arc, index) => {
    d3.select('#projects-pie-plot')
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(index));
  });

  // Create legend
  let legend = d3.select('.legend');
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}
initProjects();