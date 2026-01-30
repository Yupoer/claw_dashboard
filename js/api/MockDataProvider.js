/**
 * MockDataProvider - 模擬數據提供者
 * 
 * 為開發和測試提供模擬數據。
 * 當 OpenClaw 接入真實 API 時，此文件可以刪除。
 */

// 模擬數據存儲
const mockStore = {
    agent: {
        name: 'OpenClaw',
        avatar: null,
        status: 'working', // 'working' | 'idle'
        currentTask: {
            id: 'task-001',
            title: '分析用戶需求文檔',
            progress: 65,
            startedAt: new Date(Date.now() - 1800000).toISOString() // 30分鐘前
        }
    },

    tasks: [
        {
            id: 'task-001',
            title: '分析用戶需求文檔',
            description: '詳細閱讀並分析客戶提供的需求文檔，提取關鍵功能點和技術要求。',
            status: 'in-progress',
            priority: 'high',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            tags: ['分析', '文檔', '需求']
        },
        {
            id: 'task-002',
            title: '實現用戶認證模組',
            description: '設計並實現安全的用戶登入、註冊和權限管理功能。',
            status: 'pending',
            priority: 'high',
            dueDate: new Date(Date.now() + 172800000).toISOString(),
            tags: ['開發', '安全', 'Auth']
        },
        {
            id: 'task-003',
            title: '優化資料庫查詢效能',
            description: '分析慢查詢並優化索引，提升系統整體響應速度。',
            status: 'pending',
            priority: 'medium',
            dueDate: new Date(Date.now() + 259200000).toISOString(),
            tags: ['優化', '資料庫', '效能']
        },
        {
            id: 'task-004',
            title: '撰寫 API 文檔',
            description: '為所有公開 API 端點撰寫詳細的技術文檔。',
            status: 'pending',
            priority: 'low',
            tags: ['文檔', 'API']
        },
        {
            id: 'task-005',
            title: '完成前端儀表板設計',
            description: '使用現代化設計語言完成管理後台的 UI 設計。',
            status: 'completed',
            priority: 'high',
            completedAt: new Date(Date.now() - 3600000).toISOString(),
            tags: ['設計', 'UI', '前端']
        },
        {
            id: 'task-006',
            title: '修復登入頁面 Bug',
            description: '解決用戶反饋的登入頁面在 Safari 瀏覽器上的顯示問題。',
            status: 'completed',
            priority: 'high',
            completedAt: new Date(Date.now() - 7200000).toISOString(),
            tags: ['Bug', '前端', 'Safari']
        },
        {
            id: 'task-007',
            title: '配置 CI/CD 管道',
            description: '設置 GitHub Actions 自動化構建和部署流程。',
            status: 'completed',
            priority: 'medium',
            completedAt: new Date(Date.now() - 14400000).toISOString(),
            tags: ['DevOps', 'CI/CD']
        },
        {
            id: 'task-008',
            title: '代碼審查 - PR #42',
            description: '審查團隊成員提交的用戶模組重構 PR。',
            status: 'completed',
            priority: 'medium',
            completedAt: new Date(Date.now() - 21600000).toISOString(),
            tags: ['審查', 'PR']
        },
        {
            id: 'task-009',
            title: '更新依賴套件',
            description: '將專案依賴更新到最新版本，確保安全性。',
            status: 'completed',
            priority: 'low',
            completedAt: new Date(Date.now() - 43200000).toISOString(),
            tags: ['維護', '安全']
        }
    ],

    apiBalances: [
        {
            provider: 'Anthropic',
            remaining: 45.50,
            total: 100,
            estimatedDaysLeft: 12,
            lastUpdated: new Date().toISOString()
        },
        {
            provider: 'OpenAI',
            remaining: 8.25,
            total: 50,
            estimatedDaysLeft: 3,
            lastUpdated: new Date().toISOString()
        }
    ],

    models: {
        current: {
            id: 'claude-3-5-sonnet',
            name: 'Claude 3.5 Sonnet',
            provider: 'Anthropic',
            status: 'active'
        },
        fallback: {
            id: 'gpt-4o',
            name: 'GPT-4o',
            provider: 'OpenAI',
            status: 'ready'
        }
    },

    learningItems: [
        {
            id: 'learn-001',
            title: '優化程式碼重構工作流',
            description: '研究更高效的程式碼重構策略，減少人工干預需求。',
            priority: 1,
            category: '工作流優化',
            addedAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'researching'
        },
        {
            id: 'learn-002',
            title: '學習 Rust 語言基礎',
            description: '掌握 Rust 語言的所有權系統和並發編程模型。',
            priority: 2,
            category: '技術學習',
            addedAt: new Date(Date.now() - 172800000).toISOString(),
            status: 'planned'
        },
        {
            id: 'learn-003',
            title: '研究向量資料庫應用',
            description: '探索 Pinecone、Weaviate 等向量資料庫在 RAG 中的應用。',
            priority: 2,
            category: 'AI/ML',
            addedAt: new Date(Date.now() - 259200000).toISOString(),
            status: 'researching'
        },
        {
            id: 'learn-004',
            title: '改善錯誤處理機制',
            description: '設計更完善的錯誤捕獲和恢復策略。',
            priority: 3,
            category: '工作流優化',
            addedAt: new Date(Date.now() - 345600000).toISOString(),
            status: 'planned'
        },
        {
            id: 'learn-005',
            title: 'Kubernetes 進階操作',
            description: '學習 K8s 的 Operator 模式和自定義資源管理。',
            priority: 4,
            category: 'DevOps',
            addedAt: new Date(Date.now() - 432000000).toISOString(),
            status: 'planned'
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
