(function () {
    'use strict';

    var entries = document.getElementById('col-entries');
    var search = document.getElementById('col-search');
    var shown = document.getElementById('col-shown');
    var empty = document.getElementById('col-empty');
    var toast = document.getElementById('col-toast');
    var sortSelect = document.getElementById('col-sort');
    var filterBar = document.getElementById('col-filter');
    var starMinSelect = document.getElementById('col-star-min');
    var total = entries ? parseInt(entries.getAttribute('data-total'), 10) || 0 : 0;
    var unit = entries ? (entries.getAttribute('data-unit') || '条') : '条';
    var cards = entries ? Array.prototype.slice.call(entries.querySelectorAll('.col-card')) : [];
    var groups = entries ? Array.prototype.slice.call(entries.querySelectorAll('.col-group')) : [];
    var railList = document.querySelector('.col-rail-list');
    var railLinks = Array.prototype.slice.call(document.querySelectorAll('.col-rail a[data-target]'));
    var mobileButtons = Array.prototype.slice.call(document.querySelectorAll('.col-mobile-groups button[data-target]'));
    var toastTimer = null;
    var activeStar = 'all';
    var SORT_KEY = 'ning-collection-sort';

    function showToast(text) {
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add('on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('on');
        }, 1800);
    }

    /* ---------- 复制链接 ---------- */

    function absoluteLink(id) {
        return location.origin + location.pathname + '#' + id;
    }

    function legacyCopy(text) {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(area);
        return ok;
    }

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).then(function () {
                return true;
            }, function () {
                return legacyCopy(text);
            });
        }
        return Promise.resolve(legacyCopy(text));
    }

    document.querySelectorAll('.col-anchor[data-link]').forEach(function (btn) {
        btn.addEventListener('click', function (event) {
            event.preventDefault();
            var id = btn.getAttribute('data-link');
            var url = absoluteLink(id);
            copyText(url).then(function (ok) {
                showToast(ok ? '链接已复制' : url);
                if (history.replaceState) history.replaceState(null, '', '#' + id);
                highlightFromHash();
            });
        });
    });

    function highlightFromHash() {
        var id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
        if (!id) return;
        var card = document.getElementById(id);
        if (!card || !card.classList.contains('col-card')) return;
        card.classList.add('is-target');
        card.scrollIntoView({ block: 'center' });
        setTimeout(function () { card.classList.remove('is-target'); }, 2200);
    }

    /* ---------- 排序 ---------- */

    function cardKey(card) {
        var date = card.getAttribute('data-date') || '';
        var year = card.getAttribute('data-year') || '0';
        return date || (year + '-00-00');
    }

    function starOf(card) {
        return parseInt(card.getAttribute('data-star'), 10) || 0;
    }

    function sortAll(mode) {
        if (!groups.length) return;

        var byStar = mode === 'star';
        var dir = mode === 'asc' ? 1 : -1;

        groups.forEach(function (group) {
            var list = Array.prototype.slice.call(group.querySelectorAll('.col-card'));
            list.sort(function (a, b) {
                if (byStar) {
                    // 星级优先：先比星级（高在前），同星级再按日期新在前
                    var sa = starOf(a);
                    var sb = starOf(b);
                    if (sa !== sb) return sb - sa;
                }
                var ka = cardKey(a);
                var kb = cardKey(b);
                if (ka === kb) return 0;
                return ka < kb ? -dir : dir;
            });
            var frag = document.createDocumentFragment();
            list.forEach(function (card) { frag.appendChild(card); });
            group.appendChild(frag);
        });

        // 星级优先时年份分组仍按新在前；其余模式跟随排序方向
        var groupDir = mode === 'asc' ? 1 : -1;
        groups.sort(function (a, b) {
            var ya = parseInt(a.id.replace(/^y-/, ''), 10) || 0;
            var yb = parseInt(b.id.replace(/^y-/, ''), 10) || 0;
            if (ya === yb) return 0;
            return ya < yb ? -groupDir : groupDir;
        });

        // 用占位节点把分组整体插回原位置，避免落到页脚 col-foot 之后
        var parent = groups[0].parentNode;
        var placeholder = document.createComment('groups');
        parent.insertBefore(placeholder, groups[0]);
        groups.forEach(function (group) { parent.insertBefore(group, placeholder); });
        parent.removeChild(placeholder);

        // 侧栏与移动端分组跟随分组顺序
        var ordered = groups.map(function (group) { return group.id; });
        if (railList) {
            ordered.forEach(function (id) {
                var link = railList.querySelector('a[data-target="' + id + '"]');
                if (link) railList.appendChild(link);
            });
        }
        railLinks = Array.prototype.slice.call(document.querySelectorAll('.col-rail a[data-target]'));
        if (mobileButtons.length) {
            var mob = mobileButtons[0].parentNode;
            ordered.forEach(function (id) {
                var btn = mob.querySelector('button[data-target="' + id + '"]');
                if (btn) mob.appendChild(btn);
            });
            mobileButtons = Array.prototype.slice.call(mob.querySelectorAll('button[data-target]'));
        }

        // 第一个分组的「回到顶部」在倒序时可省略，保持标题行干净
        groups.forEach(function (group) {
            group.classList.toggle('is-first', group === groups[0]);
        });
    }

    if (sortSelect) {
        var saved = null;
        try { saved = localStorage.getItem(SORT_KEY); } catch (e) {}
        if (saved && sortSelect.querySelector('option[value="' + saved + '"]')) {
            sortSelect.value = saved;
        }
        sortSelect.addEventListener('change', function () {
            var mode = sortSelect.value;
            try { localStorage.setItem(SORT_KEY, mode); } catch (e) {}
            sortAll(mode);
            applyFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        if (sortSelect.value !== 'desc') sortAll(sortSelect.value);
    }

    /* ---------- 搜索 + 星级筛选 ---------- */

    function starMatch(card) {
        var star = starOf(card);
        if (activeStar === 'all') return true;
        if (activeStar === 'any') return star > 0;
        var min = parseInt(activeStar, 10) || 0;
        return star >= min;
    }

    function applyFilters() {
        var q = search ? search.value.trim().toLowerCase() : '';
        var visible = 0;
        cards.forEach(function (card) {
            var ok = (!q || card.textContent.toLowerCase().indexOf(q) !== -1) && starMatch(card);
            card.style.display = ok ? '' : 'none';
            if (ok) visible++;
        });
        groups.forEach(function (group) {
            var count = 0;
            Array.prototype.forEach.call(group.querySelectorAll('.col-card'), function (card) {
                if (card.style.display !== 'none') count++;
            });
            group.style.display = count ? '' : 'none';
            var badge = group.querySelector('.col-group-head .n');
            if (badge) {
                if (badge.getAttribute('data-total') === null) {
                    badge.setAttribute('data-total', badge.textContent.trim());
                }
                var all = badge.getAttribute('data-total');
                var filtered = !!q || activeStar !== 'all';
                badge.textContent = filtered ? (count + ' / ' + all) : all;
                badge.classList.toggle('is-filtered', filtered);
            }
        });
        var filtering = !!q || activeStar !== 'all';
        if (shown) shown.textContent = filtering ? visible : total;
        if (empty) empty.style.display = (filtering && visible === 0) ? 'block' : 'none';
    }

    if (search) {
        search.addEventListener('input', applyFilters);
    }

    function setStarFilter(value) {
        activeStar = value;
        if (filterBar) {
            filterBar.querySelectorAll('button[data-star]').forEach(function (other) {
                // 「全部」按钮本身就是 data-star="all"，复位时也应恢复高亮
                var on = other.getAttribute('data-star') === value;
                other.classList.toggle('on', on);
                other.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }
        if (starMinSelect) {
            starMinSelect.value = (value === 'all' || value === 'any') ? '0' : value;
        }
        applyFilters();
    }

    if (filterBar) {
        filterBar.querySelectorAll('button[data-star]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var value = btn.getAttribute('data-star');
                // 再点一次已选中的档位 = 取消筛选
                setStarFilter(value === activeStar ? 'all' : value);
            });
        });
    }

    if (starMinSelect) {
        starMinSelect.addEventListener('change', function () {
            var value = starMinSelect.value;
            setStarFilter(value === '0' ? 'all' : value);
        });
    }

    /* ---------- 复制正文 ---------- */

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
            copyText(out).then(function (ok) {
                showToast(ok ? '已复制' : '复制失败，请手动选择');
            });
        });
    });

    /* ---------- 侧栏 / 分组跳转 ---------- */

    mobileButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var target = document.getElementById(btn.getAttribute('data-target'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActive(btn.getAttribute('data-target'));
        });
    });

    function setActive(target) {
        railLinks.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('data-target') === target);
        });
        mobileButtons.forEach(function (b) {
            b.classList.toggle('on', b.getAttribute('data-target') === target);
        });
    }

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

    window.addEventListener('hashchange', highlightFromHash);
    highlightFromHash();
})();
