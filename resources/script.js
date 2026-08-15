/* ==========================================================================
   STERLING SPORTSMEN ASSOCIATION - JAVASCRIPT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".hero-slide");
  
  // If there are no slides on the page, exit early to avoid errors
  if (slides.length === 0) return;

  let currentSlide = 0;
  const slideInterval = 5000; // Time in milliseconds between slides (5 seconds)

  function nextSlide() {
    // Remove active class from current slide
    slides[currentSlide].classList.remove("active");

    // Advance to next slide, wrap around to 0 if at the end
    currentSlide = (currentSlide + 1) % slides.length;

    // Add active class to new slide
    slides[currentSlide].classList.add("active");
  }

  // Automatically cycle slides every 5 seconds
  setInterval(nextSlide, slideInterval);
});