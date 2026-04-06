const WeatherAPI = {
    async getWeatherByCoords(lat, lon) {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover,visibility',
            hourly: 'temperature_2m,weather_code,is_day',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max',
            timezone: 'auto',
            forecast_days: 7
        });
        const url = `${CONFIG.WEATHER_URL}?${params}`;
        return this._fetch(url, `weather_${lat}_${lon}`);
    },

    async getAirQuality(lat, lon) {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'european_aqi,pm10,pm2_5'
        });
        const url = `${CONFIG.AQI_URL}?${params}`;
        try {
            return await this._fetch(url, `aqi_${lat}_${lon}`);
        } catch {
            return null;
        }
    },

    async searchCities(query) {
        if (!query || query.length < 2) return [];
        const params = new URLSearchParams({
            name: query,
            count: 5,
            language: 'tr',
            format: 'json'
        });
        try {
            const response = await fetch(`${CONFIG.GEO_URL}?${params}`);
            if (!response.ok) return [];
            const data = await response.json();
            if (!data.results) return [];
            return data.results.map(city => ({
                name: city.name,
                country: city.country || '',
                admin1: city.admin1 || '',
                lat: city.latitude,
                lon: city.longitude,
                display: [city.name, city.admin1, city.country].filter(Boolean).join(', ')
            }));
        } catch {
            return [];
        }
    },

    async geocodeCity(cityName) {
        const params = new URLSearchParams({
            name: cityName,
            count: 1,
            language: 'tr',
            format: 'json'
        });
        const response = await fetch(`${CONFIG.GEO_URL}?${params}`);
        if (!response.ok) throw new Error('Sehir bulunamadi.');
        const data = await response.json();
        if (!data.results || data.results.length === 0) {
            throw new Error('Sehir bulunamadi. Lutfen baska bir sehir deneyin.');
        }
        const city = data.results[0];
        return {
            name: city.name,
            country: city.country || '',
            lat: city.latitude,
            lon: city.longitude
        };
    },

    async _fetch(url, cacheKey) {
        const cached = this._getCache(cacheKey);
        if (cached) return cached;

        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) throw new Error('Sehir bulunamadi.');
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
        } catch {}
    }
};
