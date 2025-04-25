console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// let navLinks = Array.from(document.querySelectorAll("nav a"));

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );

// if (currentLink) {
//   currentLink.classList.add('current');
// }

// let pages = [
//     { url: '', title: 'Home' },
//     { url: 'projects/', title: 'Projects' },
//     { url: 'resume/', title: 'Resume' },
//     { url: 'contact/', title: 'Contact' },
//     // add the rest of your pages here
// ];
  
// let nav = document.createElement('nav');
// document.body.prepend(nav);


// for (let p of pages) {
//     let url = p.url;
//     let title = p.title;
//     // Create link and add it to nav
//     nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
// }

// const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
//   ? "/"                  // Local server
//   : "/website/";         // GitHub Pages repo name

//   for (let p of pages) {
//     let url = p.url;
//     let title = p.title;
  
//     // Adjust URL if it's a relative link
//     url = !url.startsWith('http') ? BASE_PATH + url : url;
  
//     // Create the <a> element
//     let a = document.createElement('a');
//     a.href = url;
//     a.textContent = title;
  
//     // Highlight current page
//     if (a.host === location.host && a.pathname === location.pathname) {
//       a.classList.add('current');
//     }
  
//     // Open external links in new tab
//     if (a.host !== location.host) {
//       a.target = "_blank";
//     }
  
//     // Add the link to the nav
//     nav.append(a);
//   }

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    console.log(response); // For debugging
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';
  if (projects.length === 0) {
    containerElement.innerHTML = '<p>No projects available.</p>';
    return;
  }
  projects.forEach(projectItem => {
    const article = document.createElement('article');
    article.innerHTML = `
        <${headingLevel}>${projectItem.title}</${headingLevel}>
        <img src="${projectItem.image}" alt="${projectItem.title}">
        <p>${projectItem.description}</p>
    `;
    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/flaviagt', title: 'GitHub' }
  ];
  
  let nav = document.createElement('nav');
  document.body.prepend(nav);
  
  const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"                  // Local development
    : "/portfolio/";         // Your GitHub Pages repo name
  
  for (let p of pages) {
    let url = p.url;
    let title = p.title;
  
    url = !url.startsWith('http') ? BASE_PATH + url : url;
  
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
  
    if (a.host === location.host && a.pathname === location.pathname) {
      a.classList.add('current');
    }
  
    if (a.host !== location.host) {
      a.target = "_blank";
    }
  
    nav.append(a);
  }
  
  // Insert the Theme Switcher into the page
document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select id="theme-selector">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );

  // Get reference to the select element
let themeSelect = document.getElementById('theme-selector');

if ("colorScheme" in localStorage) {
    let savedScheme = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', savedScheme);
    themeSelect.value = savedScheme;
  }
  
  // When the user changes the dropdown, apply and save the new theme
  themeSelect.addEventListener('input', function(event) {
    let newScheme = event.target.value;
    document.documentElement.style.setProperty('color-scheme', newScheme);
    localStorage.colorScheme = newScheme;
  });  

