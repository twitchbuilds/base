import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'db.json')

const seedCats = [
  { id: 'mochi', name: 'Mochi', breed: 'Ragdoll', age: '3 yrs', emoji: '🐱', vibe: 'Cuddly', rate: 14, rating: 4.9, reviews: 128, host: 'Dana in Brooklyn', city: 'Brooklyn, NY', tags: ['Lap magnet', 'Quiet', 'Brush lover'], bio: 'Mochi has never met a laptop she did not want to sit on. Perfect for focused work sessions with a soft supervisor.', gradient: 'peach' },
  { id: 'biscuit', name: 'Biscuit', breed: 'Orange Tabby', age: '2 yrs', emoji: '😺', vibe: 'Playful', rate: 11, rating: 4.8, reviews: 96, host: 'Marcus in Austin', city: 'Austin, TX', tags: ['Fetch pro', 'Zoomies', 'Food motivated'], bio: 'Biscuit will chase a shoelace for hours and then fall asleep in your lap. Comes with his own toy basket.', gradient: 'gold' },
  { id: 'olive', name: 'Olive', breed: 'British Shorthair', age: '5 yrs', emoji: '😼', vibe: 'Chill', rate: 16, rating: 5.0, reviews: 74, host: 'Priya in Chicago', city: 'Chicago, IL', tags: ['Low energy', 'Window sitter', 'Quiet'], bio: 'A professional napper. Olive is ideal for reading afternoons and long video calls where you want a calm co-star.', gradient: 'sage' },
  { id: 'pepper', name: 'Pepper', breed: 'Tuxedo', age: '1 yr', emoji: '🐈‍⬛', vibe: 'Chatty', rate: 9, rating: 4.7, reviews: 61, host: 'Theo in Portland', city: 'Portland, OR', tags: ['Talks back', 'Curious', 'Greets guests'], bio: 'Pepper narrates everything. Expect commentary on your emails, your snacks, and the birds outside.', gradient: 'ink' },
  { id: 'clementine', name: 'Clementine', breed: 'Calico', age: '4 yrs', emoji: '😸', vibe: 'Cuddly', rate: 13, rating: 4.9, reviews: 152, host: 'Rosa in Miami', city: 'Miami, FL', tags: ['Headbutts', 'Purr machine', 'Sunbather'], bio: 'Clementine purrs at a frequency that has been scientifically described as "unreasonably soothing."', gradient: 'rose' },
  { id: 'noodle', name: 'Noodle', breed: 'Siamese', age: '6 yrs', emoji: '🐈', vibe: 'Chatty', rate: 15, rating: 4.8, reviews: 88, host: 'June in Seattle', city: 'Seattle, WA', tags: ['Very vocal', 'Shoulder cat', 'Social'], bio: 'Noodle would like to be involved in whatever you are doing. Yes, including that. Especially that.', gradient: 'lavender' },
  { id: 'miso', name: 'Miso', breed: 'Scottish Fold', age: '2 yrs', emoji: '🙂', vibe: 'Chill', rate: 18, rating: 4.9, reviews: 45, host: 'Abe in San Francisco', city: 'San Francisco, CA', tags: ['Round', 'Zen', 'Sunbeam seeker'], bio: 'Miso is shaped like a dumpling and moves like a cloud. A premium companion for premium lounging.', gradient: 'cream' },
  { id: 'juniper', name: 'Juniper', breed: 'Maine Coon', age: '3 yrs', emoji: '🦁', vibe: 'Playful', rate: 17, rating: 4.9, reviews: 103, host: 'Elena in Denver', city: 'Denver, CO', tags: ['Gentle giant', 'Puzzle solver', 'Fluffy'], bio: 'Juniper is a large, polite lion who will politely solve a puzzle toy and then politely ask for more.', gradient: 'forest' }
]

function seed() {
  const now = Date.now()
  const bookings = [
    { id: 'PB-4821', catId: 'mochi', catName: 'Mochi', renter: 'Sam', email: 'sam@example.com', date: new Date(now + 864e5).toISOString().slice(0, 10), hours: 3, total: 42, note: 'Working from home, needs a desk buddy.', createdAt: new Date(now - 36 * 6e4).toISOString() },
    { id: 'PB-4818', catId: 'biscuit', catName: 'Biscuit', renter: 'Alex', email: 'alex@example.com', date: new Date(now + 2 * 864e5).toISOString().slice(0, 10), hours: 2, total: 22, note: 'Movie night.', createdAt: new Date(now - 84 * 6e4).toISOString() },
    { id: 'PB-4812', catId: 'olive', catName: 'Olive', renter: 'Riley', email: 'riley@example.com', date: new Date(now + 3 * 864e5).toISOString().slice(0, 10), hours: 5, total: 80, note: 'Reading marathon.', createdAt: new Date(now - 190 * 6e4).toISOString() }
  ]
  return { cats: seedCats, bookings, waitlist: [], baseWaitlist: 1284, counter: 4822 }
}

function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    if (!Array.isArray(raw.cats) || !Array.isArray(raw.bookings)) throw new Error('bad data')
    if (!Array.isArray(raw.waitlist)) raw.waitlist = []
    if (!raw.baseWaitlist) raw.baseWaitlist = 1284
    return raw
  } catch {
    const fresh = seed()
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(fresh, null, 2))
    return fresh
  }
}

function save(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2))
}

