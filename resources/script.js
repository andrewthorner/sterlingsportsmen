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

});
