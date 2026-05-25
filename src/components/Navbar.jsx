import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { markSearchOpened } from '../searchFocusFlags'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, ChevronDown, Bookmark, Shield, LogOut, User, CircleUser, Tv } from 'lucide-react'
import { TV_GENRES } from '../config/tvGenres'

const ZONES = [
  { id: 'bollywood', label: 'Bollywood', path: '/bollywood' },
  { id: 'hollywood', label: 'Hollywood', path: '/hollywood' },
  { id: 'animation', label: 'Animation', path: '/animation' },
]

const BOLLYWOOD_CATEGORIES = [
  { slug: 'bollywood-2020s',        label: '2020s Bollywood' },
  { slug: 'bollywood-2010s',        label: '2010s Bollywood' },
  { slug: 'bollywood-2000s',        label: '2000s Bollywood' },
  { slug: 'bollywood-90s',          label: '90s Bollywood' },
  { slug: 'bollywood-80s',          label: '80s Bollywood' },
  { slug: 'bollywood-classic',      label: 'Classic Bollywood' },
  { slug: 'bollywood-priyadarshan', label: 'Priyadarshan' },
  { slug: 'bollywood-action',       label: 'Action' },
  { slug: 'bollywood-adventure',    label: 'Adventure' },
  { slug: 'bollywood-comedy',       label: 'Comedy' },
  { slug: 'bollywood-crime',        label: 'Crime' },
  { slug: 'bollywood-drama',        label: 'Drama' },
  { slug: 'bollywood-family',       label: 'Family' },
  { slug: 'bollywood-fantasy',      label: 'Fantasy' },
  { slug: 'bollywood-horror',       label: 'Horror' },
  { slug: 'bollywood-scifi',        label: 'Science Fiction' },
  { slug: 'bollywood-thriller',     label: 'Thriller' },
  { slug: 'bollywood-romance',      label: 'Romance' },
]

const HOLLYWOOD_CATEGORIES = [
  { slug: 'hollywood-2020s',        label: '2020s Hollywood' },
  { slug: 'hollywood-2010s',        label: '2010s Hollywood' },
  { slug: 'hollywood-2000s',        label: '2000s Hollywood' },
  { slug: 'hollywood-90s',          label: '90s Hollywood' },
  { slug: 'hollywood-80s',          label: '80s Hollywood' },
  { slug: 'hollywood-classic',      label: 'Classic Hollywood' },
  { slug: 'hollywood-action',       label: 'Action' },
  { slug: 'hollywood-adventure',    label: 'Adventure' },
  { slug: 'hollywood-comedy',       label: 'Comedy' },
  { slug: 'hollywood-crime',        label: 'Crime' },
  { slug: 'hollywood-drama',        label: 'Drama' },
  { slug: 'hollywood-family',       label: 'Family' },
  { slug: 'hollywood-fantasy',      label: 'Fantasy' },
  { slug: 'hollywood-horror',       label: 'Horror' },
  { slug: 'hollywood-scifi',        label: 'Science Fiction' },
  { slug: 'hollywood-thriller',     label: 'Thriller' },
  { slug: 'hollywood-romance',      label: 'Romance' },
]

const ANIMATION_CATEGORIES = [
  { slug: 'animation-modern',      label: 'Modern Masterpieces' },
  { slug: 'animation-2010s',       label: 'The 2010s Era' },
  { slug: 'animation-2000s',       label: 'The 2000s Era' },
  { slug: 'animation-90s',         label: '90s Classics' },
  { slug: 'animation-vintage',     label: 'Vintage Cartoons' },
  { slug: 'animation-stopmotion',  label: 'Stop Motion' },
  { slug: 'animation-anime',       label: 'Anime' },
  { slug: 'animation-3d',          label: '3D Animation' },
  { slug: 'animation-puppet',      label: 'Puppet Animation' },
  { slug: 'animation-2d',          label: '2D / Hand Drawn' },
]

const AnimatedLogo = () => (
  <Link to="/" className="inline-flex items-center select-none">
    <div className="flex flex-col items-center leading-[0.7]">
      <span className="font-black uppercase tracking-tighter text-white text-lg md:text-xl leading-[0.7]">MOVIES</span>
      <span className="font-black uppercase tracking-tighter text-yellow-400 text-base md:text-lg leading-[0.7] -mt-0.5">BOX</span>
    </div>
  </Link>
)

