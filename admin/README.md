# 且宁 · 在线写作台

写作台是纯静态页面，部署在 `https://ning0ing.com/admin/`。它通过 GitHub API 直接提交 `_data/*.json`，不需要服务器或数据库。

## 第一次使用

1. 打开 `https://ning0ing.com/admin/`
2. 在 GitHub → Settings → Developer settings → Fine-grained tokens 新建 token
3. Repository access 选 **Only select repositories**，只勾选 `Ning-Qie/Ning-Qie.github.io`（不要选 Public repositories 只读选项）
4. Repository permissions → **Contents: Read and write**（Metadata 会自动只读）
5. 有效期建议 90 天
6. 把 token 粘贴到写作台，点「连接 GitHub」

token 只保存在当前浏览器（localStorage / sessionStorage），只发送到 `api.github.com`，不会写进仓库。换电脑或清除浏览器数据后需要重新粘贴；也可以在 GitHub 直接撤销。

## 内容文件（一个页面一个文件）

| 页面 | 数据文件 |
|---|---|
| `/2020-06-26-zhaichao` 摘抄 | `_data/quotes.json` |
| `/2021-03-24-zaji` 杂记 | `_data/notes.json` |
| `/2022-11-15-Crazy-Poem` 疯子的诗 | `_data/poems-crazy.json` |
| `/2021-01-25-Paradise-of-Poetry` 诗乐园 | `_data/poems-paradise.json` |

四个页面互相隔离；写作台里的「诗歌」入口只是把两本诗集放在同一个编辑界面，写入的仍是各自的文件，不会生成合并页面。

## 日常操作

- 左侧选类型 / 年份 / 诗集，中间选条目，右侧编辑并实时预览
- 「批量粘贴」按每条末尾的 `——日期 出处` 自动切分，正文里的空行会保留
- 编辑内容会先保存在本机草稿（刷新不丢）
- 点「发布」才会写入 GitHub；发布前会列出改动文件与条数，可以改提交说明
- 发布后 GitHub Pages 约 1 分钟自动构建

## 本地预览（不需要 token）

在仓库根目录启动一个静态服务器：

```bash
python3 -m http.server 8000
```

然后打开：

```text
http://127.0.0.1:8000/admin/?mock=1
```

`mock=1` 会直接读取本地的 `_data/*.json`，发布按钮只提示「本地预览模式不会写入 GitHub」。

## 注意

- 写作台页面本身是公开的，但没有 token 无法写入；页面不加入站点导航，并设置了 `noindex`。
- 如果 token 权限不足，发布会提示 403；请确认 token 对仓库有 `Contents: Read and write`。
- 删除条目会先进入本机回收站；已发布的删除仍可从 git 历史找回。
