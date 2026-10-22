import './style.css'

const state = {
  cats: [],
  bookings: [],
  stats: { cats: 0, bookings: 0, rating: 4.9, cities: 37 },
  waitlist: { count: 1284 },
  filter: { q: '', vibe: 'All', city: 'All' },
  hours: 3,
  activeCat: null
}

const $ = sel => document.querySelector(sel)
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const money = n => '$' + (Math.round(Number(n) * 100) / 100).toFixed(Number(n) % 1 ? 2 : 0)
const emojiList = ['🐱', '😺', '😸', '😻', '😼', '😽', '🙀', '🐈', '🐈‍⬛', '🦁']

function timeAgo(iso) {
  const s = (Date.now() - Date.parse(iso)) / 1000
  if (!Number.isFinite(s) || s < 0) return 'just now'
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'
  if (s < 86400) return Math.round(s / 3600) + ' hr ago'
  return Math.round(s / 86400) + 'd ago'
}

function initials(name) {
  return String(name || '?').trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10)
const totalReviews = () => state.cats.reduce((s, c) => s + Number(c.reviews || 0), 0)

async function boot() {
  try {
    const [cats, bookings, stats, waitlist] = await Promise.all([
      fetch('/api/cats').then(r => r.json()),
      fetch('/api/bookings').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/waitlist').then(r => r.json())
    ])
    state.cats = cats.cats || []
    state.bookings = bookings.bookings || []
    state.stats = stats
    state.waitlist = waitlist
  } catch (err) {
    document.getElementById('app').innerHTML = '<div style="padding:80px;text-align:center;font-family:system-ui">Could not reach the cat database. Refresh in a second.</div>'
    return
  }
  render()
  initParticles()
}