function send(res, code, payload) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
      if (data.length > 1e5) { reject(new Error('too large')); req.destroy() }
    })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch { reject(new Error('bad json')) }
    })
    req.on('error', reject)
  })
}

const clean = (v, max = 120) => String(v ?? '').trim().slice(0, max)
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

function api(req, res, next) {
  const url = new URL(req.url, 'http://localhost')
  const route = url.pathname.replace(/\/+$/, '') || '/'
  const db = load()

  if (req.method === 'GET' && route === '/cats') {
    return send(res, 200, { cats: db.cats })
  }

  if (req.method === 'GET' && route === '/bookings') {
    const bookings = [...db.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
    return send(res, 200, { bookings })
  }

  if (req.method === 'GET' && route === '/stats') {
    const avg = db.cats.reduce((s, c) => s + Number(c.rating || 0), 0) / (db.cats.length || 1)
    const cities = new Set(db.cats.map(c => (c.city || '').split(',').pop().trim()).filter(Boolean))
    return send(res, 200, {
      cats: db.cats.length,
      bookings: db.bookings.length,
      rating: Math.round(avg * 10) / 10,
      cities: cities.size + 29
    })
  }

  if (req.method === 'GET' && route === '/waitlist') {
    const counts = {}
    for (const w of db.waitlist) counts[w.city] = (counts[w.city] || 0) + 1
    return send(res, 200, {
      count: db.baseWaitlist + db.waitlist.length,
      recentCities: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([city, n]) => ({ city, n }))
    })
  }

  if (req.method === 'POST' && route === '/waitlist') {
    return readBody(req).then(body => {
      const email = clean(body.email, 120).toLowerCase()
      const city = clean(body.city, 60)
      if (!emailOk(email)) return send(res, 400, { error: 'Please add a valid email.' })
      if (city.length < 2) return send(res, 400, { error: 'Which city are you in?' })
      if (db.waitlist.some(w => w.email === email)) return send(res, 409, { error: 'You are already on the list — we will be in touch!' })
      db.waitlist.push({ email, city, createdAt: new Date().toISOString() })
      save(db)
      return send(res, 201, {
        position: db.baseWaitlist + db.waitlist.length,
        count: db.baseWaitlist + db.waitlist.length,
        city
      })
    }).catch(() => send(res, 400, { error: 'Could not join the waitlist.' }))
  }

  if (req.method === 'POST' && route === '/bookings') {
    return readBody(req).then(body => {
      const cat = db.cats.find(c => c.id === clean(body.catId, 40))
      if (!cat) return send(res, 404, { error: 'That cat is no longer listed.' })
      const renter = clean(body.renter, 60)
      const email = clean(body.email, 120)
      const date = clean(body.date, 10)
      const hours = Math.min(12, Math.max(1, Number(body.hours) || 0))
      if (renter.length < 2) return send(res, 400, { error: 'Please add your name.' })
      if (!emailOk(email)) return send(res, 400, { error: 'Please add a valid email.' })
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return send(res, 400, { error: 'Please pick a valid date.' })
      const total = Math.round(hours * Number(cat.rate) * 100) / 100
      const booking = {
        id: 'PB-' + db.counter,
        catId: cat.id,
        catName: cat.name,
        renter,
        email,
        date,
        hours,
        total,
        note: clean(body.note, 240),
        createdAt: new Date().toISOString()
      }
      db.counter += 1
      db.bookings.push(booking)
      save(db)
      return send(res, 201, { booking, cat })
    }).catch(err => send(res, 400, { error: err.message === 'bad json' ? 'Invalid request.' : 'Could not save that booking.' }))
  }

  if (req.method === 'POST' && route === '/cats') {
    return readBody(req).then(body => {
      const name = clean(body.name, 40)
      const breed = clean(body.breed, 40)
      const host = clean(body.host, 60)
      const city = clean(body.city, 60)
      const rate = Math.round(Number(body.rate) * 100) / 100
      const vibe = ['Cuddly', 'Playful', 'Chill', 'Chatty'].includes(body.vibe) ? body.vibe : 'Chill'
      const emoji = clean(body.emoji, 8) || '🐱'
      if (name.length < 2) return send(res, 400, { error: 'Please add your cat’s name.' })
      if (breed.length < 2) return send(res, 400, { error: 'Please add a breed.' })
      if (host.length < 2) return send(res, 400, { error: 'Please add your name.' })
      if (!(rate >= 5 && rate <= 60)) return send(res, 400, { error: 'Hourly rate must be between $5 and $60.' })
      const gradients = ['peach', 'gold', 'sage', 'ink', 'rose', 'lavender', 'cream', 'forest']
      const cat = {
        id: 'cat-' + Date.now().toString(36),
        name, breed,
        age: clean(body.age, 12) || '2 yrs',
        emoji,
        vibe,
        rate,
        rating: 5.0,
        reviews: 0,
        host,
        city,
        tags: ['New host', 'Vet-checked', vibe],
        bio: clean(body.bio, 240) || `${name} is a newly listed ${breed.toLowerCase()} ready for their first PurrBnB visit.`,
        gradient: gradients[db.cats.length % gradients.length],
        new: true
      }
      db.cats.unshift(cat)
      save(db)
      return send(res, 201, { cat })
    }).catch(() => send(res, 400, { error: 'Could not publish that listing.' }))
  }

  return next()
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true
  },
  plugins: [{
    name: 'purrbnb-api',
    configureServer(server) {
      server.middlewares.use('/api', api)
    }
  }]
})
