/* ==========================================================================
   STERLING SPORTSMEN ASSOCIATION - JAVASCRIPT
   Single-page app: persistent header/footer + client-side router that
   swaps route fragments (resources/pages/*.html) into #app-view.
   ========================================================================== */

// ==========================================================================
// INTERVAL TRACKING (so slideshow timers from a route we've left get
// cleared instead of piling up on detached DOM nodes)
// ==========================================================================
let activeIntervals = [];

function trackInterval(id) {
  activeIntervals.push(id);
  return id;
}

function clearActiveIntervals() {
  activeIntervals.forEach(id => clearInterval(id));
  activeIntervals = [];
}

// ==========================================================================
// ROUTES
// ==========================================================================
const ROUTES = {
  "/": {
    title: "Sterling Sportsmen Association",
    fragment: "resources/pages/home.html",
    init: initHomePage,
  },
  "/about": {
    title: "About Us | Sterling Sportsmen Association",
    fragment: "resources/pages/about.html",
    init: null,
  },
  "/facilities": {
    title: "Club Facilities | Sterling Sportsmen Association",
    fragment: "resources/pages/facilities.html",
    init: initFacilitiesPage,
  },
  "/events": {
    title: "Events & Activities | Sterling Sportsmen Association",
    fragment: "resources/pages/events.html",
    init: initEventsPage,
  },
  "/raffles": {
    title: "Upcoming Raffles | Sterling Sportsmen Association",
    fragment: "resources/pages/raffles.html",
    init: null,
  },
  "/membership": {
    title: "Membership & Application | Sterling Sportsmen Association",
    fragment: "resources/pages/membership.html",
    init: null,
  },
  "/contact": {
    title: "Contact Us | Sterling Sportsmen Association",
    fragment: "resources/pages/contact.html",
    init: initContactPage,
  },
};

let headerLoadedPromise = Promise.resolve();

function normalizePath(pathname) {
  let p = pathname || "/";
  if (p.endsWith(".html")) p = p.slice(0, -5);
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if (p === "/index" || p === "") p = "/";
  return p;
}

// ==========================================================================
// HEADER / FOOTER (loaded once, persist across route changes)
// ==========================================================================
function loadHeaderFooter() {
  const headerContainer = document.getElementById("header-placeholder");
  const headerPromise = headerContainer
    ? fetch("resources/header.html")
        .then(response => {
          if (!response.ok) throw new Error("Header file not found");
          return response.text();
        })
        .then(data => {
          headerContainer.innerHTML = data;

          const menuToggle = headerContainer.querySelector(".mobile-menu-toggle");
          const navMenu = headerContainer.querySelector(".nav-menu");

          if (menuToggle && navMenu) {
            menuToggle.addEventListener("click", function () {
              menuToggle.classList.toggle("open");
              navMenu.classList.toggle("active");
            });
          }

          applyActiveNav(normalizePath(location.pathname));
        })
        .catch(err => console.error("Error loading header:", err))
    : Promise.resolve();

  const footerContainer = document.getElementById("footer-placeholder");
  const footerPromise = footerContainer
    ? fetch("resources/footer.html")
        .then(response => {
          if (!response.ok) throw new Error("Footer file not found");
          return response.text();
        })
        .then(data => {
          footerContainer.innerHTML = data;
        })
        .catch(err => console.error("Error loading footer:", err))
    : Promise.resolve();

  return Promise.all([headerPromise, footerPromise]);
}

function applyActiveNav(path) {
  const headerContainer = document.getElementById("header-placeholder");
  if (!headerContainer) return;

  const navLinks = headerContainer.querySelectorAll("nav a");
  navLinks.forEach(link => {
    const href = link.getAttribute("href") || "";
    const linkPath = href.startsWith("/") ? normalizePath(href) : null;
    link.classList.toggle("active", linkPath !== null && linkPath === path);
  });
}

function closeMobileMenu() {
  const headerContainer = document.getElementById("header-placeholder");
  if (!headerContainer) return;
  const menuToggle = headerContainer.querySelector(".mobile-menu-toggle");
  const navMenu = headerContainer.querySelector(".nav-menu");
  if (menuToggle) menuToggle.classList.remove("open");
  if (navMenu) navMenu.classList.remove("active");
}

