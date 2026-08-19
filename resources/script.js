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
});
