/* ============================================================
   portfolio.js 최종본 (상세 주석 포함)
   - 포스터/영상/모션 모달 처리
   - 캐러셀 자동 슬라이드
   - 섹션 배경 자동 적용
   - 스크롤/네비게이션/Top 버튼
   - 캔버스 파동 효과 (마우스 따라다니는 물결)
   - 파동 잔상 줄임(3분의 1)
============================================================ */

window.addEventListener("load", function () {
  // ---------------------- 1) 설정 ----------------------
  const CONFIG = {
    introSelector: "#intro", // 인트로 영역
    introVideoSelector: "#introVideo", // 인트로 비디오
    skipSelector: "#skipBtn", // 스킵 버튼
    rippleCanvas: "#rippleCanvas", // 캔버스 ID
    carouselSelector: ".carousel-row", // 캐러셀 행
    modalSelector: "#mediaModal", // 모달 전체
    modalContentSelector: "#modalContent", // 모달 콘텐츠 영역
    modalCloseSelector: "#modalClose", // 모달 닫기 버튼
    openExternalSelector: "#openExternal", // 영상/모션 링크 이동 버튼
  };

  // ---------------------- 2) 인트로 영상 ----------------------
  const intro = document.querySelector(CONFIG.introSelector);
  const introVideo = document.querySelector(CONFIG.introVideoSelector);
  const skipBtn = document.querySelector(CONFIG.skipSelector);

  // 인트로 숨기기 함수
  function hideIntro() {
    if (!intro) return;
    intro.style.opacity = "0"; // 서서히 사라지게
    setTimeout(() => {
      if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    }, 520);
  }

  if (introVideo)
    introVideo.addEventListener("ended", hideIntro, { once: true });
  if (skipBtn)
    skipBtn.addEventListener("click", () => {
      if (introVideo)
        try {
          introVideo.pause();
        } catch (e) {}
      hideIntro();
    });

  // ---------------------- 3) 섹션/푸터 배경 자동 적용 ----------------------
  document
    .querySelectorAll("section[data-bg], footer[data-bg]")
    .forEach((sec) => {
      const bg = sec.getAttribute("data-bg");
      if (bg) sec.style.backgroundImage = `url('${bg}')`;
    });

  // ---------------------- 4) 네비게이션 스무스 스크롤 ----------------------
  document.querySelectorAll(".nav-link").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = a.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // ---------------------- 5) 캐러셀 처리 ----------------------
  const rows = document.querySelectorAll(CONFIG.carouselSelector);
  rows.forEach((row) => {
    const track = row.querySelector(".carousel-track");
    if (!track) return;

    // 트랙 복제 → 무한 루프용
    track.innerHTML += track.innerHTML;

    const speed = parseFloat(row.getAttribute("data-speed")) || 0.6;
    let pos = 0;
    let running = true;

    function getSlideWidth() {
      const first = row.querySelector(".card");
      if (!first) return 260;
      const gap = parseFloat(getComputedStyle(track).gap || 0) || 18;
      return first.offsetWidth + gap;
    }

    // 애니메이션 루프
    function frame() {
      if (running) {
        pos -= speed;
        const half = track.scrollWidth / 2;
        if (Math.abs(pos) >= half) pos = 0;
        track.style.transform = `translateX(${pos}px)`;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // 마우스 오버 시 슬라이드 멈춤
    row.addEventListener("mouseenter", () => (running = false));
    row.addEventListener("mouseleave", () => (running = true));

    // 좌우 버튼
    const prevBtn = row.querySelector(".carousel-btn.prev");
    const nextBtn = row.querySelector(".carousel-btn.next");
    const moveCount = 3;

    function jump(delta) {
      running = false;
      track.style.transition = "transform 0.45s ease";
      pos += delta;
      track.style.transform = `translateX(${pos}px)`;
      setTimeout(() => {
        track.style.transition = "";
        const half = track.scrollWidth / 2;
        if (Math.abs(pos) >= half) pos = pos % -half;
        running = true;
      }, 480);
    }

    if (prevBtn)
      prevBtn.addEventListener("click", () =>
        jump(getSlideWidth() * moveCount)
      );
    if (nextBtn)
      nextBtn.addEventListener("click", () =>
        jump(-getSlideWidth() * moveCount)
      );

    // ---------------- 카드 클릭 이벤트 처리 ----------------
    track.addEventListener("click", (ev) => {
      const card = ev.target.closest(".card");
      if (!card) return;

      const parentRow = card.closest(".project-row");
      const badge = parentRow.querySelector(".badge")?.textContent?.trim();
      const url =
        card.getAttribute("data-large") ||
        (card.querySelector("img") ? card.querySelector("img").src : null);
      if (!url) return;

      if (badge === "포스터") {
        // 포스터 → 좌우 이동 가능한 모달
        openModal(url, parentRow);
      } else {
        // 영상/모션 → 모달 열고 링크 이동 버튼
        openModal(url, parentRow, true);
      }
    });
  });

  // ---------------------- 6) 모달 처리 ----------------------
  const modal = document.querySelector(CONFIG.modalSelector);
  const modalContent = document.querySelector(CONFIG.modalContentSelector);
  const modalClose = document.querySelector(CONFIG.modalCloseSelector);
  const openExternal = document.querySelector(CONFIG.openExternalSelector);

  function openModal(url, parentRow, isLink = false) {
    if (!modal || !modalContent) return;
    modalContent.innerHTML = "";

    const posterCards = parentRow.querySelectorAll(".card");
    const posterUrls = Array.from(posterCards).map(
      (c) =>
        c.getAttribute("data-large") ||
        (c.querySelector("img") ? c.querySelector("img").src : null)
    );

    let currentIndex = posterUrls.indexOf(url);

    const img = document.createElement("img");
    img.src = posterUrls[currentIndex];
    img.alt = "확대보기";
    modalContent.appendChild(img);

    function showImage(index) {
      img.src = posterUrls[index];
      if (openExternal && isLink) {
        openExternal.setAttribute("href", posterUrls[index]);
        openExternal.style.display = "block"; // 영상/모션일 때만 버튼 보이기
      } else if (openExternal) {
        openExternal.style.display = "none";
      }
    }

    // 클릭 시 좌우 이동 (포스터만)
    modalContent.onclick = (ev) => {
      if (isLink) return; // 영상/모션은 클릭 이동 없음
      if (ev.offsetX > modalContent.clientWidth / 2) {
        currentIndex = (currentIndex + 1) % posterUrls.length;
      } else {
        currentIndex =
          (currentIndex - 1 + posterUrls.length) % posterUrls.length;
      }
      showImage(currentIndex);
    };

    showImage(currentIndex);

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!modal || !modalContent) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    modalContent.innerHTML = "";
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

  // ---------------------- 7) 캔버스 파동 효과 ----------------------
  (function initRipple() {
    const canvas = document.querySelector(CONFIG.rippleCanvas);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let DPR = window.devicePixelRatio || 1;

    // 캔버스 사이즈 조절
    function resize() {
      DPR = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    const ripples = [];

    // 파동 생성
    function createRipple(x, y, opts = {}) {
      const baseMax = opts.maxRadius || 180;
      ripples.push({
        x,
        y,
        r: 0,
        maxR: baseMax * (0.7 + Math.random() * 0.8),
        speed: (opts.speed || 1.5) * (0.7 + Math.random() * 0.8),
        alpha: 0.9,
      });
      if (ripples.length > 4) ripples.shift(); // 잔상 줄임: 기존 30 → 10
    }

    let lastMove = 0;
    let lastMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // 마우스 이동 시만 파동 발생
    window.addEventListener("mousemove", (e) => {
      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
      const now = performance.now();
      if (now - lastMove > 40) {
        createRipple(e.clientX, e.clientY, { maxRadius: 120, speed: 0.8 });
        lastMove = now;
      }
    });

    // 휠 이벤트에서도 마우스 위치 기준 파동 발생
    window.addEventListener(
      "wheel",
      (e) => {
        createRipple(lastMouse.x, lastMouse.y, { maxRadius: 140, speed: 1 });
      },
      { passive: true }
    );

    // 실제 파동 그리기
    function draw() {
      ctx.clearRect(0, 0, canvas.width / DPR, canvas.height / DPR);
      for (let i = ripples.length - 1; i >= 0; i--) {
        const p = ripples[i];
        p.r += p.speed;
        p.alpha = Math.max(0, 1 - p.r / p.maxR);

        // 외곽 원 (굵은)
        ctx.beginPath();
        ctx.lineWidth = Math.max(2, 6 * p.alpha); // 굵기 조절
        ctx.strokeStyle = `rgba(255,255,255,${0.3 * p.alpha})`; // 흰색
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();

        // 내부 작은 원 (가는)
        ctx.beginPath();
        ctx.lineWidth = Math.max(1, 2 * p.alpha);
        ctx.strokeStyle = `rgba(255,255,255,${0.15 * p.alpha})`;
        ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        // 최대 반지름 이상이면 삭제
        if (p.r > p.maxR * 1.05) ripples.splice(i, 1);
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();
});