function render() {
  const hero = state.cats[0]
  const cities = [...new Set(state.cats.map(c => c.city).filter(Boolean))].sort()
  const reviewCount = totalReviews()
  const lastBooking = state.bookings[0]

  $('#app').innerHTML = `
  <nav class="nav" id="nav">
    <div class="wrap nav-inner">
      <a class="logo" href="#top"><span class="logo-mark">🐾</span>PurrBnB</a>
      <div class="nav-links">
        <a href="#market">Browse cats</a>
        <a href="#how">How it works</a>
        <a href="#pricing">Pricing</a>
        <a href="#host">Become a host</a>
        <a href="#waitlist">Waitlist</a>
      </div>
      <div class="nav-cta">
        <a class="nav-login" href="#host">List your cat</a>
        <a class="btn btn-primary" href="#market">Book a cat</a>
      </div>
    </div>
  </nav>

  <header class="hero" id="top">
    <canvas id="paws" aria-hidden="true"></canvas>
    <div class="wrap">
      <div class="hero-grid">
        <div>
          <span class="pill"><span class="dot">🐈</span> Now booking in ${state.stats.cities} cities</span>
          <h1>Your next coworker <em>has whiskers.</em></h1>
          <p class="hero-sub">Rent a friendly, vet-checked cat by the hour. Real companionship for remote workdays, lazy Sundays, and everything in between — with zero litter box duty.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#market">Find a cat near you</a>
            <a class="btn btn-ghost" href="#how">How it works</a>
          </div>
          <div class="trust-row">
            <span class="avatars">
              <span style="background:#ff8e7f">J</span><span style="background:#8d6bc9">M</span><span style="background:#f0a53c">R</span><span style="background:#4aa77c">S</span>
            </span>
            <span><strong>${state.stats.rating.toFixed(1)} ★</strong> from ${reviewCount.toLocaleString()} reviews</span>
            <span><strong>${state.stats.cats}</strong> cats ready today</span>
            <span>🛡️ Vet-checked &amp; insured</span>
          </div>
        </div>
        <div class="hero-visual">
          <div class="showcase">
            <div class="badge-live"><i></i> Available now</div>
            <div class="showcase-art">
              <div class="big-cat">${esc(hero?.emoji || '🐱')}</div>
            </div>
            <div class="showcase-card">
              <div>
                <div class="name">${esc(hero?.name || 'Mochi')}</div>
                <div class="meta">${esc(hero?.breed || 'Ragdoll')} · ${esc(hero?.age || '3 yrs')} · ${esc(hero?.city || 'Brooklyn, NY')}</div>
              </div>
              <div class="price">${money(hero?.rate || 14)}<span style="font-size:12px;font-family:ui-sans-serif,system-ui;font-weight:500;color:#6f6579">/hr</span></div>
            </div>
            <div class="floating-chip one"><span class="emoji">🛡️</span> Insured by PawSure</div>
            <div class="floating-chip two"><span class="emoji">⭐</span> ${state.stats.rating.toFixed(1)} average rating</div>
            <div class="floating-chip three"><span class="emoji">🚲</span> Delivered in 45 min</div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <div class="strip">
    <div class="wrap strip-inner">
      <span class="label">Trusted by pet-free households at</span>
      <div class="strip-brands"><span>Notion</span><span>Figma</span><span>Stripe</span><span>Linear</span><span>Vercel</span></div>
    </div>
  </div>

  <section class="market" id="market">
    <div class="wrap">
      <div class="section-head">
        <div>
          <span class="eyebrow">The cat market</span>
          <h2 class="section-title">Meet your rented roommate</h2>
          <p class="section-sub">Every cat is vet-checked, temperament-tested, and comes with food, toys, and a litter setup. You just bring the lap.</p>
        </div>
        <div style="font-size:13px;color:#6f6579;text-align:right">
          <strong style="color:#241b2f;font-size:15px" id="resultCount">${state.cats.length} cats</strong><br>available for hourly rental
        </div>
      </div>

      <div class="searchbar">
        <div class="field">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input id="searchInput" placeholder="Search by name or breed…" aria-label="Search cats" />
        </div>
        <div class="divider"></div>
        <div class="field">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
          <select id="citySelect" aria-label="Filter by city">
            <option value="All">All cities</option>
            ${cities.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-dark" id="searchBtn">Find a cat</button>
      </div>

      <div class="chips" id="vibeChips">
        ${['All', 'Cuddly', 'Playful', 'Chill', 'Chatty'].map(v => `<button class="chip ${v === 'All' ? 'active' : ''}" data-vibe="${v}">${v === 'All' ? 'All cats' : v}</button>`).join('')}
      </div>

      <div class="cat-grid" id="catGrid"></div>

      <div class="feedbar">
        <span class="live"><i></i> LIVE</span>
        <span class="item" id="feedItem">${lastBooking ? `<strong>${esc(lastBooking.renter)}</strong> booked <strong>${esc(lastBooking.catName)}</strong> for ${lastBooking.hours} hrs · ${timeAgo(lastBooking.createdAt)}` : 'Waiting for the first rental of the day…'}</span>
        <span style="margin-left:auto;font-size:12px;color:#6f6579;white-space:nowrap">${state.stats.bookings} rentals booked</span>
      </div>
    </div>
  </section>

  <section class="how" id="how">
    <div class="wrap">
      <span class="eyebrow">How PurrBnB works</span>
      <h2 class="section-title">Three steps to a purring apartment</h2>
      <div class="how-grid">
        <div class="how-card">
          <span class="num">01</span>
          <span class="ico">🔍</span>
          <h3>Pick your cat</h3>
          <p>Filter by vibe, breed, and city. Every profile lists temperament, energy level, and what the cat is good at.</p>
        </div>
        <div class="how-card">
          <span class="num">02</span>
          <span class="ico">📅</span>
          <h3>Book by the hour</h3>
          <p>Choose a date and a block of time. Hosts confirm in minutes and your total is locked in before you pay.</p>
        </div>
        <div class="how-card">
          <span class="num">03</span>
          <span class="ico">🚲</span>
          <h3>Get feline company</h3>
          <p>Your cat arrives with food, toys, and a litter box. When the rental ends, we pick everything up. No mess, no commitment.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="waitlist-sec" id="waitlist">
    <div class="wrap">
      <div class="waitlist-band">
        <div>
          <span class="eyebrow" style="color:#ffb7ad">Expanding soon</span>
          <h2>Not in your city yet?<br>Get in line.</h2>
          <p>We open three new cities every month. Join the waitlist and get your first hour free when PurrBnB reaches you.</p>
          <div class="wait-count"><strong id="waitCount">${state.waitlist.count.toLocaleString()}</strong> cat people already waiting</div>
        </div>
        <div class="wait-form-wrap">
          <form class="wait-form" id="waitForm" novalidate>
            <div class="form-title">Join the waitlist</div>
            <div class="form-note">No spam. One email when we launch near you.</div>
            <label class="field-label" for="waitEmail">Email</label>
            <input class="input" id="waitEmail" type="email" placeholder="you@example.com" autocomplete="email" />
            <label class="field-label" for="waitCity" style="margin-top:12px">City</label>
            <input class="input" id="waitCity" placeholder="Austin, TX" autocomplete="address-level2" />
            <button class="btn btn-primary btn-block" type="submit" id="waitSubmit" style="margin-top:14px">Reserve my spot</button>
            <div class="form-msg" id="waitMsg"></div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <section class="pricing" id="pricing">
    <div class="wrap">
      <div class="center">
        <span class="eyebrow">Simple, hourly pricing</span>
        <h2 class="section-title">Companionship, without the commitment</h2>
        <p class="section-sub">Pay per rental. No deposits, no subscription, cancel up to 12 hours before.</p>
      </div>
      <div class="price-grid">
        <div class="price-card">
          <div class="plan-name">Drop-in</div>
          <div class="price-desc">A quick hit of cat energy.</div>
          <div class="plan-price">$12<small>/hr</small></div>
          <ul>
            <li><span class="tick">✓</span> Up to 3 hours with one cat</li>
            <li><span class="tick">✓</span> Food, toys &amp; litter included</li>
            <li><span class="tick">✓</span> Delivery within 45 minutes</li>
          </ul>
          <button class="btn btn-ghost btn-block" data-scroll="#market">Browse cats</button>
        </div>
        <div class="price-card featured">
          <span class="price-badge">Most popular</span>
          <div class="plan-name">Workday Pass</div>
          <div class="price-desc">A full day of supervisory purring.</div>
          <div class="plan-price">$59<small>/day</small></div>
          <ul>
            <li><span class="tick">✓</span> 8 hours, 9am–5pm</li>
            <li><span class="tick">✓</span> Pick any cat in your city</li>
            <li><span class="tick">✓</span> Free reschedule once</li>
            <li><span class="tick">✓</span> Litter box + cleanup included</li>
          </ul>
          <button class="btn btn-primary btn-block" data-scroll="#market">Book a workday</button>
        </div>
        <div class="price-card">
          <div class="plan-name">Weekend Package</div>
          <div class="price-desc">For when the apartment feels empty.</div>
          <div class="plan-price">$149<small>/wknd</small></div>
          <ul>
            <li><span class="tick">✓</span> Saturday to Sunday, one cat</li>
            <li><span class="tick">✓</span> Two cats for +$60</li>
            <li><span class="tick">✓</span> 24/7 host hotline</li>
          </ul>
          <button class="btn btn-ghost btn-block" data-scroll="#market">Plan a weekend</button>
        </div>
      </div>
    </div>
  </section>

  <section class="host-section" id="host">
    <div class="wrap">
      <div class="host-panel">
        <div>
          <span class="eyebrow">For cat owners</span>
          <h2>Your cat is already<br>a professional napper.</h2>
          <p class="lead">Let them monetize it. List your cat on PurrBnB, set your own hours, and meet verified cat people in your neighborhood.</p>
          <ul class="host-perks">
            <li><span class="ic">💸</span><div><b>Earn $300–$900 a month</b><span>You keep 85% of every booking.</span></div></li>
            <li><span class="ic">🛡️</span><div><b>$2M host protection</b><span>Every rental is insured and identity-verified.</span></div></li>
            <li><span class="ic">🗓️</span><div><b>You control the calendar</b><span>Approve every request. Block any day.</span></div></li>
          </ul>
        </div>
        <form class="host-form" id="hostForm" novalidate>
          <div class="form-title">List your cat</div>
          <div class="form-note">Takes about a minute. Most listings go live instantly.</div>
          <div class="form-grid">
            <div>
              <label class="field-label" for="catName">Cat's name</label>
              <input class="input" id="catName" placeholder="Mochi" />
            </div>
            <div>
              <label class="field-label" for="catBreed">Breed</label>
              <input class="input" id="catBreed" placeholder="Ragdoll" />
            </div>
            <div>
              <label class="field-label" for="catAge">Age</label>
              <input class="input" id="catAge" placeholder="3 yrs" />
            </div>
            <div>
              <label class="field-label" for="catRate">Hourly rate ($)</label>
              <input class="input" id="catRate" type="number" min="5" max="60" step="1" placeholder="14" />
            </div>
            <div>
              <label class="field-label" for="catVibe">Vibe</label>
              <select class="input" id="catVibe">
                <option>Cuddly</option><option>Playful</option><option>Chill</option><option>Chatty</option>
              </select>
            </div>
            <div>
              <label class="field-label" for="catEmoji">Cat emoji</label>
              <select class="input" id="catEmoji">${emojiList.map(e => `<option>${e}</option>`).join('')}</select>
            </div>
            <div>
              <label class="field-label" for="hostName">Your name</label>
              <input class="input" id="hostName" placeholder="Dana R." />
            </div>
            <div>
              <label class="field-label" for="hostCity">City</label>
              <input class="input" id="hostCity" placeholder="Brooklyn, NY" />
            </div>
            <div class="full">
              <label class="field-label" for="catBio">One line about your cat</label>
              <textarea class="input" id="catBio" placeholder="Loves laps, hates vacuums. Excellent at staring at birds."></textarea>
            </div>
          </div>
          <button class="btn btn-dark btn-block" type="submit" id="hostSubmit" style="margin-top:14px">Publish my listing</button>
          <div class="form-msg" id="hostMsg"></div>
        </form>
      </div>
    </div>
  </section>

  <section class="quotes">
    <div class="wrap">
      <div class="center">
        <span class="eyebrow">From the rental history</span>
        <h2 class="section-title">People are oddly emotional about this</h2>
      </div>
      <div class="quote-grid">
        <div class="quote">
          <div class="stars">★★★★★</div>
          <p>“I rented Olive for a Wednesday workday and my productivity went up because I couldn't move my laptop off my lap. Ten out of ten.”</p>
          <div class="who"><span class="av" style="background:#8d6bc9">MK</span><div><b>Maya K.</b><span>Chicago · Workday Pass</span></div></div>
        </div>
        <div class="quote">
          <div class="stars">★★★★★</div>
          <p>“My lease says no pets. PurrBnB is technically a visitor. Biscuit chased a shoelace for an hour and then slept on my feet. Perfect.”</p>
          <div class="who"><span class="av" style="background:#ff8e7f">JT</span><div><b>Jordan T.</b><span>Austin · Drop-in</span></div></div>
        </div>
        <div class="quote">
          <div class="stars">★★★★★</div>
          <p>“As a host, I was nervous. Now Miso has a little calendar and honestly a busier social life than I do. The payouts are real.”</p>
          <div class="who"><span class="av" style="background:#4aa77c">AR</span><div><b>Ana R.</b><span>San Francisco · Host</span></div></div>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <div class="wrap">
      <div class="foot-grid">
        <div>
          <a class="logo" href="#top"><span class="logo-mark">🐾</span>PurrBnB</a>
          <p class="foot-about">The marketplace for hourly cat companionship. Built for people who love cats and also love giving them back.</p>
        </div>
        <div class="foot-col">
          <h4>Rent</h4>
          <a href="#market">Browse cats</a><a href="#pricing">Pricing</a><a href="#how">How it works</a><a href="#waitlist">Waitlist</a>
        </div>
        <div class="foot-col">
          <h4>Host</h4>
          <a href="#host">List your cat</a><a href="#host">Host protection</a><a href="#host">Payouts</a>
        </div>
        <div class="foot-col">
          <h4>Company</h4>
          <a href="#top">About</a><a href="#top">Safety</a><a href="#top">Careers</a><a href="#top">Contact</a>
        </div>
      </div>
      <div class="foot-bottom">
        <span>© ${new Date().getFullYear()} PurrBnB Inc. All cats fictional, all cuddles real.</span>
        <span>Terms · Privacy · Made with 🐾 in Brooklyn</span>
      </div>
    </div>
  </footer>

  <div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-label="Book a cat">
    <div class="modal" id="modal"></div>
  </div>
  <div class="toast" id="toast"></div>
  `

  renderCats()
  wire()
}

