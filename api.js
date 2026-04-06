const WeatherAPI = {
    async getCurrentWeather(city) {
        const url = `${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${CONFIG.API_KEY}&units=${CONFIG.DEFAULT_UNITS}&lang=${CONFIG.DEFAULT_LANG}`;
        return this._fetch(url, `current_${city}`);
    },

    async getCurrentWeatherByCoords(lat, lon) {
        const url = `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${CONFIG.DEFAULT_UNITS}&lang=${CONFIG.DEFAULT_LANG}`;
        return this._fetch(url, `current_${lat}_${lon}`);
    },

    async getForecast(city) {
        const url = `${CONFIG.BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${CONFIG.API_KEY}&units=${CONFIG.DEFAULT_UNITS}&lang=${CONFIG.DEFAULT_LANG}`;
        return this._fetch(url, `forecast_${city}`);
    },

    async getForecastByCoords(lat, lon) {
        const url = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${CONFIG.DEFAULT_UNITS}&lang=${CONFIG.DEFAULT_LANG}`;
        return this._fetch(url, `forecast_${lat}_${lon}`);
    },

    async getAirPollution(lat, lon) {
        const url = `${CONFIG.BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`;
        return this._fetch(url, `aqi_${lat}_${lon}`);
    },

    async searchCities(query) {
        if (!query || query.length < 2) return [];
        const url = `${CONFIG.GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${CONFIG.API_KEY}`;
        try {
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            return data.map(city => ({
                name: city.name,
                country: city.country,
                state: city.state || '',
                lat: city.lat,
                lon: city.lon,
                display: city.state ? `${city.name}, ${city.state}, ${city.country}` : `${city.name}, ${city.country}`
            }));
        } catch {
            return [];
        }
    },

    async _fetch(url, cacheKey) {
        const cached = this._getCache(cacheKey);
        if (cached) return cached;

        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 401) throw new Error('API anahtari gecersiz. Lutfen gecerli bir OpenWeatherMap API anahtari girin.');
            if (response.status === 404) throw new Error('Sehir bulunamadi. Lutfen baska bir sehir deneyin.');
            if (response.status === 429) throw new Error('Cok fazla istek gonderildi. Lutfen biraz bekleyin.');
            throw new Error(`Hava durumu verisi alinamadi (Hata: ${response.status})`);
        }

        const data = await response.json();
        this._setCache(cacheKey, data);
        return data;
    },

    _getCache(key) {
        try {
            const item = localStorage.getItem(`weather_cache_${key}`);
            if (!item) return null;
            const { data, timestamp } = JSON.parse(item);
            if (Date.now() - timestamp > CONFIG.CACHE_DURATION) {
                localStorage.removeItem(`weather_cache_${key}`);
                return null;
            }
            return data;
        } catch {
            return null;
        }
    },

    _setCache(key, data) {
        try {
            localStorage.setItem(`weather_cache_${key}`, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch {
            // storage full
        }
    }
};
