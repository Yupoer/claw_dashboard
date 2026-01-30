/**
 * NotificationModule - 通知系統模塊
 * 
 * 處理所有通知的顯示和管理
 */

import EventBus, { Events } from '../core/EventBus.js';

class NotificationModule {
    constructor(config) {
        this.config = config;
        this.container = null;
        this.notifications = [];
        this.counter = 0;
        this.unsubscribers = [];
    }

    async init() {
        this.container = document.getElementById('notifications');

        // 監聽通知事件
        this.unsubscribers.push(
            EventBus.on(Events.NOTIFICATION_SHOW, (data) => this.show(data))
        );

        this.unsubscribers.push(
            EventBus.on(Events.NOTIFICATION_DISMISS, (data) => this.dismiss(data.id))
        );
    }

    render() {
        return ''; // 通知動態添加，不需要初始渲染
    }

    /**
     * 顯示通知
     * @param {Object} options - 通知選項
     * @param {string} options.type - 類型：success, warning, error, info
     * @param {string} options.message - 訊息內容
     * @param {string} [options.title] - 標題
     * @param {number} [options.duration=5000] - 持續時間（毫秒）
     * @param {boolean} [options.persistent=false] - 是否持久顯示
     */
    show({ type = 'info', message, title, duration = 5000, persistent = false }) {
        const id = `notification-${++this.counter}`;

        const notification = {
            id,
            type,
            message,
            title,
            persistent
        };

        this.notifications.push(notification);

        const html = this.renderNotification(notification);
        this.container.insertAdjacentHTML('beforeend', html);

        const element = document.getElementById(id);
        if (element) {
            // 綁定關閉按鈕
            const closeBtn = element.querySelector('.notification__close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.dismiss(id));
            }

            // 非持久通知自動消失
            if (!persistent) {
                setTimeout(() => this.dismiss(id), duration);
            }

            // 初始化圖標
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }

        return id;
    }

    renderNotification(notification) {
        const icon = this.getIcon(notification.type);

        return `
            <div class="notification notification--${notification.type} notification-enter" 
                 id="${notification.id}" role="alert">
                <div class="notification__icon">
                    <i data-lucide="${icon}" width="20" height="20"></i>
                </div>
                <div class="notification__content">
                    ${notification.title ? `
                        <div class="notification__title">${notification.title}</div>
                    ` : ''}
                    <div class="notification__message">${notification.message}</div>
                </div>
                <button class="notification__close btn btn--icon btn--ghost">
                    <i data-lucide="x" width="16" height="16"></i>
                </button>
            </div>
        `;
    }

    getIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'warning': return 'alert-triangle';
            case 'error': return 'alert-circle';
            case 'info': return 'info';
            default: return 'bell';
        }
    }

    /**
     * 關閉通知
     * @param {string} id - 通知 ID
     */
    dismiss(id) {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('notification-enter');
            element.classList.add('notification-exit');

            setTimeout(() => {
                element.remove();
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 250);
        }
    }

    /**
     * 關閉所有通知
     */
    dismissAll() {
        this.notifications.forEach(n => this.dismiss(n.id));
    }

    destroy() {
        this.dismissAll();
        this.unsubscribers.forEach(unsub => unsub());
    }
}

export default NotificationModule;
