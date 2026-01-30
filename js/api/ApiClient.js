/**
 * ApiClient - 統一 API 接口層
 * 
 * 這是 OpenClaw 需要實現的接口。目前使用 MockDataProvider 提供測試數據。
 * 當 OpenClaw 準備接入時，只需替換這個文件的實現即可。
 * 
 * @example
 * // 獲取 Agent 狀態
 * const status = await ApiClient.getAgentStatus();
 * 
 * // 獲取任務列表
 * const tasks = await ApiClient.getTasks({ status: 'pending' });
 */

import MockDataProvider from './MockDataProvider.js';
import EventBus, { Events } from '../core/EventBus.js';
import StateManager from '../core/StateManager.js';

/**
 * API 配置
 * OpenClaw 可以修改此配置以連接真實後端
 */
const API_CONFIG = {
    // 設為 true 使用真實 API，false 使用 Mock 數據
    useMockData: true,

    // 真實 API 基礎 URL（當 useMockData 為 false 時使用）
    baseUrl: '',

    // 請求超時時間（毫秒）
    timeout: 10000,

    // 自動刷新間隔（毫秒）
    refreshInterval: 30000
};

class ApiClientClass {
    constructor() {
        this.config = API_CONFIG;
        this.refreshTimers = new Map();
    }

    /**
     * 初始化 API 客戶端
     * @param {Object} [config] - 可選配置覆蓋
     */
    init(config = {}) {
        Object.assign(this.config, config);
        console.log('ApiClient: Initialized with config', this.config);

        if (this.config.refreshInterval > 0) {
            this.startAutoRefresh();
        }
    }

    /**
     * 啟動自動刷新
     */
    startAutoRefresh() {
        this.stopAutoRefresh();

        const timer = setInterval(() => {
            this.refreshAll();
        }, this.config.refreshInterval);

        this.refreshTimers.set('main', timer);
        console.log(`ApiClient: Auto-refresh started (${this.config.refreshInterval}ms)`);
    }

    /**
     * 停止自動刷新
     */
    stopAutoRefresh() {
        for (const timer of this.refreshTimers.values()) {
            clearInterval(timer);
        }
        this.refreshTimers.clear();
    }

    /**
     * 刷新所有數據
     */
    async refreshAll() {
        try {
            const [status, tasks, balance, models, learning] = await Promise.all([
                this.getAgentStatus(),
                this.getTasks(),
                this.getAPIBalance(),
                this.getModelInfo(),
                this.getLearningItems()
            ]);

            StateManager.batchUpdate({
                'agent': status,
                'tasks.completed': tasks.filter(t => t.status === 'completed'),
                'tasks.pending': tasks.filter(t => t.status === 'pending'),
                'tasks.inProgress': tasks.filter(t => t.status === 'in-progress'),
                'api.balances': balance,
                'api.lastUpdated': new Date().toISOString(),
                'models': models,
                'learning.items': learning
            });

            EventBus.emit(Events.DATA_REFRESH, { timestamp: Date.now() });
        } catch (error) {
            console.error('ApiClient: Refresh failed', error);
        }
    }

    // ==================== Agent API ====================

    /**
     * 獲取 Agent 狀態
     * @returns {Promise<Object>}
     * 
     * @typedef {Object} AgentStatus
     * @property {string} name - Agent 名稱
     * @property {string|null} avatar - 頭像 URL
     * @property {'working'|'idle'} status - 工作狀態
     * @property {Object|null} currentTask - 當前任務
     */
    async getAgentStatus() {
        if (this.config.useMockData) {
            return MockDataProvider.getAgentStatus();
        }
        return this._request('GET', '/agent/status');
    }

    /**
     * 更新 Agent 狀態
     * @param {Partial<AgentStatus>} data - 更新數據
     * @returns {Promise<Object>}
     */
    async updateAgentStatus(data) {
        if (this.config.useMockData) {
            return MockDataProvider.updateAgentStatus(data);
        }
        return this._request('PATCH', '/agent/status', data);
    }

    // ==================== Tasks API ====================

    /**
     * 獲取任務列表
     * @param {Object} [filter] - 過濾條件
     * @param {string} [filter.status] - 狀態過濾
     * @param {string} [filter.priority] - 優先級過濾
     * @returns {Promise<Array>}
     * 
     * @typedef {Object} Task
     * @property {string} id - 任務 ID
     * @property {string} title - 任務標題
     * @property {string} description - 任務描述
     * @property {'completed'|'pending'|'in-progress'} status - 狀態
     * @property {'high'|'medium'|'low'} priority - 優先級
     * @property {string} [completedAt] - 完成時間
     * @property {string} [dueDate] - 截止日期
     * @property {string[]} tags - 標籤
     */
    async getTasks(filter = {}) {
        if (this.config.useMockData) {
            return MockDataProvider.getTasks(filter);
        }
        return this._request('GET', '/tasks', null, filter);
    }

    /**
     * 獲取單個任務詳情
     * @param {string} taskId - 任務 ID
     * @returns {Promise<Object>}
     */
    async getTask(taskId) {
        if (this.config.useMockData) {
            return MockDataProvider.getTask(taskId);
        }
        return this._request('GET', `/tasks/${taskId}`);
    }

