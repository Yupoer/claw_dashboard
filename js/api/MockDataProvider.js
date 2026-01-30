/**
 * MockDataProvider - 模擬數據提供者
 * 
 * 為開發和測試提供模擬數據。
 * 當 OpenClaw 接入真實 API 時，此文件可以刪除。
 */

// 模擬數據存儲
const mockStore = {
    agent: {
        name: 'ノーマ (Nōma)',
        avatar: null,
        status: 'working', // 'working' | 'idle'
        currentTask: {
            id: 'task-current',
            title: 'Dashboard 資料對接',
            progress: 50,
            startedAt: new Date().toISOString()
        }
    },

    tasks: [
        {
            id: 'task-001',
            title: '建立 Discord 新頻道',
            description: '建立狀態、自主學習、餘額監控等專用頻道',
            status: 'in-progress',
            priority: 'high',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            tags: ['Discord', 'Dev']
        },
        {
            id: 'task-002',
            title: 'Dashboard 網頁開發',
            description: '將 OpenClaw 狀態接入 Dashboard 介面',
            status: 'in-progress',
            priority: 'high',
            dueDate: new Date(Date.now() + 172800000).toISOString(),
            tags: ['Web', 'Dashboard']
        },
        {
            id: 'task-003',
            title: 'Gmail/Drive 整合',
            description: '設定 Google Workspace 整合',
            status: 'pending',
            priority: 'medium',
            dueDate: new Date(Date.now() + 259200000).toISOString(),
            tags: ['Integration', 'Google']
        },
        {
            id: 'task-004',
            title: '模型自動切換邏輯',
            description: '實作多模型自動切換與 fallback 機制',
            status: 'pending',
            priority: 'medium',
            tags: ['AI', 'Core']
        },
        {
            id: 'task-005',
            title: '安裝 ClawdHub CLI',
            description: '安裝並配置 ClawdHub 工具',
            status: 'completed',
            priority: 'high',
            completedAt: new Date(Date.now() - 3600000).toISOString(),
            tags: ['Tools', 'Setup']
        }
    ],

    apiBalances: [
        {
            provider: 'Google',
            remaining: 999.00, // Placeholder
            total: 1000,
            estimatedDaysLeft: 30,
            lastUpdated: new Date().toISOString()
        },
        {
            provider: 'Anthropic',
            remaining: 45.50,
            total: 100,
            estimatedDaysLeft: 12,
            lastUpdated: new Date().toISOString()
        }
    ],

    models: {
        current: {
            id: 'gemini-3-pro-high',
            name: 'Gemini 3 Pro High',
            provider: 'Google',
            status: 'active'
        },
        fallback: {
            id: 'claude-3-5-sonnet',
            name: 'Claude 3.5 Sonnet',
            provider: 'Anthropic',
            status: 'ready'
        }
    },

    learningItems: [
        {
            id: 'learn-001',
            title: '工作流優化',
            description: '分解任務，避免單次呼叫過多工具導致失敗',
            priority: 1,
            category: '自主學習',
            addedAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'researching'
        },
        {
            id: 'learn-002',
            title: 'ClawdHub CLI',
            description: '學習使用新的 CLI 工具進行技能管理',
            priority: 2,
            category: '工具',
            addedAt: new Date(Date.now() - 172800000).toISOString(),
            status: 'completed'
        }
    ]
};

// 模擬網路延遲
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, Math.random() * ms + 100));

// 生成唯一 ID
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * MockDataProvider 類
 */
class MockDataProviderClass {
    // ==================== Agent ====================

    async getAgentStatus() {
        await delay();
        return { ...mockStore.agent };
    }

    async updateAgentStatus(data) {
        await delay();
        Object.assign(mockStore.agent, data);
        return { ...mockStore.agent };
    }

    // ==================== Tasks ====================

    async getTasks(filter = {}) {
        await delay();
        let tasks = [...mockStore.tasks];

        if (filter.status) {
            tasks = tasks.filter(t => t.status === filter.status);
        }
        if (filter.priority) {
            tasks = tasks.filter(t => t.priority === filter.priority);
        }

        return tasks;
    }

