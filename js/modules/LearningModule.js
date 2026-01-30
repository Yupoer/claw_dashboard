/**
 * LearningModule - 自主學習模塊
 * 
 * 顯示學習項目列表，支援優先級標記
 */

import EventBus, { Events } from '../core/EventBus.js';
import StateManager from '../core/StateManager.js';
import ApiClient from '../api/ApiClient.js';

class LearningModule {
    constructor(config) {
        this.config = config;
        this.container = null;
        this.unsubscribers = [];
    }

    async init() {
        this.unsubscribers.push(
            StateManager.subscribe('learning', () => this.update())
        );
    }

    render() {
        const items = StateManager.get('learning.items', []);

        return `
            <section class="module-section learning-module" id="section-learning">
                <div class="section-header">
                    <h3 class="section-title">
                        <i data-lucide="book-open" class="section-title__icon"></i>
                        自主學習
                    </h3>
                    <button class="btn btn--ghost btn--small" id="add-learning-btn">
                        <i data-lucide="plus" width="16" height="16"></i>
                    </button>
                </div>
                
                <div class="learning-list">
                    ${items.length > 0
                ? items.map(item => this.renderLearningItem(item)).join('')
                : this.renderEmptyState()}
                </div>
            </section>
        `;
    }

    renderLearningItem(item) {
        const priorityColor = this.getPriorityColor(item.priority);
        const statusBadge = this.getStatusBadge(item.status);

        return `
            <div class="learning-card card card--interactive" data-item-id="${item.id}">
                <div class="learning-card__header">
                    <div class="learning-card__priority" title="優先級: ${item.priority}">
                        ${this.renderPriorityStars(item.priority, item.id)}
                    </div>
                    <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
                </div>
                <div class="learning-card__body">
                    <h4 class="learning-card__title">${item.title}</h4>
                    <p class="learning-card__description">${item.description}</p>
                </div>
                <div class="learning-card__footer">
                    <span class="learning-card__category">
                        <i data-lucide="folder" width="14" height="14"></i>
                        ${item.category}
                    </span>
                    <span class="learning-card__date text-muted">
                        ${this.formatDate(item.addedAt)}
                    </span>
                </div>
            </div>
        `;
    }

    renderPriorityStars(currentPriority, itemId) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            const isFilled = i <= currentPriority;
            stars.push(`
                <button class="priority-star ${isFilled ? 'priority-star--filled' : ''}" 
                        data-item-id="${itemId}" 
                        data-priority="${i}"
                        title="設為優先級 ${i}">
                    <i data-lucide="${isFilled ? 'star' : 'star'}" width="16" height="16"></i>
                </button>
            `);
        }
        return `<div class="priority-stars">${stars.join('')}</div>`;
    }

    getPriorityColor(priority) {
        switch (priority) {
            case 1: return 'var(--color-danger)';
            case 2: return 'var(--color-warning)';
            case 3: return 'var(--color-info)';
            default: return 'var(--color-text-muted)';
        }
    }

    getStatusBadge(status) {
        switch (status) {
            case 'researching':
                return { class: 'badge--info', text: '研究中' };
            case 'planned':
                return { class: '', text: '已規劃' };
            case 'completed':
                return { class: 'badge--success', text: '已完成' };
            default:
                return { class: '', text: status };
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            month: 'short',
            day: 'numeric'
        });
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <i data-lucide="lightbulb" class="empty-state__icon"></i>
                <p class="empty-state__title">尚無學習項目</p>
                <p class="empty-state__description">添加想研究或改善的項目</p>
            </div>
        `;
    }

    afterRender() {
        this.container = document.querySelector('.learning-module');
        if (!this.container) return;

        this.bindEvents();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    bindEvents() {
        // 優先級星星點擊
        this.container.addEventListener('click', async (e) => {
            const star = e.target.closest('.priority-star');
            if (star) {
                e.stopPropagation();
                const itemId = star.dataset.itemId;
                const newPriority = parseInt(star.dataset.priority);

                try {
                    await ApiClient.updateLearningPriority(itemId, newPriority);
                    await ApiClient.refreshAll();
                    EventBus.emit(Events.LEARNING_PRIORITY_CHANGED, { itemId, priority: newPriority });
                } catch (error) {
                    console.error('Failed to update priority', error);
                }
            }
        });

        // 添加學習項目按鈕
        const addBtn = document.getElementById('add-learning-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.showAddDialog();
            });
        }
    }

    showAddDialog() {
        // 發送事件讓主程式處理模態框
        EventBus.emit('ui:show-modal', {
            title: '添加學習項目',
            content: `
                <form id="add-learning-form">
                    <div class="form-group">
                        <label for="learning-title">標題</label>
                        <input type="text" id="learning-title" class="input" required>
                    </div>
                    <div class="form-group">
                        <label for="learning-description">描述</label>
                        <textarea id="learning-description" class="input" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="learning-category">分類</label>
                        <input type="text" id="learning-category" class="input" placeholder="如：技術學習、工作流優化">
                    </div>
                    <div class="form-group">
                        <label>優先級</label>
                        <div class="priority-selector">
                            ${[1, 2, 3, 4, 5].map(p => `
                                <label class="priority-option">
                                    <input type="radio" name="priority" value="${p}" ${p === 3 ? 'checked' : ''}>
                                    <span>${p}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </form>
            `,
            actions: [
                { label: '取消', type: 'secondary', action: 'close' },
                { label: '添加', type: 'primary', action: 'submit' }
            ],
            onSubmit: async (formData) => {
                const form = document.getElementById('add-learning-form');
                const data = {
                    title: form.querySelector('#learning-title').value,
                    description: form.querySelector('#learning-description').value,
                    category: form.querySelector('#learning-category').value || '其他',
                    priority: parseInt(form.querySelector('input[name="priority"]:checked').value)
                };

                try {
                    await ApiClient.createLearningItem(data);
                    await ApiClient.refreshAll();
                    EventBus.emit(Events.NOTIFICATION_SHOW, {
                        type: 'success',
                        message: '學習項目已添加'
                    });
                    return true; // 關閉模態框
                } catch (error) {
                    EventBus.emit(Events.NOTIFICATION_SHOW, {
                        type: 'error',
                        message: '添加失敗，請重試'
                    });
                    return false;
                }
            }
        });
    }

    update() {
        if (!this.container) return;

        this.container.outerHTML = this.render();
        this.container = document.querySelector('.learning-module');
        this.bindEvents();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    destroy() {
        this.unsubscribers.forEach(unsub => unsub());
    }
}

export default LearningModule;
