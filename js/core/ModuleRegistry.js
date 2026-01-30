/**
 * ModuleRegistry - 模塊註冊與管理系統
 * 
 * 提供模塊的動態載入、初始化和生命週期管理。
 * 支援依賴注入和熱更新。
 * 
 * @example
 * // 註冊模塊
 * ModuleRegistry.register('sidebar', SidebarModule, { position: 'left' });
 * 
 * // 初始化所有模塊
 * await ModuleRegistry.initAll();
 * 
 * // 獲取模塊實例
 * const sidebar = ModuleRegistry.get('sidebar');
 */

import EventBus, { Events } from './EventBus.js';

/**
 * @typedef {Object} ModuleConfig
 * @property {string} id - 模塊唯一識別符
 * @property {string} name - 模塊顯示名稱
 * @property {string} [container] - 渲染容器選擇器
 * @property {string[]} [dependencies] - 依賴的其他模塊ID
 * @property {boolean} [enabled=true] - 是否啟用
 * @property {number} [priority=0] - 初始化優先級（越高越先）
 * @property {Object} [options] - 模塊特定選項
 */

/**
 * @typedef {Object} ModuleDefinition
 * @property {Function} init - 初始化函數
 * @property {Function} render - 渲染函數
 * @property {Function} [destroy] - 清理函數
 * @property {Function} [update] - 更新函數
 */

class ModuleRegistryClass {
    constructor() {
        /** @type {Map<string, ModuleDefinition>} */
        this.modules = new Map();

        /** @type {Map<string, ModuleConfig>} */
        this.configs = new Map();

        /** @type {Map<string, any>} */
        this.instances = new Map();

        /** @type {Set<string>} */
        this.initialized = new Set();

        this.isInitializing = false;
    }

    /**
     * 註冊模塊
     * @param {string} id - 模塊ID
     * @param {ModuleDefinition} definition - 模塊定義
     * @param {Partial<ModuleConfig>} [config={}] - 模塊配置
     */
    register(id, definition, config = {}) {
        if (this.modules.has(id)) {
            console.warn(`ModuleRegistry: Module "${id}" is already registered. Overwriting.`);
        }

        this.modules.set(id, definition);
        this.configs.set(id, {
            id,
            name: config.name || id,
            container: config.container || null,
            dependencies: config.dependencies || [],
            enabled: config.enabled !== false,
            priority: config.priority || 0,
            options: config.options || {}
        });

        console.log(`ModuleRegistry: Registered module "${id}"`);
    }

    /**
     * 取消註冊模塊
     * @param {string} id - 模塊ID
     */
    unregister(id) {
        if (this.initialized.has(id)) {
            this.destroy(id);
        }
        this.modules.delete(id);
        this.configs.delete(id);
        this.instances.delete(id);
        console.log(`ModuleRegistry: Unregistered module "${id}"`);
    }

    /**
     * 初始化單個模塊
     * @param {string} id - 模塊ID
     * @returns {Promise<void>}
     */
    async init(id) {
        if (this.initialized.has(id)) {
            return;
        }

        const definition = this.modules.get(id);
        const config = this.configs.get(id);

        if (!definition) {
            throw new Error(`ModuleRegistry: Module "${id}" not found`);
        }

        if (!config.enabled) {
            console.log(`ModuleRegistry: Module "${id}" is disabled, skipping`);
            return;
        }

        // 先初始化依賴
        for (const depId of config.dependencies) {
            if (!this.initialized.has(depId)) {
                await this.init(depId);
            }
        }

        try {
            console.log(`ModuleRegistry: Initializing module "${id}"...`);

            // 創建模塊實例
            const instance = typeof definition === 'function'
                ? new definition(config)
                : { ...definition };

            this.instances.set(id, instance);

            // 調用 init
            if (instance.init) {
                await instance.init(config);
            }

            // 調用 render
            if (instance.render && config.container) {
                const container = document.querySelector(config.container);
                if (container) {
                    const html = await instance.render(config);
                    if (typeof html === 'string') {
                        container.innerHTML = html;
                    }
                }
            }

            this.initialized.add(id);
            EventBus.emit(Events.MODULE_LOADED, { id, config });
            console.log(`ModuleRegistry: Module "${id}" initialized`);
        } catch (error) {
            console.error(`ModuleRegistry: Failed to initialize module "${id}"`, error);
            EventBus.emit(Events.MODULE_ERROR, { id, error });
            throw error;
        }
    }

    /**
     * 初始化所有已註冊的模塊
     * @returns {Promise<void>}
     */
    async initAll() {
        if (this.isInitializing) {
            console.warn('ModuleRegistry: Already initializing');
            return;
        }

        this.isInitializing = true;

        // 按優先級排序
        const sortedIds = Array.from(this.configs.entries())
            .filter(([_, config]) => config.enabled)
            .sort((a, b) => b[1].priority - a[1].priority)
            .map(([id]) => id);

        for (const id of sortedIds) {
            try {
                await this.init(id);
            } catch (error) {
                console.error(`ModuleRegistry: Error initializing "${id}", continuing...`);
            }
        }

        this.isInitializing = false;
        console.log('ModuleRegistry: All modules initialized');
    }

    /**
     * 銷毀模塊
     * @param {string} id - 模塊ID
     */
    destroy(id) {
        const instance = this.instances.get(id);
        if (instance && instance.destroy) {
            instance.destroy();
        }
        this.initialized.delete(id);
        this.instances.delete(id);
        console.log(`ModuleRegistry: Module "${id}" destroyed`);
    }

    /**
     * 銷毀所有模塊
     */
    destroyAll() {
        for (const id of this.initialized) {
            this.destroy(id);
        }
    }

    /**
     * 獲取模塊實例
     * @param {string} id - 模塊ID
     * @returns {any}
     */
    get(id) {
        return this.instances.get(id);
    }

    /**
     * 獲取模塊配置
     * @param {string} id - 模塊ID
     * @returns {ModuleConfig|undefined}
     */
    getConfig(id) {
        return this.configs.get(id);
    }

    /**
     * 更新模塊配置
     * @param {string} id - 模塊ID
     * @param {Partial<ModuleConfig>} updates - 配置更新
     */
    updateConfig(id, updates) {
        const config = this.configs.get(id);
        if (config) {
            Object.assign(config, updates);

            // 如果模塊已初始化，調用 update
            const instance = this.instances.get(id);
            if (instance && instance.update) {
                instance.update(config);
            }
        }
    }

    /**
     * 啟用/禁用模塊
     * @param {string} id - 模塊ID
     * @param {boolean} enabled - 是否啟用
     */
    setEnabled(id, enabled) {
        this.updateConfig(id, { enabled });

        if (enabled && !this.initialized.has(id)) {
            this.init(id);
        } else if (!enabled && this.initialized.has(id)) {
            this.destroy(id);
        }
    }

    /**
     * 獲取所有已註冊模塊的列表
     * @returns {Array<{id: string, config: ModuleConfig, initialized: boolean}>}
     */
    list() {
        return Array.from(this.configs.entries()).map(([id, config]) => ({
            id,
            config,
            initialized: this.initialized.has(id)
        }));
    }

    /**
     * 重新載入模塊
     * @param {string} id - 模塊ID
     */
    async reload(id) {
        this.destroy(id);
        await this.init(id);
    }
}

// 單例導出
const ModuleRegistry = new ModuleRegistryClass();
export default ModuleRegistry;
