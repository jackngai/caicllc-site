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

    // Preselect the topic dropdown from a ?topic= query param (e.g. pricing CTAs).
    if (form.topic) {
      var wanted = new URLSearchParams(window.location.search).get('topic');
      if (wanted) {
        var match = Array.prototype.find.call(form.topic.options, function (o) {
          return o.value.toLowerCase() === wanted.trim().toLowerCase();
        });
        if (match) form.topic.value = match.value;
      }
    }

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

  // ── AI Readiness Scorecard ─────────────────────────
  var scRoot = document.getElementById('scorecard');
  if (scRoot) {
    var QUESTIONS = [
      {
        q: 'How much of your week goes to repetitive, rules-based tasks?',
        options: [
          { label: 'Barely any', pts: 1 },
          { label: 'A few hours', pts: 2 },
          { label: 'Close to a full day', pts: 3 },
          { label: 'Most of my week', pts: 4 }
        ]
      },
      {
        q: 'How do your tools and apps talk to each other?',
        options: [
          { label: "Well connected, a lot is automated already", pts: 1 },
          { label: 'Some connect, some don’t', pts: 2 },
          { label: 'Mostly manual copy-paste between them', pts: 3 },
          { label: 'Everything is manual', pts: 4 }
        ]
      },
      {
        q: 'Have you used AI tools (like ChatGPT) for real work yet?',
        options: [
          { label: 'Daily and deliberately', pts: 4 },
          { label: 'Now and then', pts: 3 },
          { label: 'Tried it once or twice', pts: 2 },
          { label: 'Not yet', pts: 2 }
        ]
      },
      {
        q: 'Is there a specific task you personally repeat every week?',
        options: [
          { label: 'Yes, several of them', pts: 4 },
          { label: 'Yes, one big one', pts: 3 },
          { label: 'Maybe, I’d have to think', pts: 2 },
          { label: 'Not really', pts: 1 }
        ]
      },
      {
        q: 'Are your processes written down (SOPs, checklists)?',
        options: [
          { label: 'Yes, documented', pts: 3 },
          { label: 'Some are', pts: 2 },
          { label: 'It’s mostly in my head', pts: 2 },
          { label: 'No real process yet', pts: 1 }
        ]
      },
      {
        q: 'What’s the main thing holding you back?',
        options: [
          { label: 'I don’t know where to start', pts: 4 },
          { label: 'No time to set it up', pts: 4 },
          { label: 'I tried, but it didn’t stick', pts: 3 },
          { label: 'Not convinced it’s worth it', pts: 2 }
        ]
      }
    ];

    var MAX = QUESTIONS.reduce(function (sum, q) {
      return sum + Math.max.apply(null, q.options.map(function (o) { return o.pts; }));
    }, 0);

    var BANDS = [
      {
        min: 75,
        tone: 'high',
        name: 'Prime for automation',
        title: 'You’re prime for automation',
        rec: 'You’ve got real, repeatable work and enough readiness to move fast. One focused session can stand up a working automation around your highest-frequency task, live on the call.',
        next: [
          'Pick your single most-repeated weekly task to automate first.',
          'We build it together on the call, so you can keep running it.',
          'You leave with something working, not a to-do list.'
        ]
      },
      {
        min: 50,
        tone: 'mid',
        name: 'Ready to pilot',
        title: 'You’re ready to pilot',
        rec: 'There’s a clear opportunity here. The next step is picking one task and building it live, so you see exactly how AI fits before you scale it across the business.',
        next: [
          'Choose one workflow worth getting off your plate.',
          'Set it up hands-on in a single session.',
          'Decide what’s next once you’ve seen it run.'
        ]
      },
      {
        min: 0,
        tone: 'low',
        name: 'Foundational',
        title: 'Start with the foundation',
        rec: 'The biggest win first is clarity: mapping where AI actually fits before building anything. A strategy session gets you a clear, jargon-free plan without wasted effort.',
        next: [
          'Map where AI moves the needle for you, and where it doesn’t.',
          'Get tool recommendations matched to your level and budget.',
          'Walk away with clear, written next steps you can act on.'
        ]
      }
    ];

    var answers = new Array(QUESTIONS.length).fill(null);
    var step = 0;

    function bandFor(pct) {
      for (var i = 0; i < BANDS.length; i++) {
        if (pct >= BANDS[i].min) return BANDS[i];
      }
      return BANDS[BANDS.length - 1];
    }

    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }

    function renderQuestion() {
      var q = QUESTIONS[step];
      var pct = Math.round((step / QUESTIONS.length) * 100);
      var html = '';
      html += '<div class="sc-progress"><i style="width:' + pct + '%"></i></div>';
      html += '<p class="sc-count">Question ' + (step + 1) + ' of ' + QUESTIONS.length + '</p>';
      html += '<h2 class="sc-q">' + esc(q.q) + '</h2>';
      html += '<div class="sc-options">';
      q.options.forEach(function (o, i) {
        var sel = answers[step] === i ? ' selected' : '';
        html += '<button type="button" class="sc-option' + sel + '" data-i="' + i + '">'
              + '<span class="mark"></span><span>' + esc(o.label) + '</span></button>';
      });
      html += '</div>';
      html += '<div class="sc-foot">'
            + '<button type="button" class="sc-back"' + (step === 0 ? ' hidden' : '') + '>← Back</button>'
            + '<span class="sc-hint">Pick one to continue</span>'
            + '</div>';
      scRoot.innerHTML = html;

      scRoot.querySelectorAll('.sc-option').forEach(function (btn) {
        btn.addEventListener('click', function () {
          answers[step] = parseInt(btn.getAttribute('data-i'), 10);
          if (step < QUESTIONS.length - 1) {
            step++;
            renderQuestion();
          } else {
            renderResult();
          }
        });
      });
      var back = scRoot.querySelector('.sc-back');
      if (back) back.addEventListener('click', function () {
        if (step > 0) { step--; renderQuestion(); }
      });
    }

    function renderResult() {
      var total = answers.reduce(function (sum, ai, i) {
        return sum + (ai == null ? 0 : QUESTIONS[i].options[ai].pts);
      }, 0);
      var pct = Math.round((total / MAX) * 100);
      var band = bandFor(pct);

      var html = '';
      html += '<div class="sc-result sc-tone-' + esc(band.tone) + ' reveal in">';
      html += '<div class="sc-ring" style="--p:' + pct + '"><span class="sc-num">' + pct + '<small>/100</small></span></div>';
      html += '<span class="sc-band">Your score: ' + esc(band.name) + '</span>';
      html += '<h2>' + esc(band.title) + '</h2>';
      html += '<p class="sc-rec">' + esc(band.rec) + '</p>';
      html += '<ul class="check-list">';
      band.next.forEach(function (n) { html += '<li>' + esc(n) + '</li>'; });
      html += '</ul>';
      html += '<div class="hero-actions">'
            + '<a href="/contact.html" class="btn btn-primary btn-arrow">Free consultation</a>'
            + '<a href="pricing.html" class="btn btn-ghost">See pricing</a>'
            + '</div>';
      html += '<div><button type="button" class="sc-restart">↺ Retake the scorecard</button></div>';
      html += '</div>';
      scRoot.innerHTML = html;

      var restart = scRoot.querySelector('.sc-restart');
      if (restart) restart.addEventListener('click', function () {
        answers = new Array(QUESTIONS.length).fill(null);
        step = 0;
        renderQuestion();
      });
    }

    renderQuestion();
  }
})();