function renderCats() {
  const grid = $('#catGrid')
  if (!grid) return
  const q = state.filter.q.toLowerCase().trim()
  const list = state.cats.filter(c => {
    const hay = `${c.name} ${c.breed} ${c.city} ${c.host}`.toLowerCase()
    return (!q || hay.includes(q)) &&
      (state.filter.vibe === 'All' || c.vibe === state.filter.vibe) &&
      (state.filter.city === 'All' || c.city === state.filter.city)
  })
  const count = $('#resultCount')
  if (count) count.textContent = `${list.length} cat${list.length === 1 ? '' : 's'}`

  if (!list.length) {
    grid.innerHTML = `<div class="empty"><span class="big">🙀</span>No cats match that yet. Try a different vibe or city — or <a href="#host" style="text-decoration:underline">list your own cat</a>.</div>`
    return
  }

  grid.innerHTML = list.map(c => `
    <article class="cat-card">
      <div class="cat-art grad-${esc(c.gradient || 'peach')}">
        <span class="vibe">${esc(c.vibe)}</span>
        <span class="cat-emoji">${esc(c.emoji)}</span>
        <span class="rating">★ ${Number(c.rating).toFixed(1)} <span style="opacity:.6">(${c.reviews})</span></span>
      </div>
      <div class="cat-body">
        <div class="cat-top">
          <span class="cat-name">${esc(c.name)}</span>
          <span class="cat-rate">${money(c.rate)}<small>/hr</small></span>
        </div>
        <div class="cat-meta">${esc(c.breed)} · ${esc(c.age)} · ${esc(c.city)}</div>
        <div class="cat-tags">${(c.tags || []).slice(0, 3).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="cat-foot">
          <span class="hostline"><span class="mini">${esc(initials(c.host))}</span>${esc(c.host)}</span>
          <button class="book-btn" data-book="${esc(c.id)}">Book</button>
        </div>
      </div>
    </article>
  `).join('')
}