// ==========================================================================
// ROUTER
// ==========================================================================
async function renderRoute(pathname) {
  const path = normalizePath(pathname);
  const route = ROUTES[path];
  const appView = document.getElementById("app-view");
  if (!appView) return;

  clearActiveIntervals();

  if (!route) {
    appView.innerHTML = `
      <section class="page-banner">
        <h1>PAGE NOT FOUND</h1>
        <p>Sorry, we couldn't find that page.</p>
      </section>
      <main class="container" style="text-align:center; padding: 40px 20px;">
        <a href="/">&larr; Return to Home</a>
      </main>
    `;
    document.title = "Page Not Found | Sterling Sportsmen Association";
    window.scrollTo(0, 0);
    headerLoadedPromise.then(() => applyActiveNav(path));
    return;
  }

  try {
    const res = await fetch(route.fragment);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    appView.innerHTML = await res.text();
  } catch (err) {
    console.error("Error loading page content:", err);
    appView.innerHTML = `<main class="container"><p style="color:red; padding: 40px 20px;">Failed to load page content.</p></main>`;
  }

  document.title = route.title;
  window.scrollTo(0, 0);
  headerLoadedPromise.then(() => applyActiveNav(path));

  if (typeof route.init === "function") {
    route.init();
  }
}

function navigate(path) {
  const target = normalizePath(path);
  if (target !== normalizePath(location.pathname)) {
    history.pushState(null, "", target);
  }
  renderRoute(target);
}

function handleLinkClick(e) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const link = e.target.closest("a");
  if (!link) return;
  if (link.target === "_blank" || link.hasAttribute("download")) return;

  let url;
  try {
    url = new URL(link.href, location.href);
  } catch (err) {
    return;
  }

  if (url.origin !== location.origin) return;

  const path = normalizePath(url.pathname);
  if (!ROUTES[path]) return;

  e.preventDefault();
  closeMobileMenu();
  navigate(path);
}

document.addEventListener("click", handleLinkClick);

window.addEventListener("popstate", function () {
  renderRoute(location.pathname);
});

document.addEventListener("DOMContentLoaded", function () {
  headerLoadedPromise = loadHeaderFooter();
  renderRoute(location.pathname);
});

