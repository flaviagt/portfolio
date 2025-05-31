import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

async function loadData() {
  try {
    const data = await d3.csv('loc.csv', (row) => {
      try {
        const datetime = new Date(`${row.date}T${row.time}${row.timezone}`);
        if (isNaN(datetime)) throw new Error('Invalid datetime');
        return {
          ...row,
          line: Number(row.line),
          depth: Number(row.depth),
          length: Number(row.length),
          date: new Date(row.date + 'T00:00' + row.timezone),
          datetime,
        };
      } catch (e) {
        console.warn(`Skipping invalid row: ${JSON.stringify(row)}`, e);
        return null;
      }
    }).then(data => data.filter(d => d !== null));
    console.log('Loaded data:', data); // Debug: Log raw data
    return data;
  } catch (e) {
    console.error('Failed to load loc.csv:', e);
    return [];
  }
}

function processCommits(data) {
  const commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/flaviagt/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: true,
        writable: true,
        enumerable: false,
      });

      return ret;
    })
    .sort((a, b) => a.datetime - b.datetime); // Sort by datetime
  console.log('Processed commits:', commits); // Debug: Log commits
  return commits;
}

function renderCommitInfo(data, commits) {
  const statsDiv = d3.select('#stats');
  statsDiv.selectAll('*').remove();

  statsDiv.append('h2')
    .text('Summary')
    .style('font-size', '24px')
    .style('margin-bottom', '10px');

  const dl = statsDiv.append('dl').attr('class', 'stats');

  dl.append('dt').text('Commits');
  dl.append('dd').text(commits.length);

  const numFiles = d3.group(data, (d) => d.file).size;
  dl.append('dt').text('Files');
  dl.append('dd').text(numFiles);

  dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
  dl.append('dd').text(data.length);

  const maxDepth = d3.max(data, (d) => d.depth);
  dl.append('dt').text('Max Depth');
  dl.append('dd').text(maxDepth || 'N/A');

  const longestLine = d3.max(data, (d) => d.length);
  dl.append('dt').text('Longest Line');
  dl.append('dd').text(longestLine || 'N/A');

  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file
  );
  const maxLines = d3.max(fileLengths, (d) => d[1]);
  dl.append('dt').text('Max Lines');
  dl.append('dd').text(maxLines || 'N/A');
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) {
    console.warn('Empty commit object');
    return;
  }

  try {
    link.href = commit.url || '#';
    link.textContent = commit.id || 'Unknown';
    date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' }) || 'Unknown';
    time.textContent = commit.datetime?.toLocaleString('en', { timeStyle: 'short' }) || 'Unknown';
    author.textContent = commit.author || 'Unknown';
    lines.textContent = commit.totalLines || '0';
  } catch (e) {
    console.error('Error rendering tooltip:', e);
  }
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
}

let xScale, yScale;
let filteredCommits = null;
let data = null;
let commits = null;

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection, commits) {
  const selectedCommits = selection
    ? filteredCommits.filter((d) => isCommitSelected(selection, d))
    : [];
  
  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
  
  return selectedCommits;
}

function renderLanguageBreakdown(selection, commits) {
  const selectedCommits = selection
    ? filteredCommits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : filteredCommits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

function brushed(event, commits) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d) && filteredCommits.includes(d)
  );
  renderSelectionCount(selection, commits);
  renderLanguageBreakdown(selection, commits);
}

function updateFileDisplay(filteredCommits) {
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
      (enter) =>
        enter.append('div').call((div) => {
          div.append('dt').html((d) => `<code>${d.name}</code><br><small>${d.lines.length} lines</small>`);
          div.append('dd');
        }),
      (update) =>
        update.call((div) => {
          div.select('dt').html((d) => `<code>${d.name}</code><br><small>${d.lines.length} lines</small>`);
        }),
      (exit) => exit.remove()
    );

  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .style('background', (d) => colors(d.type));
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  if (!commits || commits.length === 0) {
    console.warn('No commits to render in scatter plot');
    d3.select('#chart .no-data-message').style('display', 'block');
    return;
  }
  d3.select('#chart .no-data-message').style('display', 'none');

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, d3.max(commits, d => d.hourFrac) || 24])
    .range([usableArea.bottom, usableArea.top]);

  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines
    .call(d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
    );

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis')
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis')
    .call(yAxis);

  svg.call(d3.brush().on('start brush end', (event) => brushed(event, commits)));
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  let svg = d3.select('#chart').select('svg');
  if (svg.empty()) {
    console.warn('No SVG found, creating new one');
    svg = d3.select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  }

  if (!commits || commits.length === 0) {
    console.warn('No commits to update in scatter plot');
    d3.select('#chart .no-data-message').style('display', 'block');
    return;
  }
  d3.select('#chart .no-data-message').style('display', 'none');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  const xAxisGroup = svg.select('g.x-axis');
  if (xAxisGroup.empty()) {
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${usableArea.bottom})`);
  }
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');
  if (dots.empty()) {
    console.warn('No dots group found, creating new one');
    svg.append('g').attr('class', 'dots');
  }

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

function onStepEnter(response) {
  const commitDate = response.element.__data__.datetime;
  console.log('Step entered, commit date:', commitDate); // Debug: Log commit date
  filteredCommits = commits.filter((d) => d.datetime <= commitDate);
  console.log('Filtered commits for scroll:', filteredCommits); // Debug: Log filtered commits
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}

async function init() {
  data = await loadData();
  commits = processCommits(data);
  if (commits.length === 0) {
    console.warn('No commits processed!');
    d3.select('#chart .no-data-message').style('display', 'block');
    return;
  }

  filteredCommits = commits;

  renderCommitInfo(data, filteredCommits);
  renderScatterPlot(data, commits);
  updateFileDisplay(filteredCommits);

  d3.select('#scatter-story')
    .selectAll('.step')
    .data(commits)
    .join('div')
    .attr('class', 'step')
    .html(
      (d, i) => `
        On ${d.datetime.toLocaleString('en', {
          dateStyle: 'full',
          timeStyle: 'short',
        })},
        I made <a href="${d.url}" target="_blank">${
          i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
        }</a>.
        I edited ${d.totalLines} lines across ${
          d3.rollups(
            d.lines,
            (D) => D.length,
            (d) => d.file,
          ).length
        } files.
        Then I looked over all I had made, and I saw that it was very good.
      `,
    );

  const scroller = scrollama();
  scroller
    .setup({
      container: '#scrolly-1',
      step: '#scrolly-1 .step',
      offset: 0.5, // Trigger at midpoint of viewport
    })
    .onStepEnter(onStepEnter);

  // Force resize to ensure Scrollama calculates layout correctly
  window.dispatchEvent(new Event('resize'));
}

init();