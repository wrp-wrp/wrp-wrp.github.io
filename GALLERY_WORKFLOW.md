# 图库功能使用说明

已在站点中加入可复用的图库能力（网格排版 + 点击大图预览 + 键盘切换）。

## 1. 功能点

1. 响应式网格（桌面 3 列，平板 2 列，手机 1 列）。
2. 点击图片打开灯箱预览。
3. 支持 `ESC` 关闭、`←/→` 切换上一张/下一张。
4. 可选显示图片标题（caption）。

## 2. 使用方式（推荐：页面资源）

把图片放在文章同级目录下（page bundle），例如：

```text
content/posts/my-trip/
  index.md
  01.jpg
  02.jpg
  03.jpg
```

然后在 `index.md` 中插入短代码：

```md
{{< gallery title="旅行相册" match="*.{jpg,jpeg,png,webp}" columns="3" captions="true" >}}
```

## 3. 参数说明

- `title`：图库标题（可选）
- `match`：匹配哪些图片（可选，默认匹配常见图片格式）
- `columns`：桌面列数（可选，默认 `3`）
- `gap`：卡片间距（可选，默认 `0.9rem`）
- `captions`：是否显示标题（`true/false`，默认 `false`）
- `images`：手动指定图片（逗号分隔），例如 `images="01.jpg,02.jpg"`

## 4. 示例

自动扫描当前文章目录下图片：

```md
{{< gallery title="实验截图" >}}
```

仅显示部分图片：

```md
{{< gallery images="image1.png,image2.png" captions="true" >}}
```