// ==========================================================================
// HOME PAGE: HERO SLIDESHOW + EVENTS CALENDAR + ANNOUNCEMENTS
// ==========================================================================
function initHomePage() {
  // --- Hero banner slideshow ---
  const slides = document.querySelectorAll(".hero-slide");
  if (slides.length > 0) {
    let currentSlide = 0;
    const slideInterval = 5000;

    trackInterval(setInterval(() => {
      slides[currentSlide].classList.remove("active");
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add("active");
    }, slideInterval));
  }

  // --- Dynamic calendar generator (auto-detect current month) ---
  const monthSelect = document.getElementById("month-select");
  const calendarContainer = document.getElementById("calendar-container");

  if (monthSelect && calendarContainer) {
    let calendarData = {};

    fetch("resources/calendar-data.json?v=" + Date.now())
      .then(res => res.json())
      .then(data => {
        calendarData = data;

        monthSelect.innerHTML = "";
        Object.keys(calendarData).forEach(monthName => {
          const opt = document.createElement("option");
          opt.value = monthName;
          opt.textContent = monthName;
          monthSelect.appendChild(opt);
        });

        const now = new Date();
        const monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];

        const currentMonthKey = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

        let defaultMonth = currentMonthKey;
        if (!calendarData[currentMonthKey]) {
          defaultMonth = Object.keys(calendarData)[0];
        }

        monthSelect.value = defaultMonth;
        renderCalendar(defaultMonth);

        monthSelect.addEventListener("change", function () {
          renderCalendar(this.value);
        });
      })
      .catch(err => console.error("Error loading calendar data:", err));

    function renderCalendar(monthKey) {
      const info = calendarData[monthKey];
      if (!info) return;

      const year = info.year;
      const month = info.monthIndex;
      const events = info.events || {};

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      let html = `<table class="calendar-table">
        <thead>
          <tr><th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th></tr>
        </thead>
        <tbody><tr>`;

      for (let i = 0; i < firstDay; i++) {
        html += `<td></td>`;
      }

      let currentDay = 1;
      let dayOfWeek = firstDay;

      while (currentDay <= daysInMonth) {
        if (dayOfWeek === 7) {
          html += `</tr><tr>`;
          dayOfWeek = 0;
        }

        const eventText = events[currentDay.toString()];
        if (eventText) {
          html += `<td class="event-day" title="${eventText}" data-event="${eventText}" data-day="${currentDay}">${currentDay}</td>`;
        } else {
          html += `<td>${currentDay}</td>`;
        }

        currentDay++;
        dayOfWeek++;
      }

      while (dayOfWeek > 0 && dayOfWeek < 7) {
        html += `<td></td>`;
        dayOfWeek++;
      }

      html += `</tr></tbody></table>`;
      calendarContainer.innerHTML = html;

      const eventCells = calendarContainer.querySelectorAll("td.event-day");
      eventCells.forEach(cell => {
        cell.style.cursor = "pointer";
        cell.addEventListener("click", function () {
          const day = this.getAttribute("data-day");
          const evt = this.getAttribute("data-event");
          alert(`${monthKey} ${day}\nEvent: ${evt}`);
        });
      });
    }
  }

  // --- Dynamic announcements, pinned story & popup modal ---
  const pinnedContainer = document.getElementById("pinned-announcement");
  const newsScrollbox = document.getElementById("news-scrollbox");
  const newsModal = document.getElementById("news-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDate = document.getElementById("modal-date");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modal-close");

  if (pinnedContainer && newsScrollbox) {
    fetch("resources/announcements.json?v=" + Date.now())
      .then(res => res.json())
      .then(data => {
        pinnedContainer.innerHTML = "";
        newsScrollbox.innerHTML = "";

        const newsData = Array.isArray(data) ? data : (data.announcements || []);

        newsData.forEach(item => {
          const itemDiv = document.createElement("div");
          itemDiv.className = `announcement-item ${item.hasPopup ? 'clickable' : ''}`;

          if (item.pinned) {
            itemDiv.classList.add("pinned-item");
            itemDiv.innerHTML = `
              <span class="pinned-badge">📌 PINNED STORY</span>
              <h3>${item.title}</h3>
              <p>${item.summary}</p>
              ${item.hasPopup ? '<div class="news-click-hint">Click for details →</div>' : ''}
            `;
            pinnedContainer.appendChild(itemDiv);
          } else {
            itemDiv.innerHTML = `
              <h3>${item.title}</h3>
              <p>${item.summary}</p>
              ${item.hasPopup ? '<div class="news-click-hint">Click for details →</div>' : ''}
            `;
            newsScrollbox.appendChild(itemDiv);
          }

          if (item.hasPopup) {
            itemDiv.addEventListener("click", function () {
              if (modalTitle) modalTitle.innerText = item.title;
              if (modalDate) modalDate.innerText = item.date;
              if (modalBody) modalBody.innerHTML = item.fullContent;
              if (newsModal) newsModal.classList.add("open");
            });
          }
        });
      })
      .catch(err => console.error("Error loading announcements:", err));
  }

  if (modalClose && newsModal) {
    modalClose.addEventListener("click", () => newsModal.classList.remove("open"));
    newsModal.addEventListener("click", function (e) {
      if (e.target === newsModal) {
        newsModal.classList.remove("open");
      }
    });
  }
}

// ==========================================================================
// FACILITIES PAGE: MULTI-SLIDESHOW HANDLER
// ==========================================================================
function initFacilitiesPage() {
  const slideshows = document.querySelectorAll(".facility-slideshow");
  slideshows.forEach(slideshow => {
    const slides = slideshow.querySelectorAll(".facility-slide");
    if (slides.length < 2) return;

    let currentSlide = 0;
    const intervalTime = parseInt(slideshow.getAttribute("data-interval")) || 4000;

    trackInterval(setInterval(() => {
      slides[currentSlide].classList.remove("active");
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add("active");
    }, intervalTime));
  });
}

