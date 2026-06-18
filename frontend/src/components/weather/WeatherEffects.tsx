import { useEffect, useState, useMemo, createContext, useContext } from 'react'

type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'thunderstorm' | 'loading'

interface WeatherData {
  temperature: number
  condition: WeatherCondition
  description: string
}

/**
 * Maps WMO weather codes to our simplified conditions.
 * See: https://open-meteo.com/en/docs#weathervariables
 */
function mapWMOCode(code: number): { condition: WeatherCondition; description: string } {
  if (code === 0 || code === 1) return { condition: 'sunny', description: 'Trời nắng' }
  if (code === 2 || code === 3) return { condition: 'cloudy', description: 'Trời nhiều mây' }
  if (code >= 45 && code <= 48) return { condition: 'cloudy', description: 'Sương mù' }
  if (code >= 51 && code <= 57) return { condition: 'rainy', description: 'Mưa phùn' }
  if (code >= 61 && code <= 65) return { condition: 'rainy', description: 'Trời mưa' }
  if (code >= 66 && code <= 67) return { condition: 'rainy', description: 'Mưa lạnh' }
  if (code >= 71 && code <= 77) return { condition: 'cloudy', description: 'Trời u ám' }
  if (code >= 80 && code <= 82) return { condition: 'rainy', description: 'Mưa rào' }
  if (code >= 95 && code <= 99) return { condition: 'thunderstorm', description: 'Giông bão' }
  return { condition: 'cloudy', description: 'Trời nhiều mây' }
}

/* Context to share weather data between overlay & badge */
const WeatherContext = createContext<WeatherData>({
  temperature: 0,
  condition: 'loading',
  description: '',
})

export function useWeather(): WeatherData {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 0,
    condition: 'loading',
    description: 'Đang tải...',
  })

  useEffect(() => {
    const controller = new AbortController()

    async function fetchWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=10.8231&longitude=106.6297&current=temperature_2m,weather_code&timezone=Asia%2FHo_Chi_Minh',
          { signal: controller.signal }
        )
        const data = await res.json()
        const { temperature_2m, weather_code } = data.current
        const mapped = mapWMOCode(weather_code)
        setWeather({
          temperature: Math.round(temperature_2m),
          condition: mapped.condition,
          description: mapped.description,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setWeather({
            temperature: 30,
            condition: 'rainy',
            description: 'Trời mưa',
          })
        }
      }
    }

    fetchWeather()
    return () => controller.abort()
  }, [])

  return weather
}

/* ─── Rain Effect — Very subtle ambient drops ─── */
function RainEffect() {
  const drops = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 1.2 + Math.random() * 0.8,
      opacity: 0.06 + Math.random() * 0.14,
      width: 1 + Math.random() * 0.5,
      height: 14 + Math.random() * 10,
    }))
  }, [])

  return (
    <div className="weather-rain-container">
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="weather-raindrop"
          style={{
            left: `${drop.left}%`,
            animationDelay: `${drop.delay}s`,
            animationDuration: `${drop.duration}s`,
            opacity: drop.opacity,
            width: `${drop.width}px`,
            height: `${drop.height}px`,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Thunderstorm ─── */
function ThunderstormEffect() {
  return (
    <div className="weather-rain-container">
      <RainEffect />
      <div className="weather-lightning" />
    </div>
  )
}

/* ─── Sun Effect ─── */
function SunEffect() {
  const particles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 50,
      top: 5 + Math.random() * 45,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 5,
    }))
  }, [])

  return (
    <div className="weather-sun-container">
      <div className="weather-sun">
        <div className="weather-sun-core" />
        <div className="weather-sun-rays">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="weather-sun-ray"
              style={{ transform: `rotate(${i * 30}deg)` }}
            />
          ))}
        </div>
        <div className="weather-sun-halo" />
      </div>
      {particles.map((p) => (
        <div
          key={p.id}
          className="weather-sun-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Cloudy Effect ─── */
function CloudEffect() {
  return (
    <div className="weather-cloud-container">
      <div className="weather-cloud weather-cloud-1" />
      <div className="weather-cloud weather-cloud-2" />
      <div className="weather-cloud weather-cloud-3" />
    </div>
  )
}

/* ─── Weather Overlay (absolute positioned behind content) ─── */
export function WeatherOverlay() {
  const weather = useContext(WeatherContext)

  return (
    <div className="weather-overlay" aria-hidden="true">
      {weather.condition === 'sunny' && <SunEffect />}
      {weather.condition === 'cloudy' && <CloudEffect />}
      {weather.condition === 'rainy' && <RainEffect />}
      {weather.condition === 'thunderstorm' && <ThunderstormEffect />}
    </div>
  )
}

/* ─── Inline Weather Badge (sits inside the footer naturally) ─── */
export function WeatherBadge() {
  const weather = useContext(WeatherContext)

  if (weather.condition === 'loading') return null

  const iconMap = {
    sunny: '☀️',
    cloudy: '⛅',
    rainy: '🌧️',
    thunderstorm: '⛈️',
  }

  return (
    <div className="weather-badge-inline">
      <span className="weather-badge-inline-icon">{iconMap[weather.condition]}</span>
      <span className="weather-badge-inline-temp">{weather.temperature}°C</span>
      <span className="weather-badge-inline-sep">·</span>
      <span className="weather-badge-inline-desc">{weather.description}</span>
    </div>
  )
}

/* ─── Provider — wraps the left panel to share weather state ─── */
export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const weather = useWeather()
  return (
    <WeatherContext.Provider value={weather}>
      {children}
    </WeatherContext.Provider>
  )
}

/* ─── Legacy Export for backward compat ─── */
export function WeatherEffects() {
  const weather = useWeather()

  return (
    <>
      <WeatherContext.Provider value={weather}>
        <WeatherOverlay />
      </WeatherContext.Provider>
    </>
  )
}

export default WeatherEffects