const Navbar = ({ user, onLogout }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState('bollywood')
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)
  const profileRef = useRef(null)
  const isTVRoute = location.pathname === '/' || location.pathname.startsWith('/tv')
  const routeZone =
    location.pathname.startsWith('/hollywood') ? 'hollywood'
      : location.pathname.startsWith('/animation') ? 'animation'
        : location.pathname.startsWith('/bollywood') ? 'bollywood'
          : null
  const activeZone = isTVRoute ? null : (routeZone ?? selectedZone)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowCategories(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleCategoryClick = (item) => {
    setShowCategories(false)
    setMobileOpen(false)
    if (isTVRoute) {
      navigate(`/tv-genre?id=${item.id}&name=${encodeURIComponent(item.name)}`)
      return
    }
    navigate(`/genre?slug=${item.slug}&name=${encodeURIComponent(item.label)}&zone=${activeZone || selectedZone}`)
  }

  const zoneIndex = ZONES.findIndex(z => z.id === activeZone)

  return (
    <>
      <nav className={`fixed top-0 w-full z-[100] px-4 md:px-12 py-3 flex items-center justify-between transition-all duration-300 ${
        scrolled || mobileOpen ? 'bg-black shadow-2xl' : 'bg-gradient-to-b from-black/80 via-black/20 to-transparent'
      }`}>

        {/* Logo */}
        <div className="flex-shrink-0">
          <AnimatedLogo />
        </div>

        {/* Desktop center — zone switcher + categories */}
        <div className="hidden lg:flex items-center gap-4">

          {/* Zone Switcher */}
          <div className="relative flex bg-white/5 border border-white/10 rounded-full p-1 h-10 items-center backdrop-blur-md">
            {!isTVRoute && zoneIndex >= 0 && (
              <motion.div
                className="absolute rounded-full h-8 bg-gradient-to-r from-yellow-500 to-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                animate={{ x: zoneIndex * 95, width: 95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            {ZONES.map((zone) => (
              <motion.button
                key={zone.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedZone(zone.id); navigate(zone.path) }}
                className={`relative z-10 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 w-[95px] h-full ${
                  activeZone === zone.id ? 'text-[#333]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {zone.label}
              </motion.button>
            ))}
          </div>

          <NavLink
            to="/tv-shows"
            className={({ isActive }) => `inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight h-9 transition-all duration-300 border backdrop-blur-sm ${
              isActive || isTVRoute
                ? 'bg-yellow-400 text-black border-yellow-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            TV Shows
          </NavLink>

          {/* Categories Dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setShowCategories(true)}
            onMouseLeave={() => setShowCategories(false)}
          >
            <button
              type="button"
              onClick={() => setShowCategories(p => !p)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-tight text-gray-400 hover:text-white transition-all duration-300 h-9 backdrop-blur-sm"
            >
              Categories
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showCategories ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showCategories && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-[calc(100%+12px)] z-50 w-[300px] rounded-2xl border border-white/10 bg-black/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
                >
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400 mb-4">
                    {isTVRoute ? 'TV Genres' : 'Genres'}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {isTVRoute ? (
                      TV_GENRES.map((genre) => (
                        <motion.button key={genre.id} whileHover={{ x: 5, color: '#fff' }} type="button" onClick={() => handleCategoryClick(genre)} className="text-left text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 transition-all duration-200 py-1">{genre.name}</motion.button>
                      ))
                    ) : selectedZone === 'bollywood' ? (
                      BOLLYWOOD_CATEGORIES.map((cat) => (
                        <motion.button key={cat.slug} whileHover={{ x: 5, color: '#fff' }} type="button" onClick={() => handleCategoryClick(cat)} className="text-left text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 transition-all duration-200 py-1">{cat.label}</motion.button>
                      ))
                    ) : selectedZone === 'hollywood' ? (
                      HOLLYWOOD_CATEGORIES.map((cat) => (
                        <motion.button key={cat.slug} whileHover={{ x: 5, color: '#fff' }} type="button" onClick={() => handleCategoryClick(cat)} className="text-left text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 transition-all duration-200 py-1">{cat.label}</motion.button>
                      ))
                    ) : (
                      ANIMATION_CATEGORIES.map((cat) => (
                        <motion.button key={cat.slug} whileHover={{ x: 5, color: '#fff' }} type="button" onClick={() => handleCategoryClick(cat)} className="text-left text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 transition-all duration-200 py-1">{cat.label}</motion.button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Surprise Me */}
          {/* <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              markSearchOpened('')
              navigate('/search', { state: { focusSearch: true, t: Date.now() } })
            }}
            className="relative flex items-center justify-center w-9 h-9 rounded-full bg-yellow-500/10 border border-yellow-500/40 text-yellow-400"
            title="Search"
          >
            <motion.span
              className="absolute inset-0 rounded-full bg-yellow-400/10"
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <Zap className="w-4 h-4 fill-yellow-400 text-yellow-400" style={{ filter: 'drop-shadow(0 0 8px rgba(250,204,21,1))' }} />
          </motion.button> */}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              markSearchOpened('')
              navigate('/search', { state: { focusSearch: true, t: Date.now() } })
            }}
            className="text-gray-300 hover:text-white transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Profile dropdown — desktop */}
          <div ref={profileRef} className="hidden lg:block relative">
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-yellow-400/50 flex items-center justify-center transition-all"
            >
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-4 h-4 text-white" />}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-[calc(100%+10px)] w-48 bg-black/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden z-[110]"
                >
                  {user && (
                    <button
                      type="button"
                      onClick={() => { setProfileOpen(false); navigate('/profile') }}
                      className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center shrink-0">
                        {user?.avatar
                          ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                          : <User className="w-3.5 h-3.5 text-gray-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-widest text-white truncate">{user.fullName}</p>
                        <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/profile') }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <CircleUser className="w-4 h-4 text-yellow-400" /> Profile
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/my-list') }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Bookmark className="w-4 h-4 text-yellow-400" /> My List
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => { setProfileOpen(false); navigate('/admin') }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-yellow-400 hover:text-white hover:bg-yellow-500/10 transition-all border-t border-white/5"
                    >
                      <Shield className="w-4 h-4 text-yellow-400" /> Admin
                    </button>
                  )}
                  <button
                    onClick={() => { setProfileOpen(false); onLogout() }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all border-t border-white/5"
                  >
                    <LogOut className="w-4 h-4 text-gray-500" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hamburger — mobile */}
          <button
            className="lg:hidden p-1.5 text-gray-300 hover:text-white"
            onClick={() => setMobileOpen(p => !p)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[98] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="fixed top-0 right-0 h-full w-[80vw] max-w-xs z-[99] bg-[#0a0a0a] border-l border-white/10 flex flex-col lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
                <AnimatedLogo />
                <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col px-5 py-6 gap-1">
                {user && (
                  <div className="mb-4 pb-4 border-b border-white/10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center shrink-0">
                      {user?.avatar
                        ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                        : <User className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest text-white truncate">{user.fullName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                )}

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Browse</p>
                {ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => { setSelectedZone(zone.id); navigate(zone.path); setMobileOpen(false) }}
                    className={`text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition mb-1 ${
                      activeZone === zone.id ? 'bg-yellow-400 text-black' : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    {zone.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => { navigate('/tv-shows'); setMobileOpen(false) }}
                  className="text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition mb-1 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  TV Shows
                </button>

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mt-5 mb-2 px-0.5">
                  {isTVRoute ? 'TV Genres' : 'Categories'}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {isTVRoute ? (
                    TV_GENRES.map((genre) => (
                      <button key={genre.id} onClick={() => handleCategoryClick(genre)} className="text-left px-2.5 py-2.5 rounded-lg bg-white/5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:text-white hover:bg-white/10 transition leading-snug line-clamp-3 min-h-[3.25rem]">{genre.name}</button>
                    ))
                  ) : selectedZone === 'bollywood' ? (
                    BOLLYWOOD_CATEGORIES.map((cat) => (
                      <button key={cat.slug} onClick={() => handleCategoryClick(cat)} className="text-left px-2.5 py-2.5 rounded-lg bg-white/5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:text-white hover:bg-white/10 transition leading-snug line-clamp-3 min-h-[3.25rem]">{cat.label}</button>
                    ))
                  ) : selectedZone === 'hollywood' ? (
                    HOLLYWOOD_CATEGORIES.map((cat) => (
                      <button key={cat.slug} onClick={() => handleCategoryClick(cat)} className="text-left px-2.5 py-2.5 rounded-lg bg-white/5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:text-white hover:bg-white/10 transition leading-snug line-clamp-3 min-h-[3.25rem]">{cat.label}</button>
                    ))
                  ) : (
                    ANIMATION_CATEGORIES.map((cat) => (
                      <button key={cat.slug} onClick={() => handleCategoryClick(cat)} className="text-left px-2.5 py-2.5 rounded-lg bg-white/5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:text-white hover:bg-white/10 transition leading-snug line-clamp-3 min-h-[3.25rem]">{cat.label}</button>
                    ))
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
                  <button onClick={() => { navigate('/profile'); setMobileOpen(false) }}
                    className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-300 hover:text-white">
                    <CircleUser className="w-4 h-4 text-yellow-400" /> Profile
                  </button>
                  <button onClick={() => { navigate('/my-list'); setMobileOpen(false) }}
                    className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-300 hover:text-white">
                    <Bookmark className="w-4 h-4 text-yellow-400" /> My List
                  </button>
                  {user?.role === 'admin' && (
                    <button onClick={() => { navigate('/admin'); setMobileOpen(false) }}
                      className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-yellow-400">
                      <Shield className="w-4 h-4" /> Admin
                    </button>
                  )}
                  <button onClick={() => { onLogout(); setMobileOpen(false) }}
                    className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-300 hover:text-white">
                    <LogOut className="w-4 h-4 text-gray-500" /> Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
