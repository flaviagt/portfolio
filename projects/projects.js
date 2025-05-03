import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

let query = '';

async function initProjects() {
  const projects = await fetchJSON('../lib/projects.json');
  const projectsContainer = document.querySelector('.projects');
  const projectsTitle = document.querySelector('.projects-title');
  const searchInput = document.querySelector('.searchBar');

  if (projectsTitle) {
    projectsTitle.textContent = `Projects (${projects.length})`;
  }
  renderProjects(projects, projectsContainer, 'h2');

  // Initial pie chart and legend render
  renderPieChart(projects);

  // Search functionality
  searchInput.addEventListener('input', (event) => { // Using 'input' for real-time updates
    query = event.target.value;
    const filteredProjects = projects.filter((project) => {
      const values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
  });
}

// Refactor pie chart and legend rendering
function renderPieChart(projectsGiven) {
  // Clear existing SVG paths and legend items
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  // Re-calculate rolled data
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  // Re-calculate data for pie chart
  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // Re-calculate pie chart
  let sliceGenerator = d3.pie().value((d) => d.value);
  let slices = sliceGenerator(data);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let arcs = slices.map((d) => arcGenerator(d));

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Update pie chart paths
  arcs.forEach((arc, index) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(index));
  });

  // Update legend
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

initProjects();