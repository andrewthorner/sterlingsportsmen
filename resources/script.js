/* ==========================================================================
   STERLING SPORTSMEN ASSOCIATION - JAVASCRIPT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  
// 1. LOAD SHARED HEADER
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

        // --- HAMBURGER MENU TOGGLE LOGIC ---
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

  // 2. LOAD SHARED FOOTER
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

  // 3. HERO BANNER SLIDESHOW (Runs if hero slides exist on page)
  const slides = document.querySelectorAll(".hero-slide");
  if (slides.length > 0) {
    let currentSlide = 0;
    const slideInterval = 5000; // 5 seconds per slide

    function nextSlide() {
      slides[currentSlide].classList.remove("active");
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add("active");
    }

    setInterval(nextSlide, slideInterval);
  }
// 4. MULTI-SLIDESHOW HANDLER (Runs slideshows for facility cards)
  const slideshows = document.querySelectorAll(".facility-slideshow");
  slideshows.forEach(slideshow => {
    const slides = slideshow.querySelectorAll(".facility-slide");
    if (slides.length < 2) return; // Skip if only 1 image

    let currentSlide = 0;
    const intervalTime = parseInt(slideshow.getAttribute("data-interval")) || 4000;

    setInterval(() => {
      slides[currentSlide].classList.remove("active");
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add("active");
    }, intervalTime);
  });

  // 5. MOBILE CALENDAR EVENT POPUP
  const eventDays = document.querySelectorAll(".calendar-table td.event-day");
  
  eventDays.forEach(day => {
    // Make the calendar cell look clickable/tappable
    day.style.cursor = "pointer";

    day.addEventListener("click", function () {
      const eventTitle = this.getAttribute("title");
      const dayNumber = this.innerText.trim();

      if (eventTitle) {
        alert(`September ${dayNumber}, 2026\nEvent: ${eventTitle}`);
      }
    });
  });
// ==========================================================================
  // DYNAMIC 12-MONTH CALENDAR GENERATOR (AUTO-DETECT CURRENT MONTH)
  // ==========================================================================
  const monthSelect = document.getElementById("month-select");
  const calendarContainer = document.getElementById("calendar-container");

  if (monthSelect && calendarContainer) {
    let calendarData = {};

    // Fetch calendar data JSON
    fetch("resources/calendar-data.json")
      .then(res => res.json())
      .then(data => {
        calendarData = data;

        // Populate dropdown options
        monthSelect.innerHTML = "";
        Object.keys(calendarData).forEach(monthName => {
          const opt = document.createElement("option");
          opt.value = monthName;
          opt.textContent = monthName;
          monthSelect.appendChild(opt);
        });

        // 1. AUTO-DETECT CURRENT REAL-WORLD MONTH & YEAR
        const now = new Date();
        const monthNames = [
          "January", "February", "March", "April", "May", "June", 
          "July", "August", "September", "October", "November", "December"
        ];
        
        // Build the current month key format (e.g. "October 2026")
        const currentMonthKey = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

        // 2. DEFAULT TO CURRENT MONTH IF IT EXISTS IN JSON, OTHERWISE FALLBACK TO FIRST AVAILABLE
        let defaultMonth = currentMonthKey;
        if (!calendarData[currentMonthKey]) {
          defaultMonth = Object.keys(calendarData)[0]; // Fallback to first month in JSON if out of range
        }

        // Set the dropdown menu selection and render the calendar
        monthSelect.value = defaultMonth;
        renderCalendar(defaultMonth);

        // Handle dropdown selection changes manually
        monthSelect.addEventListener("change", function () {
          renderCalendar(this.value);
        });
      })
      .catch(err => console.error("Error loading calendar data:", err));

    function renderCalendar(monthKey) {
      const info = calendarData[monthKey];
      if (!info) return;

      const year = info.year;
      const month = info.monthIndex; // 0 = Jan, 8 = Sept
      const events = info.events || {};

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      let html = `<table class="calendar-table">
        <thead>
          <tr><th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th></tr>
        </thead>
        <tbody><tr>`;

      // Fill empty cells before day 1
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

      // Fill remaining empty cells at month end
      while (dayOfWeek > 0 && dayOfWeek < 7) {
        html += `<td></td>`;
        dayOfWeek++;
      }

      html += `</tr></tbody></table>`;
      calendarContainer.innerHTML = html;

      // Attach click/tap popup events
      const eventCells = calendarContainer.querySelectorAll("td.event-day");
      eventCells.forEach(cell => {
        cell.addEventListener("click", function () {
          const day = this.getAttribute("data-day");
          const evt = this.getAttribute("data-event");
          alert(`${monthKey} ${day}\nEvent: ${evt}`);
        });
      });
    }
  }
  // ==========================================================================
  // DYNAMIC ANNOUNCEMENTS, PINNED STORY & POPUP MODAL
  // ==========================================================================
  const pinnedContainer = document.getElementById("pinned-announcement");
  const newsScrollbox = document.getElementById("news-scrollbox");
  const modal = document.getElementById("news-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDate = document.getElementById("modal-date");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modal-close");

  if (pinnedContainer && newsScrollbox) {
    fetch("resources/announcements.json")
      .then(res => res.json())
      .then(data => {
        pinnedContainer.innerHTML = "";
        newsScrollbox.innerHTML = "";

        // Fallback: Handles both raw arrays and nested object lists cleanly!
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

          // Attach click listener for modal popup
          if (item.hasPopup) {
            itemDiv.addEventListener("click", function () {
              modalTitle.innerText = item.title;
              modalDate.innerText = item.date;
              modalBody.innerHTML = item.fullContent;
              modal.classList.add("open");
            });
          }
        });
      })
      .catch(err => console.error("Error loading announcements:", err));
  }

  // Close modal when clicking 'X' or outside the card
  if (modalClose && modal) {
    modalClose.addEventListener("click", () => modal.classList.remove("open"));
    
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.classList.remove("open");
      }
    });
  }
// GALLERY MODAL LIGHTBOX WITH ARROWS & ADVANCE-ON-CLICK
const galleryModal = document.getElementById("gallery-modal");
const galleryTitle = document.getElementById("gallery-modal-title");
const mainImg = document.getElementById("gallery-main-img");
const thumbsContainer = document.getElementById("gallery-thumbs-scroll");
const galleryClose = document.getElementById("gallery-modal-close");
const prevBtn = document.getElementById("gallery-prev-btn");
const nextBtn = document.getElementById("gallery-next-btn");

if (galleryModal) {
  let currentPhotos = [];
  let currentIndex = 0;

  // Helper function to show a specific image index
  function showPhoto(index) {
    if (currentPhotos.length === 0) return;
    
    // Wrap around index boundaries
    if (index < 0) index = currentPhotos.length - 1;
    if (index >= currentPhotos.length) index = 0;

    currentIndex = index;
    mainImg.src = currentPhotos[currentIndex];

    // Highlight corresponding thumbnail and scroll into view
    const thumbs = thumbsContainer.querySelectorAll(".gallery-thumb");
    thumbs.forEach((t, i) => {
      if (i === currentIndex) {
        t.classList.add("active");
        t.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      } else {
        t.classList.remove("active");
      }
    });
  }

  // Open Modal Listener
  document.querySelectorAll(".past-event-item[data-gallery-folder]").forEach(item => {
    item.addEventListener("click", function () {
      const title = this.getAttribute("data-gallery-title");
      const folderPath = this.getAttribute("data-gallery-folder");
      const photoCount = parseInt(this.getAttribute("data-photo-count")) || 0;

      if (photoCount === 0) return;

      // Construct photo paths array
      currentPhotos = [];
      for (let i = 1; i <= photoCount; i++) {
        currentPhotos.push(`${folderPath}/${i}.webp`);
      }

      galleryTitle.innerText = title;
      thumbsContainer.innerHTML = "";

      // Build thumbnail bar
      currentPhotos.forEach((photoUrl, index) => {
        const thumb = document.createElement("img");
        thumb.src = photoUrl;
        thumb.className = `gallery-thumb ${index === 0 ? 'active' : ''}`;

        thumb.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent trigger parent click
          showPhoto(index);
        });

        thumbsContainer.appendChild(thumb);
      });

      showPhoto(0);
      galleryModal.classList.add("open");
    });
  });

  // Navigation Event Listeners
  if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); showPhoto(currentIndex - 1); });
  if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); showPhoto(currentIndex + 1); });
  
  // Advance to next photo on main image click
  if (mainImg) mainImg.addEventListener("click", () => showPhoto(currentIndex + 1));

  // Keyboard navigation (Left / Right Arrow Keys)
  document.addEventListener("keydown", function (e) {
    if (!galleryModal.classList.contains("open")) return;
    if (e.key === "ArrowLeft") showPhoto(currentIndex - 1);
    if (e.key === "ArrowRight") showPhoto(currentIndex + 1);
    if (e.key === "Escape") galleryModal.classList.remove("open");
  });

  // Close handlers
  if (galleryClose) galleryClose.addEventListener("click", () => galleryModal.classList.remove("open"));

  galleryModal.addEventListener("click", function (e) {
    if (e.target === galleryModal) {
      galleryModal.classList.remove("open");
    }
  });
  // FULLSCREEN TOGGLE LOGIC
// FULLSCREEN TOGGLE LOGIC
const photoContainer = document.getElementById("main-photo-container");
const fullscreenBtn = document.getElementById("gallery-fullscreen-btn");

if (fullscreenBtn && photoContainer) {
  fullscreenBtn.addEventListener("click", function (e) {
    e.stopPropagation();

    if (!document.fullscreenElement) {
      if (photoContainer.requestFullscreen) {
        photoContainer.requestFullscreen();
      } else if (photoContainer.webkitRequestFullscreen) {
        photoContainer.webkitRequestFullscreen();
      }
      fullscreenBtn.innerHTML = "&times;"; // Changes icon to 'X' when inside full-screen
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      fullscreenBtn.innerHTML = "&#10064;"; // Reverts back to expand icon
    }
  });

  document.addEventListener("fullscreenchange", function () {
    if (!document.fullscreenElement) {
      fullscreenBtn.innerHTML = "&#10064;";
    }
  });
}
}
// CONTACT FORM WORKER SUBMISSION
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
      // Replace with your Cloudflare Worker URL or relative path if routed on same domain
      const response = await fetch("https://ssa-api.andrew-thorner.workers.dev/", {
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
});