    /**
     * 創建任務
     * @param {Object} data - 任務數據
     * @returns {Promise<Object>}
     */
    async createTask(data) {
        if (this.config.useMockData) {
            return MockDataProvider.createTask(data);
        }
        return this._request('POST', '/tasks', data);
    }

    /**
     * 更新任務
     * @param {string} taskId - 任務 ID
     * @param {Object} data - 更新數據
     * @returns {Promise<Object>}
     */
    async updateTask(taskId, data) {
        if (this.config.useMockData) {
            return MockDataProvider.updateTask(taskId, data);
        }
        return this._request('PATCH', `/tasks/${taskId}`, data);
    }

    /**
     * 刪除任務
     * @param {string} taskId - 任務 ID
     * @returns {Promise<void>}
     */
    async deleteTask(taskId) {
        if (this.config.useMockData) {
            return MockDataProvider.deleteTask(taskId);
        }
        return this._request('DELETE', `/tasks/${taskId}`);
    }

    /**
     * 標記任務完成
     * @param {string} taskId - 任務 ID
     * @returns {Promise<Object>}
     */
    async completeTask(taskId) {
        return this.updateTask(taskId, {
            status: 'completed',
            completedAt: new Date().toISOString()
        });
    }

    // ==================== API Balance ====================

    /**
     * 獲取 API 餘額
     * @returns {Promise<Array>}
     * 
     * @typedef {Object} APIBalance
     * @property {string} provider - 提供商名稱
     * @property {number} remaining - 剩餘額度（美元）
     * @property {number} total - 總額度
     * @property {number} estimatedDaysLeft - 預估可用天數
     * @property {string} lastUpdated - 最後更新時間
     */
    async getAPIBalance() {
        if (this.config.useMockData) {
            return MockDataProvider.getAPIBalance();
        }
        return this._request('GET', '/api/balance');
    }

    /**
     * 更新 API 餘額
     * @param {string} provider - 提供商
     * @param {Object} data - 餘額數據
     * @returns {Promise<Object>}
     */
    async updateAPIBalance(provider, data) {
        if (this.config.useMockData) {
            return MockDataProvider.updateAPIBalance(provider, data);
        }
        return this._request('PATCH', `/api/balance/${provider}`, data);
    }

    // ==================== Models API ====================

    /**
     * 獲取模型資訊
     * @returns {Promise<Object>}
     * 
     * @typedef {Object} ModelInfo
     * @property {Object} current - 當前使用模型
     * @property {Object} fallback - 備用模型
     */
    async getModelInfo() {
        if (this.config.useMockData) {
            return MockDataProvider.getModelInfo();
        }
        return this._request('GET', '/models');
    }

    /**
     * 切換模型
     * @param {string} modelId - 模型 ID
     * @returns {Promise<Object>}
     */
    async switchModel(modelId) {
        if (this.config.useMockData) {
            return MockDataProvider.switchModel(modelId);
        }
        return this._request('POST', `/models/${modelId}/activate`);
    }

    // ==================== Learning API ====================

    /**
     * 獲取學習項目列表
     * @returns {Promise<Array>}
     * 
     * @typedef {Object} LearningItem
     * @property {string} id - 項目 ID
     * @property {string} title - 標題
     * @property {string} description - 描述
     * @property {1|2|3|4|5} priority - 優先級（1=最高）
     * @property {string} category - 分類
     * @property {string} addedAt - 添加時間
     * @property {'researching'|'planned'|'completed'} status - 狀態
     */
    async getLearningItems() {
        if (this.config.useMockData) {
            return MockDataProvider.getLearningItems();
        }
        return this._request('GET', '/learning');
    }

    /**
     * 創建學習項目
     * @param {Object} data - 項目數據
     * @returns {Promise<Object>}
     */
    async createLearningItem(data) {
        if (this.config.useMockData) {
            return MockDataProvider.createLearningItem(data);
        }
        return this._request('POST', '/learning', data);
    }

    /**
     * 更新學習項目優先級
     * @param {string} itemId - 項目 ID
     * @param {number} priority - 新優先級
     * @returns {Promise<Object>}
     */
    async updateLearningPriority(itemId, priority) {
        if (this.config.useMockData) {
            return MockDataProvider.updateLearningPriority(itemId, priority);
        }
        return this._request('PATCH', `/learning/${itemId}`, { priority });
    }

    /**
     * 刪除學習項目
     * @param {string} itemId - 項目 ID
     * @returns {Promise<void>}
     */
    async deleteLearningItem(itemId) {
        if (this.config.useMockData) {
            return MockDataProvider.deleteLearningItem(itemId);
        }
        return this._request('DELETE', `/learning/${itemId}`);
    }

    // ==================== 內部方法 ====================

    /**
     * 發送 HTTP 請求
     * @param {string} method - HTTP 方法
     * @param {string} endpoint - API 端點
     * @param {Object} [body] - 請求體
     * @param {Object} [params] - 查詢參數
     * @returns {Promise<any>}
     */
    async _request(method, endpoint, body = null, params = null) {
        const url = new URL(endpoint, this.config.baseUrl);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, value);
                }
            });
        }

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        options.signal = controller.signal;

        try {
            const response = await fetch(url.toString(), options);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
}

// 單例導出
const ApiClient = new ApiClientClass();
export default ApiClient;
