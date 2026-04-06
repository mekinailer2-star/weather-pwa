const Utils = {
    formatTemp(temp, unit) {
        const rounded = Math.round(temp);
        return unit === 'metric' ? `${rounded}°C` : `${rounded}°F`;
    },

    formatTempValue(temp) {
        return Math.round(temp);
    },

    celsiusToFahrenheit(c) {
        return (c * 9/5) + 32;
    },

    fahrenheitToCelsius(f) {
        return (f - 32) * 5/9;
    },

    formatTime(timestamp, timezone) {
        const date = new Date((timestamp + timezone) * 1000);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });
    },

    formatDate(timestamp, timezone) {
        const date = new Date((timestamp + timezone) * 1000);
        return date.toLocaleDateString('tr-TR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: 'UTC'
        });
    },

    formatShortDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('tr-TR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    },

    formatHour(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    getWindDirection(deg) {
        const dirs = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
        return dirs[Math.round(deg / 22.5) % 16];
    },

    getWindDirectionFull(deg) {
        const dirs = ['Kuzey', 'Kuzeydogu', 'Dogu', 'Guneydogu', 'Guney', 'Guneybati', 'Bati', 'Kuzeybati'];
        return dirs[Math.round(deg / 45) % 8];
    },

    formatWindSpeed(speed, unit) {
        if (unit === 'metric') {
            return `${(speed * 3.6).toFixed(1)} km/s`;
        }
        return `${speed.toFixed(1)} mph`;
    },

    formatVisibility(vis) {
        if (vis >= 1000) {
            return `${(vis / 1000).toFixed(1)} km`;
        }
        return `${vis} m`;
    },

    getUVDescription(uv) {
        if (uv <= 2) return { text: 'Dusuk', color: '#22c55e' };
        if (uv <= 5) return { text: 'Orta', color: '#eab308' };
        if (uv <= 7) return { text: 'Yuksek', color: '#f97316' };
        if (uv <= 10) return { text: 'Cok Yuksek', color: '#ef4444' };
        return { text: 'Asiri', color: '#7c3aed' };
    },

    getAQIDescription(aqi) {
        const descs = {
            1: { text: 'Iyi', color: '#22c55e', percent: 20 },
            2: { text: 'Orta', color: '#eab308', percent: 40 },
            3: { text: 'Hassas', color: '#f97316', percent: 60 },
            4: { text: 'Sagliksiz', color: '#ef4444', percent: 80 },
            5: { text: 'Tehlikeli', color: '#7c3aed', percent: 100 }
        };
        return descs[aqi] || descs[1];
    },

    getWeatherIcon(code, isDay) {
        const icons = {
            '01d': 'clear-day', '01n': 'clear-night',
            '02d': 'partly-cloudy-day', '02n': 'partly-cloudy-night',
            '03d': 'cloudy', '03n': 'cloudy',
            '04d': 'overcast', '04n': 'overcast',
            '09d': 'rain', '09n': 'rain',
            '10d': 'rain-sun', '10n': 'rain-night',
            '11d': 'thunderstorm', '11n': 'thunderstorm',
            '13d': 'snow', '13n': 'snow',
            '50d': 'mist', '50n': 'mist'
        };
        return icons[code] || 'cloudy';
    },

    getWeatherCondition(code) {
        const id = parseInt(code);
        if (id >= 200 && id < 300) return 'thunderstorm';
        if (id >= 300 && id < 400) return 'drizzle';
        if (id >= 500 && id < 600) return 'rain';
        if (id >= 600 && id < 700) return 'snow';
        if (id >= 700 && id < 800) return 'mist';
        if (id === 800) return 'clear';
        if (id > 800) return 'clouds';
        return 'clear';
    },

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    isNight(current, sunrise, sunset) {
        return current < sunrise || current > sunset;
    },

    getDayFromTimestamp(ts) {
        return new Date(ts * 1000).toLocaleDateString('tr-TR', { weekday: 'short' });
    },

    groupForecastByDay(list) {
        const days = {};
        list.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString('tr-TR');
            if (!days[date]) {
                days[date] = {
                    dt: item.dt,
                    temps: [],
                    icons: [],
                    descriptions: [],
                    items: []
                };
            }
            days[date].temps.push(item.main.temp);
            days[date].icons.push(item.weather[0].icon);
            days[date].descriptions.push(item.weather[0].description);
            days[date].items.push(item);
        });

        return Object.values(days).map(day => ({
            dt: day.dt,
            temp_max: Math.max(...day.temps),
            temp_min: Math.min(...day.temps),
            icon: Utils.getMostFrequent(day.icons),
            description: Utils.capitalizeFirst(Utils.getMostFrequent(day.descriptions)),
            items: day.items
        }));
    },

    getMostFrequent(arr) {
        const freq = {};
        let maxCount = 0;
        let maxItem = arr[0];
        arr.forEach(item => {
            freq[item] = (freq[item] || 0) + 1;
            if (freq[item] > maxCount) {
                maxCount = freq[item];
                maxItem = item;
            }
        });
        return maxItem;
    }
};
