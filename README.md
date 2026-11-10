# 诗词寻踪 · 古风九宫格诗词解谜

一个可直接在浏览器中运行的古风网页小游戏：在 3×3 汉字九宫格中，按正确顺序找出真正的诗句。全部诗句出自**人教版统编高中语文教材**篇目，逐字核对原文。

## 运行方法

环境要求：Node.js ≥ 18（无其他外部服务依赖）。

```bash
# 1. 安装依赖（国内网络可加 --registry=https://registry.npmmirror.com）
npm install

# 2. 启动开发服务器，浏览器打开 http://localhost:5173
npm run dev

# 3. 生产构建（输出到 dist/，为纯静态文件，任意静态服务器可部署）
npm run build

# 4. 本地预览构建产物
npm run preview

# 5. 运行题库与核心逻辑自检（20 题全部可通关校验）
npm run selftest
```

## 玩法

- **初级 · 诗句寻字**：直接给出诗名与线索，按顺序点选汉字拼出诗句。
- **中级 · 诗题寻踪**：先从 4 个诗题中判断诗句出处（选错会给解释），再选字成句。
- **高级 · 诗词探秘**：诗名隐去，只留线索（作者、意象、上下句等），答对后展示赏析。

操作：点选字块入答案区，再次点击已选字或「撤销」可取消，「重选」清空，「提交答案」校验字序。「提示」每关 2 次，点亮下一个正确字（少量扣分）。

成长系统：五段章节旅程共 20 关、积分与连胜加成、1–3 星评价、11 个成就、关卡顺序解锁，进度自动保存在浏览器 localStorage，刷新后可继续。

## 目录结构

```
shici-xunzong/
├── index.html
├── src/
│   ├── main.tsx            # 入口
│   ├── App.tsx             # 屏幕切换、进度与成就状态
│   ├── types.ts            # 类型定义（题库/进度/成就）
│   ├── data/
│   │   └── poems.ts        # 题库数据（与游戏逻辑分离，加题只改这里）
│   ├── game/
│   │   ├── logic.ts        # 关卡组织、校验、提示、计分、成就、存档
│   │   └── audio.ts        # WebAudio 程序化音效（无音频资源）
│   ├── components/         # 首页 / 游戏页 / 结算弹窗 / 引导 / 背景
│   └── index.css           # 古风主题样式（墨蓝/黛青/朱红/鎏金）
└── src/selftest.ts         # 自检脚本
```

## 如何添加新诗词

在 `src/data/poems.ts` 的 `QUESTIONS` 数组中追加一条记录即可，字段包括：诗题、作者、朝代、目标诗句（带标点）、`answer`（去标点字序，重复字如实保留）、`tiles`（9 个汉字，目标字必须全部出现）、题干、中级的 `options` 或高级的 `clues`、释义、赏析、教材来源。游戏启动时会自动校验配置，有误的题目会被跳过并在控制台警告，不会导致卡关。

添加题目时的两条硬性规则：

1. 目标诗句的每个字（含重复字）都必须出现在 `tiles` 中；
2. 干扰字不得与目标字拼出另一句同样成立的诗句。

## 质量保障

- `npm run selftest`：校验全部题目可通关（含重复字关卡「蜀道之难，难于上青天」「十年生死两茫茫」）、提示逻辑、计分公式与成就结算。
- `npm run build`：TypeScript 严格模式类型检查 + 生产构建。

## AI 诗人对谈（可选）

通关结算后，可点「与{作者}对谈」，让诗人以第一人称回答这首诗的含义、用字与心境。

```
浏览器（静态站） → Cloudflare Worker 代理 → DeepSeek API
```

密钥只存在 Worker 里，前端一律不接触。未配置代理时，对话自动降级为「离线诗笺」，直接用题库里的释义与赏析作答，不影响闯关。接口超时或报错时同样降级。

### 部署代理（Cloudflare 控制台，无需本地 Node）

1. 登录 Cloudflare → Workers & Pages → Create → Worker，命名如 `shici-poet-api`。
2. 进入在线编辑器，把 `worker/src/index.js` 全文粘贴进去，点 Deploy。
3. 在 Settings → Variables and Secrets 添加 Secret：`DEEPSEEK_API_KEY` = 你的 DeepSeek API Key。
4. 添加明文变量：`ALLOWED_ORIGINS` = `https://luoshuhen68.github.io,http://localhost:5173`，可选 `DAILY_LIMIT_PER_IP` = `40`。
5. 记下形如 `https://shici-poet-api.xxx.workers.dev` 的地址。

### 启用

把 [config.ts](src/ai/config.ts) 里的 `AI_ENDPOINT` 换成上一步的地址，重新构建并推送即可。地址里仍带 `<` 时视为未配置，自动走离线模式。

### 命令行部署（本机有 Node 时更省事）

```bash
cd worker
npx wrangler login
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler deploy
```

想要可靠的每日限额，再执行 `npx wrangler kv namespace create RATE`，把返回的 id 填进 `wrangler.toml`。

### 成本与限制

- 单次对谈（约 600 token 输入 / 100 token 输出）成本约 0.001–0.003 元。
- 默认每个 IP 每天 40 次；问题限 200 字，历史只带最近 6 条，单次回答上限 260 token。
- 提示词在 Worker 端拼装，前端无法伪造 system 指令；并拦截「忽略以上规则」这类越界指令。

### 对外运营的合规清单

- 域名解析到国内服务器需完成 ICP 备案。
- 使用已完成生成式 AI 服务备案的模型（DeepSeek、豆包、通义等均已备案）。
- 界面保留「本对话由 AI 生成」标识（已内置）。
- 正式公测建议接入内容安全审核 API，并按监管要求留存对话日志 6 个月。