function wire() {
  const nav = $('#nav')
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  document.querySelectorAll('[data-scroll]').forEach(el => {
    el.addEventListener('click', () => {
      const target = document.querySelector(el.getAttribute('data-scroll'))
      if (target) target.scrollIntoView({ behavior: 'smooth' })
    })
  })

  $('#vibeChips').addEventListener('click', e => {
    const chip = e.target.closest('[data-vibe]')
    if (!chip) return
    state.filter.vibe = chip.dataset.vibe
    document.querySelectorAll('#vibeChips .chip').forEach(c => c.classList.toggle('active', c === chip))
    renderCats()
  })

  const applySearch = () => {
    state.filter.q = $('#searchInput').value
    state.filter.city = $('#citySelect').value
    renderCats()
    document.getElementById('catGrid').scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  $('#searchBtn').addEventListener('click', applySearch)
  $('#searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') applySearch() })
  $('#citySelect').addEventListener('change', () => { state.filter.city = $('#citySelect').value; renderCats() })

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-book]')
    if (btn) {
      const cat = state.cats.find(c => c.id === btn.dataset.book)
      if (cat) openBooking(cat)
    }
  })

  $('#hostForm').addEventListener('submit', submitHost)
  $('#waitForm').addEventListener('submit', submitWaitlist)

  const overlay = $('#overlay')
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal() })
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal() })
}

