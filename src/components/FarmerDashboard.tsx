import { useEffect, useMemo, useState } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import PageLayout from '../shared/PageLayout';
import farmImage from '../assets/images/farm.jfif';
import farmerAvatar from '../assets/images/mada-dashboard.png';
import '../css/FarmerDashboard.css';
import { supabase } from '../supabase/supabase-client';
import { useFarmerProfile } from '../hooks/useFarmerProfile';

interface FarmerDashboardProps {
  onLogout?: () => void;
  onNavigate?: (screen: string) => void;
}

interface FarmSummary {
  count: number;
  totalHectares: number;
}

interface UpcomingTask {
  id: string;
  title: string;
  due_at: string;
}

interface WeatherState {
  tempC: number;
  highC: number;
  lowC: number;
  description: string;
  code: number;
  feelsLikeC: number;
  humidity: number;
  windKph: number;
  precipitationChance: number;
  forecast: Array<{
    date: string;
    highC: number;
    lowC: number;
    description: string;
    code: number;
    precipitationChance: number;
  }>;
}

function describeWeather(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if ([51, 53, 55].includes(code)) return 'Drizzle';
  if ([56, 57].includes(code)) return 'Freezing drizzle';
  if ([61, 63, 65].includes(code)) return 'Rain';
  if ([66, 67].includes(code)) return 'Freezing rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Rain showers';
  if ([85, 86].includes(code)) return 'Snow showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Weather unavailable';
}

