/* ==========================================================================
   STERLING SPORTSMEN ASSOCIATION - JAVASCRIPT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  
  // ==========================================================================
  // 1. LOAD SHARED HEADER
  // ==========================================================================
  const headerContainer = document.getElementById("header-placeholder");
  if (headerContainer) {
    fetch("resources/header.html")
      .then(response => {
        if (!response.ok) throw new Error("Header file not found");
        return response.text();
      })
      .then(data => {
        headerContainer.innerHTML = data;

        // Auto-highlight active navigation link
        const currentPage = window.location.pathname.split("/").pop() || "index.html";
        const navLinks = headerContainer.querySelectorAll("nav a");
        navLinks.forEach(link => {
          if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
          }
        });

        // Hamburger Menu Toggle
        const menuToggle = headerContainer.querySelector(".mobile-menu-toggle");
        const navMenu = headerContainer.querySelector(".nav-menu");

        if (menuToggle && navMenu) {
          menuToggle.addEventListener("click", function () {
            menuToggle.classList.toggle("open");
            navMenu.classList.toggle("active");
          });
        }
      })
      .catch(err => console.error("Error loading header:", err));
  }

  // ==========================================================================
  // 2. LOAD SHARED FOOTER
  // ==========================================================================
  const footerContainer = document.getElementById("footer-placeholder");
  if (footerContainer) {
    fetch("resources/footer.html")
      .then(response => {
        if (!response.ok) throw new Error("Footer file not found");
        return response.text();
      })
      .then(data => {
        footerContainer.innerHTML = data;
      })
      .catch(err => console.error("Error loading footer:", err));
  }

  // ==========================================================================
  // 3. HERO BANNER SLIDESHOW
  // ==========================================================================
  const slides = document.querySelectorAll(".hero-slide");
  if (slides.length > 0) {
    let currentSlide = 0;
    const slideInterval = 5000;

    function nextSlide() {
      slides[currentSlide].classList.remove("active");
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add("active");
    }

    setInterval(nextSlide, slideInterval);
  }

  // ==========================================================================
  // 4. MULTI-SLIDESHOW HANDLER (Facility Cards)
  // ==========================================================================
  const slideshows = document.querySelectorAll(".facility-slideshow");
  slideshows.forEach(slideshow => {
    const slides = slideshow.querySelectorAll(".facility-slide");
    if (slides.length < 2) return;

    let currentSlide = 0;
    const intervalTime = parseInt(slideshow.getAttribute("data-interval")) || 4000;

    setInterval(() => {
      slides[currentSlide].classList.remove("active");
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add("active");
    }, intervalTime);
  });

  // ==========================================================================
  // 5. DYNAMIC CALENDAR GENERATOR (AUTO-DETECT CURRENT MONTH)
  // ==========================================================================
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

  // ==========================================================================
  // 6. DYNAMIC ANNOUNCEMENTS, PINNED STORY & POPUP MODAL
  // ==========================================================================
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

  // ==========================================================================
  // 7. CONTACT FORM SUBMISSION
  // ==========================================================================
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");

  if (contactForm) {
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
  // 8. DYNAMIC EVENTS RENDERER & LIGHTBOX BINDING (events.html)
  // ==========================================================================
  async function renderEventsPage() {
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

      // Re-bind lightbox event listeners to dynamic past items
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

  // Trigger events page renderer
  renderEventsPage();

});
