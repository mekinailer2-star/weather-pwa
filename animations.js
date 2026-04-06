const WeatherAnimations = {
    container: null,

    init() {
        this.container = document.getElementById('weather-animation');
    },

    clear() {
        if (this.container) this.container.innerHTML = '';
    },

    setCondition(condition, isNight) {
        this.clear();
        const bg = document.getElementById('weather-bg');

        bg.className = 'weather-bg';
        bg.classList.add(isNight ? 'night' : 'day');

        switch (condition) {
            case 'clear':
                bg.classList.add('clear');
                isNight ? this._createStars() : this._createSun();
                break;
            case 'clouds':
                bg.classList.add('cloudy');
                this._createClouds(3);
                break;
            case 'rain':
            case 'drizzle':
                bg.classList.add('rainy');
                this._createRain(condition === 'drizzle' ? 30 : 60);
                this._createClouds(2);
                break;
            case 'thunderstorm':
                bg.classList.add('stormy');
                this._createRain(80);
                this._createLightning();
                this._createClouds(3);
                break;
            case 'snow':
                bg.classList.add('snowy');
                this._createSnow(50);
                this._createClouds(2);
                break;
            case 'mist':
                bg.classList.add('misty');
                this._createMist();
                break;
            default:
                bg.classList.add('clear');
                isNight ? this._createStars() : this._createSun();
        }
    },

    _createSun() {
        const sun = document.createElement('div');
        sun.className = 'anim-sun';
        sun.innerHTML = `
            <div class="sun-body"></div>
            <div class="sun-rays"></div>
        `;
        this.container.appendChild(sun);
    },

    _createStars() {
        const count = 40;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'anim-star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 60 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            star.style.width = star.style.height = (Math.random() * 3 + 1) + 'px';
            this.container.appendChild(star);
        }

        const moon = document.createElement('div');
        moon.className = 'anim-moon';
        this.container.appendChild(moon);
    },

    _createClouds(count) {
        for (let i = 0; i < count; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'anim-cloud';
            cloud.style.top = (10 + i * 15) + '%';
            cloud.style.animationDuration = (20 + Math.random() * 20) + 's';
            cloud.style.animationDelay = -(Math.random() * 20) + 's';
            cloud.style.opacity = 0.4 + Math.random() * 0.4;
            cloud.style.transform = `scale(${0.6 + Math.random() * 0.8})`;
            cloud.innerHTML = `<svg viewBox="0 0 200 80" width="200"><path d="M170 70H30c-16.6 0-30-11.2-30-25s13.4-25 30-25c2.8 0 5.5.4 8 1C44 8.5 58.7 0 76 0c20.4 0 37.7 12.6 43.7 30h2.3c16.6 0 30 11.2 30 25s-13.4 25-30 25h-22c11 0 22-8 22-20s-11-20-22-20z" fill="currentColor"/></svg>`;
            this.container.appendChild(cloud);
        }
    },

    _createRain(count) {
        for (let i = 0; i < count; i++) {
            const drop = document.createElement('div');
            drop.className = 'anim-raindrop';
            drop.style.left = Math.random() * 100 + '%';
            drop.style.animationDuration = (0.4 + Math.random() * 0.4) + 's';
            drop.style.animationDelay = Math.random() * 2 + 's';
            drop.style.opacity = 0.3 + Math.random() * 0.5;
            this.container.appendChild(drop);
        }
    },

    _createSnow(count) {
        for (let i = 0; i < count; i++) {
            const flake = document.createElement('div');
            flake.className = 'anim-snowflake';
            flake.style.left = Math.random() * 100 + '%';
            flake.style.animationDuration = (3 + Math.random() * 5) + 's';
            flake.style.animationDelay = Math.random() * 5 + 's';
            flake.style.opacity = 0.4 + Math.random() * 0.6;
            const size = 3 + Math.random() * 6;
            flake.style.width = flake.style.height = size + 'px';
            this.container.appendChild(flake);
        }
    },

    _createLightning() {
        const lightning = document.createElement('div');
        lightning.className = 'anim-lightning';
        this.container.appendChild(lightning);

        const flash = () => {
            lightning.classList.add('flash');
            setTimeout(() => lightning.classList.remove('flash'), 200);
            setTimeout(() => {
                lightning.classList.add('flash');
                setTimeout(() => lightning.classList.remove('flash'), 100);
            }, 300);
            setTimeout(flash, 4000 + Math.random() * 8000);
        };
        setTimeout(flash, 2000);
    },

    _createMist() {
        for (let i = 0; i < 5; i++) {
            const mist = document.createElement('div');
            mist.className = 'anim-mist';
            mist.style.top = (20 + i * 15) + '%';
            mist.style.animationDuration = (8 + Math.random() * 8) + 's';
            mist.style.animationDelay = -(Math.random() * 8) + 's';
            mist.style.opacity = 0.2 + Math.random() * 0.3;
            this.container.appendChild(mist);
        }
    },

    getWeatherIconSVG(iconType) {
        const icons = {
            'clear-day': `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" fill="#fbbf24"/><g stroke="#fbbf24" stroke-width="3" fill="none"><line x1="50" y1="15" x2="50" y2="25"/><line x1="50" y1="75" x2="50" y2="85"/><line x1="15" y1="50" x2="25" y2="50"/><line x1="75" y1="50" x2="85" y2="50"/><line x1="25.3" y1="25.3" x2="32.3" y2="32.3"/><line x1="67.7" y1="67.7" x2="74.7" y2="74.7"/><line x1="25.3" y1="74.7" x2="32.3" y2="67.7"/><line x1="67.7" y1="32.3" x2="74.7" y2="25.3"/></g></svg>`,
            'clear-night': `<svg viewBox="0 0 100 100"><path d="M60 20a30 30 0 1 0 20 40A25 25 0 0 1 60 20z" fill="#cbd5e1"/></svg>`,
            'partly-cloudy-day': `<svg viewBox="0 0 100 100"><circle cx="40" cy="35" r="15" fill="#fbbf24"/><g stroke="#fbbf24" stroke-width="2" fill="none"><line x1="40" y1="10" x2="40" y2="17"/><line x1="40" y1="53" x2="40" y2="57"/><line x1="18" y1="35" x2="22" y2="35"/><line x1="58" y1="35" x2="62" y2="35"/></g><path d="M75 75H30c-11 0-20-7.5-20-17s9-17 20-17c2 0 3.7.3 5.5.7C39 32 49 25 62 25c14 0 26 8.5 30 20h1.5C104 45 112 53 112 62s-8 17-20 17h-17z" fill="white" opacity="0.95" transform="scale(0.7) translate(5,20)"/></svg>`,
            'partly-cloudy-night': `<svg viewBox="0 0 100 100"><path d="M45 18a20 20 0 1 0 13 27A17 17 0 0 1 45 18z" fill="#cbd5e1"/><path d="M75 75H30c-11 0-20-7.5-20-17s9-17 20-17c2 0 3.7.3 5.5.7C39 32 49 25 62 25c14 0 26 8.5 30 20h1.5C104 45 112 53 112 62s-8 17-20 17h-17z" fill="white" opacity="0.9" transform="scale(0.7) translate(5,20)"/></svg>`,
            'cloudy': `<svg viewBox="0 0 100 100"><path d="M80 75H25c-13 0-23-8-23-19s10-19 23-19c2 0 4 .2 6 .7C36 26 48 18 63 18c16 0 30 10 34 24h2c13 0 23 8 23 19s-10 19-23 19H80z" fill="#94a3b8" transform="scale(0.85) translate(8,8)"/></svg>`,
            'overcast': `<svg viewBox="0 0 100 100"><path d="M80 70H25c-13 0-23-8-23-19s10-19 23-19c2 0 4 .2 6 .7C36 21 48 13 63 13c16 0 30 10 34 24h2c13 0 23 8 23 19s-10 19-23 19H80z" fill="#64748b" transform="scale(0.85) translate(8,8)"/><path d="M70 80H20c-10 0-18-6-18-14s8-14 18-14c1.5 0 3 .2 4.5.5C28 43 38 37 51 37c12 0 23 7 27 18h1.5c10 0 18 6 18 14s-8 14-18 14H70z" fill="#94a3b8" transform="scale(0.7) translate(15,15)"/></svg>`,
            'rain': `<svg viewBox="0 0 100 100"><path d="M78 50H28c-11 0-20-7-20-16s9-16 20-16c1.5 0 3 .2 5 .6C37 9 47 2 60 2c14 0 25 8 29 20h1c11 0 20 7 20 16s-9 16-20 16h-12z" fill="#64748b" transform="scale(0.8) translate(10,5)"/><line x1="30" y1="58" x2="25" y2="75" stroke="#60a5fa" stroke-width="2" opacity="0.7"/><line x1="45" y1="60" x2="40" y2="80" stroke="#60a5fa" stroke-width="2" opacity="0.8"/><line x1="60" y1="56" x2="55" y2="73" stroke="#60a5fa" stroke-width="2" opacity="0.6"/><line x1="72" y1="60" x2="67" y2="78" stroke="#60a5fa" stroke-width="2" opacity="0.7"/></svg>`,
            'rain-sun': `<svg viewBox="0 0 100 100"><circle cx="30" cy="25" r="12" fill="#fbbf24"/><path d="M78 50H28c-11 0-20-7-20-16s9-16 20-16c1.5 0 3 .2 5 .6C37 9 47 2 60 2c14 0 25 8 29 20h1c11 0 20 7 20 16s-9 16-20 16h-12z" fill="#94a3b8" transform="scale(0.8) translate(10,10)"/><line x1="30" y1="62" x2="25" y2="78" stroke="#60a5fa" stroke-width="2" opacity="0.7"/><line x1="50" y1="65" x2="45" y2="82" stroke="#60a5fa" stroke-width="2" opacity="0.8"/><line x1="70" y1="60" x2="65" y2="76" stroke="#60a5fa" stroke-width="2" opacity="0.6"/></svg>`,
            'rain-night': `<svg viewBox="0 0 100 100"><path d="M30 15a12 12 0 1 0 8 16A10 10 0 0 1 30 15z" fill="#cbd5e1"/><path d="M78 50H28c-11 0-20-7-20-16s9-16 20-16c1.5 0 3 .2 5 .6C37 9 47 2 60 2c14 0 25 8 29 20h1c11 0 20 7 20 16s-9 16-20 16h-12z" fill="#475569" transform="scale(0.8) translate(10,10)"/><line x1="30" y1="62" x2="25" y2="78" stroke="#60a5fa" stroke-width="2" opacity="0.7"/><line x1="50" y1="65" x2="45" y2="82" stroke="#60a5fa" stroke-width="2" opacity="0.8"/><line x1="70" y1="60" x2="65" y2="76" stroke="#60a5fa" stroke-width="2" opacity="0.6"/></svg>`,
            'thunderstorm': `<svg viewBox="0 0 100 100"><path d="M78 45H28c-11 0-20-7-20-16s9-16 20-16c1.5 0 3 .2 5 .6C37 4 47-3 60-3c14 0 25 8 29 20h1c11 0 20 7 20 16s-9 16-20 16h-12z" fill="#475569" transform="scale(0.8) translate(10,8)"/><polygon points="52,48 42,68 48,68 40,88 58,62 50,62 58,48" fill="#fbbf24"/><line x1="30" y1="55" x2="26" y2="70" stroke="#60a5fa" stroke-width="2" opacity="0.5"/><line x1="70" y1="52" x2="66" y2="67" stroke="#60a5fa" stroke-width="2" opacity="0.5"/></svg>`,
            'snow': `<svg viewBox="0 0 100 100"><path d="M78 50H28c-11 0-20-7-20-16s9-16 20-16c1.5 0 3 .2 5 .6C37 9 47 2 60 2c14 0 25 8 29 20h1c11 0 20 7 20 16s-9 16-20 16h-12z" fill="#94a3b8" transform="scale(0.8) translate(10,5)"/><circle cx="30" cy="65" r="3" fill="white" opacity="0.8"/><circle cx="50" cy="70" r="3" fill="white" opacity="0.9"/><circle cx="70" cy="63" r="3" fill="white" opacity="0.7"/><circle cx="40" cy="78" r="2.5" fill="white" opacity="0.8"/><circle cx="60" cy="80" r="2.5" fill="white" opacity="0.7"/></svg>`,
            'mist': `<svg viewBox="0 0 100 100"><line x1="15" y1="35" x2="85" y2="35" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" opacity="0.5"/><line x1="20" y1="48" x2="80" y2="48" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" opacity="0.6"/><line x1="10" y1="61" x2="90" y2="61" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" opacity="0.4"/><line x1="25" y1="74" x2="75" y2="74" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" opacity="0.3"/></svg>`
        };
        return icons[iconType] || icons['cloudy'];
    }
};
