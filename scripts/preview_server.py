#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""本地预览服务器：_site 的静态页面 + 源码里的 /admin/ 和 /_data/。

用法：python3 scripts/preview_server.py [--port 8000]
支持 GitHub Pages 风格的「无扩展名 URL」：/2020-06-26-zhaichao -> .html
"""
import argparse
import mimetypes
import os
import posixpath
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / '_site'

EXTRA_TYPES = {
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
    '.otf': 'font/otf', '.json': 'application/json; charset=utf-8',
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
}


def resolve(path):
    if path.startswith('/admin'):
        base, rel = ROOT, path[1:]
    elif path.startswith('/_data'):
        base, rel = ROOT, path[1:]
    else:
        base, rel = SITE, path[1:]

    target = (base / rel).resolve()
    try:
        target.relative_to(base.resolve())
    except ValueError:
        return None
    if target.is_dir():
        target = target / 'index.html'
    if target.is_file():
        return target
    if not Path(rel).suffix:
        html = (base / (rel + '.html')).resolve()
        if html.is_file():
            return html
        index = (base / rel / 'index.html').resolve()
        if index.is_file():
            return index
    return None


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path == '/admin':
            path = '/admin/'
        file = resolve(path)
        if not file:
            self.send_error(404, 'Not found')
            return
        try:
            data = file.read_bytes()
        except OSError:
            self.send_error(404, 'Not found')
            return
        ctype = EXTRA_TYPES.get(file.suffix.lower()) or mimetypes.guess_type(str(file))[0] or 'application/octet-stream'
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    if not SITE.exists():
        raise SystemExit('缺少 _site，请先构建站点。')
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print('本地预览：http://127.0.0.1:%d/' % args.port)
    print('写作台：  http://127.0.0.1:%d/admin/?mock=1' % args.port)
    server.serve_forever()


if __name__ == '__main__':
    main()
