import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

let query = '';
let selectedIndex = -1;
let initialData = []; // Store initial pie chart data
let initialArcs = []; // Store initial arc paths
let filteredProjects = []; // Store current filtered projects globally [NEW]

async function initProjects() {
  const projects = await fetchJSON('../lib/projects.json');
  const projectsContainer = document.querySelector('.projects');
  const projectsTitle = document.querySelector('.projects-title');
  const searchInput = document.querySelector('.searchBar');

  if (projectsTitle) {
    projectsTitle.textContent = `${projects.length} Projects`;
  }
  renderProjects(projects, projectsContainer, 'h2');

  // Initialize filteredProjects with all projects
  filteredProjects = projects; // [NEW]

  // Initial pie chart and legend render
  renderPieChart(projects);

  // Search functionality
  searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    filteredProjects = projects.filter((project) => {
      const values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    }); // Update global filteredProjects [MODIFIED]
    renderProjects(filteredProjects, projectsContainer, 'h2');
    updatePieChartFilter(filteredProjects);

    // Apply year filter if a slice is selected [NEW]
    if (selectedIndex !== -1) {
      filteredProjects = filteredProjects.filter(
        (project) => project.year === initialData[selectedIndex].label
      );
      renderProjects(filteredProjects, projectsContainer, 'h2');
      updatePieChartFilter(filteredProjects);
    }
  });

  // Function to render initial pie chart and legend
  function renderPieChart(projectsGiven) {
    // Clear existing SVG paths and legend items
    const svg = d3.select('#projects-pie-plot');
    svg.selectAll('path').remove();
    const legend = d3.select('.legend');
    legend.selectAll('li').remove();

    // Re-calculate rolled data (done once initially)
    let rolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year
    );

    // Store initial data for pie chart
    initialData = rolledData.map(([year, count]) => {
      return { value: count, label: year };
    });

    // Generate pie chart
    let sliceGenerator = d3.pie().value((d) => d.value);
    let slices = sliceGenerator(initialData);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    initialArcs = slices.map((d) => arcGenerator(d));

    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    // Append pie chart paths with click event
    initialArcs.forEach((arc, i) => {
      svg
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(i))
        .attr('class', selectedIndex === i ? 'selected' : '')
        .on('click', () => {
          selectedIndex = selectedIndex === i ? -1 : i; // Toggle selection

          // Update classes for paths
          svg
            .selectAll('path')
            .attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : ''));

          // Update classes for legend items
          legend
            .selectAll('li')
            .attr('class', (_, idx) =>
              selectedIndex === idx ? 'legend-item selected' : 'legend-item'
            );

          // Filter projects by selected year, starting from filteredProjects
          if (selectedIndex === -1) {
            filteredProjects = projects.filter((project) => {
              const values = Object.values(project).join('\n').toLowerCase();
              return values.includes(query.toLowerCase());
            }); // Reset to search filter only [MODIFIED]
          } else {
            filteredProjects = projects
              .filter((project) => {
                const values = Object.values(project).join('\n').toLowerCase();
                return values.includes(query.toLowerCase());
              })
              .filter((project) => project.year === initialData[selectedIndex].label); // Combine filters [MODIFIED]
          }
          renderProjects(filteredProjects, projectsContainer, 'h2');
          updatePieChartFilter(filteredProjects);
        });
    });

    // Append legend with click event
    initialData.forEach((d, idx) => {
      legend
        .append('li')
        .attr('class', selectedIndex === idx ? 'legend-item selected' : 'legend-item')
        .attr('style', `--color:${colors(idx)}`)
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on('click', () => {
          selectedIndex = selectedIndex === idx ? -1 : idx; // Toggle selection

          // Update classes for paths
          svg
            .selectAll('path')
            .attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : ''));

          // Update classes for legend items
          legend
            .selectAll('li')
            .attr('class', (_, idx) =>
              selectedIndex === idx ? 'legend-item selected' : 'legend-item'
            );

          // Filter projects by selected year, starting from filteredProjects
          if (selectedIndex === -1) {
            filteredProjects = projects.filter((project) => {
              const values = Object.values(project).join('\n').toLowerCase();
              return values.includes(query.toLowerCase());
            }); // Reset to search filter only [MODIFIED]
          } else {
            filteredProjects = projects
              .filter((project) => {
                const values = Object.values(project).join('\n').toLowerCase();
                return values.includes(query.toLowerCase());
              })
              .filter((project) => project.year === initialData[selectedIndex].label); // Combine filters [MODIFIED]
          }
          renderProjects(filteredProjects, projectsContainer, 'h2');
          updatePieChartFilter(filteredProjects);
        });
    });
  }

  // Function to update pie chart opacity based on filtered projects
  function updatePieChartFilter(projectsGiven) {
    const svg = d3.select('#projects-pie-plot');
    let rolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year
    );
    let currentData = rolledData.map(([year, count]) => year);

    svg
      .selectAll('path')
      .attr('class', (d, i) => {
        const year = initialData[i].label;
        return currentData.includes(year) ? (selectedIndex === i ? 'selected' : '') : 'unselected';
      });
  }
}

initProjects();