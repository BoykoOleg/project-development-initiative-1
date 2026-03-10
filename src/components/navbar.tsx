import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAccess } from "@/hooks/use-access"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { hasAccess } = useAccess()
  const clickCount = useRef(0)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleLogoClick() {
    clickCount.current += 1
    if (clickTimer.current) clearTimeout(clickTimer.current)
    if (clickCount.current >= 5) {
      clickCount.current = 0
      navigate('/admin')
      return
    }
    clickTimer.current = setTimeout(() => { clickCount.current = 0 }, 2000)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999] bg-black/95 backdrop-blur-md border-b border-red-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer select-none" onClick={handleLogoClick}>
            <h1 className="font-orbitron text-xl font-bold text-white">
              Trade<span className="text-red-500">Base</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="/catalog"
                className="font-geist text-white hover:text-red-500 transition-colors duration-200"
              >
                Каталог
              </a>
              <a href="/trading-basics" className="font-geist text-white hover:text-red-500 transition-colors duration-200">
                Основы
              </a>
              <a href="/bots-guide" className="font-geist text-white hover:text-red-500 transition-colors duration-200">
                Боты
              </a>
              <a href="/practice" className="font-geist text-white hover:text-red-500 transition-colors duration-200">
                Практика
              </a>
              <a href="/bot-landing" className="font-geist text-red-400 hover:text-red-300 transition-colors duration-200 font-semibold">
                🤖 Боты
              </a>
              <a href="/bot-builder" className="font-geist text-white hover:text-red-500 transition-colors duration-200">
                Конструктор
              </a>
              <a href="/legends" className="font-geist text-yellow-400 hover:text-yellow-300 transition-colors duration-200 font-semibold">
                🏆 Легенды
              </a>
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            {hasAccess ? (
              <Button className="bg-red-500 hover:bg-red-600 text-white font-geist border-0" onClick={() => navigate('/trading-basics')}>
                Начать обучение
              </Button>
            ) : (
              <Button className="bg-red-500 hover:bg-red-600 text-white font-geist border-0 animate-pulse" onClick={() => navigate('/payment')}>
                🔑 Получить доступ — 2 000 ₽
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-red-500 transition-colors duration-200"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black/98 border-t border-red-500/20">
              <a
                href="/catalog"
                className="block px-3 py-2 font-geist text-white hover:text-red-500 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Каталог
              </a>
              <a
                href="/trading-basics"
                className="block px-3 py-2 font-geist text-white hover:text-red-500 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Основы
              </a>
              <a
                href="/bots-guide"
                className="block px-3 py-2 font-geist text-white hover:text-red-500 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Боты
              </a>
              <a
                href="/practice"
                className="block px-3 py-2 font-geist text-white hover:text-red-500 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Практика
              </a>
              <a
                href="/bot-landing"
                className="block px-3 py-2 font-geist text-red-400 hover:text-red-300 font-semibold transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                🤖 Боты
              </a>
              <a
                href="/bot-builder"
                className="block px-3 py-2 font-geist text-white hover:text-red-500 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Конструктор
              </a>
              <a
                href="/legends"
                className="block px-3 py-2 font-geist text-yellow-400 hover:text-yellow-300 font-semibold transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                🏆 Легенды
              </a>
              <div className="px-3 py-2">
                {hasAccess ? (
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-geist border-0" onClick={() => { navigate('/trading-basics'); setIsOpen(false) }}>
                    Начать обучение
                  </Button>
                ) : (
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-geist border-0" onClick={() => { navigate('/payment'); setIsOpen(false) }}>
                    🔑 Получить доступ — 2 000 ₽
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}