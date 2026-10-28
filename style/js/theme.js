(function () {
    'use strict';

    var root = document.documentElement;
    var button = document.getElementById('theme-toggle');
    var meta = document.getElementById('theme-color');
    var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var COLORS = { light: '#f7f7f7', dark: '#1b1c1f' };

    function applied() {
        return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function mode() {
        return root.getAttribute('data-theme-mode') || 'auto';
    }

    function syncButton(theme) {
        if (!button) return;
        var dark = theme === 'dark';
        button.setAttribute('aria-pressed', dark ? 'true' : 'false');
        button.setAttribute('aria-label', dark ? '切换到日间模式' : '切换到夜间模式');
        button.setAttribute('title', dark ? '切换到日间模式' : '切换到夜间模式');
    }

    function apply(theme, nextMode, persist) {
        root.setAttribute('data-theme', theme);
        if (nextMode) root.setAttribute('data-theme-mode', nextMode);
        root.style.colorScheme = theme;
        root.style.backgroundColor = COLORS[theme] || COLORS.light;
        if (meta) meta.setAttribute('content', COLORS[theme] || COLORS.light);
        syncButton(theme);
        if (persist) {
            try {
                localStorage.setItem('ning-theme', theme);
            } catch (e) {}
        }
    }

    if (button) {
        button.addEventListener('click', function () {
            var next = applied() === 'dark' ? 'light' : 'dark';
            apply(next, next, true);
        });
    }

    window.addEventListener('storage', function (event) {
        if (event.key !== 'ning-theme' || !event.newValue) return;
        var next = event.newValue === 'dark' ? 'dark' : 'light';
        apply(next, next, false);
    });

    if (media) {
        var onChange = function () {
            if (mode() !== 'auto') return;
            apply(media.matches ? 'dark' : 'light', 'auto', false);
        };
        if (media.addEventListener) media.addEventListener('change', onChange);
        else if (media.addListener) media.addListener(onChange);
    }

    if (meta) meta.setAttribute('content', COLORS[applied()] || COLORS.light);
    syncButton(applied());
})();
