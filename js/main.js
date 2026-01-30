/**
 * OpenClaw Dashboard - 主程式入口
 * 
 * 初始化所有模塊並啟動應用
 */

import EventBus, { Events } from './core/EventBus.js';
import ModuleRegistry from './core/ModuleRegistry.js';
import StateManager from './core/StateManager.js';
import ApiClient from './api/ApiClient.js';

// 導入模塊
import SidebarModule from './modules/SidebarModule.js';
import TasksModule from './modules/TasksModule.js';
import LearningModule from './modules/LearningModule.js';
import InfoPanelModule from './modules/InfoPanelModule.js';
import NotificationModule from './modules/NotificationModule.js';

/**
 * Dashboard 應用程式類
 */
class DashboardApp {
    constructor() {
        this.initialized = false;
    }

    /**
     * 初始化應用
     */
    async init() {
        console.log('🚀 OpenClaw Dashboard initializing...');

        try {
            // 1. 初始化 API 客戶端
            ApiClient.init({
                useMockData: true,
                refreshInterval: 30000
            });

            // 2. 註冊模塊
            this.registerModules();

            // 3. 渲染主佈局
            this.renderLayout();

            // 4. 初始化所有模塊
            await ModuleRegistry.initAll();

            // 5. 調用 afterRender
            this.callAfterRender();

            // 6. 載入初始數據
            await ApiClient.refreshAll();

            // 7. 隱藏載入畫面
            this.hideLoadingScreen();

            // 8. 綁定全局事件
            this.bindGlobalEvents();

            this.initialized = true;
            console.log('✅ OpenClaw Dashboard initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize dashboard:', error);
            this.showError(error);
        }
    }

    /**
     * 註冊所有模塊
     */
    registerModules() {
        // 通知模塊（最高優先級）
        ModuleRegistry.register('notifications', NotificationModule, {
            name: '通知系統',
            priority: 100
        });

        // 左側邊欄
        ModuleRegistry.register('sidebar', SidebarModule, {
            name: '側邊欄',
            container: '#sidebar-container',
            priority: 50
        });

        // 任務模塊
        ModuleRegistry.register('tasks', TasksModule, {
            name: '任務列表',
            container: '#tasks-container',
            priority: 40
        });

        // 學習模塊
        ModuleRegistry.register('learning', LearningModule, {
            name: '自主學習',
            container: '#learning-container',
            priority: 30
        });

        // 資訊面板
        ModuleRegistry.register('infoPanel', InfoPanelModule, {
            name: '資訊面板',
            container: '#info-panel-container',
            priority: 20
        });
    }

    /**
     * 渲染主佈局
     */
    renderLayout() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="layout">
                <!-- 左側邊欄容器 -->
                <div id="sidebar-container"></div>
                
                <!-- 中央主區塊 -->
                <main class="main-content">
                    <div class="main-content__header">
                        <div class="mobile-header">
                            <button class="btn btn--icon btn--ghost mobile-menu-toggle" id="mobile-menu-btn">
                                <i data-lucide="menu"></i>
                            </button>
                            <h1 class="mobile-title">OpenClaw Dashboard</h1>
                            <button class="btn btn--icon btn--ghost mobile-info-toggle" id="mobile-info-btn">
                                <i data-lucide="panel-right"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="main-content__grid">
                        <!-- 任務模塊容器 -->
                        <div id="tasks-container"></div>
                        
                        <!-- 學習模塊容器 -->
                        <div id="learning-container"></div>
                    </div>
                </main>
                
                <!-- 右側資訊欄容器 -->
                <div id="info-panel-container"></div>
            </div>
            
            <!-- 手機選單按鈕 -->
            <button class="mobile-menu-btn" id="mobile-fab">
                <i data-lucide="layout-dashboard"></i>
            </button>
            
