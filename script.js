const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// ---- scroll reveal ----
const revealTargets = document.querySelectorAll(
  ".section-head, .product-block, .lb-item, .about-title, .about-body, .about-stats, .club-card, .newsletter"
);
revealTargets.forEach((el) => el.setAttribute("data-reveal", ""));

if (reduceMotion.matches) {
  revealTargets.forEach((el) => el.classList.add("is-visible"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  revealTargets.forEach((el) => io.observe(el));
}

// ---- hero parallax (background moves slower than scroll) ----
const heroImg = document.getElementById("heroImg");
if (heroImg && !reduceMotion.matches) {
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          heroImg.style.transform = `translateY(${y * 0.15}px)`;
        }
        ticking = false;
      });
    },
    { passive: true }
  );
}

// ---- product galleries: dots <-> scroll-snap track ----
document.querySelectorAll("[data-gallery]").forEach((gallery) => {
  const track = gallery.querySelector("[data-track]");
  const dots = Array.from(gallery.querySelectorAll(".dot"));
  if (!track || !dots.length) return;

  const setActive = (index) => {
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number(dot.dataset.index);
      const child = track.children[index];
      if (child) {
        track.scrollTo({ left: child.offsetLeft, behavior: reduceMotion.matches ? "auto" : "smooth" });
      }
      setActive(index);
    });
  });

  let scrollTimer;
  track.addEventListener(
    "scroll",
    () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const index = Math.round(track.scrollLeft / track.clientWidth);
        setActive(index);
      }, 80);
    },
    { passive: true }
  );
});

// ---- size selection ----
document.querySelectorAll(".size-select").forEach((group) => {
  group.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      group.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
  });
});

// ---- cart count + add-to-bag feedback ----
const cartCount = document.querySelector(".cart-count");
const cartBtn = document.querySelector(".cart");
let count = 0;

function bumpCart() {
  count += 1;
  if (cartCount) cartCount.textContent = String(count);
  if (cartBtn) {
    cartBtn.classList.remove("is-bumped");
    void cartBtn.offsetWidth;
    cartBtn.classList.add("is-bumped");
  }
}

function flashAdded(btn) {
  const label = btn.querySelector(".btn-label");
  const original = label ? label.textContent : btn.textContent;
  if (label) label.textContent = "ADDED ✓";
  btn.classList.add("is-added");
  bumpCart();
  setTimeout(() => {
    if (label) label.textContent = original;
    btn.classList.remove("is-added");
  }, 1400);
}

document.querySelectorAll(".add-bag-btn").forEach((btn) => {
  btn.addEventListener("click", () => flashAdded(btn));
});

// ---- product detail modal ----
const PRODUCTS = {
  1: {
    index: "01",
    name: "ONE STROKE TEE",
    desc: "左胸主 Logo，右袖波浪線。厚磅純棉，落肩剪裁，日常也能穿的第一件 OSC。",
    price: "NT$ 1,680",
    img: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1800&auto=format&fit=crop",
  },
  2: {
    index: "02",
    name: "LINE HOODIE",
    desc: "領口 ONE STROKE CLUB，中間直向波浪線。Minimal / Essential 定位，最乾淨的一件。",
    price: "NT$ 2,980",
    img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1800&auto=format&fit=crop",
  },
  3: {
    index: "03",
    name: "STATEMENT TEE",
    desc: "實心主 Logo，背面大型 ONE STROKE CLUB 直向排列，下擺 KEEP THE LINE MOVING。最強烈的一件。",
    price: "NT$ 1,880",
    img: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1800&auto=format&fit=crop",
  },
};

const modal = document.getElementById("productModal");
const modalImg = document.getElementById("modalImg");
const modalIndex = document.getElementById("modalIndex");
const modalName = document.getElementById("modalName");
const modalDesc = document.getElementById("modalDesc");
const modalPrice = document.getElementById("modalPrice");
const modalAddBtn = document.getElementById("modalAddBtn");
const modalSizes = document.getElementById("modalSizes");

function openModal(id) {
  const p = PRODUCTS[id];
  if (!p || !modal) return;
  modalImg.src = p.img;
  modalImg.alt = p.name;
  modalIndex.textContent = p.index;
  modalName.textContent = p.name;
  modalDesc.textContent = p.desc;
  modalPrice.textContent = p.price;
  modalAddBtn.dataset.name = p.name;
  modalAddBtn.dataset.price = p.price;
  if (modalSizes) modalSizes.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll(".view-detail-btn").forEach((btn) => {
  btn.addEventListener("click", () => openModal(btn.dataset.product));
});
document.querySelectorAll("[data-close]").forEach((el) => {
  el.addEventListener("click", closeModal);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
if (modalAddBtn) modalAddBtn.addEventListener("click", () => flashAdded(modalAddBtn));

// ---- newsletter form (front-end only demo) ----
const newsletterForm = document.querySelector(".newsletter-form");
const formNote = document.querySelector(".form-note");
if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector("input[type='email']").value.trim();
    if (email) {
      formNote.textContent = `已收到，${email} — DROP 上架第一時間通知你。`;
      newsletterForm.reset();
    }
  });
}

// ---- header strengthens after scrolling past hero ----
const header = document.querySelector(".header");
const onScroll = () => {
  if (window.scrollY > 40) header.classList.add("is-scrolled");
  else header.classList.remove("is-scrolled");
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
