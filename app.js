const App = {
    state: {
        currentCity: '',
        unit: 'metric',
        theme: 'light',
        favorites: [],
        history: [],
        currentData: null,
        forecastData: null,
        aqiData: null
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
        if (lastCity) {
            this.loadWeather(lastCity);
        } else {
            this.getCurrentLocation();
        }
    },

    cacheElements() {
        const ids = [
            'search-input','search-clear','search-suggestions','menu-btn','sidebar',
            'sidebar-overlay','sidebar-close','favorites-list','history-list','no-favorites',
            'no-history','clear-history','loading','error-container','error-message','retry-btn',
            'weather-content','city-name','current-date','fav-btn','weather-icon-main',
            'current-temp','weather-desc','temp-max','temp-min','feels-like','sunrise',
            'sunset','feels-like-card','wind-card','hourly-scroll','forecast-list',
            'humidity','humidity-bar','wind-speed','wind-dir','pressure','visibility',
            'uv-index','uv-desc','clouds','sunrise-detail','sunset-detail','aqi-value',
            'aqi-desc','aqi-bar','unit-toggle','theme-toggle','theme-icon-light',
            'theme-icon-dark','location-btn','offline-banner','weather-bg'
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
                this.loadWeather(searchInput.value.trim());
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
            const lastCity = localStorage.getItem('lastCity') || CONFIG.DEFAULT_CITY;
            this.loadWeather(lastCity);
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
            const lastCity = localStorage.getItem('lastCity');
            if (lastCity) this.loadWeather(lastCity);
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
            `<div class="suggestion-item" data-name="${city.name}" data-lat="${city.lat}" data-lon="${city.lon}">${city.display}</div>`
        ).join('');
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.elements.search_input.value = item.dataset.name;
                this.loadWeather(item.dataset.name);
                this.closeSuggestions();
            });
        });
    },

    closeSuggestions() {
        this.elements.search_suggestions.innerHTML = '';
    },

    async loadWeather(city) {
        this.showLoading();
        try {
            const [current, forecast] = await Promise.all([
                WeatherAPI.getCurrentWeather(city),
                WeatherAPI.getForecast(city)
            ]);

            let aqi = null;
            try {
                aqi = await WeatherAPI.getAirPollution(current.coord.lat, current.coord.lon);
            } catch {}

            this.state.currentData = current;
            this.state.forecastData = forecast;
            this.state.aqiData = aqi;
            this.state.currentCity = current.name;

            localStorage.setItem('lastCity', current.name);
            this.addToHistory(current.name);
            this.render();
        } catch (error) {
            this.showError(error.message);
        }
    },

    async loadWeatherByCoords(lat, lon) {
        this.showLoading();
        try {
            const [current, forecast] = await Promise.all([
                WeatherAPI.getCurrentWeatherByCoords(lat, lon),
                WeatherAPI.getForecastByCoords(lat, lon)
            ]);

            let aqi = null;
            try {
                aqi = await WeatherAPI.getAirPollution(lat, lon);
            } catch {}

            this.state.currentData = current;
            this.state.forecastData = forecast;
            this.state.aqiData = aqi;
            this.state.currentCity = current.name;

            localStorage.setItem('lastCity', current.name);
            this.addToHistory(current.name);
            this.render();
        } catch (error) {
            this.showError(error.message);
        }
    },

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.loadWeather(CONFIG.DEFAULT_CITY);
            return;
        }
        this.showLoading();
        navigator.geolocation.getCurrentPosition(
            pos => this.loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
            () => this.loadWeather(CONFIG.DEFAULT_CITY),
            { timeout: 10000 }
        );
    },

    render() {
        const { currentData: data, forecastData: forecast, aqiData: aqi } = this.state;
        if (!data) return;

        const isNight = Utils.isNight(data.dt, data.sys.sunrise, data.sys.sunset);
        const condition = Utils.getWeatherCondition(data.weather[0].id);
        const iconKey = Utils.getWeatherIcon(data.weather[0].icon, !isNight);

        if (isNight && this.state.theme === 'light') {
            // keep user preference
        }

        WeatherAnimations.setCondition(condition, isNight);
        this.renderCurrent(data, iconKey);
        this.renderHourly(forecast);
        this.renderForecast(forecast);
        this.renderDetails(data, aqi);
        this.updateFavButton();

        this.elements.loading.style.display = 'none';
        this.elements.error_container.style.display = 'none';
        this.elements.weather_content.style.display = 'block';
    },

    renderCurrent(data, iconKey) {
        this.elements.city_name.textContent = `${data.name}, ${data.sys.country}`;
        this.elements.current_date.textContent = Utils.formatDate(data.dt, data.timezone);

        this.elements.weather_icon_main.innerHTML = WeatherAnimations.getWeatherIconSVG(iconKey);

        const temp = this.state.unit === 'metric' ? data.main.temp : Utils.celsiusToFahrenheit(data.main.temp);
        const feelsLike = this.state.unit === 'metric' ? data.main.feels_like : Utils.celsiusToFahrenheit(data.main.feels_like);
        const tempMax = this.state.unit === 'metric' ? data.main.temp_max : Utils.celsiusToFahrenheit(data.main.temp_max);
        const tempMin = this.state.unit === 'metric' ? data.main.temp_min : Utils.celsiusToFahrenheit(data.main.temp_min);
        const unitSym = this.state.unit === 'metric' ? '°C' : '°F';

        this.elements.current_temp.textContent = `${Math.round(temp)}${unitSym}`;
        this.elements.weather_desc.textContent = Utils.capitalizeFirst(data.weather[0].description);

        this.elements.temp_max.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg> ${Math.round(tempMax)}${unitSym}`;
        this.elements.temp_min.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg> ${Math.round(tempMin)}${unitSym}`;
        this.elements.feels_like.textContent = `Hissedilen: ${Math.round(feelsLike)}${unitSym}`;

        this.elements.sunrise.textContent = Utils.formatTime(data.sys.sunrise, data.timezone);
        this.elements.sunset.textContent = Utils.formatTime(data.sys.sunset, data.timezone);
        this.elements.feels_like_card.textContent = `${Math.round(feelsLike)}${unitSym}`;
        this.elements.wind_card.textContent = Utils.formatWindSpeed(data.wind.speed, this.state.unit);
    },

    renderHourly(forecast) {
        const hours = forecast.list.slice(0, 8);
        this.elements.hourly_scroll.innerHTML = hours.map((item, i) => {
            const iconKey = Utils.getWeatherIcon(item.weather[0].icon, true);
            const temp = this.state.unit === 'metric' ? item.main.temp : Utils.celsiusToFahrenheit(item.main.temp);
            const unitSym = this.state.unit === 'metric' ? '°' : '°F';
            return `
                <div class="hourly-item ${i === 0 ? 'now' : ''}">
                    <span class="hourly-time">${i === 0 ? 'Simdi' : Utils.formatHour(item.dt)}</span>
                    <div class="hourly-icon">${WeatherAnimations.getWeatherIconSVG(iconKey)}</div>
                    <span class="hourly-temp">${Math.round(temp)}${unitSym}</span>
                </div>
            `;
        }).join('');
    },

    renderForecast(forecast) {
        const days = Utils.groupForecastByDay(forecast.list);
        this.elements.forecast_list.innerHTML = days.map(day => {
            const iconKey = Utils.getWeatherIcon(day.icon, true);
            const tempMax = this.state.unit === 'metric' ? day.temp_max : Utils.celsiusToFahrenheit(day.temp_max);
            const tempMin = this.state.unit === 'metric' ? day.temp_min : Utils.celsiusToFahrenheit(day.temp_min);
            const unitSym = this.state.unit === 'metric' ? '°' : '°F';
            return `
                <div class="forecast-item">
                    <span class="forecast-day">${Utils.formatShortDate(day.dt)}</span>
                    <div class="forecast-icon">${WeatherAnimations.getWeatherIconSVG(iconKey)}</div>
                    <span class="forecast-desc">${day.description}</span>
                    <div class="forecast-temps">
                        <span class="forecast-max">${Math.round(tempMax)}${unitSym}</span>
                        <span class="forecast-min">${Math.round(tempMin)}${unitSym}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderDetails(data, aqi) {
        this.elements.humidity.textContent = `%${data.main.humidity}`;
        this.elements.humidity_bar.style.width = `${data.main.humidity}%`;
        this.elements.humidity_bar.style.background = data.main.humidity > 70 ? '#3b82f6' : data.main.humidity > 40 ? '#22c55e' : '#f59e0b';

        this.elements.wind_speed.textContent = Utils.formatWindSpeed(data.wind.speed, this.state.unit);
        this.elements.wind_dir.textContent = data.wind.deg !== undefined ? `${Utils.getWindDirectionFull(data.wind.deg)} (${data.wind.deg}°)` : '--';

        this.elements.pressure.textContent = `${data.main.pressure} hPa`;
        this.elements.visibility.textContent = data.visibility !== undefined ? Utils.formatVisibility(data.visibility) : '--';
        this.elements.clouds.textContent = `%${data.clouds.all}`;

        this.elements.sunrise_detail.textContent = Utils.formatTime(data.sys.sunrise, data.timezone);
        this.elements.sunset_detail.textContent = Utils.formatTime(data.sys.sunset, data.timezone);

        this.elements.uv_index.textContent = '--';
        this.elements.uv_desc.textContent = 'Veri yok';

        if (aqi && aqi.list && aqi.list.length > 0) {
            const aqiVal = aqi.list[0].main.aqi;
            const aqiInfo = Utils.getAQIDescription(aqiVal);
            this.elements.aqi_value.textContent = aqiVal;
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
        if (this.state.currentData) this.render();
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
        document.querySelector('meta[name="theme-color"]').setAttribute('content',
            this.state.theme === 'dark' ? '#0f172a' : '#4A90D9');
    },

    toggleFavorite() {
        const city = this.state.currentCity;
        if (!city) return;
        const idx = this.state.favorites.indexOf(city);
        if (idx > -1) {
            this.state.favorites.splice(idx, 1);
        } else {
            if (this.state.favorites.length >= CONFIG.MAX_FAVORITES) {
                this.state.favorites.pop();
            }
            this.state.favorites.unshift(city);
        }
        localStorage.setItem('favorites', JSON.stringify(this.state.favorites));
        this.updateFavButton();
    },

    updateFavButton() {
        const isFav = this.state.favorites.includes(this.state.currentCity);
        this.elements.fav_btn.classList.toggle('active', isFav);
    },

    addToHistory(city) {
        this.state.history = this.state.history.filter(c => c !== city);
        this.state.history.unshift(city);
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

    renderFavorites() {
        const list = this.elements.favorites_list;
        const noMsg = this.elements.no_favorites;
        if (!this.state.favorites.length) {
            list.innerHTML = '';
            noMsg.style.display = 'block';
            return;
        }
        noMsg.style.display = 'none';
        list.innerHTML = this.state.favorites.map(city => `
            <li class="city-item">
                <span class="city-item-name" data-city="${city}">${city}</span>
                <button class="city-item-remove" data-remove-fav="${city}">&times;</button>
            </li>
        `).join('');
        list.querySelectorAll('.city-item-name').forEach(el => {
            el.addEventListener('click', () => {
                this.loadWeather(el.dataset.city);
                this.toggleSidebar(false);
            });
        });
        list.querySelectorAll('.city-item-remove').forEach(el => {
            el.addEventListener('click', e => {
                e.stopPropagation();
                this.state.favorites = this.state.favorites.filter(c => c !== el.dataset.removeFav);
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
        list.innerHTML = this.state.history.map(city => `
            <li class="city-item">
                <span class="city-item-name" data-city="${city}">${city}</span>
            </li>
        `).join('');
        list.querySelectorAll('.city-item-name').forEach(el => {
            el.addEventListener('click', () => {
                this.loadWeather(el.dataset.city);
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
