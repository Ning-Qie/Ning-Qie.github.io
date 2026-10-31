(function () {
    'use strict';

    var SITE = 'https://ning0ing.com';
    var OWNER = 'Ning-Qie';
    var REPO = 'Ning-Qie.github.io';
    var BRANCH = 'master';
    var TOKEN_KEY = 'ning-admin-token';
    var DRAFT_KEY = 'ning-admin-draft-v1';
    var TRASH_KEY = 'ning-admin-trash-v1';
    var UI_KEY = 'ning-admin-ui-v2';

    var FILES = {
        quotes: {
            path: '_data/quotes.json',
            page: '/2020-06-26-zhaichao',
            type: 'quotes',
            title: '摘抄',
            unit: '条',
            crumb: '摘抄 · COLLECT',
            sub: '为了寻找你 / 我搬进鸟的眼睛 / 经常盯着路过的风'
        },
        notes: {
            path: '_data/notes.json',
            page: '/2021-03-24-zaji',
            type: 'notes',
            title: '杂记',
            unit: '条',
            crumb: '杂记 · NOTES',
            sub: '突然蹦出的一些'
        },
        crazy: {
            path: '_data/poems-crazy.json',
            page: '/2022-11-15-Crazy-Poem',
            type: 'poems',
            title: '疯子的诗',
            unit: '首',
            crumb: '疯子的诗 · POEMS',
            sub: '诗，是写给自己的'
        },
        paradise: {
            path: '_data/poems-paradise.json',
            page: '/2021-01-25-Paradise-of-Poetry',
            type: 'poems',
            title: '诗乐园',
            unit: '首',
            crumb: '诗乐园 · POEMS',
            sub: '偶尔也需要读读诗'
        }
    };

    var TYPES = {
        quotes: { name: '摘抄', single: '摘抄', unit: '条', keys: ['quotes'] },
        poems: { name: '诗歌', single: '诗', unit: '首', keys: ['crazy', 'paradise'] },
        notes: { name: '杂记', single: '杂记', unit: '条', keys: ['notes'] }
    };

    var DATA_KEYS = ['quotes', 'notes', 'crazy', 'paradise'];

    var data = { quotes: [], notes: [], crazy: [], paradise: [] };
    var baseline = { quotes: [], notes: [], crazy: [], paradise: [] };
    var token = '';
    var state = {
        type: 'quotes',
        book: 'crazy',
        year: 'all',
        section: 'all',
        star: 'all',
        query: '',
        selected: null,
        dirty: false,
        loaded: false,
        mock: false,
        batch: false,
        publishing: false,
        readonly: false,
        draftAt: 0,
        sideCollapsed: false,
        focusMode: false,
        autoHidden: false,
        previewW: 404,
        restoreW: 404
    };
    var draftTimer = null;
    var listTimer = null;
    var resizeTimer = null;
    var previewDefault = 404;

    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function todayISO() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function dateLabel(date) {
        if (!date) return '';
        var p = date.split('-');
        if (p.length !== 3) return date;
        return (+p[0]) + '.' + (+p[1]) + '.' + (+p[2]);
    }

    function timeLabel(ts) {
        if (!ts) return '';
        var d = new Date(ts);
        return pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function readToken() {
        try {
            var local = localStorage.getItem(TOKEN_KEY);
            if (local) return { token: local, remember: true };
            var session = sessionStorage.getItem(TOKEN_KEY);
            if (session) return { token: session, remember: false };
        } catch (e) {}
        return { token: '', remember: true };
    }

    function saveToken(value, remember) {
        try {
            if (remember) {
                localStorage.setItem(TOKEN_KEY, value);
                sessionStorage.removeItem(TOKEN_KEY);
            } else {
                sessionStorage.setItem(TOKEN_KEY, value);
                localStorage.removeItem(TOKEN_KEY);
            }
        } catch (e) {}
    }

    function clearToken() {
        try {
            localStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(TOKEN_KEY);
        } catch (e) {}
    }

    function readDraft() {
        try {
            var raw = localStorage.getItem(DRAFT_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function writeDraft(value) {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
        } catch (e) {}
    }

    function clearDraft() {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch (e) {}
    }

    function readTrash() {
        try {
            var raw = localStorage.getItem(TRASH_KEY);
            var list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function writeTrash(list) {
        try {
            localStorage.setItem(TRASH_KEY, JSON.stringify(list));
        } catch (e) {}
    }

    function readUi() {
        try {
            var raw = localStorage.getItem(UI_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function writeUi() {
        try {
            localStorage.setItem(UI_KEY, JSON.stringify({
                sideCollapsed: state.sideCollapsed,
                focusMode: state.focusMode,
                previewW: state.previewW
            }));
        } catch (e) {}
    }

    function workspaceWidth() {
        var ws = document.querySelector('.workspace');
        return ws ? ws.getBoundingClientRect().width : window.innerWidth - 232;
    }

    function listPaneWidth() {
        var pane = document.querySelector('.list-pane');
        return pane && pane.getBoundingClientRect().width ? pane.getBoundingClientRect().width : 330;
    }

    /* 预览可拖范围：编辑区在时给它留 430px 可读宽度；编辑区让位后预览可铺满 */
    function previewBounds(stageHidden) {
        var rest = workspaceWidth() - listPaneWidth();
        var max = stageHidden ? rest - 2 : rest - 430;
        return { min: 300, max: Math.min(920, Math.max(320, Math.round(max))) };
    }

    /* 三栏布局状态：侧栏收起 / 编辑区让位（专注模式或拖拽中临时让位） */
    function layoutState() {
        var stageHidden = state.focusMode || state.autoHidden;
        return {
            collapsed: state.sideCollapsed,
            stageHidden: stageHidden,
            previewW: state.previewW
        };
    }

    function applyLayout() {
        var app = $('#app');
        if (!app) return;
        var s = layoutState();
        app.classList.toggle('side-collapsed', s.collapsed);
        app.classList.toggle('editor-off', s.stageHidden);
        app.classList.toggle('focus-mode', state.focusMode);
        app.style.setProperty('--preview-w', s.previewW + 'px');

        var sideBtn = $('#side-toggle');
        if (sideBtn) sideBtn.setAttribute('aria-expanded', s.collapsed ? 'false' : 'true');

        var stageBtn = $('#editor-toggle');
        if (stageBtn) {
            stageBtn.setAttribute('aria-pressed', s.stageHidden ? 'true' : 'false');
            stageBtn.title = s.stageHidden ? '显示编辑区（⌘E）' : '隐藏编辑区（⌘E）';
            stageBtn.classList.toggle('on', s.stageHidden);
        }
    }

    function collapseSidebar() {
        state.sideCollapsed = !state.sideCollapsed;
        state.previewW = clampPreview(state.previewW, layoutState().stageHidden);
        applyLayout();
        writeUi();
    }

    function toggleFocus() {
        if (window.innerWidth <= 900) {
            setView(document.body.dataset.view === 'edit' ? 'preview' : 'edit');
            return;
        }
        if (state.focusMode || state.autoHidden) {
            state.focusMode = false;
            state.autoHidden = false;
            state.previewW = clampPreview(state.restoreW, false);
            showToast('已恢复编辑区');
        } else {
            state.restoreW = state.previewW;
            state.focusMode = true;
            state.autoHidden = false;
            state.previewW = previewBounds(true).max;
            showToast('编辑区已隐藏 · 预览铺满（⌘E 恢复）');
        }
        applyLayout();
        writeUi();
    }

    function clampPreview(width, stageHidden) {
        var b = previewBounds(stageHidden);
        return Math.max(b.min, Math.min(b.max, Math.round(width)));
    }

    /* live = 拖动中：越过编辑区可读下限时编辑区临时让位，拖回来自动恢复 */
    function setPreviewWidth(width, live) {
        if (live && !state.focusMode) {
            var limit = previewBounds(false).max;
            if (!state.autoHidden && width > limit + 10) {
                state.restoreW = limit;
                state.autoHidden = true;
            } else if (state.autoHidden && width <= limit) {
                state.autoHidden = false;
                state.restoreW = limit;
            }
        }
        state.previewW = clampPreview(width, layoutState().stageHidden);
        applyLayout();
        var badge = $('#resize-badge');
        if (badge) {
            badge.hidden = !live;
            if (live) badge.textContent = state.previewW + 'px';
        }
        if (!live) writeUi();
    }

    function bindResize() {
        var grip = $('#preview-grip');
        if (!grip) return;
        grip.addEventListener('pointerdown', function (event) {
            if (window.innerWidth <= 900 || state.focusMode) return;
            event.preventDefault();
            var startX = event.clientX;
            var startW = $('.preview-pane').getBoundingClientRect().width;
            document.body.classList.add('resizing');
            grip.classList.add('dragging');
            try { grip.setPointerCapture(event.pointerId); } catch (e) {}
            function move(ev) {
                setPreviewWidth(startW - (ev.clientX - startX), true);
            }
            function up() {
                document.body.classList.remove('resizing');
                grip.classList.remove('dragging');
                var badge = $('#resize-badge');
                if (badge) badge.hidden = true;
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', up);
                writeUi();
            }
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
        });
        grip.addEventListener('dblclick', function () {
            state.focusMode = false;
            state.autoHidden = false;
            setPreviewWidth(previewDefault, false);
            showToast('预览宽度已复位');
        });
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                state.previewW = clampPreview(state.previewW, layoutState().stageHidden);
                applyLayout();
                writeUi();
            }, 180);
        });
    }

    function currentKey() {
        return state.type === 'poems' ? state.book : state.type;
    }

    function currentList() {
        return data[currentKey()] || [];
    }

    function currentMeta() {
        return FILES[currentKey()];
    }

    function currentEntry() {
        return currentList().find(function (entry) { return entry.id === state.selected; }) || null;
    }

    function typeMeta() {
        return TYPES[state.type];
    }

    function findEntryById(id) {
        for (var i = 0; i < DATA_KEYS.length; i++) {
            var key = DATA_KEYS[i];
            var entry = data[key].find(function (item) { return item.id === id; });
            if (entry) return { key: key, entry: entry, list: data[key] };
        }
        return null;
    }

    function decodeBase64(value) {
        var binary = atob(String(value || '').replace(/\s/g, ''));
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes);
    }

    async function api(path, options) {
        options = options || {};
        var headers = {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
        if (token) headers.Authorization = 'Bearer ' + token;
        var init = { method: options.method || 'GET', headers: headers, cache: 'no-store' };
        if (options.json !== undefined) {
            headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(options.json);
        }
        var response = await fetch('https://api.github.com' + path, init);
        var text = await response.text();
        var body = null;
        if (text) {
            try { body = JSON.parse(text); } catch (e) { body = text; }
        }
        if (!response.ok) {
            var message = body && body.message ? body.message : (response.status + ' ' + response.statusText);
            var error = new Error(message);
            error.status = response.status;
            error.body = body;
            throw error;
        }
        return body;
    }

    async function loadFile(key) {
        var meta = await api('/repos/' + OWNER + '/' + REPO + '/contents/' + FILES[key].path + '?ref=' + BRANCH);
        var text;
        if (meta && meta.content) {
            text = decodeBase64(meta.content);
        } else if (meta && meta.download_url) {
            var raw = await fetch(meta.download_url, { cache: 'no-store' });
            if (!raw.ok) throw new Error('读取 ' + FILES[key].path + ' 失败');
            text = await raw.text();
        } else {
            throw new Error('读取 ' + FILES[key].path + ' 失败');
        }
        var parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error(FILES[key].path + ' 不是数组');
        return parsed;
    }

    async function loadAll() {
        var results = await Promise.all(DATA_KEYS.map(function (key) { return loadFile(key); }));
        DATA_KEYS.forEach(function (key, index) {
            data[key] = results[index];
        });
        baseline = clone(data);
    }

    function normalizeOrder() {
        ['quotes', 'notes', 'crazy'].forEach(function (key) {
            data[key] = data[key]
                .map(function (entry, index) { return { entry: entry, index: index }; })
                .sort(function (a, b) {
                    var da = a.entry.date || '';
                    var db = b.entry.date || '';
                    if (da === db) return a.index - b.index;
                    return db.localeCompare(da);
                })
                .map(function (item) { return item.entry; });
        });
    }

    function normalizeEntry(key, entry) {
        if (key === 'quotes' || key === 'notes' || key === 'crazy') {
            if (!entry.date) {
                entry.date = todayISO();
                entry.dateLabel = dateLabel(entry.date);
                entry.year = +entry.date.slice(0, 4);
            }
        }
        if (!Array.isArray(entry.tags)) entry.tags = [];
        return entry;
    }

    function filteredList() {
        var list = currentList();
        var q = state.query.trim().toLowerCase();
        return list.filter(function (entry) {
            if (state.type !== 'poems' || state.book !== 'paradise') {
                if (state.year !== 'all' && String(entry.year) !== String(state.year)) return false;
            } else if (state.section !== 'all' && entry.section !== state.section) {
                return false;
            }
            if (state.type === 'quotes' && state.star !== 'all') {
                var min = parseInt(state.star, 10);
                if (!isNaN(min) && starValue(entry) < min) return false;
            }
            if (!q) return true;
            return [entry.text, entry.title, entry.author, entry.source, entry.note, (entry.tags || []).join(' ')]
                .join(' ').toLowerCase().indexOf(q) !== -1;
        });
    }

    function yearsOf(list) {
        var set = {};
        list.forEach(function (entry) {
            if (entry.year && entry.year !== 0) set[String(entry.year)] = true;
        });
        return Object.keys(set).sort(function (a, b) { return +b - +a; });
    }

    function sectionsOf(list) {
        var order = ['现代诗', '古诗'];
        var set = {};
        list.forEach(function (entry) { if (entry.section) set[entry.section] = true; });
        return order.filter(function (section) { return set[section]; }).concat(
            Object.keys(set).filter(function (section) { return order.indexOf(section) === -1; })
        );
    }

    function pageTitle(entry) {
        var meta = currentMeta();
        if (state.type === 'poems') return state.book === 'paradise' ? '诗乐园' : '疯子的诗';
        return meta.title;
    }

    function sourceLabel(entry) {
        if (state.type === 'notes') return entry.source ? '《' + entry.source + '》' : '杂记';
        if (state.type === 'poems') return currentMeta().title;
        if (entry.source) return '《' + entry.source + '》';
        return entry.author || '摘抄';
    }

    function excerpt(entry) {
        if (entry.title) return entry.title;
        var line = String(entry.text || '').split('\n').find(function (part) { return part.trim(); });
        return line || '（空白）';
    }

    function uid(prefix) {
        var list = currentList();
        var base = state.type === 'poems' && state.book === 'paradise' ? String(Date.now()) : todayISO().replace(/-/g, '');
        var n = 1;
        while (list.some(function (entry) { return entry.id === prefix + '-' + base + '-' + n; })) n++;
        return prefix + '-' + base + '-' + n;
    }

    function insertEntry(key, entry, atTop) {
        if (atTop === false) data[key].push(entry);
        else data[key].unshift(entry);
    }

    function showToast(message) {
        var toast = $('#toast');
        $('#toast-text').textContent = message;
        toast.classList.add('on');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(function () { toast.classList.remove('on'); }, 2400);
    }

    function setView(view) {
        document.body.dataset.view = view;
        $$('#mobile-tabs button').forEach(function (btn) {
            btn.classList.toggle('on', btn.dataset.view === view);
        });
    }

    function renderTypes() {
        var icons = {
            quotes: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.2 7.5h3.9v3.9H9.2c0 1.6.8 2.5 2.3 3.2v1.9c-2.7-.2-4.3-1.9-4.3-4.8V7.5zm8.1 0h3.9v3.9h-1.9c0 1.6.8 2.5 2.3 3.2v1.9c-2.7-.2-4.3-1.9-4.3-4.8V7.5z"/></svg>',
            poems: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 4c-6 .5-10 3-11.5 8.5L7 17l4.5-1.5C17 14 19.5 10 20 4z"/><path d="M4 20c2-4 5-7 9-9"/></svg>',
            notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h9l4 4v14H6V3z"/><path d="M9 11h7M9 15h5"/></svg>'
        };
        var counts = {
            quotes: data.quotes.length,
            poems: data.crazy.length + data.paradise.length,
            notes: data.notes.length
        };
        $('#type-nav').innerHTML = Object.keys(TYPES).map(function (type) {
            return '<button class="side-item ' + (state.type === type ? 'active' : '') + '" data-type="' + type + '" type="button">' +
                icons[type] + '<span>' + TYPES[type].name + '</span><span class="count">' + counts[type] + '</span></button>';
        }).join('');
        $$('#type-nav [data-type]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                switchType(btn.dataset.type);
            });
        });
        $('#mobile-type').value = state.type;
    }

    function switchType(type) {
        state.type = type;
        state.query = '';
        $('#search').value = '';
        state.year = 'all';
        state.section = 'all';
        closeBatch();
        state.selected = filteredList()[0] ? filteredList()[0].id : null;
        renderAll();
    }

    function renderYearNav() {
        var isParadise = state.type === 'poems' && state.book === 'paradise';
        var values = isParadise ? sectionsOf(currentList()) : yearsOf(currentList());
        var label = isParadise ? '按分类' : '按年份';
        $('#year-label').textContent = label;

        var items = [{ value: 'all', label: isParadise ? '全部分类' : '全部年份', count: currentList().length }];
        values.forEach(function (value) {
            var count = currentList().filter(function (entry) {
                return isParadise ? entry.section === value : String(entry.year) === String(value);
            }).length;
            items.push({ value: value, label: value, count: count });
        });

        var current = isParadise ? state.section : state.year;
        $('#year-nav').innerHTML = items.map(function (item) {
            return '<button class="side-year ' + (String(current) === String(item.value) ? 'active' : '') + '" data-value="' + esc(item.value) + '" type="button">' +
                '<span>' + esc(item.label) + '</span><span class="count">' + item.count + '</span></button>';
        }).join('');
        $$('#year-nav [data-value]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setYearValue(btn.dataset.value);
            });
        });

        $('#year-strip').innerHTML = items.map(function (item) {
            return '<button class="chip ' + (String(current) === String(item.value) ? 'active' : '') + '" data-value="' + esc(item.value) + '" type="button">' + esc(item.label) + '</button>';
        }).join('');
        $$('#year-strip [data-value]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setYearValue(btn.dataset.value);
            });
        });

        var starStrip = $('#star-strip');
        if (starStrip) {
            if (state.type === 'quotes') {
                var starred = currentList().filter(function (entry) { return starValue(entry) > 0; }).length;
                var top = currentList().filter(function (entry) { return starValue(entry) >= 4; }).length;
                starStrip.style.display = 'flex';
                starStrip.innerHTML = [
                    { value: 'all', label: '全部', count: currentList().length },
                    { value: '1', label: '★ 星标', count: starred }
                ].map(function (item) {
                    return '<button class="chip ' + (state.star === item.value ? 'active' : '') + '" data-star-filter="' + item.value + '" type="button">' +
                        item.label + ' ' + item.count + '</button>';
                }).join('') +
                    '<span class="chip-min"><span>至少</span><select id="star-min-select">' +
                    [0,1,2,3,4,5].map(function (n) {
                        var sel = (n > 0 && String(state.star) === String(n)) ? ' selected' : '';
                        return '<option value="' + n + '"' + sel + '>' + (n === 0 ? 'N 星' : n + ' 星') + '</option>';
                    }).join('') +
                    '</select></span>';

                $$('#star-strip [data-star-filter]').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        state.star = (state.star === btn.dataset.starFilter) ? 'all' : btn.dataset.starFilter;
                        var list = filteredList();
                        state.selected = list[0] ? list[0].id : null;
                        renderAll();
                    });
                });
                var minSel = $('#star-min-select');
                if (minSel) {
                    minSel.addEventListener('change', function () {
                        var n = parseInt(minSel.value, 10) || 0;
                        state.star = n === 0 ? 'all' : String(n);
                        var list = filteredList();
                        state.selected = list[0] ? list[0].id : null;
                        renderAll();
                    });
                }
            } else {
                if (state.star !== 'all') state.star = 'all';
                starStrip.style.display = 'none';
                starStrip.innerHTML = '';
            }
        }

        var bookStrip = $('#book-strip');
        if (state.type === 'poems') {
            bookStrip.style.display = 'flex';
            bookStrip.innerHTML = ['crazy', 'paradise'].map(function (book) {
                var meta = FILES[book];
                return '<button class="chip ' + (state.book === book ? 'active' : '') + '" data-book="' + book + '" type="button">' +
                    meta.title + ' ' + data[book].length + '</button>';
            }).join('');
            $$('#book-strip [data-book]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    switchBook(btn.dataset.book);
                });
            });
        } else {
            bookStrip.style.display = 'none';
            bookStrip.innerHTML = '';
        }
    }

    function setYearValue(value) {
        if (state.type === 'poems' && state.book === 'paradise') state.section = value;
        else state.year = value;
        var list = filteredList();
        state.selected = list[0] ? list[0].id : null;
        renderAll();
    }

    function switchBook(book) {
        if (state.book === book) return;
        state.book = book;
        state.year = 'all';
        state.section = 'all';
        state.query = '';
        $('#search').value = '';
        closeBatch();
        var list = filteredList();
        state.selected = list[0] ? list[0].id : null;
        renderAll();
    }

    function renderList() {
        var list = filteredList();
        var meta = currentMeta();
        $('#list-title').innerHTML = meta.title + '<span class="num">' + list.length + ' ' + meta.unit + '</span>';
        $('#crumb-type').textContent = meta.title;

        var html = '';
        var lastGroup = '';
        list.forEach(function (entry) {
            var group;
            if (state.type === 'poems' && state.book === 'paradise') {
                group = entry.section || '未分类';
            } else if (entry.date) {
                group = entry.date.slice(0, 4) + ' 年 ' + (+entry.date.slice(5, 7)) + ' 月';
            } else {
                group = '未标日期';
            }
            if (group !== lastGroup) {
                html += '<div class="month-label">' + esc(group) + '</div>';
                lastGroup = group;
            }
            var shortDate = entry.dateLabel || (entry.date ? entry.date.slice(5).replace('-', '.') : '—');
            var tags = (entry.tags || []).slice(0, 3).map(function (tag) {
                return '<span class="tag">' + esc(tag) + '</span>';
            }).join('');
            var star = state.type === 'quotes' ? starValue(entry) : 0;
            if (star > 0) {
                tags = '<span class="entry-stars" title="' + star + ' 星">' + new Array(star + 1).join('★') + '</span>' + tags;
            }
            html += '<div class="entry ' + (entry.id === state.selected ? 'active' : '') + '" data-id="' + esc(entry.id) + '">' +
                '<div class="entry-top"><span class="entry-date">' + esc(shortDate) + '</span><span class="entry-src">' + esc(sourceLabel(entry)) + '</span></div>' +
                '<p>' + esc(excerpt(entry)) + '</p>' +
                '<div class="entry-tags">' + tags + '</div>' +
                '</div>';
        });
        if (!list.length) {
            html = '<div class="list-end" style="padding:34px 8px">没有匹配的内容<br><br>点右上角 + 新建</div>';
        } else {
            html += '<div class="list-end">— 已加载全部 —</div>';
        }
        $('#list-scroll').innerHTML = html;
        $$('#list-scroll .entry').forEach(function (row) {
            row.addEventListener('click', function () {
                state.selected = row.dataset.id;
                closeBatch();
                if (window.innerWidth <= 900) setView('edit');
                renderAll();
            });
        });
    }

    function isTyping(event) {
        var target = event.target;
        if (!target) return false;
        var tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        return !!target.isContentEditable;
    }

    function scrollSelectedIntoView() {
        var row = $('#list-scroll .entry.active');
        if (row) row.scrollIntoView({ block: 'nearest' });
    }

    function selectEntry(id) {
        if (!id || id === state.selected) return;
        state.selected = id;
        closeBatch();
        renderList();
        renderEditor();
        renderPreview();
        scrollSelectedIntoView();
        if (window.innerWidth <= 900) setView('edit');
    }

    function moveSelection(delta) {
        var list = filteredList();
        if (!list.length) return;
        var index = list.findIndex(function (entry) { return entry.id === state.selected; });
        if (index < 0) index = delta > 0 ? -1 : 0;
        var next = list[Math.min(list.length - 1, Math.max(0, index + delta))];
        if (!next) return;
        selectEntry(next.id);
    }

    /* 数字键设定星级：按几就是几星；再按同一数字 = 取消；0 也取消 */
    function starFromKeyboard(value) {
        var entry = currentEntry();
        if (!entry) return;
        var next = Math.max(0, Math.min(5, value));
        if (next > 0 && starValue(entry) === next) next = 0;
        if (next > 0) entry.star = next;
        else delete entry.star;
        state.dirty = true;
        renderStarRating();
        renderList();
        renderPreview();
        renderStatus();
        renderDraftBanner();
        saveDraftSoon();
        updatePublishHint();
        showToast(next > 0 ? '已设置 ' + next + ' 星' : '已清除星级');
    }

    function field(label, control, hint) {
        return '<div class="field"><div class="label">' + label + (hint ? '<span class="opt">' + hint + '</span>' : '') + '</div>' + control + '</div>';
    }

    function inputField(label, fieldName, value, placeholder, type) {
        return field(
            label,
            '<input class="input" type="' + (type || 'text') + '" data-field="' + fieldName + '" value="' + esc(value || '') + '" placeholder="' + esc(placeholder || '') + '">'
        );
    }

    function textField(label, fieldName, value, placeholder, minHeight, hint) {
        return field(
            label,
            '<div class="textarea-wrap"><textarea class="textarea" data-field="' + fieldName + '" style="min-height:' + (minHeight || 210) + 'px" placeholder="' + esc(placeholder || '') + '">' + esc(value || '') + '</textarea><span class="char" id="char">0 字</span></div>',
            hint
        );
    }

    function tagsField(entry) {
        var value = (entry.tags || []).join(', ');
        return field('标签', '<input class="input" data-field="tags" value="' + esc(value) + '" placeholder="用逗号分隔，如：摘抄, 社会学">');
    }

    function citeText(entry) {
        if (entry.citeAnomaly && entry.cite) return entry.cite;
        var parts = [];
        if (entry.dateLabel) parts.push(entry.dateLabel);
        if (entry.author) parts.push(entry.author);
        if (entry.source) parts.push('《' + entry.source + '》');
        if (entry.note) parts.push(entry.note);
        return parts.join(' ');
    }

    function starValue(entry) {
        var value = entry && entry.star ? parseInt(entry.star, 10) : 0;
        if (isNaN(value)) return 0;
        return Math.max(0, Math.min(5, value));
    }

    function renderStarRating() {
        var box = $('#star-rating');
        var list = $('#star-buttons');
        if (!box || !list) return;
        var entry = currentEntry();
        var applicable = state.type === 'quotes' && !!entry && !state.batch;
        box.hidden = !applicable;
        if (!applicable) return;
        var value = starValue(entry);
        var html = '';
        for (var i = 1; i <= 5; i++) {
            html += '<button class="star-btn' + (i <= value ? ' on' : '') + '" type="button" data-star="' + i +
                '" role="radio" aria-checked="' + (i === value ? 'true' : 'false') +
                '" aria-label="' + i + ' 星" title="' + i + ' 星">★</button>';
        }
        html += '<button class="star-clear" type="button" data-star="0" title="清除星级">清除</button>';
        list.innerHTML = html;
        $$('#star-buttons .star-btn, #star-buttons .star-clear').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setStar(parseInt(btn.dataset.star, 10) || 0);
            });
        });
    }

    function setStar(value) {
        var entry = currentEntry();
        if (!entry) return;
        var next = Math.max(0, Math.min(5, value));
        if (starValue(entry) === next) next = 0;          // 再点同一颗星 = 取消
        if (next > 0) entry.star = next;
        else delete entry.star;
        state.dirty = true;
        renderStarRating();
        renderList();
        renderPreview();
        renderStatus();
        renderDraftBanner();
        saveDraftSoon();
        updatePublishHint();
        showToast(next > 0 ? '已标记 ' + next + ' 星' : '已清除星级');
    }

    function renderEditor() {
        var entry = currentEntry();
        var meta = currentMeta();
        var batchButton = $('#batch-toggle');
        $('#type-pill').textContent = typeMeta().single;
        batchButton.style.display = state.type === 'poems' ? 'none' : '';
        batchButton.textContent = state.batch ? '返回编辑' : '批量粘贴';
        $('#copy-link').disabled = !entry;
        $('#duplicate-btn').disabled = !entry;
        $('#delete-btn').disabled = !entry;
        $('#save-btn').disabled = !entry;

        if (!entry) {
            $('#editor-title').textContent = '未选择内容';
            $('#form').innerHTML = '<div class="preview-empty" style="padding:70px 10px">左侧选择一条内容，或点 + 新建。</div>';
            $('#foot-meta').textContent = '选择一个条目开始编辑';
            var starBox = $('#star-rating');
            if (starBox) starBox.hidden = true;
            return;
        }

        var title = entry.dateLabel || '未标日期';
        if (state.type === 'poems') title += ' · ' + (entry.title || '无题');
        else if (state.type === 'notes') title += ' · 杂记';
        else title += ' · ' + (entry.source || '未填写出处');
        $('#editor-title').innerHTML = esc(title);

        var html = '';
        if (state.type === 'quotes') {
            html += textField('正文', 'text', entry.text, '粘贴或输入摘抄内容…', 210, '支持多段落，换行会保留');
            html += '<div class="field"><div class="label">出处预览</div><div class="cite-preview"><span class="cite-label">将显示为</span><span>——<b>' + esc(entry.dateLabel || '日期') + '</b> ' + esc(entry.author || '作者') + (entry.source ? '《' + esc(entry.source) + '》' : '') + (entry.note ? ' ' + esc(entry.note) : '') + '</span></div></div>';
            html += '<div class="field-row">' + inputField('日期', 'date', entry.date, '', 'date') + inputField('作者', 'author', entry.author, '如：王水照 崔铭') + '</div>';
            html += '<div class="field-row">' + inputField('书名 / 出处', 'source', entry.source, '如：苏轼传') + inputField('备注', 'note', entry.note, '章节 / 读书笔记，选填') + '</div>';
            html += tagsField(entry);
        } else if (state.type === 'notes') {
            html += textField('正文', 'text', entry.text, '今天想到…', 320, '空行分段，换行会保留');
            html += '<div class="field-row">' + inputField('日期', 'date', entry.date, '', 'date') + inputField('作者', 'author', entry.author, '选填') + '</div>';
            html += '<div class="field-row">' + inputField('书名 / 出处', 'source', entry.source, '选填') + inputField('备注', 'note', entry.note, '选填') + '</div>';
            html += tagsField(entry);
        } else if (state.book === 'crazy') {
            html += textField('正文', 'text', entry.text, '诗的第一行…', 300, '一行一句，空行分段');
            html += '<div class="field-row">' + inputField('日期', 'date', entry.date, '', 'date') +
                '<div class="field"><div class="label">收录到</div><select class="input" data-field="book"><option value="crazy" selected>疯子的诗（原创）</option><option value="paradise">诗乐园（收藏）</option></select></div></div>';
            html += tagsField(entry);
        } else {
            html += '<div class="field-row">' + inputField('标题', 'title', entry.title, '无题') + inputField('作者', 'author', entry.author, '如：海子') + '</div>';
            html += '<div class="field-row"><div class="field"><div class="label">分类</div><select class="input" data-field="section"><option value="现代诗"' + (entry.section !== '古诗' ? ' selected' : '') + '>现代诗</option><option value="古诗"' + (entry.section === '古诗' ? ' selected' : '') + '>古诗</option></select></div>' + inputField('日期', 'date', entry.date, '选填', 'date') + '</div>';
            html += '<div class="field"><div class="label">收录到</div><select class="input" data-field="book"><option value="crazy">疯子的诗（原创）</option><option value="paradise"' + (state.book === 'paradise' ? ' selected' : '') + '>诗乐园（收藏）</option></select></div>';
            html += textField('正文', 'text', entry.text, '诗的第一行…', 260, '一行一句，空行分段');
            html += tagsField(entry);
        }

        if (entry.citeAnomaly) {
            html += '<div class="field-warning">原始出处格式不标准：' + esc(entry.cite || '') + '。修改作者、书名或备注后，会按字段重新显示。</div>';
        }
        if (entry.dateNote) {
            html += '<div class="field-warning">' + esc(entry.dateNote) + '。</div>';
        }

        $('#form').innerHTML = html;
        $('#editor-scroll').scrollTop = 0;
        updateChar();
        updateFoot();
        renderStarRating();
    }

    function updateEditorTitle() {
        var entry = currentEntry();
        if (!entry) return;
        var title = entry.dateLabel || '未标日期';
        if (state.type === 'poems') title += ' · ' + (entry.title || '无题');
        else if (state.type === 'notes') title += ' · 杂记';
        else title += ' · ' + (entry.source || '未填写出处');
        $('#editor-title').textContent = title;
    }

    function updateChar() {
        var entry = currentEntry();
        var char = $('#char');
        if (char && entry) char.textContent = (entry.text || '').replace(/\s/g, '').length + ' 字';
    }

    function updateFoot() {
        var entry = currentEntry();
        if (!entry) return;
        var count = (entry.text || '').replace(/\s/g, '').length;
        $('#foot-meta').innerHTML = '正文 <b>' + count + '</b> 字 · 草稿自动保存';
    }

    function renderPreview() {
        var entry = currentEntry();
        var meta = currentMeta();
        if (!entry) {
            $('#preview-body').innerHTML = '<div class="preview-empty">选择一条内容开始预览</div>';
            $('#preview-url').textContent = 'ning0ing.com' + meta.page;
            $('#p-title').textContent = pageTitle(entry);
            $('#preview-page').textContent = pageTitle(entry);
            $('#preview-crumb').textContent = meta.crumb;
            $('#preview-sub').textContent = meta.sub;
            $('#preview-year').textContent = '';
            $('#anchor').textContent = '#';
            return;
        }
        $('#preview-url').textContent = 'ning0ing.com' + meta.page;
        $('#p-title').textContent = pageTitle(entry);
        $('#preview-page').textContent = pageTitle(entry);
        $('#preview-crumb').textContent = meta.crumb;
        $('#preview-sub').textContent = meta.sub;
        $('#preview-year').textContent = entry.date ? entry.date.slice(0, 4) : (state.book === 'paradise' ? '诗乐园' : '');
        $('#anchor').textContent = '#' + entry.id;

        var text = esc(entry.text || '正文…').replace(/\n/g, '<br>');
        var cite = citeText(entry);
        if (state.type === 'poems') {
            $('#preview-body').innerHTML = '<div class="quote-card">' +
                (entry.title ? '<p style="font-family:var(--serif);font-size:14px;font-weight:600;margin:0 0 2px">' + esc(entry.title) + '</p>' : '') +
                (entry.author ? '<div style="font-size:9px;color:#a89e8c;margin-bottom:8px">' + esc(entry.author) + '</div>' : '') +
                '<p class="quote-text">' + text + '</p>' +
                '<div class="quote-cite"><span>——' + esc(cite) + '</span><span class="src">' + esc(entry.section || '') + '</span></div>' +
                '</div>';
        } else {
            var star = starValue(entry);
            var starLine = (state.type === 'quotes' && star > 0)
                ? '<div class="quote-stars">' + new Array(star + 1).join('★') + '</div>' : '';
            $('#preview-body').innerHTML = '<div class="quote-card">' + starLine +
                '<p class="quote-text">' + text + '</p>' +
                '<div class="quote-cite"><span>——' + esc(cite) + '</span><span class="src">' + esc((entry.tags || [])[0] || '') + '</span></div>' +
                '</div>';
        }
    }

    function renderStatus() {
        var sync = $('#sync');
        var dot = '<i></i>';
        if (state.mock) {
            sync.innerHTML = '<i style="background:#3d6fe0;box-shadow:0 0 0 3px #eaf0fd"></i><span>本地预览 · 只读 GitHub</span>';
            $('#side-status').textContent = '本地预览：数据来自 _data/';
        } else if (!token) {
            sync.innerHTML = '<i style="background:#c04a3a;box-shadow:0 0 0 3px #f9e9e6"></i><span>未连接 GitHub</span>';
            $('#side-status').textContent = '未连接 GitHub';
        } else if (state.publishing) {
            sync.innerHTML = '<i style="background:#3d6fe0;box-shadow:0 0 0 3px #eaf0fd"></i><span>正在发布…</span>';
            $('#side-status').textContent = '正在发布到 GitHub…';
        } else if (state.readonly) {
            sync.innerHTML = '<i style="background:#c04a3a;box-shadow:0 0 0 3px #f9e9e6"></i><span>token 只读 · 无法发布</span>';
            $('#side-status').textContent = 'token 缺少 Contents: Read and write，请在 GitHub 更新后重新连接';
        } else if (state.dirty) {
            sync.innerHTML = '<i style="background:#d99a2b;box-shadow:0 0 0 3px #fbf3e3"></i><span>未发布的更改</span>';
            $('#side-status').textContent = '已连接 ' + OWNER + '/' + REPO + ' · ' + BRANCH;
        } else {
            sync.innerHTML = dot + '<span>GitHub 已连接</span>';
            $('#side-status').textContent = '已连接 ' + OWNER + '/' + REPO + ' · ' + BRANCH;
        }
        $('#publish-btn').disabled = state.publishing;
    }

    function renderDraftBanner() {
        var banner = $('#draft-banner');
        if (!state.dirty) {
            banner.classList.remove('on');
            banner.innerHTML = '';
            return;
        }
        banner.classList.add('on');
        banner.innerHTML = '有未发布的草稿' + (state.draftAt ? ' · 自动保存于 ' + timeLabel(state.draftAt) : '') +
            ' <button type="button" id="discard-draft">放弃草稿</button>';
        var btn = $('#discard-draft');
        if (btn) btn.addEventListener('click', discardDraft);
    }

    function renderTrashCount() {
        $('#trash-count').textContent = readTrash().length;
    }

    function renderAll() {
        renderTypes();
        renderYearNav();
        var list = filteredList();
        if (!currentEntry() || !list.some(function (entry) { return entry.id === state.selected; })) {
            state.selected = list[0] ? list[0].id : null;
        }
        renderList();
        renderEditor();
        renderPreview();
        renderStatus();
        renderDraftBanner();
        renderTrashCount();
        setView(document.body.dataset.view || 'list');
    }

    function updateRow(entry) {
        var row = document.querySelector('#list-scroll .entry[data-id="' + entry.id + '"]');
        if (!row) return;
        var date = row.querySelector('.entry-date');
        var src = row.querySelector('.entry-src');
        var text = row.querySelector('p');
        if (date) date.textContent = entry.dateLabel || (entry.date ? entry.date.slice(5).replace('-', '.') : '—');
        if (src) src.textContent = sourceLabel(entry);
        if (text) text.textContent = excerpt(entry);
    }

    function onFormInput(event) {
        var target = event.target;
        if (!target || !target.dataset || !target.dataset.field) return;
        var entry = currentEntry();
        if (!entry) return;
        var fieldName = target.dataset.field;

        if (fieldName === 'book') {
            moveBook(entry, target.value);
            return;
        }

        if (fieldName === 'tags') {
            entry.tags = String(target.value || '').split(/[,，]/).map(function (tag) { return tag.trim(); }).filter(Boolean);
        } else if (fieldName === 'date') {
            entry.date = target.value || '';
            entry.dateLabel = dateLabel(entry.date);
            entry.year = entry.date ? +entry.date.slice(0, 4) : 0;
        } else {
            entry[fieldName] = target.value;
            if (fieldName === 'author' || fieldName === 'source' || fieldName === 'note') {
                entry.citeAnomaly = false;
            }
        }

        state.dirty = true;
        updateEditorTitle();
        updateChar();
        updateFoot();
        updateRow(entry);
        renderPreview();
        renderStatus();
        renderDraftBanner();
        saveDraftSoon();
        updatePublishHint();
    }

    function moveBook(entry, book) {
        if (book === state.book) return;
        var from = data[state.book];
        var index = from.findIndex(function (item) { return item.id === entry.id; });
        if (index < 0) return;
        from.splice(index, 1);
        if (book === 'crazy') {
            if (!entry.date) {
                entry.date = todayISO();
                entry.dateLabel = dateLabel(entry.date);
                entry.year = +entry.date.slice(0, 4);
            }
            entry.section = '原创';
            entry.tags = Array.from(new Set(['诗', '原创'].concat(entry.tags || [])));
            data.crazy.unshift(entry);
        } else {
            entry.section = entry.section === '原创' || !entry.section ? '现代诗' : entry.section;
            entry.tags = Array.from(new Set(['诗', entry.section].concat(entry.tags || [])));
            data.paradise.push(entry);
        }
        state.book = book;
        state.selected = entry.id;
        state.year = 'all';
        state.section = 'all';
        state.dirty = true;
        saveDraftSoon();
        renderAll();
        showToast('已移到「' + FILES[book].title + '」');
    }

    function saveDraftSoon() {
        clearTimeout(draftTimer);
        draftTimer = setTimeout(function () {
            saveDraft(true);
        }, 450);
    }

    function saveDraft(silent) {
        if (!state.loaded) return;
        state.draftAt = Date.now();
        writeDraft({ data: data, savedAt: state.draftAt });
        renderDraftBanner();
        renderStatus();
        if (!silent) showToast('草稿已保存到本机浏览器');
    }

    function discardDraft() {
        if (!window.confirm('放弃本机未发布的草稿，回到线上版本？')) return;
        data = clone(baseline);
        state.dirty = false;
        state.draftAt = 0;
        clearDraft();
        state.selected = filteredList()[0] ? filteredList()[0].id : null;
        renderAll();
        showToast('已放弃本机草稿');
    }

    function applyDraft() {
        var draft = readDraft();
        if (!draft || !draft.data) return;
        var valid = DATA_KEYS.every(function (key) { return Array.isArray(draft.data[key]); });
        if (!valid) return;
        if (JSON.stringify(draft.data) === JSON.stringify(baseline)) {
            clearDraft();
            return;
        }
        data = draft.data;
        state.dirty = true;
        state.draftAt = draft.savedAt || 0;
        state.selected = filteredList()[0] ? filteredList()[0].id : null;
    }

    function newEntry() {
        var key = currentKey();
        var meta = FILES[key];
        var entry;
        var idPrefix = { quotes: 'q', notes: 'n', crazy: 'pc', paradise: 'pp' }[key];
        if (key === 'quotes') {
            entry = { id: uid(idPrefix), date: todayISO(), dateLabel: dateLabel(todayISO()), text: '', author: '', source: '', note: '', cite: '', citeAnomaly: false, year: +todayISO().slice(0, 4), tags: ['摘抄'], star: 0 };
        } else if (key === 'notes') {
            entry = { id: uid(idPrefix), date: todayISO(), dateLabel: dateLabel(todayISO()), text: '', author: '', source: '', note: '', cite: '', citeAnomaly: false, year: +todayISO().slice(0, 4), tags: ['杂记'] };
        } else if (key === 'crazy') {
            entry = { id: uid(idPrefix), date: todayISO(), dateLabel: dateLabel(todayISO()), text: '', title: '', author: '', section: '原创', year: +todayISO().slice(0, 4), tags: ['诗', '原创'] };
        } else {
            entry = { id: uid(idPrefix), date: '', dateLabel: '', text: '', title: '', author: '', section: '现代诗', year: 0, tags: ['诗', '现代诗'] };
        }
        insertEntry(key, entry, key !== 'paradise');
        state.selected = entry.id;
        state.dirty = true;
        state.query = '';
        $('#search').value = '';
        if (state.type === 'poems' && state.book === 'paradise') {
            state.section = 'all';
        } else {
            state.year = 'all';
        }
        closeBatch();
        saveDraft(true);
        renderAll();
        if (window.innerWidth <= 900) setView('edit');
        var textarea = $('#form textarea');
        if (textarea) setTimeout(function () { textarea.focus(); }, 40);
    }

    function deleteEntry() {
        var entry = currentEntry();
        if (!entry) return;
        if (!window.confirm('删除这条内容？会先放进本机回收站，可恢复。')) return;
        var key = currentKey();
        var index = data[key].findIndex(function (item) { return item.id === entry.id; });
        var trash = readTrash();
        trash.unshift({ key: key, entry: entry, index: index, deletedAt: Date.now() });
        writeTrash(trash);
        data[key].splice(index, 1);
        state.selected = filteredList()[0] ? filteredList()[0].id : null;
        state.dirty = true;
        saveDraft(true);
        renderAll();
        showToast('已移入回收站');
    }

    function duplicateEntry() {
        var entry = currentEntry();
        if (!entry) return;
        var copy = clone(entry);
        copy.id = uid({ quotes: 'q', notes: 'n', crazy: 'pc', paradise: 'pp' }[currentKey()]);
        copy.text = entry.text;
        insertEntry(currentKey(), copy, currentKey() !== 'paradise');
        state.selected = copy.id;
        state.dirty = true;
        saveDraft(true);
        renderAll();
        showToast('已复制为新条目');
    }

    function copyLink() {
        var entry = currentEntry();
        if (!entry) return;
        var url = SITE + currentMeta().page + '#' + entry.id;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () { showToast('已复制单条链接'); }, function () { showToast(url); });
        } else {
            showToast(url);
        }
    }

    function switchBatch(on) {
        state.batch = on;
        $('#form').classList.toggle('off', on);
        $('#batch-pane').classList.toggle('on', on);
        $('#batch-toggle').textContent = on ? '返回编辑' : '批量粘贴';
        $('.editor-foot').style.display = on ? 'none' : 'flex';
        if (on) {
            $('#editor-title').textContent = '批量粘贴';
            $('#batch-text').value = '';
            $('#batch-text').focus();
            parseBatch();
        } else {
            renderEditor();
            renderPreview();
        }
    }

    function closeBatch() {
        if (state.batch) switchBatch(false);
    }

    function parseDate(raw) {
        var m = raw.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*(.*)$/);
        if (m) {
            return {
                date: m[1] + '-' + pad(+m[2]) + '-' + pad(+m[3]),
                label: (+m[1]) + '.' + (+m[2]) + '.' + (+m[3]),
                rest: m[4]
            };
        }
        m = raw.match(/^(\d{4})[.\-/](\d{1,2})\s*(.*)$/);
        if (m) {
            return { date: m[1] + '-' + pad(+m[2]) + '-01', label: (+m[1]) + '.' + (+m[2]), rest: m[3] };
        }
        m = raw.match(/^(\d{4})\s*(.*)$/);
        if (m) {
            return { date: m[1] + '-01-01', label: m[1], rest: m[2] };
        }
        return { date: '', label: '', rest: raw };
    }

    function parseBatch() {
        var raw = $('#batch-text').value;
        var out = [];
        var buf = [];
        raw.split('\n').forEach(function (line) {
            if (line.trim().startsWith('——')) {
                var text = buf.join('\n').trim();
                buf = [];
                if (!text) return;
                var cite = line.trim().replace(/^—+/, '').trim();
                var parsed = parseDate(cite);
                var rest = parsed.rest;
                var source = '';
                var author = rest;
                var note = '';
                var match = rest.match(/《([^》]+)》/);
                if (match) {
                    source = match[1].trim();
                    author = rest.slice(0, match.index).trim();
                    note = rest.slice(match.index + match[0].length).trim();
                }
                out.push({
                    text: text,
                    date: parsed.date,
                    dateLabel: parsed.label,
                    author: author,
                    source: source,
                    note: note,
                    cite: cite,
                    citeAnomaly: false
                });
            } else {
                buf.push(line);
            }
        });
        $('#batch-count').textContent = out.length + ' 条';
        $('#batch-import').textContent = '导入 ' + out.length + ' 条';
        $('#batch-meta').innerHTML = out.length
            ? '<b>✓</b> 识别到 ' + out.length + ' 条，导入到「' + currentMeta().title + '」'
            : '没有识别到条目，检查每条是否以「——」开头';
        $('#parsed').innerHTML = out.length ? out.map(function (item) {
            return '<div class="parsed-item"><div class="pd"><span>' + esc(item.dateLabel || '未识别日期') + '</span><span>' + esc(item.author) + '</span></div><div class="pt">' + esc(item.text) + '</div>' + (item.source ? '<div class="pcite">《' + esc(item.source) + '》</div>' : '') + '</div>';
        }).join('') : '<div class="preview-empty">粘贴后点「重新识别」</div>';
        return out;
    }

    function importBatch() {
        var items = parseBatch();
        if (!items.length) {
            showToast('没有可导入的条目');
            return;
        }
        var key = currentKey();
        var prefix = { quotes: 'q', notes: 'n' }[key];
        if (!prefix) {
            showToast('只有摘抄和杂记支持批量粘贴');
            return;
        }
        var addedIds = [];
        items.forEach(function (item) {
            var entry = {
                id: uid(prefix),
                date: item.date || todayISO(),
                dateLabel: item.dateLabel || dateLabel(item.date || todayISO()),
                text: item.text,
                author: item.author,
                source: item.source,
                note: item.note,
                cite: item.cite,
                citeAnomaly: false,
                year: +(item.date || todayISO()).slice(0, 4),
                tags: [key === 'quotes' ? '摘抄' : '杂记']
            };
            data[key].unshift(entry);
            addedIds.push(entry.id);
        });
        normalizeOrder();
        state.selected = addedIds[0];
        state.dirty = true;
        state.query = '';
        $('#search').value = '';
        state.year = 'all';
        closeBatch();
        saveDraft(true);
        renderAll();
        showToast('已导入 ' + items.length + ' 条');
    }

    function changedFiles() {
        var changed = [];
        DATA_KEYS.forEach(function (key) {
            if (JSON.stringify(data[key]) !== JSON.stringify(baseline[key])) {
                changed.push(key);
            }
        });
        return changed;
    }

    function diffStats(key) {
        var base = baseline[key];
        var current = data[key];
        var baseMap = {};
        var currentMap = {};
        base.forEach(function (entry) { baseMap[entry.id] = entry; });
        current.forEach(function (entry) { currentMap[entry.id] = entry; });
        var added = current.filter(function (entry) { return !baseMap[entry.id]; }).length;
        var removed = base.filter(function (entry) { return !currentMap[entry.id]; }).length;
        var modified = current.filter(function (entry) {
            return baseMap[entry.id] && JSON.stringify(baseMap[entry.id]) !== JSON.stringify(entry);
        }).length;
        return { added: added, removed: removed, modified: modified };
    }

    function publish() {
        if (state.mock) {
            showToast('本地预览模式不会写入 GitHub');
            return;
        }
        if (!token) {
            openConnect(false);
            showToast('请先连接 GitHub');
            return;
        }
        if (state.readonly) {
            openConnect(false);
            showToast('当前 token 只有读权限：请在 GitHub 给 Contents: Read and write 后重新连接');
            return;
        }
        ['quotes', 'notes', 'crazy'].forEach(function (key) {
            data[key].forEach(function (entry) { normalizeEntry(key, entry); });
        });
        normalizeOrder();
        var changed = changedFiles();
        if (!changed.length) {
            showToast('没有需要发布的更改');
            return;
        }
        var totalAdded = 0;
        var totalModified = 0;
        var totalRemoved = 0;
        var rows = changed.map(function (key) {
            var stats = diffStats(key);
            totalAdded += stats.added;
            totalModified += stats.modified;
            totalRemoved += stats.removed;
            return '<div class="diff-row"><span class="name">' + esc(FILES[key].title) + '</span>' +
                '<span class="nums"><span class="add">+' + stats.added + '</span><span class="mod">~' + stats.modified + '</span><span class="del">-' + stats.removed + '</span></span></div>';
        }).join('');
        var defaultMessage = '更新内容 ' + todayISO() + '（+' + totalAdded + ' ~' + totalModified + ' -' + totalRemoved + '）';

        var root = $('#modal-root');
        root.innerHTML = '<div class="modal" id="publish-modal"><div class="modal-card">' +
            '<div class="modal-head"><h2>发布到 GitHub</h2><button class="close" type="button" id="modal-close">×</button></div>' +
            '<div class="modal-body">' +
            '<p class="publish-note" style="margin-top:0">确认后会把下面这些文件写入 <b>' + OWNER + '/' + REPO + '</b> 的 <code>' + BRANCH + '</code> 分支。GitHub Pages 约 1 分钟后更新。</p>' +
            rows +
            '<label class="commit-label" for="commit-message">提交说明</label>' +
            '<input class="commit-input" id="commit-message" value="' + esc(defaultMessage) + '">' +
            '<div class="connect-error" id="publish-error"></div>' +
            '<p class="publish-note">不会边打字边推送；这次只会提交上面这些内容文件。</p>' +
            '</div>' +
            '<div class="modal-foot"><span class="foot-meta">' + (totalAdded + totalModified + totalRemoved) + ' 处变化</span><div class="right"><button class="btn" type="button" id="modal-cancel">取消</button><button class="btn btn-dark" type="button" id="modal-publish">确认发布</button></div></div>' +
            '</div></div>';

        var close = function () { root.innerHTML = ''; };
        $('#modal-close').onclick = close;
        $('#modal-cancel').onclick = close;
        $('#modal-publish').onclick = async function () {
            var button = this;
            var message = $('#commit-message').value.trim() || defaultMessage;
            var errorBox = $('#publish-error');
            errorBox.classList.remove('on');
            button.disabled = true;
            button.textContent = '发布中…';
            state.publishing = true;
            renderStatus();
            try {
                for (var i = 0; i < changed.length; i++) {
                    var remote = await loadFile(changed[i]);
                    if (JSON.stringify(remote) !== JSON.stringify(baseline[changed[i]])) {
                        throw new Error('线上内容已被其他设备修改，请刷新页面后再发布。');
                    }
                }
                var payload = changed.map(function (key) {
                    return { key: key, path: FILES[key].path, content: JSON.stringify(data[key], null, 2) + '\n' };
                });
                var commit = await commitChanges(payload, message);
                baseline = clone(data);
                state.dirty = false;
                state.draftAt = 0;
                clearDraft();
                state.publishing = false;
                root.innerHTML = '<div class="modal" id="publish-modal"><div class="modal-card">' +
                    '<div class="modal-head"><h2>已发布</h2><button class="close" type="button" id="modal-close-ok">×</button></div>' +
                    '<div class="modal-body"><p style="font-size:13px;line-height:1.8;margin:0 0 10px">内容已经提交到 GitHub，GitHub Pages 正在构建，约 1 分钟后更新。</p>' +
                    '<p style="font-size:12px;line-height:1.8;margin:0"><a href="' + esc(commit.html_url) + '" target="_blank" rel="noopener" style="color:#3d6fe0">查看这次 commit ↗</a></p></div>' +
                    '<div class="modal-foot"><div class="right"><button class="btn btn-dark" type="button" id="modal-done">完成</button></div></div>' +
                    '</div></div>';
                $('#modal-close-ok').onclick = close;
                $('#modal-done').onclick = close;
                renderAll();
                showToast('已发布，GitHub Pages 构建中');
            } catch (err) {
                state.publishing = false;
                renderStatus();
                button.disabled = false;
                button.textContent = '确认发布';
                var messageText = err.message || '发布失败';
                if (err.status === 403) {
                    messageText = 'GitHub 拒绝写入：当前 token 没有 Contents: Read and write 权限。请到 GitHub → Settings → Developer settings → Fine-grained tokens，把该 token 的 Repository access 设为 Only select repositories 并选中本仓库，Contents 改为 Read and write；保存后在「GitHub 设置」里重新连接。';
                }
                errorBox.textContent = messageText;
                errorBox.classList.add('on');
            }
        };
    }

    async function commitChanges(files, message) {
        var ref = await api('/repos/' + OWNER + '/' + REPO + '/git/ref/heads/' + BRANCH);
        var head = ref.object.sha;
        var headCommit = await api('/repos/' + OWNER + '/' + REPO + '/git/commits/' + head);
        var baseTree = headCommit.tree.sha;
        var treeEntries = [];
        for (var i = 0; i < files.length; i++) {
            var blob = await api('/repos/' + OWNER + '/' + REPO + '/git/blobs', {
                method: 'POST',
                json: { content: files[i].content, encoding: 'utf-8' }
            });
            treeEntries.push({ path: files[i].path, mode: '100644', type: 'blob', sha: blob.sha });
        }
        var tree = await api('/repos/' + OWNER + '/' + REPO + '/git/trees', {
            method: 'POST',
            json: { base_tree: baseTree, tree: treeEntries }
        });
        var commit = await api('/repos/' + OWNER + '/' + REPO + '/git/commits', {
            method: 'POST',
            json: { message: message, tree: tree.sha, parents: [head] }
        });
        await api('/repos/' + OWNER + '/' + REPO + '/git/refs/heads/' + BRANCH, {
            method: 'PATCH',
            json: { sha: commit.sha, force: false }
        });
        return commit;
    }

    function openConnect(auto) {
        var screen = $('#connect-screen');
        screen.hidden = false;
        var loaded = state.loaded;
        $('#connect-title').textContent = loaded ? '更换 GitHub token' : '连接 GitHub 开始写作';
        $('#connect-btn').textContent = auto ? '连接中…' : (loaded ? '重新连接' : '连接 GitHub');
        $('#connect-btn').disabled = !!auto;
        $('#connect-cancel').hidden = !loaded;
        $('#disconnect-btn').hidden = !(token && loaded);
        $('#connect-error').classList.remove('on');
        $('#connect-error').textContent = '';
        var current = readToken();
        if (current.token && !$('#token-input').value) {
            $('#token-input').value = current.token;
            $('#remember-token').checked = current.remember;
        }
    }

    function closeConnect() {
        if (!state.loaded) return;
        $('#connect-screen').hidden = true;
    }

    async function connect(tokenValue, remember, auto) {
        var button = $('#connect-btn');
        var errorBox = $('#connect-error');
        errorBox.classList.remove('on');
        errorBox.textContent = '';
        button.disabled = true;
        button.textContent = auto ? '连接中…' : '连接中…';
        try {
            token = tokenValue;
            var repoInfo = await api('/repos/' + OWNER + '/' + REPO);
            state.readonly = !!(repoInfo && repoInfo.permissions && repoInfo.permissions.push === false);
            await loadAll();
            state.loaded = true;
            state.mock = false;
            saveToken(tokenValue, remember);
            $('#remember-token').checked = remember;
            $('#token-input').value = tokenValue;
            $('#app').hidden = false;
            $('#connect-screen').hidden = true;
            state.selected = filteredList()[0] ? filteredList()[0].id : null;
            applyDraft();
            renderAll();
            showToast(state.readonly ? '已连接，但 token 只有读权限，暂时不能发布' : '已连接 GitHub');
        } catch (err) {
            token = '';
            state.loaded = false;
            state.readonly = false;
            $('#app').hidden = true;
            var message = err.message || '连接失败';
            if (err.status === 401) message = 'token 无效或已过期，请重新生成。';
            if (err.status === 403) message = '权限不足或 API 频率受限：请确认 token 对该仓库有 Contents: Read and write 权限。';
            if (err.status === 404) message = '仓库或数据文件不存在：请确认 token 能访问 ' + OWNER + '/' + REPO + '。';
            errorBox.textContent = message;
            errorBox.classList.add('on');
            $('#connect-screen').hidden = false;
            $('#connect-cancel').hidden = true;
            $('#connect-btn').disabled = false;
            $('#connect-btn').textContent = '连接 GitHub';
        }
    }

    function disconnect() {
        clearToken();
        token = '';
        state.readonly = false;
        $('#disconnect-btn').hidden = true;
        $('#connect-cancel').hidden = !state.loaded;
        $('#connect-title').textContent = '连接 GitHub 开始写作';
        $('#connect-btn').textContent = '连接 GitHub';
        $('#token-input').value = '';
        renderStatus();
        showToast('已清除本机 token');
    }

    function openTrash() {
        var trash = readTrash();
        var root = $('#modal-root');
        var rows = trash.length ? trash.map(function (item, index) {
            return '<div class="diff-row"><span class="name">' + esc(excerpt(item.entry).slice(0, 40)) + '</span>' +
                '<span style="font-size:10.5px;color:#8f959f">' + esc(FILES[item.key].title) + '</span>' +
                '<button class="btn" style="height:26px;font-size:11px;margin-left:auto" data-restore="' + index + '">恢复</button></div>';
        }).join('') : '<div class="diff-empty">回收站是空的。删除的内容会先放在这里。</div>';
        root.innerHTML = '<div class="modal"><div class="modal-card">' +
            '<div class="modal-head"><h2>回收站</h2><button class="close" type="button" id="trash-close">×</button></div>' +
            '<div class="modal-body">' + rows + '</div>' +
            '<div class="modal-foot"><span class="foot-meta">仅保存在本机浏览器</span><div class="right">' +
            (trash.length ? '<button class="btn" type="button" id="trash-clear">清空</button>' : '') +
            '<button class="btn btn-dark" type="button" id="trash-done">完成</button></div></div>' +
            '</div></div>';
        var close = function () { root.innerHTML = ''; };
        $('#trash-close').onclick = close;
        $('#trash-done').onclick = close;
        var clearBtn = $('#trash-clear');
        if (clearBtn) clearBtn.onclick = function () {
            if (!window.confirm('清空回收站？清空后只能从 git 历史找回。')) return;
            writeTrash([]);
            close();
            renderTrashCount();
            showToast('回收站已清空');
        };
        $$('[data-restore]').forEach(function (btn) {
            btn.onclick = function () {
                var index = +btn.dataset.restore;
                var list = readTrash();
                var item = list.splice(index, 1)[0];
                if (!item) return;
                var key = item.key;
                if (state.type === 'poems' && key !== state.book) {
                    /* 恢复到对应的诗集，不强制切换当前视图 */
                }
                var target = data[key];
                if (typeof item.index === 'number' && item.index >= 0 && item.index <= target.length) {
                    target.splice(item.index, 0, item.entry);
                } else {
                    target.unshift(item.entry);
                }
                writeTrash(list);
                state.dirty = true;
                saveDraft(true);
                close();
                renderAll();
                showToast('已恢复');
            };
        });
    }

    function updatePublishHint() {
        renderStatus();
    }

    function bind() {
        $('#search').addEventListener('input', function () {
            state.query = this.value;
            renderList();
        });

        $('#new-btn').addEventListener('click', newEntry);
        $('#delete-btn').addEventListener('click', deleteEntry);
        $('#save-btn').addEventListener('click', function () { saveDraft(false); });
        $('#duplicate-btn').addEventListener('click', duplicateEntry);
        $('#copy-link').addEventListener('click', copyLink);
        $('#publish-btn').addEventListener('click', publish);
        $('#view-site').addEventListener('click', function () {
            window.open(SITE + currentMeta().page, '_blank', 'noopener');
        });
        $('#side-toggle').addEventListener('click', collapseSidebar);
        $('#editor-toggle').addEventListener('click', toggleFocus);
        bindResize();
        $('#settings-btn').addEventListener('click', function () { openConnect(false); });
        $('#settings-btn-top').addEventListener('click', function () { openConnect(false); });
        $('#trash-btn').addEventListener('click', openTrash);
        $('#trash-btn-top').addEventListener('click', openTrash);
        $('#batch-toggle').addEventListener('click', function () { switchBatch(!state.batch); });
        $('#batch-cancel').addEventListener('click', function () { switchBatch(false); });
        $('#batch-import').addEventListener('click', importBatch);
        $('#reparse').addEventListener('click', parseBatch);
        $('#batch-text').addEventListener('input', function () { clearTimeout(listTimer); listTimer = setTimeout(parseBatch, 300); });
        $('#mobile-type').addEventListener('change', function () { switchType(this.value); });
        $$('#mobile-tabs button').forEach(function (btn) {
            btn.addEventListener('click', function () { setView(btn.dataset.view); });
        });
        $('#token-peek').addEventListener('click', function () {
            var input = $('#token-input');
            var show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            this.textContent = show ? '隐藏' : '显示';
        });
        $('#connect-btn').addEventListener('click', function () {
            var value = $('#token-input').value.trim();
            if (!value) {
                var errorBox = $('#connect-error');
                errorBox.textContent = '请先粘贴 GitHub token。';
                errorBox.classList.add('on');
                return;
            }
            connect(value, $('#remember-token').checked, false);
        });
        $('#token-input').addEventListener('keydown', function (event) {
            if (event.key === 'Enter') $('#connect-btn').click();
        });
        $('#connect-cancel').addEventListener('click', closeConnect);
        $('#disconnect-btn').addEventListener('click', disconnect);
        $('#form').addEventListener('input', onFormInput);
        $('#form').addEventListener('change', onFormInput);
        document.addEventListener('keydown', function (event) {
            var meta = event.metaKey || event.ctrlKey;
            if (meta && event.key.toLowerCase() === 's') {
                event.preventDefault();
                saveDraft(false);
            }
            if (meta && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                $('#search').focus();
            }
            if (meta && event.key.toLowerCase() === 'b') {
                event.preventDefault();
                collapseSidebar();
            }
            if (meta && event.key.toLowerCase() === 'e') {
                event.preventDefault();
                toggleFocus();
            }
            var typing = isTyping(event);
            var blocked = meta || event.altKey || !!$('#modal-root').innerHTML ||
                !$('#connect-screen').hidden || state.batch;
            if (!typing && !blocked) {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    moveSelection(1);
                    return;
                }
                if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    moveSelection(-1);
                    return;
                }
                if (/^[0-5]$/.test(event.key) && state.type === 'quotes') {
                    event.preventDefault();
                    starFromKeyboard(parseInt(event.key, 10));
                    return;
                }
            }
            if (event.key === 'Escape') {
                if ($('#modal-root').innerHTML) {
                    $('#modal-root').innerHTML = '';
                } else if (!$('#connect-screen').hidden && state.loaded) {
                    closeConnect();
                } else if (state.batch) {
                    switchBatch(false);
                }
            }
        });
        $('#modal-root').addEventListener('click', function (event) {
            if (event.target.id === 'modal-root') $('#modal-root').innerHTML = '';
        });
    }

    async function loadMock() {
        try {
            var results = await Promise.all(DATA_KEYS.map(function (key) {
                return fetch('../' + FILES[key].path, { cache: 'no-store' }).then(function (res) {
                    if (!res.ok) throw new Error('读取 ' + FILES[key].path + ' 失败');
                    return res.json();
                });
            }));
            DATA_KEYS.forEach(function (key, index) { data[key] = results[index]; });
            baseline = clone(data);
            state.loaded = true;
            state.mock = true;
            state.readonly = false;
            state.selected = filteredList()[0] ? filteredList()[0].id : null;
            applyDraft();
            $('#app').hidden = false;
            $('#connect-screen').hidden = true;
            $('#settings-btn').style.display = 'none';
            $('#settings-btn-top').style.display = 'none';
            renderAll();
            showToast('本地预览模式：数据来自 _data/');
        } catch (err) {
            $('#connect-error').textContent = '本地预览模式读取 _data/ 失败：' + err.message + '。请从仓库根目录启动静态服务器，并在网址后加 ?mock=1。';
            $('#connect-error').classList.add('on');
        }
    }

    function init() {
        var ui = readUi();
        if (ui) {
            state.sideCollapsed = !!ui.sideCollapsed;
            state.focusMode = !!ui.focusMode;
            if (typeof ui.previewW === 'number') state.previewW = ui.previewW;
        }
        bind();
        applyLayout();
        renderTypes();
        renderYearNav();
        var mock = new URLSearchParams(location.search).get('mock') === '1';
        if (mock) {
            $('#connect-screen').hidden = true;
            $('#app').hidden = false;
            loadMock();
            return;
        }
        var saved = readToken();
        if (saved.token) {
            $('#token-input').value = saved.token;
            $('#remember-token').checked = saved.remember;
            openConnect(true);
            connect(saved.token, saved.remember, true);
        } else {
            openConnect(false);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