// ==========================================================================
// CONTACT PAGE: CONTACT FORM SUBMISSION
// ==========================================================================
function initContactPage() {
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");

  if (!contactForm) return;

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.innerText = "Sending...";
    formStatus.innerText = "";
    formStatus.style.color = "#333";

    const formData = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      subject: document.getElementById("subject").value,
      message: document.getElementById("message").value,
    };

    try {
      const response = await fetch("https://ssa-api.andrew-thorner.workers.dev/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        formStatus.style.color = "#2c5e3b";
        formStatus.innerText = "✓ Thank you! Your message has been sent successfully.";
        contactForm.reset();
      } else {
        throw new Error(result.error || "Failed to send message.");
      }
    } catch (err) {
      formStatus.style.color = "#a00000";
      formStatus.innerText = "✕ Error: " + err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Send Message";
    }
  });
}

// ==========================================================================
// EVENTS PAGE: DYNAMIC EVENTS RENDERER & LIGHTBOX BINDING
// ==========================================================================
async function initEventsPage() {
  const upcomingContainer = document.getElementById("upcoming-events-container");
  const pastContainer = document.getElementById("past-events-container");

  if (!upcomingContainer || !pastContainer) return;

  try {
    const res = await fetch("resources/events.json?v=" + Date.now());
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();

    // RENDER UPCOMING EVENTS
    if (data.upcoming && data.upcoming.length > 0) {
      const featuredList = data.upcoming.filter(e => e.featured);
      const gridList = data.upcoming.filter(e => !e.featured);

      let upcomingHtml = "";

      // Render full-width featured hero cards
      featuredList.forEach(e => {
        upcomingHtml += `
          <article class="event-card featured-event">
            <div class="event-img-container">
              <img src="${e.image}" alt="${e.title}" class="event-img">
              ${e.featuredBadge ? `<span class="featured-badge">${e.featuredBadge}</span>` : ''}
            </div>
            <div class="event-details">
              <h3>${e.title}</h3>
              <p class="event-date">${e.date}</p>
              ${e.location ? `<p class="event-location">${e.location}</p>` : ''}
              <p>${e.description}</p>
              ${e.extraNote ? `<p style="margin-top: 10px; font-weight: bold; color: #8b0000;">${e.extraNote}</p>` : ''}
            </div>
          </article>
        `;
      });

      // Render remaining events in a 2-column side-by-side grid
      if (gridList.length > 0) {
        upcomingHtml += `<div class="upcoming-grid">`;
        gridList.forEach(e => {
          upcomingHtml += `
            <article class="event-card">
              <div class="event-img-container">
                <img src="${e.image}" alt="${e.title}" class="event-img">
              </div>
              <div class="event-details">
                <h3>${e.title}</h3>
                <p class="event-date">${e.date}</p>
                ${e.location ? `<p class="event-location">${e.location}</p>` : ''}
                <p>${e.description}</p>
              </div>
            </article>
          `;
        });
        upcomingHtml += `</div>`;
      }

      upcomingContainer.innerHTML = upcomingHtml;
    } else {
      upcomingContainer.innerHTML = "<p>No upcoming events scheduled at this time.</p>";
    }

    // RENDER PAST EVENTS ARCHIVE
    if (data.past && data.past.length > 0) {
      pastContainer.innerHTML = data.past.map(e => `
        <div class="past-event-item ${e.hasGallery ? 'clickable' : ''}"
             ${e.hasGallery ? `data-gallery-title="${e.title}" data-gallery-folder="${e.galleryFolder}" data-photo-count="${e.photoCount}"` : ''}>
          <img src="${e.thumb}" alt="${e.title}" class="past-event-thumb">
          <div class="past-event-info">
            <h3>${e.title}</h3>
            <p class="past-event-date">${e.date}</p>
            <p>${e.description}</p>
          </div>
        </div>
      `).join('');
    } else {
      pastContainer.innerHTML = "<p>No past events found in archive.</p>";
    }

    // Bind lightbox event listeners to dynamic past items
    bindGalleryListeners();

  } catch (err) {
    console.error("Error loading events:", err);
    if (upcomingContainer) upcomingContainer.innerHTML = `<p style="color:red;">Failed to load upcoming events.</p>`;
    if (pastContainer) pastContainer.innerHTML = `<p style="color:red;">Failed to load past events archive.</p>`;
  }
}

