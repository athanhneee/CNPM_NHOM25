const API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5'
const CITY = 'Ho Chi Minh City,VN'

export interface RealWeather {
  condition: 'rain' | 'sunny' | 'cloudy'
  temp: number
  label: string
  humidity: number
  wind: number
  rainChance: number
  forecast: Array<{
    day: Date
    high: number
    low: number
    condition: 'rain' | 'sunny' | 'cloudy'
  }>
}

function mapCondition(id: number): 'rain' | 'sunny' | 'cloudy' {
  if (id >= 200 && id < 600) return 'rain'
  if (id === 800) return 'sunny'
  return 'cloudy'
}

export async function fetchWeather(): Promise<RealWeather | null> {
  if (!API_KEY) return null

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?q=${CITY}&units=metric&lang=vi&appid=${API_KEY}`),
      fetch(`${BASE_URL}/forecast?q=${CITY}&units=metric&lang=vi&appid=${API_KEY}`),
    ])

    if (!currentRes.ok || !forecastRes.ok) {
      return null
    }

    const current = await currentRes.json()
    const forecast = await forecastRes.json()

    // Extract current pop from forecast (first item)
    const currentPop = forecast.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0

    // Group forecast by day
    const dailyData = new Map<string, { high: number; low: number; conditions: number[] }>()
    
    for (const item of forecast.list) {
      const date = new Date(item.dt * 1000)
      const dateStr = date.toISOString().split('T')[0]!
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, { high: -100, low: 100, conditions: [] })
      }
      
      const dayData = dailyData.get(dateStr)!
      dayData.high = Math.max(dayData.high, item.main.temp_max)
      dayData.low = Math.min(dayData.low, item.main.temp_min)
      dayData.conditions.push(item.weather[0].id)
    }

    const forecastArray = Array.from(dailyData.entries()).map(([dateStr, data]) => {
      // Pick most common condition or worst condition
      const isRain = data.conditions.some(id => id >= 200 && id < 600)
      const isCloudy = data.conditions.some(id => id > 800)
      let condition: 'rain' | 'sunny' | 'cloudy' = 'sunny'
      if (isRain) condition = 'rain'
      else if (isCloudy) condition = 'cloudy'

      return {
        day: new Date(dateStr),
        high: Math.round(data.high),
        low: Math.round(data.low),
        condition
      }
    })

    // Remove today from forecast if we want future days
    const todayStr = new Date().toISOString().split('T')[0]
    const futureForecast = forecastArray.filter(f => f.day.toISOString().split('T')[0] !== todayStr).slice(0, 5)

    return {
      condition: mapCondition(current.weather[0].id),
      temp: Math.round(current.main.temp),
      label: current.weather[0].description,
      humidity: current.main.humidity,
      wind: Math.round(current.wind.speed * 3.6), // m/s to km/h
      rainChance: currentPop,
      forecast: futureForecast,
    }
  } catch (err) {
    console.error('Failed to fetch weather', err)
    return null
  }
}
