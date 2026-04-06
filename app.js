const App = {
    state: {
        currentCity: '',
        currentCountry: '',
        unit: 'metric',
        theme: 'light',
        favorites: [],
        history: [],
        weatherData: null,
        aqiData: null,
        lat: null,
        lon: null
    },

    elements: {},

    init() {
        this.cacheElements();
        this.loadState();
        this.bindEvents();
        this.applyTheme();
        WeatherAnimations.init();
        this.registerServiceWorker();

        const lastCity = localStorage.getItem('lastCity');
        const lastLat = localStorage.getItem('lastLat');
        const lastLon = localStorage.getItem('lastLon');
        if (lastLat && lastLon) {
            this.state.currentCity = lastCity || '';
            this.state.currentCountry = localStorage.getItem('lastCountry') || '';
            this.loadWeatherByCoords(parseFloat(lastLat), parseFloat(lastLon), lastCity, localStorage.getItem('lastCountry') || '');
        } else {
            this.getCurrentLocation();
        }
    },

    cacheElements() {
        const ids = [
            'search-input', 'search-clear', 'search-suggestions', 'menu-btn', 'sidebar',
            'sidebar-overlay', 'sidebar-close', 'favorites-list', 'history-list', 'no-favorites',
            'no-history', 'clear-history', 'loading', 'error-container', 'error-message', 'retry-btn',
            'weather-content', 'city-name', 'current-date', 'fav-btn', 'weather-icon-main',
            'current-temp', 'weather-desc', 'temp-max', 'temp-min', 'feels-like', 'sunrise',
            'sunset', 'feels-like-card', 'wind-card', 'hourly-scroll', 'forecast-list',
            'humidity', 'humidity-bar', 'wind-speed', 'wind-dir', 'pressure', 'visibility',
            'uv-index', 'uv-desc', 'clouds', 'sunrise-detail', 'sunset-detail', 'aqi-value',
            'aqi-desc', 'aqi-bar', 'unit-toggle', 'theme-toggle', 'theme-icon-light',
            'theme-icon-dark', 'location-btn', 'offline-banner', 'weather-bg'
        ];
        ids.forEach(id => {
            this.elements[id.replace(/-/g, '_')] = document.getElementById(id);
        });
    },

    loadState() {
        try {
            this.state.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            this.state.history = JSON.parse(localStorage.getItem('history') || '[]');
            this.state.unit = localStorage.getItem('unit') || 'metric';
            this.state.theme = localStorage.getItem('theme') || this.getSystemTheme();
        } catch {
            this.state.favorites = [];
            this.state.history = [];
        }
        this.elements.unit_toggle.textContent = this.state.unit === 'metric' ? '°C' : '°F';
    },

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    bindEvents() {
        const searchInput = this.elements.search_input;
        searchInput.addEventListener('input', Utils.debounce(() => this.handleSearch(), 300));
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                this.loadWeatherByCity(searchInput.value.trim());
                this.closeSuggestions();
            }
        });
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2) this.handleSearch();
        });

        this.elements.search_clear.addEventListener('click', () => {
            searchInput.value = '';
            this.elements.search_clear.style.display = 'none';
            this.closeSuggestions();
        });

        this.elements.menu_btn.addEventListener('click', () => this.toggleSidebar(true));
        this.elements.sidebar_overlay.addEventListener('click', () => this.toggleSidebar(false));
        this.elements.sidebar_close.addEventListener('click', () => this.toggleSidebar(false));

        this.elements.unit_toggle.addEventListener('click', () => this.toggleUnit());
        this.elements.theme_toggle.addEventListener('click', () => this.toggleTheme());
        this.elements.location_btn.addEventListener('click', () => this.getCurrentLocation());
        this.elements.fav_btn.addEventListener('click', () => this.toggleFavorite());
        this.elements.retry_btn.addEventListener('click', () => {
            if (this.state.lat && this.state.lon) {
                this.loadWeatherByCoords(this.state.lat, this.state.lon, this.state.currentCity, this.state.currentCountry);
            } else {
                this.loadWeatherByCity(CONFIG.DEFAULT_CITY);
            }
        });
        this.elements.clear_history.addEventListener('click', () => this.clearHistory());

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        document.addEventListener('click', e => {
            if (!e.target.closest('.search-container')) this.closeSuggestions();
        });

        window.addEventListener('online', () => {
            this.elements.offline_banner.style.display = 'none';
            if (this.state.lat && this.state.lon) {
                this.loadWeatherByCoords(this.state.lat, this.state.lon, this.state.currentCity, this.state.currentCountry);
            }
        });
        window.addEventListener('offline', () => {
            this.elements.offline_banner.style.display = 'flex';
        });
    },

    async handleSearch() {
        const query = this.elements.search_input.value.trim();
        this.elements.search_clear.style.display = query ? 'block' : 'none';
        if (query.length < 2) {
            this.closeSuggestions();
            return;
        }
        const cities = await WeatherAPI.searchCities(query);
        this.renderSuggestions(cities);
    },

    renderSuggestions(cities) {
        const container = this.elements.search_suggestions;
        if (!cities.length) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = cities.map(city =>
            `<div class="suggestion-item" data-name="${city.name}" data-lat="${city.lat}" data-lon="${city.lon}" data-country="${city.country}">${city.display}</div>`
        ).join('');
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                const lat = parseFloat(item.dataset.lat);
                const lon = parseFloat(item.dataset.lon);
                const country = item.dataset.country;
                this.elements.search_input.value = name;
                this.loadWeatherByCoords(lat, lon, name, country);
                this.closeSuggestions();
            });
        });
    },

    closeSuggestions() {
        this.elements.search_suggestions.innerHTML = '';
    },

    async loadWeatherByCity(cityName) {
        this.showLoading();
        try {
            const geo = await WeatherAPI.geocodeCity(cityName);
            await this.loadWeatherByCoords(geo.lat, geo.lon, geo.name, geo.country);
        } catch (error) {
            this.showError(error.message);
        }
    },

    async loadWeatherByCoords(lat, lon, cityName, country) {
        this.showLoading();
        try {
            const [weather, aqi] = await Promise.all([
                WeatherAPI.getWeatherByCoords(lat, lon),
                WeatherAPI.getAirQuality(lat, lon)
            ]);

            this.state.weatherData = weather;
            this.state.aqiData = aqi;
            this.state.lat = lat;
            this.state.lon = lon;
            this.state.currentCity = cityName || 'Bilinmiyor';
            this.state.currentCountry = country || '';

            localStorage.setItem('lastCity', this.state.currentCity);
            localStorage.setItem('lastCountry', this.state.currentCountry);
            localStorage.setItem('lastLat', lat.toString());
            localStorage.setItem('lastLon', lon.toString());
            this.addToHistory(this.state.currentCity);
            this.render();
        } catch (error) {
            this.showError(error.message);
        }
    },

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.loadWeatherByCoords(CONFIG.DEFAULT_LAT, CONFIG.DEFAULT_LON, CONFIG.DEFAULT_CITY, 'TR');
            return;
        }
        this.showLoading();
        navigator.geolocation.getCurrentPosition(
            async pos => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                try {
                    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=tr`);
                    if (resp.ok) {
                        const data = await resp.json();
                        const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.state || '';
                        const countryCode = data.address?.country_code?.toUpperCase() || '';
                        if (cityName) {
                            this.loadWeatherByCoords(lat, lon, cityName, countryCode);
                            return;
                        }
                    }
                } catch {}
                this.loadWeatherByCoords(lat, lon, `${lat.toFixed(2)}, ${lon.toFixed(2)}`, '');
            },
            () => this.loadWeatherByCoords(CONFIG.DEFAULT_LAT, CONFIG.DEFAULT_LON, CONFIG.DEFAULT_CITY, 'TR'),
            { timeout: 10000 }
        );
    },

    render() {
        const data = this.state.weatherData;
        if (!data || !data.current) return;

        const isDay = !!data.current.is_day;
        const condition = Utils.wmoToCondition(data.current.weather_code);
        const iconKey = Utils.wmoToIconKey(data.current.weather_code, isDay);

        WeatherAnimations.setCondition(condition, !isDay);
        this.renderCurrent(data, iconKey, isDay);
        this.renderHourly(data);
        this.renderForecast(data);
        this.renderDetails(data);
        this.updateFavButton();

        this.elements.loading.style.display = 'none';
        this.elements.error_container.style.display = 'none';
        this.elements.weather_content.style.display = 'block';
    },

    renderCurrent(data, iconKey, isDay) {
        const c = data.current;
        const d = data.daily;
        const cityDisplay = this.state.currentCountry
            ? `${this.state.currentCity}, ${this.state.currentCountry}`
            : this.state.currentCity || `${this.state.lat.toFixed(2)}, ${this.state.lon.toFixed(2)}`;

        this.elements.city_name.textContent = cityDisplay;
        this.elements.current_date.textContent = Utils.formatDate(c.time);
        this.elements.weather_icon_main.innerHTML = WeatherAnimations.getWeatherIconSVG(iconKey);

        const temp = this.state.unit === 'metric' ? c.temperature_2m : Utils.celsiusToFahrenheit(c.temperature_2m);
        const feelsLike = this.state.unit === 'metric' ? c.apparent_temperature : Utils.celsiusToFahrenheit(c.apparent_temperature);
        const tempMax = this.state.unit === 'metric' ? d.temperature_2m_max[0] : Utils.celsiusToFahrenheit(d.temperature_2m_max[0]);
        const tempMin = this.state.unit === 'metric' ? d.temperature_2m_min[0] : Utils.celsiusToFahrenheit(d.temperature_2m_min[0]);
        const sym = this.state.unit === 'metric' ? '°C' : '°F';

        this.elements.current_temp.textContent = `${Math.round(temp)}${sym}`;
        this.elements.weather_desc.textContent = Utils.capitalizeFirst(Utils.wmoToDescription(c.weather_code));

        this.elements.temp_max.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg> ${Math.round(tempMax)}${sym}`;
        this.elements.temp_min.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg> ${Math.round(tempMin)}${sym}`;
        this.elements.feels_like.textContent = `Hissedilen: ${Math.round(feelsLike)}${sym}`;

        this.elements.sunrise.textContent = Utils.formatTime(d.sunrise[0]);
        this.elements.sunset.textContent = Utils.formatTime(d.sunset[0]);
        this.elements.feels_like_card.textContent = `${Math.round(feelsLike)}${sym}`;
        this.elements.wind_card.textContent = Utils.formatWindSpeed(c.wind_speed_10m, this.state.unit);
    },

    renderHourly(data) {
        const now = new Date();
        const hourly = data.hourly;
        let startIdx = 0;
        for (let i = 0; i < hourly.time.length; i++) {
            if (new Date(hourly.time[i]) >= now) {
                startIdx = i;
                break;
            }
        }
        const hours = [];
        for (let i = startIdx; i < Math.min(startIdx + 24, hourly.time.length); i++) {
            hours.push({
                time: hourly.time[i],
                temp: hourly.temperature_2m[i],
                code: hourly.weather_code[i],
                isDay: hourly.is_day[i]
            });
        }

        this.elements.hourly_scroll.innerHTML = hours.map((item, i) => {
            const iconKey = Utils.wmoToIconKey(item.code, !!item.isDay);
            const temp = this.state.unit === 'metric' ? item.temp : Utils.celsiusToFahrenheit(item.temp);
            const sym = this.state.unit === 'metric' ? '°' : '°F';
            return `
                <div class="hourly-item ${i === 0 ? 'now' : ''}">
                    <span class="hourly-time">${i === 0 ? 'Simdi' : Utils.formatHour(item.time)}</span>
                    <div class="hourly-icon">${WeatherAnimations.getWeatherIconSVG(iconKey)}</div>
                    <span class="hourly-temp">${Math.round(temp)}${sym}</span>
                </div>
            `;
        }).join('');
    },

    renderForecast(data) {
        const d = data.daily;
        const days = [];
        for (let i = 0; i < d.time.length; i++) {
            days.push({
                date: d.time[i],
                code: d.weather_code[i],
                max: d.temperature_2m_max[i],
                min: d.temperature_2m_min[i],
                precip: d.precipitation_probability_max ? d.precipitation_probability_max[i] : null
            });
        }

        this.elements.forecast_list.innerHTML = days.map(day => {
            const iconKey = Utils.wmoToIconKey(day.code, true);
            const tempMax = this.state.unit === 'metric' ? day.max : Utils.celsiusToFahrenheit(day.max);
            const tempMin = this.state.unit === 'metric' ? day.min : Utils.celsiusToFahrenheit(day.min);
            const sym = this.state.unit === 'metric' ? '°' : '°F';
            const desc = Utils.capitalizeFirst(Utils.wmoToDescription(day.code));
            return `
                <div class="forecast-item">
                    <span class="forecast-day">${Utils.formatShortDate(day.date)}</span>
                    <div class="forecast-icon">${WeatherAnimations.getWeatherIconSVG(iconKey)}</div>
                    <span class="forecast-desc">${desc}${day.precip !== null ? ` (%${day.precip})` : ''}</span>
                    <div class="forecast-temps">
                        <span class="forecast-max">${Math.round(tempMax)}${sym}</span>
                        <span class="forecast-min">${Math.round(tempMin)}${sym}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderDetails(data) {
        const c = data.current;
        const d = data.daily;

        this.elements.humidity.textContent = `%${c.relative_humidity_2m}`;
        this.elements.humidity_bar.style.width = `${c.relative_humidity_2m}%`;
        this.elements.humidity_bar.style.background = c.relative_humidity_2m > 70 ? '#3b82f6' : c.relative_humidity_2m > 40 ? '#22c55e' : '#f59e0b';

        this.elements.wind_speed.textContent = Utils.formatWindSpeed(c.wind_speed_10m, this.state.unit);
        this.elements.wind_dir.textContent = c.wind_direction_10m !== undefined
            ? `${Utils.getWindDirectionFull(c.wind_direction_10m)} (${c.wind_direction_10m}°)`
            : '--';

        this.elements.pressure.textContent = `${Math.round(c.surface_pressure)} hPa`;
        this.elements.visibility.textContent = c.visibility !== undefined ? Utils.formatVisibility(c.visibility) : '--';
        this.elements.clouds.textContent = `%${c.cloud_cover}`;

        this.elements.sunrise_detail.textContent = Utils.formatTime(d.sunrise[0]);
        this.elements.sunset_detail.textContent = Utils.formatTime(d.sunset[0]);

        const uvMax = d.uv_index_max ? d.uv_index_max[0] : null;
        if (uvMax !== null) {
            const uvInfo = Utils.getUVDescription(uvMax);
            this.elements.uv_index.textContent = uvMax.toFixed(1);
            this.elements.uv_desc.textContent = uvInfo.text;
            this.elements.uv_desc.style.color = uvInfo.color;
        } else {
            this.elements.uv_index.textContent = '--';
            this.elements.uv_desc.textContent = 'Veri yok';
        }

        const aqi = this.state.aqiData;
        if (aqi && aqi.current && aqi.current.european_aqi !== undefined) {
            const aqiVal = aqi.current.european_aqi;
            const aqiInfo = Utils.getAQIDescription(aqiVal);
            this.elements.aqi_value.textContent = Math.round(aqiVal);
            this.elements.aqi_desc.textContent = aqiInfo.text;
            this.elements.aqi_desc.style.color = aqiInfo.color;
            this.elements.aqi_bar.style.width = `${aqiInfo.percent}%`;
            this.elements.aqi_bar.style.background = aqiInfo.color;
        } else {
            this.elements.aqi_value.textContent = '--';
            this.elements.aqi_desc.textContent = 'Veri yok';
            this.elements.aqi_bar.style.width = '0%';
        }
    },

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    },

    toggleSidebar(open) {
        this.elements.sidebar.classList.toggle('open', open);
        if (open) {
            this.renderFavorites();
            this.renderHistory();
        }
    },

    toggleUnit() {
        this.state.unit = this.state.unit === 'metric' ? 'imperial' : 'metric';
        localStorage.setItem('unit', this.state.unit);
        this.elements.unit_toggle.textContent = this.state.unit === 'metric' ? '°C' : '°F';
        if (this.state.weatherData) this.render();
    },

    toggleTheme() {
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.state.theme);
        this.applyTheme();
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        if (this.state.theme === 'dark') {
            this.elements.theme_icon_light.style.display = 'none';
            this.elements.theme_icon_dark.style.display = 'block';
        } else {
            this.elements.theme_icon_light.style.display = 'block';
            this.elements.theme_icon_dark.style.display = 'none';
        }
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', this.state.theme === 'dark' ? '#0f172a' : '#4A90D9');
        }
    },

    toggleFavorite() {
        const city = this.state.currentCity;
        if (!city) return;
        const favKey = `${city}|${this.state.lat}|${this.state.lon}|${this.state.currentCountry}`;
        const idx = this.state.favorites.findIndex(f => f.startsWith(city + '|'));
        if (idx > -1) {
            this.state.favorites.splice(idx, 1);
        } else {
            if (this.state.favorites.length >= CONFIG.MAX_FAVORITES) {
                this.state.favorites.pop();
            }
            this.state.favorites.unshift(favKey);
        }
        localStorage.setItem('favorites', JSON.stringify(this.state.favorites));
        this.updateFavButton();
    },

    updateFavButton() {
        const isFav = this.state.favorites.some(f => f.startsWith(this.state.currentCity + '|'));
        this.elements.fav_btn.classList.toggle('active', isFav);
    },

    addToHistory(city) {
        if (!city) return;
        const histKey = `${city}|${this.state.lat}|${this.state.lon}|${this.state.currentCountry}`;
        this.state.history = this.state.history.filter(h => !h.startsWith(city + '|'));
        this.state.history.unshift(histKey);
        if (this.state.history.length > CONFIG.MAX_HISTORY) {
            this.state.history = this.state.history.slice(0, CONFIG.MAX_HISTORY);
        }
        localStorage.setItem('history', JSON.stringify(this.state.history));
    },

    clearHistory() {
        this.state.history = [];
        localStorage.setItem('history', JSON.stringify(this.state.history));
        this.renderHistory();
    },

    _parseCityKey(key) {
        const parts = key.split('|');
        return { name: parts[0], lat: parseFloat(parts[1]), lon: parseFloat(parts[2]), country: parts[3] || '' };
    },

    renderFavorites() {
        const list = this.elements.favorites_list;
        const noMsg = this.elements.no_favorites;
        if (!this.state.favorites.length) {
            list.innerHTML = '';
            noMsg.style.display = 'block';
            return;
        }
        noMsg.style.display = 'none';
        list.innerHTML = this.state.favorites.map(fav => {
            const c = this._parseCityKey(fav);
            return `
                <li class="city-item">
                    <span class="city-item-name" data-lat="${c.lat}" data-lon="${c.lon}" data-name="${c.name}" data-country="${c.country}">${c.name}${c.country ? ', ' + c.country : ''}</span>
                    <button class="city-item-remove" data-remove-fav="${c.name}">&times;</button>
                </li>
            `;
        }).join('');
        list.querySelectorAll('.city-item-name').forEach(el => {
            el.addEventListener('click', () => {
                this.loadWeatherByCoords(parseFloat(el.dataset.lat), parseFloat(el.dataset.lon), el.dataset.name, el.dataset.country);
                this.toggleSidebar(false);
            });
        });
        list.querySelectorAll('.city-item-remove').forEach(el => {
            el.addEventListener('click', e => {
                e.stopPropagation();
                this.state.favorites = this.state.favorites.filter(f => !f.startsWith(el.dataset.removeFav + '|'));
                localStorage.setItem('favorites', JSON.stringify(this.state.favorites));
                this.renderFavorites();
                this.updateFavButton();
            });
        });
    },

    renderHistory() {
        const list = this.elements.history_list;
        const noMsg = this.elements.no_history;
        const clearBtn = this.elements.clear_history;
        if (!this.state.history.length) {
            list.innerHTML = '';
            noMsg.style.display = 'block';
            clearBtn.style.display = 'none';
            return;
        }
        noMsg.style.display = 'none';
        clearBtn.style.display = 'block';
        list.innerHTML = this.state.history.map(h => {
            const c = this._parseCityKey(h);
            return `
                <li class="city-item">
                    <span class="city-item-name" data-lat="${c.lat}" data-lon="${c.lon}" data-name="${c.name}" data-country="${c.country}">${c.name}${c.country ? ', ' + c.country : ''}</span>
                </li>
            `;
        }).join('');
        list.querySelectorAll('.city-item-name').forEach(el => {
            el.addEventListener('click', () => {
                this.loadWeatherByCoords(parseFloat(el.dataset.lat), parseFloat(el.dataset.lon), el.dataset.name, el.dataset.country);
                this.toggleSidebar(false);
            });
        });
    },

    showLoading() {
        this.elements.loading.style.display = 'flex';
        this.elements.error_container.style.display = 'none';
        this.elements.weather_content.style.display = 'none';
    },

    showError(message) {
        this.elements.loading.style.display = 'none';
        this.elements.weather_content.style.display = 'none';
        this.elements.error_container.style.display = 'flex';
        this.elements.error_message.textContent = message;
    },

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./sw.js');
            } catch {}
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
