/**
 * EventBus - 事件發布/訂閱系統
 * 
 * 用於模塊間的鬆耦合通訊。模塊可以發布事件，
 * 其他模塊可以訂閱這些事件以響應變化。
 * 
 * @example
 * // 訂閱事件
 * EventBus.on('task:completed', (data) => console.log(data));
 * 
 * // 發布事件
 * EventBus.emit('task:completed', { taskId: '123' });
 * 
 * // 取消訂閱
 * EventBus.off('task:completed', handler);
 */

class EventBusClass {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
    }

    /**
     * 訂閱事件
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     * @returns {Function} 取消訂閱的函數
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);

        // 返回取消訂閱函數
        return () => this.off(event, callback);
    }

    /**
     * 一次性訂閱事件（觸發後自動取消）
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     */
    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        this.on(event, wrapper);
    }

    /**
     * 取消訂閱事件
     * @param {string} event - 事件名稱
     * @param {Function} callback - 回調函數
     */
    off(event, callback) {
        if (this.events.has(event)) {
            this.events.get(event).delete(callback);
        }
    }

    /**
     * 發布事件
     * @param {string} event - 事件名稱
     * @param {*} data - 事件數據
     */
    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus: Error in handler for "${event}"`, error);
                }
            });
        }

        // 同時觸發通配符事件
        if (this.events.has('*')) {
            this.events.get('*').forEach(callback => {
                try {
                    callback({ event, data });
                } catch (error) {
                    console.error(`EventBus: Error in wildcard handler`, error);
                }
            });
        }
    }

    /**
     * 清除所有事件訂閱
     * @param {string} [event] - 可選，指定清除的事件
     */
    clear(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }

    /**
     * 獲取事件的訂閱者數量
     * @param {string} event - 事件名稱
     * @returns {number}
     */
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).size : 0;
    }
}

// 單例導出
const EventBus = new EventBusClass();

// 預定義事件類型（供 TypeScript/JSDoc 使用）
/**
 * @typedef {Object} DashboardEvents
 * @property {'agent:status-changed'} AGENT_STATUS_CHANGED
 * @property {'task:created'} TASK_CREATED
 * @property {'task:updated'} TASK_UPDATED
 * @property {'task:completed'} TASK_COMPLETED
 * @property {'task:deleted'} TASK_DELETED
 * @property {'task:expanded'} TASK_EXPANDED
 * @property {'learning:priority-changed'} LEARNING_PRIORITY_CHANGED
 * @property {'api:balance-updated'} API_BALANCE_UPDATED
 * @property {'api:balance-warning'} API_BALANCE_WARNING
 * @property {'model:status-changed'} MODEL_STATUS_CHANGED
 * @property {'notification:show'} NOTIFICATION_SHOW
 * @property {'notification:dismiss'} NOTIFICATION_DISMISS
 * @property {'ui:sidebar-toggle'} UI_SIDEBAR_TOGGLE
 * @property {'ui:theme-changed'} UI_THEME_CHANGED
 * @property {'module:loaded'} MODULE_LOADED
 * @property {'module:error'} MODULE_ERROR
 */

export const Events = {
    // Agent 事件
    AGENT_STATUS_CHANGED: 'agent:status-changed',
    
    // 任務事件
    TASK_CREATED: 'task:created',
    TASK_UPDATED: 'task:updated',
    TASK_COMPLETED: 'task:completed',
    TASK_DELETED: 'task:deleted',
    TASK_EXPANDED: 'task:expanded',
    
    // 學習項目事件
    LEARNING_PRIORITY_CHANGED: 'learning:priority-changed',
    LEARNING_STATUS_CHANGED: 'learning:status-changed',
    
    // API 事件
    API_BALANCE_UPDATED: 'api:balance-updated',
    API_BALANCE_WARNING: 'api:balance-warning',
    
    // 模型事件
    MODEL_STATUS_CHANGED: 'model:status-changed',
    
    // 通知事件
    NOTIFICATION_SHOW: 'notification:show',
    NOTIFICATION_DISMISS: 'notification:dismiss',
    
    // UI 事件
    UI_SIDEBAR_TOGGLE: 'ui:sidebar-toggle',
    UI_THEME_CHANGED: 'ui:theme-changed',
    UI_INFO_PANEL_TOGGLE: 'ui:info-panel-toggle',
    
    // 模塊事件
    MODULE_LOADED: 'module:loaded',
    MODULE_ERROR: 'module:error',
    
    // 數據刷新
    DATA_REFRESH: 'data:refresh',
    DATA_SYNC: 'data:sync'
};

export default EventBus;
