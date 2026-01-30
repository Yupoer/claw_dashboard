/**
 * StateManager - 集中式狀態管理
 * 
 * 提供響應式狀態管理，當狀態變化時自動通知訂閱者。
 * 支援狀態持久化、時間旅行（撤銷/重做）。
 * 
 * @example
 * // 設置狀態
 * StateManager.set('agent.status', 'working');
 * 
 * // 獲取狀態
 * const status = StateManager.get('agent.status');
 * 
 * // 訂閱狀態變化
 * StateManager.subscribe('agent', (newState, oldState) => {
 *     console.log('Agent state changed', newState);
 * });
 */

import EventBus from './EventBus.js';

/**
 * @typedef {Object} State
 * @property {Object} agent - Agent 狀態
 * @property {Object} tasks - 任務狀態
 * @property {Object} learning - 學習項目狀態
 * @property {Object} api - API 狀態
 * @property {Object} ui - UI 狀態
 */

class StateManagerClass {
    constructor() {
        /** @type {Object} */
        this.state = this.getInitialState();

        /** @type {Map<string, Set<Function>>} */
        this.subscribers = new Map();

        /** @type {Array<Object>} */
        this.history = [];

        /** @type {number} */
        this.historyIndex = -1;

        /** @type {number} */
        this.maxHistoryLength = 50;

        /** @type {boolean} */
        this.persistEnabled = true;

        this.loadPersistedState();
    }

    /**
     * 獲取初始狀態
     * @returns {State}
     */
    getInitialState() {
        return {
            agent: {
                name: 'OpenClaw',
                avatar: null,
                status: 'idle', // 'working' | 'idle'
                currentTask: null
            },
            tasks: {
                completed: [],
                pending: [],
                inProgress: []
            },
            learning: {
                items: []
            },
            api: {
                balances: [],
                lastUpdated: null
            },
            models: {
                current: null,
                fallback: null
            },
            ui: {
                sidebarOpen: true,
                infoPanelOpen: true,
                expandedTaskId: null,
                theme: 'dark'
            },
            config: {
                refreshInterval: 30000,
                balanceWarningThreshold: 20,
                balanceCriticalThreshold: 10
            }
        };
    }

    /**
     * 從 localStorage 載入持久化狀態
     */
    loadPersistedState() {
        try {
            const saved = localStorage.getItem('openclaw_dashboard_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 只恢復部分狀態（如 UI 偏好）
                if (parsed.ui) {
                    this.state.ui = { ...this.state.ui, ...parsed.ui };
                }
                if (parsed.config) {
                    this.state.config = { ...this.state.config, ...parsed.config };
                }
            }
        } catch (error) {
            console.warn('StateManager: Failed to load persisted state', error);
        }
    }

    /**
     * 持久化狀態到 localStorage
     */
    persistState() {
        if (!this.persistEnabled) return;

        try {
            const toPersist = {
                ui: this.state.ui,
                config: this.state.config
            };
            localStorage.setItem('openclaw_dashboard_state', JSON.stringify(toPersist));
        } catch (error) {
            console.warn('StateManager: Failed to persist state', error);
        }
    }

    /**
     * 使用點符號獲取嵌套值
     * @param {string} path - 路徑，如 'agent.status'
     * @param {*} [defaultValue] - 默認值
     * @returns {*}
     */
    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let value = this.state;

        for (const key of keys) {
            if (value === null || value === undefined) {
                return defaultValue;
            }
            value = value[key];
        }

