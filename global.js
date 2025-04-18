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
    : "/website/";         // Your GitHub Pages repo name
  
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
  