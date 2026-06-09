// Calibrated AI - shared site behavior (no dependencies)
(function () {
  // Sticky header shadow on scroll
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Close mobile menu when a link is tapped
  var toggle = document.getElementById('nav-toggle');
  if (toggle) {
    document.querySelectorAll('.nav-menu a').forEach(function (a) {
      a.addEventListener('click', function () { toggle.checked = false; });
    });
  }

  // Scroll-reveal for elements marked .reveal
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // Contact form -> mailto fallback (no backend)
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.name.value || '').trim();
      var email = (form.email.value || '').trim();
      var topic = form.topic ? form.topic.value : '';
      var message = (form.message.value || '').trim();
      var subject = encodeURIComponent('Inquiry from ' + (name || 'website') + (topic ? ': ' + topic : ''));
      var body = encodeURIComponent(
        'Name: ' + name + '\nEmail: ' + email + (topic ? '\nInterest: ' + topic : '') + '\n\n' + message
      );
      window.location.href = 'mailto:hello@caicllc.com?subject=' + subject + '&body=' + body;
    });
  }
})();