/* ---------- booking ---------- */

function openBooking(cat) {
  state.activeCat = cat
  state.hours = 3
  const overlay = $('#overlay')
  const modal = $('#modal')
  modal.innerHTML = `
    <div class="modal-head">
      <div class="modal-art grad-${esc(cat.gradient || 'peach')}">${esc(cat.emoji)}</div>
      <div>
        <div class="t">Book ${esc(cat.name)}</div>
        <div class="s">${esc(cat.breed)} · ${esc(cat.city)} · ★ ${Number(cat.rating).toFixed(1)}</div>
      </div>
      <button class="modal-close" id="modalClose" aria-label="Close">✕</button>
    </div>
    <div class="modal-body">
      <form id="bookForm" novalidate>
        <label class="field-label">How long?</label>
        <div class="hours-row" id="hoursRow">
          ${[1, 2, 3, 4, 6, 8].map(h => `<button type="button" class="hour-opt ${h === 3 ? 'active' : ''}" data-hours="${h}">${h} hr${h > 1 ? 's' : ''}</button>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px">
          <div>
            <label class="field-label" for="bookName">Your name</label>
            <input class="input" id="bookName" placeholder="Sam" autocomplete="name" />
          </div>
          <div>
            <label class="field-label" for="bookDate">Date</label>
            <input class="input" id="bookDate" type="date" min="${new Date().toISOString().slice(0, 10)}" value="${tomorrow()}" />
          </div>
        </div>
        <div style="margin-top:12px">
          <label class="field-label" for="bookEmail">Email</label>
          <input class="input" id="bookEmail" type="email" placeholder="you@example.com" autocomplete="email" />
        </div>
        <div style="margin-top:12px">
          <label class="field-label" for="bookNote">Anything ${esc(cat.name)} should know?</label>
          <textarea class="input" id="bookNote" placeholder="I work from home and have a sunny window."></textarea>
        </div>
        <div class="summary">
          <div class="lbl"><b>${money(cat.rate)}/hr × <span id="hoursLabel">3</span> hrs</b>Food, toys &amp; insurance included</div>
          <div class="tot" id="totalLabel">${money(cat.rate * 3)}</div>
        </div>
        <button class="btn btn-primary btn-block" type="submit" id="bookSubmit">Request booking</button>
        <div class="form-msg" id="bookMsg"></div>
        <div class="fineprint">Free cancellation up to 12 hours before. Pay on delivery.</div>
      </form>
    </div>
  `
  overlay.classList.add('open')
  document.body.style.overflow = 'hidden'
  $('#modalClose').addEventListener('click', closeModal)

  const updateTotal = () => {
    $('#hoursLabel').textContent = state.hours
    $('#totalLabel').textContent = money(state.hours * cat.rate)
  }
  $('#hoursRow').addEventListener('click', e => {
    const opt = e.target.closest('[data-hours]')
    if (!opt) return
    state.hours = Number(opt.dataset.hours)
    document.querySelectorAll('.hour-opt').forEach(o => o.classList.toggle('active', o === opt))
    updateTotal()
  })
  $('#bookForm').addEventListener('submit', e => {
    e.preventDefault()
    submitBooking(cat, e.currentTarget)
  })
}

function closeModal() {
  const overlay = $('#overlay')
  if (!overlay || !overlay.classList.contains('open')) return
  overlay.classList.remove('open')
  document.body.style.overflow = ''
  state.activeCat = null
}

async function submitBooking(cat, form) {
  const msg = $('#bookMsg')
  const submit = $('#bookSubmit')
  const renter = $('#bookName').value.trim()
  const email = $('#bookEmail').value.trim()
  const date = $('#bookDate').value
  const note = $('#bookNote').value.trim()

  msg.className = 'form-msg err'
  if (renter.length < 2) return (msg.textContent = 'Please add your name.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return (msg.textContent = 'Please add a valid email.')
  if (!date) return (msg.textContent = 'Please pick a date.')

  submit.disabled = true
  submit.textContent = 'Requesting…'
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catId: cat.id, renter, email, date, hours: state.hours, note })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not book that cat.')
    showBookingSuccess(data.booking, cat)
    await refreshFeedAndStats()
  } catch (err) {
    msg.className = 'form-msg err'
    msg.textContent = err.message
    submit.disabled = false
    submit.textContent = 'Request booking'
  }
}

function showBookingSuccess(booking, cat) {
  const dateLabel = new Date(booking.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  $('#modal').innerHTML = `
    <div class="modal-body">
      <div class="success">
        <div class="tickcircle">✓</div>
        <h3>${esc(cat.name)} is reserved!</h3>
        <p>${esc(booking.renter)}, your ${booking.hours}-hour rental is requested for <strong>${esc(dateLabel)}</strong>.<br>${esc(cat.host)} will confirm within 15 minutes.</p>
        <div class="refbox">
          <div class="rl">Booking reference</div>
          <div class="ref">${esc(booking.id)}</div>
        </div>
        <p style="font-size:12.5px">Total <strong>${money(booking.total)}</strong>, paid on delivery. A receipt is on its way to ${esc(booking.email)}.</p>
        <button class="btn btn-dark" id="doneBtn" style="margin-top:20px">Done</button>
      </div>
    </div>
  `
  $('#doneBtn').addEventListener('click', closeModal)
  toast(`${booking.catName} is booked — ${esc(booking.id)}`)
}

function toast(text) {
  const el = $('#toast')
  el.textContent = text
  el.classList.add('show')
  clearTimeout(el._t)
  el._t = setTimeout(() => el.classList.remove('show'), 3200)
}

async function refreshFeedAndStats() {
  try {
    const [bookings, stats] = await Promise.all([
      fetch('/api/bookings').then(r => r.json()),
      fetch('/api/stats').then(r => r.json())
    ])
    state.bookings = bookings.bookings || []
    state.stats = stats
    const b = state.bookings[0]
    const feed = $('#feedItem')
    if (feed && b) feed.innerHTML = `<strong>${esc(b.renter)}</strong> booked <strong>${esc(b.catName)}</strong> for ${b.hours} hrs · just now`
  } catch { /* feed is decorative */ }
}

/* ---------- host form ---------- */

async function submitHost(e) {
  e.preventDefault()
  const msg = $('#hostMsg')
  const btn = $('#hostSubmit')
  const payload = {
    name: $('#catName').value.trim(),
    breed: $('#catBreed').value.trim(),
    age: $('#catAge').value.trim(),
    rate: $('#catRate').value,
    vibe: $('#catVibe').value,
    emoji: $('#catEmoji').value,
    host: $('#hostName').value.trim(),
    city: $('#hostCity').value.trim(),
    bio: $('#catBio').value.trim()
  }
  msg.className = 'form-msg err'
  if (payload.name.length < 2) return (msg.textContent = 'Please add your cat’s name.')
  if (payload.breed.length < 2) return (msg.textContent = 'Please add a breed.')
  if (payload.host.length < 2) return (msg.textContent = 'Please add your name.')
  if (!(Number(payload.rate) >= 5 && Number(payload.rate) <= 60)) return (msg.textContent = 'Set an hourly rate between $5 and $60.')

  btn.disabled = true
  btn.textContent = 'Publishing…'
  try {
    const res = await fetch('/api/cats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not publish that listing.')
    state.cats.unshift(data.cat)
    state.filter = { q: '', vibe: 'All', city: 'All' }
    confetti()
    e.target.reset()
    $('#searchInput').value = ''
    $('#citySelect').innerHTML = `<option value="All">All cities</option>` +
      [...new Set(state.cats.map(c => c.city).filter(Boolean))].sort().map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')
    document.querySelectorAll('#vibeChips .chip').forEach((c, i) => c.classList.toggle('active', i === 0))
    renderCats()
    const count = $('#resultCount')
    if (count) count.textContent = `${state.cats.length} cats`
    msg.className = 'form-msg ok'
    msg.textContent = `${data.cat.name} is live! Neighbors can book them right now.`
    toast(`${data.cat.emoji} ${data.cat.name} is now on PurrBnB`)
    document.getElementById('market').scrollIntoView({ behavior: 'smooth' })
  } catch (err) {
    msg.className = 'form-msg err'
    msg.textContent = err.message
  } finally {
    btn.disabled = false
    btn.textContent = 'Publish my listing'
  }
}

/* ---------- waitlist ---------- */

async function submitWaitlist(e) {
  e.preventDefault()
  const msg = $('#waitMsg')
  const btn = $('#waitSubmit')
  const email = $('#waitEmail').value.trim()
  const city = $('#waitCity').value.trim()
  msg.className = 'form-msg err'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return (msg.textContent = 'Please add a valid email.')
  if (city.length < 2) return (msg.textContent = 'Which city are you in?')

  btn.disabled = true
  btn.textContent = 'Saving your spot…'
  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, city })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not join the waitlist.')
    $('#waitCount').textContent = data.count.toLocaleString()
    const form = $('#waitForm')
    form.innerHTML = `
      <div class="success" style="padding:14px 4px 4px">
        <div class="tickcircle">🐾</div>
        <h3 style="font-size:24px">You're in line!</h3>
        <p>You are <strong>#${data.count.toLocaleString()}</strong> for <strong>${esc(data.city)}</strong>.<br>We'll email you the moment PurrBnB reaches your neighborhood.</p>
        <div class="refbox"><div class="rl">Waitlist position</div><div class="ref">#${data.count.toLocaleString()}</div></div>
        <div class="fineprint" style="margin-top:6px">Keep an eye out — early waitlisters get their first hour free.</div>
      </div>
    `
    toast(`You're on the waitlist for ${data.city} 🐾`)
  } catch (err) {
    msg.className = 'form-msg err'
    msg.textContent = err.message
    btn.disabled = false
    btn.textContent = 'Reserve my spot'
  }
}

