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
    if (slides.length < 2) return;
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
  const cartBody = root.querySelector('[data-acs-cart-body]');
  const cartSubtotal = root.querySelector('[data-acs-cart-subtotal]');

  function setCart(open) {
    cart?.classList.toggle('is-open', open);
    overlay?.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  root.querySelectorAll('[data-acs-cart-open]').forEach((button) => button.addEventListener('click', () => setCart(true)));
  root.querySelectorAll('[data-acs-cart-close]').forEach((button) => button.addEventListener('click', () => setCart(false)));

  const mobileMenu = root.querySelector('[data-acs-mobile-menu]');
  function setMenu(open) {
    mobileMenu?.classList.toggle('is-open', open);
    overlay?.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  root.querySelector('[data-acs-menu-open]')?.addEventListener('click', () => setMenu(true));
  root.querySelector('[data-acs-menu-close]')?.addEventListener('click', () => setMenu(false));
  overlay?.addEventListener('click', () => {
    setCart(false);
    setMenu(false);
  });

  const tabButtons = Array.from(root.querySelectorAll('[data-acs-tab]'));
  const productGrids = Array.from(root.querySelectorAll('[data-acs-product-grid]'));
  tabButtons.forEach((button) => button.addEventListener('click', () => {
    tabButtons.forEach((item) => item.classList.toggle('is-active', item === button));
    productGrids.forEach((grid) => {
      grid.hidden = grid.dataset.acsProductGrid !== button.dataset.acsTab;
    });
  }));

  function formatMoney(cents, currency) {
    try {
      return new Intl.NumberFormat(document.documentElement.lang || 'en-US', {
        style: 'currency',
        currency: currency || 'USD'
      }).format(cents / 100);
    } catch (_error) {
      return '$' + (cents / 100).toFixed(2);
    }
  }

  async function refreshCart(openDrawer = true) {
    const response = await fetch('/cart.js', { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error('Unable to load cart');
    const cartData = await response.json();

    root.querySelectorAll('[data-acs-cart-open]').forEach((button) => {
      const label = button.textContent.includes('Cart') ? `Cart (${cartData.item_count})` : button.textContent;
      if (button.tagName === 'BUTTON') button.textContent = label;
    });
    const heading = root.querySelector('.acs-cart-drawer__head strong');
    if (heading) heading.textContent = `Your cart (${cartData.item_count})`;

    if (cartSubtotal) {
      cartSubtotal.textContent = formatMoney(cartData.total_price, cartData.currency);
    }

    if (!cartBody) return;
    if (!cartData.items.length) {
      cartBody.innerHTML = '<div class="acs-cart-empty">No products in the cart.</div>';
    } else {
      cartBody.innerHTML = cartData.items.map((item) => `
        <article class="acs-cart-item" data-acs-cart-key="${item.key}">
          <img src="${item.image || ''}" alt="${item.product_title}" width="80" height="80">
          <div>
            <strong>${item.product_title}</strong>
            <span>${item.variant_title || ''}</span>
            <div class="acs-cart-item__controls">
              <button type="button" data-acs-cart-change="-1" aria-label="Decrease quantity">&minus;</button>
              <span>${item.quantity}</span>
              <button type="button" data-acs-cart-change="1" aria-label="Increase quantity">+</button>
            </div>
          </div>
        </article>
      `).join('');
    }
    if (openDrawer) setCart(true);
  }

  root.querySelectorAll('[data-acs-add-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      if (button) {
        button.disabled = true;
        button.textContent = 'Adding...';
      }
      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            id: Number(form.querySelector('[name="id"]').value),
            quantity: 1
          })
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.description || 'Unable to add product');
        }
        await refreshCart(true);
      } catch (error) {
        window.alert(error.message);
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = 'Add to cart';
        }
      }
    });
  });

  cartBody?.addEventListener('click', async (event) => {
    const changeButton = event.target.closest('[data-acs-cart-change]');
    if (!changeButton) return;
    const itemElement = changeButton.closest('[data-acs-cart-key]');
    if (!itemElement) return;
    const quantityElement = itemElement.querySelector('.acs-cart-item__controls span');
    const nextQuantity = Math.max(0, Number(quantityElement.textContent) + Number(changeButton.dataset.acsCartChange));
    changeButton.disabled = true;
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id: itemElement.dataset.acsCartKey, quantity: nextQuantity })
      });
      if (!response.ok) throw new Error('Unable to update cart');
      await refreshCart(false);
    } catch (error) {
      window.alert(error.message);
      changeButton.disabled = false;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    setCart(false);
    setMenu(false);
  });

  showSlide(0);
  startTimer();
})();
