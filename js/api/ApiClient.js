/**
 * ApiClient - Firebase Realtime Database 接口層
 * 
 * 使用 Firebase Realtime Database 進行實時數據同步。
 * 實現 Dead Man's Switch (心跳檢測) 機制。
 */

import EventBus, { Events } from '../core/EventBus.js';
import StateManager from '../core/StateManager.js';

/**
 * API 配置
 */
const API_CONFIG = {
    // 心跳超時時間（毫秒）- 60秒無心跳視為離線
    heartbeatTimeout: 60000,

    // 日誌數量限制
    logsLimit: 200,

    // 心跳檢查間隔（毫秒）
    heartbeatCheckInterval: 5000
};

class ApiClientClass {
    constructor() {
        this.config = API_CONFIG;
        this.unsubscribers = [];
        this.heartbeatChecker = null;
        this.isInitialized = false;
    }

    /**
     * 初始化 API 客戶端
     * @param {Object} [config] - 可選配置覆蓋
     */
    init(config = {}) {
        Object.assign(this.config, config);
        console.log('ApiClient: Initializing with Firebase...');

        // 等待 Firebase 初始化完成
        this.waitForFirebase().then(() => {
            this.startListeners();
            this.startHeartbeatChecker();
            this.isInitialized = true;
            console.log('ApiClient: Firebase listeners attached');
        }).catch(error => {
            console.error('ApiClient: Firebase initialization failed', error);
        });
    }

    /**
     * 等待 Firebase 準備好
     */
    waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5秒超時

            const check = () => {
                if (window.FirebaseDB) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Firebase initialization timeout'));
                } else {
                    attempts++;
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    /**
     * 啟動所有 Firebase 監聽器
     */
    startListeners() {
        this.listenToAgentStatus();
        this.listenToLogs();
    }

    /**
     * 監聽 Agent 狀態 (/status 節點)
     */
    listenToAgentStatus() {
        const { database, ref, onValue } = window.FirebaseDB;
        const statusRef = ref(database, 'status');

        const unsubscribe = onValue(statusRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                console.log('ApiClient: Status update received', data);

                // 計算實際狀態（考慮心跳）
                const displayState = this.calculateDisplayState(data);

                // 更新 StateManager
                StateManager.batchUpdate({
                    'agent.status': displayState.state,
                    'agent.currentTask': data.currentTask ? {
                        id: 'firebase-task',
                        title: data.currentTask,
                        progress: 50,
                        startedAt: new Date().toISOString()
                    } : null,
                    'agent.lastHeartbeat': data.lastHeartbeat,
                    'agent.model': data.model || 'Unknown',
                    'agent.tokenUsage': data.tokenUsage || 0,
                    'agent.quotaRemaining': data.quotaRemaining || 1,
                    'agent.displayState': displayState.displayText,
                    'agent.isOnline': displayState.isOnline,
                    'api.lastUpdated': new Date().toISOString()
                });

                EventBus.emit(Events.AGENT_STATUS_CHANGED, displayState);
            }
        }, (error) => {
            console.error('ApiClient: Error listening to status', error);
        });

