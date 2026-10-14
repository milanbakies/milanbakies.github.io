/* Io. Iucundum est te adesse. Pervenisti. Ecce crustulum. */
var PING_PERIOD = 22000;
var PING_SWEEP = 0.62;
var FADE_START = 3000;
var FADE_DUR = 2000;
var PING_SHIFT = FADE_START + FADE_DUR / 2 - (PING_PERIOD * PING_SWEEP) / 2;

(function () {
  var chooser = document.querySelector(".chooser");
  var stage = document.querySelector(".stage");
  var track = document.querySelector(".track");
  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-area]"));
  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-panel]"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".pager-dot"));
  var index = Math.max(0, tabs.findIndex(function (tab) { return tab.classList.contains("is-selected"); }));
  var ignoreScroll = false;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fit() {
    var panel = panels[index];
    if (!panel || !stage) return;
    stage.style.height = panel.offsetHeight + "px";
  }

  function centerTab(tab) {
    if (!chooser || chooser.scrollWidth <= chooser.clientWidth + 8) return;
    ignoreScroll = true;
    tab.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "center", block: "nearest" });
    window.setTimeout(function () { ignoreScroll = false; }, 480);
  }

  function go(next, fromScroll) {
    next = Math.max(0, Math.min(tabs.length - 1, next));
    index = next;
    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.classList.toggle("is-selected", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach(function (panel, i) {
      var on = i === index;
      panel.classList.toggle("is-open", on);
      if (on) panel.removeAttribute("inert");
      else panel.setAttribute("inert", "");
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-on", i === index);
    });
    if (track) track.style.transform = "translate3d(" + (-index * 100) + "%, 0, 0)";
    fit();
    if (!fromScroll) centerTab(tabs[index]);
  }

  go(index, true);

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { go(i); });
    tab.addEventListener("keydown", function (event) {
      var next = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = i + 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = i - 1;
      if (next === null || next < 0 || next >= tabs.length) return;
      event.preventDefault();
      tabs[next].focus();
      go(next);
    });
  });

  if (window.ResizeObserver) {
    var observer = new ResizeObserver(function () { fit(); });
    panels.forEach(function (panel) { observer.observe(panel); });
  }
  window.addEventListener("resize", fit);

  if (chooser) {
    var scrollTimer;
    chooser.addEventListener("scroll", function () {
      if (ignoreScroll || chooser.scrollWidth <= chooser.clientWidth + 8) return;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(function () {
        var mid = chooser.getBoundingClientRect().left + chooser.clientWidth / 2;
        var best = 0;
        var bestDist = Infinity;
        tabs.forEach(function (tab, i) {
          var box = tab.getBoundingClientRect();
          var dist = Math.abs(box.left + box.width / 2 - mid);
          if (dist < bestDist) {
            best = i;
            bestDist = dist;
          }
        });
        if (best !== index) go(best, true);
      }, 70);
    }, { passive: true });
  }

  if (stage) {
    var startX = 0;
    var startY = 0;
    var tracking = false;
    stage.addEventListener("touchstart", function (event) {
      if (event.touches.length !== 1) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    stage.addEventListener("touchend", function (event) {
      if (!tracking) return;
      var dx = event.changedTouches[0].clientX - startX;
      var dy = event.changedTouches[0].clientY - startY;
      tracking = false;
      if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (dx < 0) go(index + 1);
      else go(index - 1);
    }, { passive: true });
  }

  document.querySelectorAll(".ask-q").forEach(function (button) {
    button.addEventListener("click", function () {
      var ask = button.closest(".ask");
      var wasOpen = ask.classList.contains("is-open");
      ask.parentElement.querySelectorAll(".ask.is-open").forEach(function (openAsk) {
        openAsk.classList.remove("is-open");
        openAsk.querySelector(".ask-q").setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        ask.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
      window.requestAnimationFrame(fit);
    });
  });

  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      document.documentElement.classList.add("is-ready");
      fit();
      centerTab(tabs[index]);
    });
  });

  if (!reduce && document.querySelector("main")) {
    startIntro();
    startRadar();
  }
})();

function pingEase(u) {
  return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
}

function pingClock(now) {
  if (!window.__pingT0) window.__pingT0 = now;
  return now - window.__pingT0;
}