        return value !== undefined ? value : defaultValue;
    }

    /**
     * 使用點符號設置嵌套值
     * @param {string} path - 路徑，如 'agent.status'
     * @param {*} value - 新值
     * @param {boolean} [notify=true] - 是否通知訂閱者
     */
    set(path, value, notify = true) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;

        // 保存舊狀態用於歷史
        const oldState = this.deepClone(this.state);

        for (const key of keys) {
            if (!(key in target)) {
                target[key] = {};
            }
            target = target[key];
        }

        const oldValue = target[lastKey];
        target[lastKey] = value;

        // 記錄歷史
        this.recordHistory(oldState);

        // 持久化
        this.persistState();

        // 通知訂閱者
        if (notify) {
            this.notifySubscribers(path, value, oldValue);
        }
    }

    /**
     * 批量更新狀態
     * @param {Object} updates - 更新對象，鍵為路徑
     */
    batchUpdate(updates) {
        const oldState = this.deepClone(this.state);

        for (const [path, value] of Object.entries(updates)) {
            this.set(path, value, false);
        }

        this.recordHistory(oldState);
        this.persistState();

        // 一次性通知
        for (const [path, value] of Object.entries(updates)) {
            this.notifySubscribers(path, value, this.get(path));
        }
    }

    /**
     * 訂閱狀態變化
     * @param {string} path - 監聽的路徑
     * @param {Function} callback - 回調函數 (newValue, oldValue, path)
     * @returns {Function} 取消訂閱函數
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        this.subscribers.get(path).add(callback);

        return () => {
            this.subscribers.get(path).delete(callback);
        };
    }

    /**
     * 通知訂閱者
     * @param {string} changedPath - 變更的路徑
     * @param {*} newValue - 新值
     * @param {*} oldValue - 舊值
     */
    notifySubscribers(changedPath, newValue, oldValue) {
        // 通知精確匹配的訂閱者
        if (this.subscribers.has(changedPath)) {
            this.subscribers.get(changedPath).forEach(callback => {
                try {
                    callback(newValue, oldValue, changedPath);
                } catch (error) {
                    console.error('StateManager: Subscriber error', error);
                }
            });
        }

        // 通知父路徑訂閱者
        const parts = changedPath.split('.');
        for (let i = parts.length - 1; i >= 0; i--) {
            const parentPath = parts.slice(0, i).join('.');
            if (parentPath && this.subscribers.has(parentPath)) {
                const parentNewValue = this.get(parentPath);
                this.subscribers.get(parentPath).forEach(callback => {
                    try {
                        callback(parentNewValue, undefined, changedPath);
                    } catch (error) {
                        console.error('StateManager: Subscriber error', error);
                    }
                });
            }
        }

        // 通知全局訂閱者
        if (this.subscribers.has('*')) {
            this.subscribers.get('*').forEach(callback => {
                try {
                    callback(this.state, oldValue, changedPath);
                } catch (error) {
                    console.error('StateManager: Subscriber error', error);
                }
            });
        }

        // 發送事件
        EventBus.emit(`state:${changedPath}`, { newValue, oldValue, path: changedPath });
    }

    /**
     * 記錄歷史
     * @param {Object} oldState - 舊狀態
     */
    recordHistory(oldState) {
        // 移除之後的歷史（如果有撤銷過）
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(oldState);
        this.historyIndex++;

        // 限制歷史長度
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    /**
     * 撤銷
     * @returns {boolean} 是否成功
     */
    undo() {
        if (this.historyIndex < 0) {
            return false;
        }

        const previousState = this.history[this.historyIndex];
        this.historyIndex--;

        this.state = this.deepClone(previousState);
        this.notifySubscribers('*', this.state, null);

        return true;
    }

    /**
     * 重做
     * @returns {boolean} 是否成功
     */
    redo() {
        if (this.historyIndex >= this.history.length - 1) {
            return false;
        }

        this.historyIndex++;
        const nextState = this.history[this.historyIndex];

        this.state = this.deepClone(nextState);
        this.notifySubscribers('*', this.state, null);

        return true;
    }

    /**
     * 重置狀態
     */
    reset() {
        const oldState = this.state;
        this.state = this.getInitialState();
        this.history = [];
        this.historyIndex = -1;
        localStorage.removeItem('openclaw_dashboard_state');
        this.notifySubscribers('*', this.state, oldState);
    }

    /**
     * 獲取完整狀態（用於調試）
     * @returns {Object}
     */
    getState() {
        return this.deepClone(this.state);
    }

    /**
     * 深度克隆對象
     * @param {*} obj - 要克隆的對象
     * @returns {*}
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

// 單例導出
const StateManager = new StateManagerClass();
export default StateManager;