function WeatherIcon({ code, size = 34 }: { code: number; size?: number }) {
  const Icon =
    code === 0 ? Sun
      : code <= 2 ? CloudSun
        : code === 3 ? Cloud
          : code === 45 || code === 48 ? CloudFog
            : [51, 53, 55, 56, 57].includes(code) ? CloudDrizzle
              : [61, 63, 65, 66, 67, 80, 81, 82].includes(code) ? CloudRain
                : [71, 73, 75, 77, 85, 86].includes(code) ? CloudSnow
                  : [95, 96, 99].includes(code) ? CloudLightning
                    : CloudSun;

  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function formatTaskWhen(iso: string): string {
  const due = new Date(iso);
  const now = new Date();

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const dayDiff = Math.round(
    (startOfDay(due) - startOfDay(now)) / (1000 * 60 * 60 * 24)
  );

  const time = due.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (dayDiff === 0) return `Today • ${time}`;
  if (dayDiff === 1) return `Tomorrow • ${time}`;
  if (dayDiff > 1 && dayDiff < 7) {
    const weekday = due.toLocaleDateString(undefined, { weekday: 'long' });
    return `${weekday} • ${time}`;
  }
  const date = due.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return `${date} • ${time}`;
}

/**
 * Turn a free-form address into something Open-Meteo's geocoder can match.
 *   "Barangay San Isidro, Nueva Ecija" -> "Nueva Ecija"
 *   "Odiongan, Romblon"                -> "Romblon"
 *   "Quezon City"                      -> "Quezon City"
 */
function guessGeoQuery(address: string): string {
  const parts = address
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Prefer the last part (usually province/region). Fall back to whole string.
  const candidate = parts[parts.length - 1] ?? address;

  // Strip common PH prefixes that confuse the geocoder.
  return candidate
    .replace(/^(barangay|brgy\.?|brgy|purok|sitio)\s+/i, '')
    .trim();
}

function FarmerDashboard({ onLogout, onNavigate }: FarmerDashboardProps) {
  const { profile, loading: profileLoading, error: profileError } =
    useFarmerProfile();

  const [farmSummary, setFarmSummary] = useState<FarmSummary | null>(null);
  const [farmSummaryLoading, setFarmSummaryLoading] = useState(true);
  const [nextTask, setNextTask] = useState<UpcomingTask | null>(null);
  const [nextTaskLoading, setNextTaskLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherFailed, setWeatherFailed] = useState(false);

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  // Farms summary
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('area_hectares')
        .eq('farmer_id', profile.id);

      if (cancelled) return;

      if (error || !data) {
        setFarmSummary({ count: 0, totalHectares: 0 });
        setFarmSummaryLoading(false);
        return;
      }

      const totalHectares = data.reduce(
        (sum, row) => sum + Number(row.area_hectares ?? 0),
        0
      );
      setFarmSummary({ count: data.length, totalHectares });
      setFarmSummaryLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Next upcoming task
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, due_at')
        .eq('farmer_id', profile.id)
        .is('completed_at', null)
        .gte('due_at', new Date().toISOString())
        .order('due_at', { ascending: true })
        .limit(1);

      if (cancelled) return;

      if (error || !data || data.length === 0) {
        setNextTask(null);
        setNextTaskLoading(false);
        return;
      }

      setNextTask(data[0]);
      setNextTaskLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Weather via Open-Meteo. Uses a cleaned-up query so real PH addresses resolve.
  useEffect(() => {
    if (!profile?.address) return;
    let cancelled = false;

    (async () => {
      try {
        const query = guessGeoQuery(profile.address) || profile.address;

        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            query
          )}&count=1&language=en&format=json`
        );
        if (!geoRes.ok) throw new Error('Unable to find weather for your address.');
        const geo = await geoRes.json();
        const place = geo?.results?.[0];

        if (!place) {
          if (!cancelled) {
            setWeatherFailed(true);
            setWeatherLoading(false);
          }
          return;
        }

        const wxRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=4`
        );
        if (!wxRes.ok) throw new Error('Unable to load the weather forecast.');
        const wx = await wxRes.json();
        if (cancelled) return;

        setWeather({
          tempC: Math.round(wx.current.temperature_2m),
          highC: Math.round(wx.daily.temperature_2m_max[0]),
          lowC: Math.round(wx.daily.temperature_2m_min[0]),
          description: describeWeather(wx.current.weather_code),
          code: wx.current.weather_code,
          feelsLikeC: Math.round(wx.current.apparent_temperature),
          humidity: Math.round(wx.current.relative_humidity_2m),
          windKph: Math.round(wx.current.wind_speed_10m),
          precipitationChance: Math.round(
            wx.daily.precipitation_probability_max[0] ?? 0
          ),
          forecast: wx.daily.time.slice(1).map((date: string, index: number) => ({
            date,
            highC: Math.round(wx.daily.temperature_2m_max[index + 1]),
            lowC: Math.round(wx.daily.temperature_2m_min[index + 1]),
            description: describeWeather(wx.daily.weather_code[index + 1]),
            code: wx.daily.weather_code[index + 1],
            precipitationChance: Math.round(
              wx.daily.precipitation_probability_max[index + 1] ?? 0
            ),
          })),
        });
        setWeatherLoading(false);
      } catch {
        if (!cancelled) {
          setWeatherFailed(true);
          setWeatherLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.address]);

  // ---- Render gates ----
  const weatherUnavailable = weatherFailed || !profile?.address;

  if (profileLoading) {
    return (
      <PageLayout
        activeTab="Home"
        onNavigate={onNavigate}
        loading
        loadingText="Loading your dashboard..."
      >
        {null}
      </PageLayout>
    );
  }

  if (profileError || !profile) {
    return (
      <PageLayout activeTab="Home" onNavigate={onNavigate}>
        <div className="dashboard-content">
          <p className="dashboard-error" role="alert">
            {profileError ?? 'Unable to load your profile.'}
          </p>
          {onLogout && (
            <button className="dashboard-logout-btn" onClick={onLogout}>
              Sign out
            </button>
          )}
        </div>
      </PageLayout>
    );
  }

  if (
    farmSummaryLoading ||
    nextTaskLoading ||
    (Boolean(profile.address) && weatherLoading)
  ) {
    return (
      <PageLayout
        activeTab="Home"
        onNavigate={onNavigate}
        loading
        loadingText="Loading your dashboard..."
      >
        {null}
      </PageLayout>
    );
  }

  const firstName = profile.full_name.trim().split(/\s+/)[0];

  return (
    <PageLayout activeTab="Home" onNavigate={onNavigate}>
      <div className="dashboard-content">
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="user-greeting">
            <span className="greeting-sub">{greeting}</span>
            <h1 className="user-name">
              {firstName} <span className="wave-emoji">👋</span>
            </h1>
            <p className="location-tag">
              <svg
                className="location-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              {profile.address}
            </p>
          </div>

          <div className="header-illustration" aria-hidden="true">
            <img
              src={farmerAvatar}
              alt=""
              className="illustration-img"
            />
          </div>
        </header>

        {/* WEATHER — shows live data, or a placeholder if lookup fails */}
        <section className="weather-card" aria-label="Local weather forecast">
          {weather ? (
            <div className="weather-content">
              <div className="weather-heading">
                <div>
                  <span className="weather-eyebrow">LOCAL WEATHER</span>
                  <h2>Today&apos;s forecast</h2>
                </div>
                <span className="weather-location">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 22s7-6.2 7-13a7 7 0 1 0-14 0c0 6.8 7 13 7 13Z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {profile.address.split(',').slice(-1)[0].trim()}
                </span>
              </div>

              <div className="weather-current">
                <div className="weather-condition-icon">
                  <WeatherIcon
                    code={weather.code}
                    size={42}
                  />
                </div>
                <div className="weather-current-reading">
                  <span className="weather-temp">{weather.tempC}°</span>
                  <span className="weather-unit">C</span>
                </div>
                <div className="weather-summary">
                  <strong>{weather.description}</strong>
                  <span>
                    H: {weather.highC}° <span aria-hidden="true">·</span> L:{' '}
                    {weather.lowC}°
                  </span>
                </div>
              </div>

              <div className="weather-details">
                <div className="weather-detail">
                  <Thermometer size={17} aria-hidden="true" />
                  <span>Feels like</span>
                  <strong>{weather.feelsLikeC}°</strong>
                </div>
                <div className="weather-detail">
                  <Droplets size={17} aria-hidden="true" />
                  <span>Rain chance</span>
                  <strong>{weather.precipitationChance}%</strong>
                </div>
                <div className="weather-detail">
                  <Wind size={17} aria-hidden="true" />
                  <span>Wind</span>
                  <strong>{weather.windKph} km/h</strong>
                </div>
                <div className="weather-detail">
                  <Droplets size={17} aria-hidden="true" />
                  <span>Humidity</span>
                  <strong>{weather.humidity}%</strong>
                </div>
              </div>

              <div className="weather-forecast">
                {weather.forecast.map((day) => (
                  <div className="weather-forecast-day" key={day.date}>
                    <span className="forecast-weekday">
                      {new Date(`${day.date}T12:00:00`).toLocaleDateString(
                        undefined,
                        { weekday: 'short' }
                      )}
                    </span>
                    <WeatherIcon
                      code={day.code}
                      size={20}
                    />
                    <span className="forecast-temperatures">
                      <strong>{day.highC}°</strong>
                      <span>{day.lowC}°</span>
                    </span>
                    <span className="forecast-rain">
                      <Droplets size={11} aria-hidden="true" />
                      {day.precipitationChance}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="weather-empty">
              <div className="weather-empty-icon">
                {weatherUnavailable ? <Cloud size={28} /> : <CloudSun size={28} />}
              </div>
              <div>
                <span className="weather-eyebrow">LOCAL WEATHER</span>
                <h2>
                  {weatherUnavailable
                    ? 'Forecast unavailable'
                    : 'Loading forecast…'}
                </h2>
                <p>
                  {weatherUnavailable
                    ? 'Add your address to see local conditions.'
                    : 'Getting current conditions and the 3-day outlook.'}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* MY FARMS */}
        <section
          className="my-farms-banner"
          onClick={() => onNavigate?.('Farm')}
          style={{ cursor: 'pointer' }}
        >
          <img src={farmImage} alt="Farm" className="farms-bg" />
          <div className="farms-overlay"></div>
          <div className="farms-info">
            <h3>My Farms</h3>
            {farmSummary && farmSummary.count > 0 ? (
              <p>
                {farmSummary.count}{' '}
                {farmSummary.count === 1 ? 'Farm' : 'Farms'} •{' '}
                {farmSummary.totalHectares.toFixed(2)} ha total
              </p>
            ) : (
              <p>No farms yet — tap to add one</p>
            )}
          </div>
          <button className="farms-arrow" aria-label="View Farms">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </section>

        {/* ACTION GRID */}
        <section className="action-grid">
          <button
            className="grid-item"
            onClick={() => onNavigate?.('CropHealth')}
          >
            <div className="grid-icon-box">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="#1B4D2E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22V12" />
                <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
                <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
              </svg>
            </div>
            <span>Crop Health</span>
          </button>

          <button
            className="grid-item"
            onClick={() => onNavigate?.('Expenses')}
          >
            <div className="grid-icon-box">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="#1B4D2E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L18 2L20 7L4 7L6 2Z" />
                <path d="M4 7C4 7 3 14 3 17C3 19.2 4.8 21 7 21H17C19.2 21 21 19.2 21 17C21 14 20 7 20 7" />
                <circle cx="12" cy="14" r="2" />
              </svg>
            </div>
            <span>Expenses</span>
          </button>

          <button
            className="grid-item"
            onClick={() => onNavigate?.('Market')}
          >
            <div className="grid-icon-box">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="#1B4D2E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6V20C3 20.5 3.5 21 4 21H20C20.5 21 21 20.5 21 20V6L18 2H6Z" />
                <path d="M3 6H21" />
                <path d="M16 10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10" />
              </svg>
            </div>
            <span>Market Prices</span>
          </button>

          <button
            className="grid-item"
            onClick={() => onNavigate?.('Tasks')}
          >
            <div className="grid-icon-box">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="#1B4D2E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="3" />
                <path d="M16 2V6" />
                <path d="M8 2V6" />
                <path d="M3 10H21" />
                <rect x="7" y="14" width="3" height="3" fill="#1B4D2E" />
              </svg>
            </div>
            <span>Calendar</span>
          </button>

          <button
            className="grid-item"
            onClick={() => onNavigate?.('Announcements')}
          >
            <div className="grid-icon-box">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="#1B4D2E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15V6C21 4.9 20.1 4 19 4H5C3.9 4 3 4.9 3 6V15C3 16.1 3.9 17 5 17H7V21L11 17H19C20.1 17 21 16.1 21 15Z" />
                <path d="M12 8V11" />
                <path d="M12 13H12.01" />
              </svg>
            </div>
            <span>Announcements</span>
          </button>

          <button
            className="grid-item"
            onClick={() => onNavigate?.('Assistance')}
          >
            <div className="grid-icon-box">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="#1B4D2E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10" />
              </svg>
            </div>
            <span>Assistance</span>
          </button>
        </section>

        {/* UPCOMING TASKS */}
        <section className="upcoming-section">
          <div className="section-header">
            <h3>Upcoming Tasks</h3>
            <a
              href="#view-all"
              className="view-all-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.('Tasks');
              }}
            >
              View All
            </a>
          </div>

          {nextTask ? (
            <div className="task-card">
              <div className="task-icon-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="#1B4D2E"
                  strokeWidth="2"
                >
                  <path d="M12 22V12" />
                  <path d="M12 12C12 7.5 15.5 4 20 4C20 8.5 16.5 12 12 12Z" />
                  <path d="M12 16C12 13 9.5 10.5 6.5 10.5C6.5 13.5 9 16 12 16Z" />
                </svg>
              </div>
              <div className="task-details">
                <h4>{nextTask.title}</h4>
                <p>{formatTaskWhen(nextTask.due_at)}</p>
              </div>
            </div>
          ) : (
            <p className="task-empty">No upcoming tasks.</p>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

export default FarmerDashboard;