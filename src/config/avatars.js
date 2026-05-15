// DiceBear avatars — all free, no API key needed
// https://api.dicebear.com/9.x/{style}/svg?seed={seed}&options...

const BASE = 'https://api.dicebear.com/9.x'

export const AVATARS = [
  // ── Bottts (robots) ──────────────────────────────────────────
  { id: 'bot-nova',    url: `${BASE}/bottts/svg?seed=Nova&backgroundColor=1a1a2e` },
  { id: 'bot-orion',  url: `${BASE}/bottts/svg?seed=Orion&backgroundColor=0d1b2a` },
  { id: 'bot-zara',   url: `${BASE}/bottts/svg?seed=Zara&backgroundColor=16213e` },
  { id: 'bot-rex',    url: `${BASE}/bottts/svg?seed=Rex&backgroundColor=1b1b2f` },
  { id: 'bot-pixel',  url: `${BASE}/bottts/svg?seed=Pixel&backgroundColor=0f3460` },

  // ── Bottts Neutral (cleaner robots) ──────────────────────────
  { id: 'botn-ace',   url: `${BASE}/bottts-neutral/svg?seed=Ace&backgroundColor=1a1a2e` },
  { id: 'botn-echo',  url: `${BASE}/bottts-neutral/svg?seed=Echo&backgroundColor=0d1b2a` },
  { id: 'botn-flux',  url: `${BASE}/bottts-neutral/svg?seed=Flux&backgroundColor=16213e` },

  // ── Adventurer (illustrated characters) ──────────────────────
  { id: 'adv-blaze',  url: `${BASE}/adventurer/svg?seed=Blaze&backgroundColor=1a1a2e` },
  { id: 'adv-storm',  url: `${BASE}/adventurer/svg?seed=Storm&backgroundColor=0d1b2a` },
  { id: 'adv-luna',   url: `${BASE}/adventurer/svg?seed=Luna&backgroundColor=16213e` },
  { id: 'adv-kai',    url: `${BASE}/adventurer/svg?seed=Kai&backgroundColor=1b1b2f` },

  // ── Adventurer Neutral ────────────────────────────────────────
  { id: 'advn-raven', url: `${BASE}/adventurer-neutral/svg?seed=Raven&backgroundColor=1a1a2e` },
  { id: 'advn-sage',  url: `${BASE}/adventurer-neutral/svg?seed=Sage&backgroundColor=0f3460` },

  // ── Pixel Art ────────────────────────────────────────────────
  { id: 'px-cyber',   url: `${BASE}/pixel-art/svg?seed=Cyber&backgroundColor=1a1a2e` },
  { id: 'px-ghost',   url: `${BASE}/pixel-art/svg?seed=Ghost&backgroundColor=0d1b2a` },
  { id: 'px-neon',    url: `${BASE}/pixel-art/svg?seed=Neon&backgroundColor=16213e` },
  { id: 'px-viper',   url: `${BASE}/pixel-art/svg?seed=Viper&backgroundColor=1b1b2f` },
  { id: 'px-dusk',    url: `${BASE}/pixel-art/svg?seed=Dusk&backgroundColor=0f3460` },

  // ── Fun Emoji ─────────────────────────────────────────────────
  { id: 'em-spark',   url: `${BASE}/fun-emoji/svg?seed=Spark&backgroundColor=1a1a2e` },
  { id: 'em-blip',    url: `${BASE}/fun-emoji/svg?seed=Blip&backgroundColor=0d1b2a` },
  { id: 'em-zest',    url: `${BASE}/fun-emoji/svg?seed=Zest&backgroundColor=16213e` },
  { id: 'em-quark',   url: `${BASE}/fun-emoji/svg?seed=Quark&backgroundColor=1b1b2f` },

  // ── Thumbs ────────────────────────────────────────────────────
  { id: 'th-nova',    url: `${BASE}/thumbs/svg?seed=Nova&backgroundColor=1a1a2e` },
  { id: 'th-comet',   url: `${BASE}/thumbs/svg?seed=Comet&backgroundColor=0d1b2a` },
  { id: 'th-drift',   url: `${BASE}/thumbs/svg?seed=Drift&backgroundColor=16213e` },

  // ── Lorelei (stylised faces) ──────────────────────────────────
  { id: 'lor-aria',   url: `${BASE}/lorelei/svg?seed=Aria&backgroundColor=1a1a2e` },
  { id: 'lor-mira',   url: `${BASE}/lorelei/svg?seed=Mira&backgroundColor=0d1b2a` },
  { id: 'lor-nova',   url: `${BASE}/lorelei/svg?seed=Nova&backgroundColor=16213e` },

  // ── Shapes (abstract / geometric) ────────────────────────────
  { id: 'sh-alpha',   url: `${BASE}/shapes/svg?seed=Alpha&backgroundColor=1a1a2e` },
  { id: 'sh-beta',    url: `${BASE}/shapes/svg?seed=Beta&backgroundColor=0d1b2a` },
  { id: 'sh-gamma',   url: `${BASE}/shapes/svg?seed=Gamma&backgroundColor=16213e` },
]
