/**
 * SidebarModule - 左側邊欄模塊
 * 
 * 顯示 Agent 頭像、名稱、狀態指示燈和當前任務摘要
 */

import EventBus, { Events } from '../core/EventBus.js';
import StateManager from '../core/StateManager.js';
import ApiClient from '../api/ApiClient.js';

class SidebarModule {
    constructor(config) {
        this.config = config;
        this.container = null;
        this.unsubscribers = [];
    }

    async init() {
        // 訂閱狀態變化
        this.unsubscribers.push(
            StateManager.subscribe('agent', () => this.update())
        );

        // 監聽 UI 事件
        this.unsubscribers.push(
            EventBus.on(Events.UI_SIDEBAR_TOGGLE, () => this.toggle())
        );
    }

    render() {
        const agent = StateManager.get('agent', {});
        const isWorking = agent.status === 'working';
        const currentTask = agent.currentTask;

        return `
            <aside class="sidebar" id="sidebar">
                <div class="sidebar__header">
                    <div class="agent-profile">
                        <div class="agent-avatar ${isWorking ? 'agent-avatar--working' : ''}">
                            ${agent.avatar
                ? `<img src="${agent.avatar}" alt="${agent.name}" />`
                : `<div class="agent-avatar__placeholder">
                                    <i data-lucide="bot" class="agent-avatar__icon"></i>
                                   </div>`
            }
                            <span class="status-indicator ${isWorking ? 'status-indicator--active' : 'status-indicator--idle'}"></span>
                        </div>
                        <div class="agent-info">
                            <h2 class="agent-name">${agent.name || 'OpenClaw'}</h2>
                            <span class="agent-status ${isWorking ? 'text-success' : 'text-muted'}">
                                <span class="status-dot ${isWorking ? 'status-dot--active' : 'status-dot--idle'}"></span>
                                ${isWorking ? '工作中' : '閒置'}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="sidebar__content">
                    ${currentTask ? this.renderCurrentTask(currentTask) : this.renderIdleState()}
                    
                    <nav class="sidebar-nav">
                        <div class="sidebar-nav__section">
                            <h3 class="sidebar-nav__title">快速導航</h3>
                            <ul class="sidebar-nav__list">
                                <li class="sidebar-nav__item sidebar-nav__item--active" data-section="completed">
                                    <i data-lucide="check-circle"></i>
                                    <span>近期完成</span>
                                </li>
                                <li class="sidebar-nav__item" data-section="pending">
                                    <i data-lucide="list-todo"></i>
                                    <span>待辦事項</span>
                                </li>
                                <li class="sidebar-nav__item" data-section="learning">
                                    <i data-lucide="book-open"></i>
                                    <span>自主學習</span>
                                </li>
                            </ul>
                        </div>
                    </nav>
                </div>

                <div class="sidebar__footer">
                    <button class="btn btn--ghost btn--small refresh-btn" id="refresh-data">
                        <i data-lucide="refresh-cw"></i>
                        <span>刷新數據</span>
                    </button>
                </div>
            </aside>
        `;
    }

    renderCurrentTask(task) {
        return `
            <div class="current-task-card">
                <div class="current-task-card__header">
                    <i data-lucide="loader" class="animate-spin"></i>
                    <span>當前任務</span>
                </div>
                <div class="current-task-card__content">
                    <h4 class="current-task-card__title">${task.title}</h4>
                    <div class="current-task-card__progress">
                        <div class="progress">
                            <div class="progress__bar animate-progress" style="width: ${task.progress}%"></div>
                        </div>
                        <span class="current-task-card__percent">${task.progress}%</span>
                    </div>
                    <div class="current-task-card__time">
                        <i data-lucide="clock"></i>
                        <span>${this.formatDuration(task.startedAt)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderIdleState() {
        return `
            <div class="idle-state">
                <div class="idle-state__icon">
                    <i data-lucide="coffee"></i>
                </div>
                <p class="idle-state__text">等待新任務...</p>
            </div>
        `;
    }

    formatDuration(startedAt) {
        const start = new Date(startedAt);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);

        if (diff < 60) return `${diff} 秒`;
        if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘`;
        return `${Math.floor(diff / 3600)} 小時 ${Math.floor((diff % 3600) / 60)} 分鐘`;
    }

    afterRender() {
        this.container = document.getElementById('sidebar');
        if (!this.container) return;

        // 綁定事件
        this.bindEvents();

        // 初始化圖標
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    bindEvents() {
        // 刷新按鈕
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.classList.add('animate-spin');
                await ApiClient.refreshAll();
                setTimeout(() => refreshBtn.classList.remove('animate-spin'), 500);
            });
        }

        // 導航項目
        const navItems = this.container.querySelectorAll('.sidebar-nav__item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                navItems.forEach(i => i.classList.remove('sidebar-nav__item--active'));
                item.classList.add('sidebar-nav__item--active');

                // 滾動到對應區塊
                const targetSection = document.getElementById(`section-${section}`);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    update() {
        if (!this.container) return;

        // 只更新需要變化的部分
        const agent = StateManager.get('agent', {});
        const isWorking = agent.status === 'working';

        // 更新狀態指示
        const avatar = this.container.querySelector('.agent-avatar');
        if (avatar) {
            avatar.classList.toggle('agent-avatar--working', isWorking);
        }

        const statusIndicator = this.container.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.toggle('status-indicator--active', isWorking);
            statusIndicator.classList.toggle('status-indicator--idle', !isWorking);
        }

        const statusText = this.container.querySelector('.agent-status');
        if (statusText) {
            statusText.className = `agent-status ${isWorking ? 'text-success' : 'text-muted'}`;
            statusText.innerHTML = `
                <span class="status-dot ${isWorking ? 'status-dot--active' : 'status-dot--idle'}"></span>
                ${isWorking ? '工作中' : '閒置'}
            `;
        }

        // 更新當前任務區塊
        const contentArea = this.container.querySelector('.sidebar__content');
        if (contentArea) {
            const existingTaskCard = contentArea.querySelector('.current-task-card, .idle-state');
            const newContent = agent.currentTask
                ? this.renderCurrentTask(agent.currentTask)
                : this.renderIdleState();

            if (existingTaskCard) {
                existingTaskCard.outerHTML = newContent;
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }
        }
    }

    toggle() {
        if (this.container) {
            this.container.classList.toggle('sidebar--open');
        }
    }

    destroy() {
        this.unsubscribers.forEach(unsub => unsub());
    }
}

export default SidebarModule;