    async getTask(taskId) {
        await delay();
        const task = mockStore.tasks.find(t => t.id === taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }
        return { ...task };
    }

    async createTask(data) {
        await delay();
        const newTask = {
            id: generateId('task'),
            status: 'pending',
            priority: 'medium',
            tags: [],
            createdAt: new Date().toISOString(),
            ...data
        };
        mockStore.tasks.unshift(newTask);
        return { ...newTask };
    }

    async updateTask(taskId, data) {
        await delay();
        const index = mockStore.tasks.findIndex(t => t.id === taskId);
        if (index === -1) {
            throw new Error(`Task not found: ${taskId}`);
        }
        mockStore.tasks[index] = { ...mockStore.tasks[index], ...data };
        return { ...mockStore.tasks[index] };
    }

    async deleteTask(taskId) {
        await delay();
        const index = mockStore.tasks.findIndex(t => t.id === taskId);
        if (index === -1) {
            throw new Error(`Task not found: ${taskId}`);
        }
        mockStore.tasks.splice(index, 1);
    }

    // ==================== API Balance ====================

    async getAPIBalance() {
        await delay();
        return mockStore.apiBalances.map(b => ({
            ...b,
            lastUpdated: new Date().toISOString()
        }));
    }

    async updateAPIBalance(provider, data) {
        await delay();
        const balance = mockStore.apiBalances.find(b => b.provider === provider);
        if (balance) {
            Object.assign(balance, data, { lastUpdated: new Date().toISOString() });
        }
        return { ...balance };
    }

    // ==================== Models ====================

    async getModelInfo() {
        await delay();
        return { ...mockStore.models };
    }

    async switchModel(modelId) {
        await delay();
        // 模擬切換邏輯
        const { current, fallback } = mockStore.models;
        if (fallback.id === modelId) {
            mockStore.models.current = { ...fallback, status: 'active' };
            mockStore.models.fallback = { ...current, status: 'ready' };
        }
        return { ...mockStore.models };
    }

    // ==================== Learning ====================

    async getLearningItems() {
        await delay();
        return mockStore.learningItems
            .sort((a, b) => a.priority - b.priority)
            .map(item => ({ ...item }));
    }

    async createLearningItem(data) {
        await delay();
        const newItem = {
            id: generateId('learn'),
            priority: 3,
            status: 'planned',
            category: '其他',
            addedAt: new Date().toISOString(),
            ...data
        };
        mockStore.learningItems.push(newItem);
        return { ...newItem };
    }

    async updateLearningPriority(itemId, priority) {
        await delay();
        const item = mockStore.learningItems.find(i => i.id === itemId);
        if (!item) {
            throw new Error(`Learning item not found: ${itemId}`);
        }
        item.priority = priority;
        return { ...item };
    }

    async deleteLearningItem(itemId) {
        await delay();
        const index = mockStore.learningItems.findIndex(i => i.id === itemId);
        if (index === -1) {
            throw new Error(`Learning item not found: ${itemId}`);
        }
        mockStore.learningItems.splice(index, 1);
    }

    // ==================== 模擬狀態切換 ====================

    /**
     * 模擬 Agent 狀態切換（用於演示）
     */
    simulateStatusChange() {
        setInterval(() => {
            mockStore.agent.status = mockStore.agent.status === 'working' ? 'idle' : 'working';
            if (mockStore.agent.status === 'working') {
                // 隨機選一個待辦任務
                const pending = mockStore.tasks.filter(t => t.status === 'pending');
                if (pending.length > 0) {
                    const task = pending[Math.floor(Math.random() * pending.length)];
                    mockStore.agent.currentTask = {
                        id: task.id,
                        title: task.title,
                        progress: Math.floor(Math.random() * 50),
                        startedAt: new Date().toISOString()
                    };
                }
            } else {
                mockStore.agent.currentTask = null;
            }
        }, 60000); // 每分鐘切換一次
    }
}

const MockDataProvider = new MockDataProviderClass();
export default MockDataProvider;
