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
})();