        this.unsubscribers.push(() => unsubscribe());
    }

    /**
     * 監聽日誌 (/logs 節點，限制最後 200 條)
     */
    listenToLogs() {
        const { database, ref, onValue, query, limitToLast } = window.FirebaseDB;
        const logsRef = query(ref(database, 'logs'), limitToLast(this.config.logsLimit));

        const unsubscribe = onValue(logsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // 將對象轉換為數組並按時間排序
                const logs = Object.entries(data).map(([id, log]) => ({
                    id,
                    ...log
                })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                console.log(`ApiClient: Received ${logs.length} logs`);

                StateManager.set('logs', logs);
                EventBus.emit(Events.DATA_REFRESH, { type: 'logs', count: logs.length });
            }
        }, (error) => {
            console.error('ApiClient: Error listening to logs', error);
        });

        this.unsubscribers.push(() => unsubscribe());
    }

    /**
     * 計算顯示狀態（包含心跳檢測）
     * @param {Object} data - Firebase 狀態數據
     * @returns {Object} 顯示狀態
     */
    calculateDisplayState(data) {
        const lastHeartbeat = data.lastHeartbeat || 0;
        const timeSinceHeartbeat = Date.now() - lastHeartbeat;
        const isOnline = timeSinceHeartbeat <= this.config.heartbeatTimeout;

        if (!isOnline) {
            return {
                state: 'offline',
                displayText: '🔴 OFFLINE',
                isOnline: false,
                timeSinceHeartbeat
            };
        }

        const state = data.state || 'idle';
        let displayText = '';

        switch (state) {
            case 'working':
                displayText = '🟢 WORKING';
                break;
            case 'idle':
                displayText = '🟡 IDLE';
                break;
            case 'error':
                displayText = '🔴 ERROR';
                break;
            default:
                displayText = `⚪ ${state.toUpperCase()}`;
        }

        return {
            state,
            displayText,
            isOnline: true,
            timeSinceHeartbeat
        };
    }

    /**
     * 啟動心跳檢查器（Dead Man's Switch）
     */
    startHeartbeatChecker() {
        this.stopHeartbeatChecker();

        this.heartbeatChecker = setInterval(() => {
            const lastHeartbeat = StateManager.get('agent.lastHeartbeat', 0);
            const timeSinceHeartbeat = Date.now() - lastHeartbeat;

            if (timeSinceHeartbeat > this.config.heartbeatTimeout) {
                const currentState = StateManager.get('agent.displayState');
                if (currentState !== '🔴 OFFLINE') {
                    console.warn('ApiClient: Heartbeat timeout - Agent is OFFLINE');
                    StateManager.batchUpdate({
                        'agent.status': 'offline',
                        'agent.displayState': '🔴 OFFLINE',
                        'agent.isOnline': false
                    });
                    EventBus.emit(Events.AGENT_STATUS_CHANGED, {
                        state: 'offline',
                        displayText: '🔴 OFFLINE',
                        isOnline: false
                    });
                }
            }
        }, this.config.heartbeatCheckInterval);

        console.log('ApiClient: Heartbeat checker started');
    }

    /**
     * 停止心跳檢查器
     */
    stopHeartbeatChecker() {
        if (this.heartbeatChecker) {
            clearInterval(this.heartbeatChecker);
            this.heartbeatChecker = null;
        }
    }

    /**
     * 啟動自動刷新（保持 API 兼容性）
     */
    startAutoRefresh() {
        // Firebase 使用實時監聽，不需要輪詢
        console.log('ApiClient: Auto-refresh not needed with Firebase realtime listeners');
    }

    /**
     * 停止自動刷新（保持 API 兼容性）
     */
    stopAutoRefresh() {
        // 可選：頁面隱藏時可考慮暫停監聽
        console.log('ApiClient: Realtime listeners remain active');
    }

    /**
     * 刷新所有數據（保持 API 兼容性）
     * Firebase 使用實時同步，此方法主要用於手動觸發 UI 更新
     */
    async refreshAll() {
        console.log('ApiClient: Manual refresh triggered');
        EventBus.emit(Events.DATA_REFRESH, { timestamp: Date.now() });
    }

    /**
     * 銷毀並清理所有監聽器
     */
    destroy() {
        this.stopHeartbeatChecker();
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        this.isInitialized = false;
        console.log('ApiClient: Destroyed');
    }

    // ==================== 保持 API 兼容性的佔位方法 ====================
    // 以下方法保留接口，但在 Firebase 模式下不再使用

    async getAgentStatus() {
        return {
            status: StateManager.get('agent.status', 'idle'),
            currentTask: StateManager.get('agent.currentTask'),
            lastHeartbeat: StateManager.get('agent.lastHeartbeat')
        };
    }

    async getTasks() {
        return [];
    }

    async getAPIBalance() {
        return [];
    }

    async getModelInfo() {
        return {
            current: {
                id: StateManager.get('agent.model', 'unknown'),
                name: StateManager.get('agent.model', 'Unknown Model'),
                provider: 'Google',
                status: StateManager.get('agent.isOnline') ? 'active' : 'offline'
            },
            fallback: null
        };
    }

    async getLearningItems() {
        return [];
    }
}

// 單例導出
const ApiClient = new ApiClientClass();
export default ApiClient;
