import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
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
    });
}

function renderCommitInfo(data, commits) {
  const statsDiv = d3.select('#stats');

  // Add "Summary" heading above the box
  statsDiv.append('h2')
    .text('Summary')
    .style('font-size', '24px')
    .style('margin-bottom', '10px');

  // Create the dl box with stats
  const dl = statsDiv.append('dl').attr('class', 'stats');

  // Commits
  dl.append('dt').text('Commits');
  dl.append('dd').text(commits.length);

  // Number of files
  const numFiles = d3.group(data, (d) => d.file).size;
  dl.append('dt').text('Files');
  dl.append('dd').text(numFiles);

  // Total LOC
  dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Max depth
  const maxDepth = d3.max(data, (d) => d.depth);
  dl.append('dt').text('Max Depth');
  dl.append('dd').text(maxDepth);

  // Longest line
  const longestLine = d3.max(data, (d) => d.length);
  dl.append('dt').text('Longest Line');
  dl.append('dd').text(longestLine);

  // Max lines (maximum file length in lines)
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file
  );
  const maxLines = d3.max(fileLengths, (d) => d[1]);
  dl.append('dt').text('Max Lines');
  dl.append('dd').text(maxLines);
}

let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);