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

  // D3 pie chart
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let data = [1, 2];
  let total = 0;

  for (let d of data) {
    total += d;
  }

  let angle = 0;
  let arcData = [];

  for (let d of data) {
    let endAngle = angle + (d / total) * 2 * Math.PI;
    arcData.push({ startAngle: angle, endAngle });
    angle = endAngle;
  }

  let arcs = arcData.map((d) => arcGenerator(d));
  let colors = ['gold', 'purple'];

  arcs.forEach((arc, idx) => {
    d3.select('svg')
      .append('path')
      .attr('d', arc)
      .attr('fill', colors[idx]);
  });
}
initProjects();