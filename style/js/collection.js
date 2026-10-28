(function () {
    'use strict';

    var entries = document.getElementById('col-entries');
    var search = document.getElementById('col-search');
    var shown = document.getElementById('col-shown');
    var empty = document.getElementById('col-empty');
    var toast = document.getElementById('col-toast');
    var total = entries ? parseInt(entries.getAttribute('data-total'), 10) || 0 : 0;
    var unit = entries ? (entries.getAttribute('data-unit') || '条') : '条';
    var cards = entries ? Array.prototype.slice.call(entries.querySelectorAll('.col-card')) : [];
    var groups = entries ? Array.prototype.slice.call(entries.querySelectorAll('.col-group')) : [];
    var railLinks = Array.prototype.slice.call(document.querySelectorAll('.col-rail a[data-target]'));
    var mobileButtons = Array.prototype.slice.call(document.querySelectorAll('.col-mobile-groups button[data-target]'));
    var toastTimer = null;

    function showToast(text) {
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add('on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('on');
        }, 1800);
    }

    function setActive(target) {
        railLinks.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('data-target') === target);
        });
        mobileButtons.forEach(function (b) {
            b.classList.toggle('on', b.getAttribute('data-target') === target);
        });
    }

    function filter() {
        var q = search ? search.value.trim().toLowerCase() : '';
        var visible = 0;
        cards.forEach(function (card) {
            var ok = !q || card.textContent.toLowerCase().indexOf(q) !== -1;
            card.style.display = ok ? '' : 'none';
            if (ok) visible++;
        });
        groups.forEach(function (group) {
            var has = Array.prototype.some.call(group.querySelectorAll('.col-card'), function (card) {
                return card.style.display !== 'none';
            });
            group.style.display = has ? '' : 'none';
        });
        if (shown) shown.textContent = q ? visible : total;
        if (empty) empty.style.display = (q && visible === 0) ? 'block' : 'none';
    }

    if (search) {
        search.addEventListener('input', filter);
    }

    document.querySelectorAll('[data-copy]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var card = document.getElementById(btn.getAttribute('data-copy'));
            if (!card) return;
            var title = card.querySelector('.col-poem-title');
            var author = card.querySelector('.col-poem-author');
            var textEl = card.querySelector('.col-text');
            var dateEl = card.querySelector('.col-date');
            var citeEl = card.querySelector('.col-cite-hidden');
            var body = textEl ? textEl.textContent.trim() : '';
            var date = dateEl ? dateEl.textContent.trim() : '';
            var cite = citeEl ? citeEl.textContent.trim() : '';
            var authorText = author ? author.textContent.trim() : '';
            var out = '';
            if (title) out += title.textContent.trim() + '\n';
            out += body;
            if (authorText) {
                out += '\n\n——' + (date ? date + ' ' : '') + authorText;
            } else if (date || cite) {
                out += '\n\n——' + (date ? date + ' ' : '') + cite;
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(out).then(function () {
                    showToast('已复制');
                }, function () {
                    showToast('复制失败，请手动选择');
                });
            } else {
                showToast('当前浏览器不支持自动复制');
            }
        });
    });

    mobileButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var target = document.getElementById(btn.getAttribute('data-target'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActive(btn.getAttribute('data-target'));
        });
    });

    railLinks.forEach(function (a) {
        a.addEventListener('click', function () {
            setActive(a.getAttribute('data-target'));
        });
    });

    if ('IntersectionObserver' in window && groups.length) {
        var observer = new IntersectionObserver(function (items) {
            items.forEach(function (item) {
                if (item.isIntersecting) {
                    setActive(item.target.id);
                }
            });
        }, {
            rootMargin: '-150px 0px -65% 0px',
            threshold: 0
        });
        groups.forEach(function (group) {
            observer.observe(group);
        });
    }
})();
