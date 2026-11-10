/**
 * AI 对话服务配置
 * ------------------------------------------------------------------
 * 游戏本体是纯静态站点，不能直接持有大模型 API Key，
 * 所有请求都发往 Cloudflare Worker 代理（见项目根目录 worker/）。
 *
 * 部署 Worker 后，把下面的地址换成 wrangler 输出的实际地址，例如：
 *   https://shici-poet-api.your-subdomain.workers.dev
 * 地址中仍含尖括号时视为未配置，游戏会自动降级为离线诗笺模式。
 */
export const AI_ENDPOINT = 'https://shici-poet-api.luoshuhen68.workers.dev'

/** 是否已配置可用的代理地址 */
export function isAiConfigured(): boolean {
  return !AI_ENDPOINT.includes('<') && /^https?:\/\//.test(AI_ENDPOINT)
}
