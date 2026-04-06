const Utils = {
    formatTemp(temp, unit) {
        const val = unit === 'imperial' ? this.celsiusToFahrenheit(temp) : temp;
        return `${Math.round(val)}${unit === 'metric' ? '°C' : '°F'}`;
    },

    celsiusToFahrenheit(c) {
        return (c * 9 / 5) + 32;
    },

    formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    },

    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('tr-TR', {
            weekday: 'long', day: 'numeric', month: 'long'
        });
    },

    formatShortDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('tr-TR', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    },

    formatHour(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
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
        if (unit === 'imperial') {
            return `${(speed * 0.621371).toFixed(1)} mph`;
        }
        return `${speed.toFixed(1)} km/s`;
    },

    formatVisibility(vis) {
        if (vis >= 1000) {
            return `${(vis / 1000).toFixed(1)} km`;
        }
        return `${Math.round(vis)} m`;
    },

    getUVDescription(uv) {
        if (uv <= 2) return { text: 'Dusuk', color: '#22c55e' };
        if (uv <= 5) return { text: 'Orta', color: '#eab308' };
        if (uv <= 7) return { text: 'Yuksek', color: '#f97316' };
        if (uv <= 10) return { text: 'Cok Yuksek', color: '#ef4444' };
        return { text: 'Asiri', color: '#7c3aed' };
    },

    getAQIDescription(aqi) {
        if (aqi <= 20) return { text: 'Iyi', color: '#22c55e', percent: 20 };
        if (aqi <= 40) return { text: 'Orta', color: '#eab308', percent: 40 };
        if (aqi <= 60) return { text: 'Hassas', color: '#f97316', percent: 60 };
        if (aqi <= 80) return { text: 'Sagliksiz', color: '#ef4444', percent: 80 };
        return { text: 'Tehlikeli', color: '#7c3aed', percent: 100 };
    },

    wmoToDescription(code) {
        const descs = {
            0: 'Acik hava',
            1: 'Genel olarak acik',
            2: 'Parcali bulutlu',
            3: 'Kapali',
            45: 'Sisli',
            48: 'Kiragi sisli',
            51: 'Hafif ciseleme',
            53: 'Orta ciseleme',
            55: 'Yogun ciseleme',
            56: 'Hafif donan ciseleme',
            57: 'Yogun donan ciseleme',
            61: 'Hafif yagmur',
            63: 'Orta yagmur',
            65: 'Siddetli yagmur',
            66: 'Hafif donan yagmur',
            67: 'Siddetli donan yagmur',
            71: 'Hafif kar',
            73: 'Orta kar',
            75: 'Yogun kar',
            77: 'Kar taneleri',
            80: 'Hafif sagnak',
            81: 'Orta sagnak',
            82: 'Siddetli sagnak',
            85: 'Hafif kar sagnagi',
            86: 'Siddetli kar sagnagi',
            95: 'Gok gurultusu',
            96: 'Dolu ile firtina',
            99: 'Siddetli dolu firtinasi'
        };
        return descs[code] || 'Bilinmiyor';
    },

    wmoToCondition(code) {
        if (code === 0 || code === 1) return 'clear';
        if (code === 2 || code === 3) return 'clouds';
        if (code === 45 || code === 48) return 'mist';
        if (code >= 51 && code <= 57) return 'drizzle';
        if (code >= 61 && code <= 67) return 'rain';
        if (code >= 71 && code <= 77) return 'snow';
        if (code >= 80 && code <= 82) return 'rain';
        if (code >= 85 && code <= 86) return 'snow';
        if (code >= 95) return 'thunderstorm';
        return 'clear';
    },

    wmoToIconKey(code, isDay) {
        const condition = this.wmoToCondition(code);
        const dayStr = isDay ? 'day' : 'night';
        const map = {
            'clear': isDay ? 'clear-day' : 'clear-night',
            'clouds': isDay ? 'partly-cloudy-day' : 'partly-cloudy-night',
            'mist': 'mist',
            'drizzle': 'rain',
            'rain': isDay ? 'rain-sun' : 'rain-night',
            'snow': 'snow',
            'thunderstorm': 'thunderstorm'
        };
        if (code === 3) return 'overcast';
        return map[condition] || 'cloudy';
    },

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    isNightNow(isDay) {
        return !isDay;
    }
};