/* ---------- particles ---------- */

function initParticles() {
  const canvas = document.getElementById('paws')
  const hero = document.querySelector('.hero')
  if (!canvas || !hero) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const ctx = canvas.getContext('2d')
  const glyphs = ['🐾', '✦', '🐾', '·', '✧', '🐾', '◦']
  let w = 0, h = 0, particles = [], raf = null, last = performance.now()

  function makeParticle(seedY) {
    return {
      baseX: Math.random() * w,
      y: seedY === undefined ? h + Math.random() * 120 : seedY,
      size: 7 + Math.random() * 13,
      speed: 5 + Math.random() * 9,
      sway: 8 + Math.random() * 26,
      phase: Math.random() * Math.PI * 2,
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
      alpha: 0.1 + Math.random() * 0.22,
      rot: (Math.random() - 0.5) * 0.7,
      spin: (Math.random() - 0.5) * 0.1
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = hero.clientWidth
    h = hero.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const count = Math.max(16, Math.min(48, Math.floor(w / 34)))
    particles = Array.from({ length: count }, (_, i) => makeParticle(Math.random() * h))
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      p.y -= p.speed * dt
      p.phase += dt * 0.32
      p.rot += p.spin * dt
      if (p.y < -30) Object.assign(p, makeParticle(h + 20))
      const x = p.baseX + Math.sin(p.phase) * p.sway
      ctx.save()
      ctx.translate(x, p.y)
      ctx.rotate(p.rot)
      ctx.globalAlpha = p.alpha
      ctx.font = `${p.size}px ui-sans-serif, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(p.glyph, 0, 0)
      ctx.restore()
    }
    raf = requestAnimationFrame(frame)
  }

  resize()
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null }
    else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) }
  })
  raf = requestAnimationFrame(frame)
}

function confetti() {
  const colors = ['#ff6b5e', '#5b3d8f', '#ffb648', '#4aa77c', '#ffc9b5']
  const pieces = Array.from({ length: 26 }, (_, i) => {
    const s = document.createElement('span')
    s.textContent = i % 3 === 0 ? '🐾' : '•'
    Object.assign(s.style, {
      position: 'fixed', left: '50%', top: '58%', zIndex: 90, pointerEvents: 'none',
      fontSize: (10 + Math.random() * 14) + 'px',
      color: colors[i % colors.length],
      transition: 'transform 1.1s cubic-bezier(.2,.7,.3,1), opacity 1.1s ease'
    })
    document.body.appendChild(s)
    requestAnimationFrame(() => {
      s.style.transform = `translate(${(Math.random() - 0.5) * 460}px, ${-80 - Math.random() * 240}px) rotate(${(Math.random() - 0.5) * 540}deg)`
      s.style.opacity = '0'
    })
    setTimeout(() => s.remove(), 1300)
  })
  return pieces
}

boot()