// BIND GALLERY LIGHTBOX MODAL LISTENERS
function bindGalleryListeners() {
  const galleryModal = document.getElementById("gallery-modal");
  const galleryTitle = document.getElementById("gallery-modal-title");
  const mainImg = document.getElementById("gallery-main-img");
  const thumbsContainer = document.getElementById("gallery-thumbs-scroll");
  const galleryClose = document.getElementById("gallery-modal-close");
  const prevBtn = document.getElementById("gallery-prev-btn");
  const nextBtn = document.getElementById("gallery-next-btn");

  if (!galleryModal) return;

  let currentPhotos = [];
  let currentIndex = 0;

  function showPhoto(index) {
    if (currentPhotos.length === 0) return;

    if (index < 0) index = currentPhotos.length - 1;
    if (index >= currentPhotos.length) index = 0;

    currentIndex = index;
    mainImg.src = currentPhotos[currentIndex];

    const thumbs = thumbsContainer.querySelectorAll(".gallery-thumb-item");
    thumbs.forEach((t, i) => {
      if (i === currentIndex) {
        t.classList.add("active");
        t.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      } else {
        t.classList.remove("active");
      }
    });
  }

  document.querySelectorAll(".past-event-item.clickable").forEach(item => {
    item.addEventListener("click", function () {
      const title = this.getAttribute("data-gallery-title");
      const folderPath = this.getAttribute("data-gallery-folder");
      const photoCount = parseInt(this.getAttribute("data-photo-count")) || 0;

      if (photoCount === 0) return;

      currentPhotos = [];
      for (let i = 1; i <= photoCount; i++) {
        currentPhotos.push(`${folderPath}/${i}.webp`);
      }

      galleryTitle.innerText = title;
      thumbsContainer.innerHTML = "";

      currentPhotos.forEach((photoUrl, index) => {
        const thumb = document.createElement("img");
        thumb.src = photoUrl;
        thumb.className = `gallery-thumb-item ${index === 0 ? 'active' : ''}`;

        thumb.addEventListener("click", (e) => {
          e.stopPropagation();
          showPhoto(index);
        });

        thumbsContainer.appendChild(thumb);
      });

      showPhoto(0);
      galleryModal.classList.add("open");
    });
  });

  if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); showPhoto(currentIndex - 1); };
  if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); showPhoto(currentIndex + 1); };
  if (mainImg) mainImg.onclick = () => showPhoto(currentIndex + 1);

  document.onkeydown = function (e) {
    if (!galleryModal.classList.contains("open")) return;
    if (e.key === "ArrowLeft") showPhoto(currentIndex - 1);
    if (e.key === "ArrowRight") showPhoto(currentIndex + 1);
    if (e.key === "Escape") galleryModal.classList.remove("open");
  };

  if (galleryClose) galleryClose.onclick = () => galleryModal.classList.remove("open");

  galleryModal.onclick = function (e) {
    if (e.target === galleryModal) {
      galleryModal.classList.remove("open");
    }
  };

  // Fullscreen Toggle Logic
  const photoContainer = document.getElementById("main-photo-container");
  const fullscreenBtn = document.getElementById("gallery-fullscreen-btn");

  if (fullscreenBtn && photoContainer) {
    fullscreenBtn.onclick = function (e) {
      e.stopPropagation();

      if (!document.fullscreenElement) {
        if (photoContainer.requestFullscreen) {
          photoContainer.requestFullscreen();
        } else if (photoContainer.webkitRequestFullscreen) {
          photoContainer.webkitRequestFullscreen();
        }
        fullscreenBtn.innerHTML = "&times;";
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        fullscreenBtn.innerHTML = "&#10064;";
      }
    };

    document.onfullscreenchange = function () {
      if (!document.fullscreenElement) {
        fullscreenBtn.innerHTML = "&#10064;";
      }
    };
  }
}