            <!-- 遮罩層 -->
            <div class="overlay" id="overlay"></div>
        `;
    }

    /**
     * 調用所有模塊的 afterRender
     */
    callAfterRender() {
        const modules = ModuleRegistry.list();
        modules.forEach(({ id }) => {
            const instance = ModuleRegistry.get(id);
            if (instance && typeof instance.afterRender === 'function') {
                instance.afterRender();
            }
        });

        // 初始化 Lucide 圖標
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * 隱藏載入畫面
     */
    hideLoadingScreen() {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => loadingScreen.remove(), 350);
        }
    }

    /**
     * 綁定全局事件
     */
    bindGlobalEvents() {
        // 手機選單切換
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileFab = document.getElementById('mobile-fab');
        const mobileInfoBtn = document.getElementById('mobile-info-btn');
        const overlay = document.getElementById('overlay');
        const sidebar = document.getElementById('sidebar');
        const infoPanel = document.getElementById('info-panel');

        const toggleSidebar = () => {
            sidebar?.classList.toggle('sidebar--open');
            overlay?.classList.toggle('overlay--visible', sidebar?.classList.contains('sidebar--open'));
        };

        const toggleInfoPanel = () => {
            infoPanel?.classList.toggle('info-panel--visible');
            overlay?.classList.toggle('overlay--visible', infoPanel?.classList.contains('info-panel--visible'));
        };

        const closeAll = () => {
            sidebar?.classList.remove('sidebar--open');
            infoPanel?.classList.remove('info-panel--visible');
            overlay?.classList.remove('overlay--visible');
        };

        mobileMenuBtn?.addEventListener('click', toggleSidebar);
        mobileFab?.addEventListener('click', toggleSidebar);
        mobileInfoBtn?.addEventListener('click', toggleInfoPanel);
        overlay?.addEventListener('click', closeAll);

        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            // ESC 關閉所有面板
            if (e.key === 'Escape') {
                closeAll();
            }
            // Ctrl/Cmd + R 刷新數據
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                ApiClient.refreshAll();
                EventBus.emit(Events.NOTIFICATION_SHOW, {
                    type: 'info',
                    message: '數據刷新中...',
                    duration: 2000
                });
            }
        });

        // 監聽模態框事件
        EventBus.on('ui:show-modal', (options) => this.showModal(options));

        // 監聯可見性變化（標籤頁切換時暫停/恢復刷新）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                ApiClient.stopAutoRefresh();
            } else {
                ApiClient.startAutoRefresh();
                ApiClient.refreshAll();
            }
        });
    }

    /**
     * 顯示模態框
     */
    showModal(options) {
        const modalRoot = document.getElementById('modal-root');
        const modalId = `modal-${Date.now()}`;

        const html = `
            <div class="modal-overlay" id="${modalId}">
                <div class="modal animate-scaleIn" role="dialog" aria-modal="true">
                    <div class="modal__header">
                        <h3 class="modal__title">${options.title}</h3>
                        <button class="btn btn--icon btn--ghost modal-close">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal__body">
                        ${options.content}
                    </div>
                    <div class="modal__footer">
                        ${(options.actions || []).map(action => `
                            <button class="btn btn--${action.type || 'secondary'}" data-action="${action.action}">
                                ${action.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        modalRoot.innerHTML = html;

        const modalOverlay = document.getElementById(modalId);
        const modal = modalOverlay.querySelector('.modal');

        // 初始化圖標
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // 關閉模態框
        const closeModal = () => {
            modalOverlay.remove();
        };

        // 點擊遮罩關閉
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });

        // 關閉按鈕
        modal.querySelector('.modal-close')?.addEventListener('click', closeModal);

        // 動作按鈕
        modal.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                if (action === 'close') {
                    closeModal();
                } else if (action === 'submit' && options.onSubmit) {
                    const result = await options.onSubmit();
                    if (result) {
                        closeModal();
                    }
                }
            });
        });

        // ESC 關閉
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    /**
     * 顯示錯誤
     */
    showError(error) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="error-screen">
                <i data-lucide="alert-triangle" class="error-screen__icon"></i>
                <h2>載入失敗</h2>
                <p>${error.message}</p>
                <button class="btn btn--primary" onclick="location.reload()">
                    重新載入
                </button>
            </div>
        `;

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

// 啟動應用
const app = new DashboardApp();

// 等待 DOM 載入完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// 導出供調試使用
window.DashboardApp = app;
window.ModuleRegistry = ModuleRegistry;
window.StateManager = StateManager;
window.EventBus = EventBus;
window.ApiClient = ApiClient;
