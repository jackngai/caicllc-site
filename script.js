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

  // Contact form -> real submission via n8n webhook (no email app)
  var ENDPOINT = 'https://n8n.caicllc.com/webhook/caicllc-contact-7f3a2c';
  var form = document.getElementById('contact-form');
  if (form) {
    var statusEl = document.getElementById('form-status');
    var submitBtn = form.querySelector('button[type="submit"]');

    function setStatus(msg, kind) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: bots fill this hidden field; humans never see it.
      if (form._gotcha && form._gotcha.value.trim() !== '') return;

      var payload = new URLSearchParams();
      payload.append('name', (form.name.value || '').trim());
      payload.append('email', (form.email.value || '').trim());
      payload.append('topic', form.topic ? form.topic.value : '');
      payload.append('message', (form.message.value || '').trim());
      payload.append('_gotcha', form._gotcha ? form._gotcha.value : '');

      var originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
      setStatus('', '');

      function done(ok) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
        if (ok) {
          form.reset();
          setStatus("Thanks. Your message is in. I'll reply within 24 hours.", 'ok');
        } else {
          setStatus("Something went wrong sending that. Email hello@caicllc.com directly and I'll get right back to you.", 'err');
        }
      }

      var xhr = new XMLHttpRequest();
      xhr.open('POST', ENDPOINT, true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        done(xhr.status >= 200 && xhr.status < 300);
      };
      xhr.onerror = function () { done(false); };
      xhr.send(payload.toString());
    });
  }
})();