function startIntro() {
  var veil = document.querySelector(".intro");
  var line = veil && veil.querySelector(".intro-line");
  if (!veil || !line || !document.querySelector(".stage")) return;

  var text = line.textContent;
  line.textContent = "";
  line.classList.add("is-split");
  var chars = [];
  text.split(/(\s+)/).forEach(function (part) {
    if (!part) return;
    if (/^\s+$/.test(part)) {
      line.appendChild(document.createTextNode(" "));
      return;
    }
    var word = document.createElement("span");
    word.className = "intro-word";
    for (var i = 0; i < part.length; i++) {
      var ch = document.createElement("span");
      ch.className = "intro-ch";
      ch.textContent = part.charAt(i);
      word.appendChild(ch);
      chars.push(ch);
    }
    line.appendChild(word);
  });

  var held = [];
  Array.prototype.forEach.call(document.body.children, function (el) {
    if (el === veil || el.classList.contains("radar")) return;
    if (el.hasAttribute("inert")) return;
    el.setAttribute("inert", "");
    held.push(el);
  });

  var fields = [];
  var fieldsReady = false;

  function readyFields() {
    if (fieldsReady) return;
    fieldsReady = true;
    var still = document.querySelector(".panel.is-open .panel-title");
    var anchor = still && still.getBoundingClientRect();
    var ax = anchor ? anchor.left + anchor.width / 2 : window.innerWidth / 2;
    var ay = anchor ? anchor.top + anchor.height / 2 : window.innerHeight / 2;
    var height = window.innerHeight;
    document.querySelectorAll(".brand, .lang, .choice, .pager, .panel.is-open .kicker, .panel.is-open .lead, .panel.is-open .label, .panel.is-open .ask, .panel.is-open .quiet, .contact p, .mail, .foot").forEach(function (el) {
      if (still && (el === still || still.contains(el))) return;
      var rect = el.getBoundingClientRect();
      if (rect.width < 2 && rect.height < 2) return;
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = cx;
      var dy = cy - height;
      var len = Math.hypot(dx, dy) || 1;
      var fromStill = Math.hypot(cx - ax, cy - ay);
      fields.push({
        el: el,
        dist: len,
        amp: 8 + Math.min(2, fromStill / 220)
      });
    });
  }

  var opened = false;
  var done = false;

  function settle() {
    fields.forEach(function (field) {
      field.el.style.transform = "";
    });
  }

  function openPage() {
    if (opened) return;
    opened = true;
    veil.remove();
    held.forEach(function (el) { el.removeAttribute("inert"); });
  }

  function finish() {
    if (done) return;
    done = true;
    openPage();
    settle();
  }

  window.addEventListener("keydown", onKey);

  function onKey(event) {
    if (opened || done) {
      window.removeEventListener("keydown", onKey);
      return;
    }
    if (event.key === "Escape") finish();
  }

  function frame(now) {
    if (done) return;
    var elapsed = pingClock(now);
    var rise = Math.max(0, Math.min(1, elapsed / 800));
    var p = elapsed <= FADE_START ? 0 : Math.max(0, Math.min(1, (elapsed - FADE_START) / FADE_DUR));
    var swoosh = Math.sin(p * Math.PI);

    if (!opened) {
      chars.forEach(function (ch, index) {
        var wave = 0.5 + 0.5 * Math.sin((elapsed / 2600) * Math.PI * 2 - index * 0.28);
        var breath = 0.86 + 0.14 * wave;
        ch.style.opacity = String(rise * breath);
        ch.style.color = "#f3f0e8";
        ch.style.textShadow = "0 0 " + (10 + wave * 14).toFixed(1) + "px rgba(210, 255, 74, " + (0.45 + wave * 0.5).toFixed(2) + "), 0 0 " + (28 + wave * 22).toFixed(1) + "px rgba(210, 255, 74, " + (0.16 + wave * 0.28).toFixed(2) + ")";
        ch.style.transform = "translate3d(" + (-swoosh * 4).toFixed(2) + "px, " + (swoosh * -1).toFixed(2) + "px, 0)";
      });
      veil.style.opacity = String(1 - pingEase(p));
      if (p >= 1) {
        openPage();
        window.removeEventListener("keydown", onKey);
      }
    }

    if (elapsed > 400) readyFields();
    var reach = Math.hypot(window.innerWidth, window.innerHeight) + 24;
    var pingElapsed = elapsed - PING_SHIFT;
    var sweepMs = PING_PERIOD * PING_SWEEP;
    var pingU = Math.max(0, Math.min(1, pingElapsed / sweepMs));
    var radius = pingEase(pingU) * reach;
    var band = Math.max(78, reach * 0.06);
    var tail = band * 0.42;
    fields.forEach(function (field) {
      var passed = radius - field.dist;
      var lift = 0;
      if (passed >= -band && passed < 0) {
        lift = Math.sin((1 + passed / band) * Math.PI * 0.5);
      } else if (passed >= 0 && passed < tail) {
        lift = Math.cos((passed / tail) * Math.PI * 0.5);
      }
      var x = lift * field.amp * 0.78;
      var y = lift * field.amp * -0.36;
      field.el.style.transform = lift ? "translate3d(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px, 0)" : "";
    });

    if (pingElapsed > sweepMs + 800) {
      done = true;
      if (!opened) openPage();
      settle();
      return;
    }
    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
}

function startRadar() {
  var canvas = document.createElement("canvas");
  canvas.className = "radar";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  var ctx = canvas.getContext("2d");
  var period = PING_PERIOD;
  var sweep = PING_SWEEP;
  var cycle = -1;
  var target = null;
  var lit = false;
  var fadeTimer = 0;
  var dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
  }

  function clearWord() {
    var old = document.querySelector(".ping-word");
    if (!old || !old.parentNode) return;
    var parent = old.parentNode;
    while (old.firstChild) parent.insertBefore(old.firstChild, old);
    parent.removeChild(old);
    parent.normalize();
  }

  function pickWord() {
    clearWord();
    var root = document.querySelector("main");
    if (!root) return null;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var found = [];
    var node;
    var pattern = /\p{L}[\p{L}'’-]{4,}/gu;
    while ((node = walker.nextNode())) {
      var parent = node.parentElement;
      if (!parent || parent.closest("script, style, .radar, .ask-q, .choice")) continue;
      var display = window.getComputedStyle(parent).display;
      if (display === "flex" || display === "inline-flex" || display === "grid" || display === "inline-grid") continue;
      var panel = parent.closest(".panel");
      if (panel && !panel.classList.contains("is-open")) continue;
      var ask = parent.closest(".ask");
      if (ask && !ask.classList.contains("is-open") && parent.closest(".ask-a")) continue;
      var text = node.textContent;
      if (!text || !pattern.test(text)) {
        pattern.lastIndex = 0;
        continue;
      }
      pattern.lastIndex = 0;
      var match;
      while ((match = pattern.exec(text))) {
        var range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        var rect = range.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        if (rect.bottom < 8 || rect.top > window.innerHeight - 8) continue;
        if (rect.right < 8 || rect.left > window.innerWidth - 8) continue;
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        found.push({
          node: node,
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          dist: Math.hypot(cx, cy - window.innerHeight)
        });
      }
    }
    if (!found.length) return null;
    var last = target && target.text;
    var pool = found.filter(function (word) { return word.text !== last; });
    if (!pool.length) pool = found;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function arm(word) {
    try {
      var range = document.createRange();
      range.setStart(word.node, word.start);
      range.setEnd(word.node, word.end);
      var span = document.createElement("span");
      span.className = "ping-word";
      range.surroundContents(span);
      word.span = span;
      return true;
    } catch (error) {
      return false;
    }
  }

  function draw(radius, alpha) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (alpha <= 0.01 || radius < 2) return;
    var ox = 0;
    var oy = h;
    var band = Math.max(18, radius * 0.045);
    var grad = ctx.createRadialGradient(ox, oy, Math.max(0, radius - band), ox, oy, radius + 2);
    grad.addColorStop(0, "rgba(62, 190, 202, 0)");
    grad.addColorStop(0.62, "rgba(62, 190, 202, " + (alpha * 0.05) + ")");
    grad.addColorStop(0.86, "rgba(143, 212, 220, " + (alpha * 0.16) + ")");
    grad.addColorStop(1, "rgba(210, 255, 74, 0)");
    ctx.beginPath();
    ctx.arc(ox, oy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ox, oy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(143, 212, 220, " + (alpha * 0.42) + ")";
    ctx.lineWidth = 1.15;
    ctx.stroke();
    var ghost = radius * 0.7;
    if (ghost > 12) {
      ctx.beginPath();
      ctx.arc(ox, oy, ghost, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(62, 190, 202, " + (alpha * 0.16) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function frame(now) {
    var elapsed = pingClock(now) - PING_SHIFT;
    var n = Math.floor(elapsed / period);
    var t = (elapsed % period) / period;
    var u = Math.min(t / sweep, 1);
    var eased = pingEase(u);
    var reach = Math.hypot(window.innerWidth, window.innerHeight) + 24;
    var radius = eased * reach;
    var alpha = t < sweep ? Math.sin(u * Math.PI) * 0.75 : 0;
    if (n !== cycle) {
      cycle = n;
      lit = false;
      window.clearTimeout(fadeTimer);
      target = pickWord();
      if (target && !arm(target)) target = null;
    }
    draw(radius, alpha);
    if (target && target.span && !lit && radius >= target.dist) {
      lit = true;
      target.span.classList.add("is-lit");
      fadeTimer = window.setTimeout(function () {
        if (target && target.span) target.span.classList.remove("is-lit");
      }, 2600);
    }
    window.requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  window.requestAnimationFrame(frame);
}
