/**
 * TasksModule - 任務列表模塊
 * 
 * 顯示近期完成和待辦任務，支援點擊展開詳情
 */

import EventBus, { Events } from '../core/EventBus.js';
import StateManager from '../core/StateManager.js';
import ApiClient from '../api/ApiClient.js';

class TasksModule {
    constructor(config) {
        this.config = config;
        this.container = null;
        this.unsubscribers = [];
        this.expandedTaskId = null;
    }

    async init() {
        // 訂閱狀態變化
        this.unsubscribers.push(
            StateManager.subscribe('tasks', () => this.update())
        );

        this.unsubscribers.push(
            StateManager.subscribe('ui.expandedTaskId', (taskId) => {
                this.expandedTaskId = taskId;
                this.update();
            })
        );
    }

    render() {
        const completedTasks = StateManager.get('tasks.completed', []);
        const pendingTasks = StateManager.get('tasks.pending', []);
        const inProgressTasks = StateManager.get('tasks.inProgress', []);

        return `
            <div class="tasks-module">
                <!-- 近期完成 -->
                <section class="module-section" id="section-completed">
                    <div class="section-header">
                        <h3 class="section-title">
                            <i data-lucide="check-circle" class="section-title__icon"></i>
                            近期完成
                        </h3>
                        <span class="badge">${completedTasks.length}</span>
                    </div>
                    <div class="task-list" id="completed-tasks">
                        ${completedTasks.length > 0
                ? completedTasks.slice(0, 5).map(task => this.renderTaskCard(task)).join('')
                : this.renderEmptyState('尚無完成任務')}
                    </div>
                </section>

                <!-- 進行中 -->
                ${inProgressTasks.length > 0 ? `
                <section class="module-section" id="section-in-progress">
                    <div class="section-header">
                        <h3 class="section-title">
                            <i data-lucide="loader" class="section-title__icon"></i>
                            進行中
                        </h3>
                        <span class="badge badge--info">${inProgressTasks.length}</span>
                    </div>
                    <div class="task-list" id="in-progress-tasks">
                        ${inProgressTasks.map(task => this.renderTaskCard(task)).join('')}
                    </div>
                </section>
                ` : ''}

                <!-- 待辦事項 -->
                <section class="module-section" id="section-pending">
                    <div class="section-header">
                        <h3 class="section-title">
                            <i data-lucide="list-todo" class="section-title__icon"></i>
                            待辦事項
                        </h3>
                        <span class="badge">${pendingTasks.length}</span>
                    </div>
                    <div class="task-list" id="pending-tasks">
                        ${pendingTasks.length > 0
                ? pendingTasks.map(task => this.renderTaskCard(task)).join('')
                : this.renderEmptyState('沒有待辦任務')}
                    </div>
                </section>
            </div>
        `;
    }

    renderTaskCard(task) {
        const isExpanded = this.expandedTaskId === task.id;
        const priorityClass = this.getPriorityClass(task.priority);
        const statusIcon = this.getStatusIcon(task.status);

        return `
            <div class="task-card card card--interactive ${isExpanded ? 'task-card--expanded' : ''}" 
                 data-task-id="${task.id}">
                <div class="task-card__header">
                    <div class="task-card__left">
                        <span class="priority ${priorityClass}">
                            <span class="priority__dot"></span>
                        </span>
                        <h4 class="task-card__title">${task.title}</h4>
                    </div>
                    <div class="task-card__right">
                        ${task.completedAt
                ? `<span class="task-card__time text-muted">
                                <i data-lucide="check" width="14" height="14"></i>
                                ${this.formatTime(task.completedAt)}
                               </span>`
                : task.dueDate
                    ? `<span class="task-card__time ${this.isOverdue(task.dueDate) ? 'text-danger' : 'text-muted'}">
                                    <i data-lucide="calendar" width="14" height="14"></i>
                                    ${this.formatDate(task.dueDate)}
                                   </span>`
                    : ''
            }
                        <i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" 
                           class="task-card__toggle" width="16" height="16"></i>
                    </div>
                </div>
                
                ${isExpanded ? `
                <div class="task-card__details animate-expand">
                    <p class="task-card__description">${task.description || '無描述'}</p>
                    <div class="task-card__meta">
                        <div class="task-card__tags">
                            ${(task.tags || []).map(tag => `
                                <span class="badge">${tag}</span>
                            `).join('')}
                        </div>
                        <div class="task-card__actions">
                            ${task.status !== 'completed' ? `
                                <button class="btn btn--small btn--primary complete-task-btn" 
                                        data-task-id="${task.id}">
                                    <i data-lucide="check" width="14" height="14"></i>
                                    完成
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    renderEmptyState(message) {
        return `
            <div class="empty-state">
                <i data-lucide="inbox" class="empty-state__icon"></i>
                <p class="empty-state__description">${message}</p>
            </div>
        `;
    }

    getPriorityClass(priority) {
        switch (priority) {
            case 'high': return 'priority--high';
            case 'medium': return 'priority--medium';
            case 'low': return 'priority--low';
            default: return '';
        }
    }

    getStatusIcon(status) {
        switch (status) {
            case 'completed': return 'check-circle';
            case 'in-progress': return 'loader';
            case 'pending': return 'circle';
            default: return 'circle';
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return '剛剛';
        if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
        return date.toLocaleDateString('zh-TW');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((date - now) / 86400000);

        if (diffDays === 0) return '今天';
        if (diffDays === 1) return '明天';
        if (diffDays < 7) return `${diffDays} 天後`;
        return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    }

    isOverdue(dateString) {
        return new Date(dateString) < new Date();
    }

    afterRender() {
        this.container = document.querySelector('.tasks-module');
        if (!this.container) return;

        this.bindEvents();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    bindEvents() {
        // 任務卡片點擊展開
        this.container.addEventListener('click', (e) => {
            const taskCard = e.target.closest('.task-card');
            if (taskCard && !e.target.closest('.complete-task-btn')) {
                const taskId = taskCard.dataset.taskId;
                const currentExpanded = StateManager.get('ui.expandedTaskId');
                StateManager.set('ui.expandedTaskId', currentExpanded === taskId ? null : taskId);
                EventBus.emit(Events.TASK_EXPANDED, { taskId });
            }
        });

        // 完成任務按鈕
        this.container.addEventListener('click', async (e) => {
            const completeBtn = e.target.closest('.complete-task-btn');
            if (completeBtn) {
                e.stopPropagation();
                const taskId = completeBtn.dataset.taskId;

                completeBtn.disabled = true;
                completeBtn.innerHTML = '<i data-lucide="loader" class="animate-spin" width="14" height="14"></i>';

                try {
                    await ApiClient.completeTask(taskId);
                    await ApiClient.refreshAll();
                    EventBus.emit(Events.TASK_COMPLETED, { taskId });
                    EventBus.emit(Events.NOTIFICATION_SHOW, {
                        type: 'success',
                        message: '任務已完成！'
                    });
                } catch (error) {
                    EventBus.emit(Events.NOTIFICATION_SHOW, {
                        type: 'error',
                        message: '操作失敗，請重試'
                    });
                }
            }
        });
    }

    update() {
        if (!this.container) return;

        // 重新渲染整個模塊
        this.container.outerHTML = this.render();
        this.container = document.querySelector('.tasks-module');
        this.bindEvents();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    destroy() {
        this.unsubscribers.forEach(unsub => unsub());
    }
}

export default TasksModule;
