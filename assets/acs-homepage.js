(function () {
  const root = document.querySelector('.acs-homepage');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.acs-slide'));
  const dots = Array.from(root.querySelectorAll('.acs-hero__dots button'));
  let index = 0;
  let timer;

  function showSlide(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  }

  function startTimer() {
    window.clearInterval(timer);
    timer = window.setInterval(() => showSlide(index + 1), 6000);
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    showSlide(i);
    startTimer();
  }));
  root.querySelector('[data-acs-prev]')?.addEventListener('click', () => { showSlide(index - 1); startTimer(); });
  root.querySelector('[data-acs-next]')?.addEventListener('click', () => { showSlide(index + 1); startTimer(); });

  const cart = root.querySelector('.acs-cart-drawer');
  const overlay = root.querySelector('.acs-cart-overlay');
  function setCart(open) {
    cart?.classList.toggle('is-open', open);
    overlay?.classList.toggle('is-open', open);
  }
  root.querySelectorAll('[data-acs-cart-open]').forEach((button) => button.addEventListener('click', () => setCart(true)));
  root.querySelectorAll('[data-acs-cart-close]').forEach((button) => button.addEventListener('click', () => setCart(false)));

  const tabButtons = Array.from(root.querySelectorAll('[data-acs-tab]'));
  tabButtons.forEach((button) => button.addEventListener('click', () => {
    tabButtons.forEach((item) => item.classList.toggle('is-active', item === button));
  }));

  showSlide(0);
  startTimer();
})();
