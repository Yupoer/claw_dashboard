/**
 * InfoPanelModule - 右側資訊欄模塊
 * 
 * 顯示 API 餘額監控和模型狀態
 */

import EventBus, { Events } from '../core/EventBus.js';
import StateManager from '../core/StateManager.js';

class InfoPanelModule {
    constructor(config) {
        this.config = config;
        this.container = null;
        this.unsubscribers = [];
    }

    async init() {
        this.unsubscribers.push(
            StateManager.subscribe('api', () => this.updateBalances())
        );

        this.unsubscribers.push(
            StateManager.subscribe('models', () => this.updateModels())
        );

        // 監控餘額警告
        this.unsubscribers.push(
            StateManager.subscribe('api.balances', (balances) => {
                this.checkBalanceWarnings(balances);
            })
        );
    }

    render() {
        const balances = StateManager.get('api.balances', []);
        const models = StateManager.get('models', {});
        const lastUpdated = StateManager.get('api.lastUpdated');

        return `
            <aside class="info-panel" id="info-panel">
                <div class="info-panel__header">
                    <h3>系統狀態</h3>
                    ${lastUpdated ? `
                        <span class="text-muted text-mono" style="font-size: var(--text-xs)">
                            更新於 ${this.formatTime(lastUpdated)}
                        </span>
                    ` : ''}
                </div>
                
                <div class="info-panel__content">
                    <!-- API 餘額監控 -->
                    <div class="info-card">
                        <div class="info-card__header">
                            <i data-lucide="wallet" width="18" height="18"></i>
                            <span>API 餘額</span>
                        </div>
                        <div class="info-card__body" id="api-balances">
                            ${balances.length > 0
                ? balances.map(b => this.renderBalanceItem(b)).join('')
                : '<p class="text-muted">載入中...</p>'}
                        </div>
                    </div>

                    <!-- 模型狀態 -->
                    <div class="info-card">
                        <div class="info-card__header">
                            <i data-lucide="cpu" width="18" height="18"></i>
                            <span>模型狀態</span>
                        </div>
                        <div class="info-card__body" id="model-status">
                            ${models.current
                ? this.renderModelStatus(models)
                : '<p class="text-muted">載入中...</p>'}
                        </div>
                    </div>

                    <!-- 快捷操作 -->
                    <div class="info-card">
                        <div class="info-card__header">
                            <i data-lucide="zap" width="18" height="18"></i>
                            <span>快捷操作</span>
                        </div>
                        <div class="info-card__body">
                            <div class="quick-actions">
                                <button class="btn btn--ghost btn--small" id="switch-model-btn">
                                    <i data-lucide="refresh-cw" width="14" height="14"></i>
                                    切換模型
                                </button>
                                <button class="btn btn--ghost btn--small" id="export-data-btn">
                                    <i data-lucide="download" width="14" height="14"></i>
                                    匯出數據
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        `;
    }

    renderBalanceItem(balance) {
        const percentage = (balance.remaining / balance.total) * 100;
        const isWarning = percentage <= 20;
        const isCritical = percentage <= 10;

        let progressClass = '';
        if (isCritical) progressClass = 'progress--danger';
        else if (isWarning) progressClass = 'progress--warning';

        return `
            <div class="balance-item ${isCritical ? 'animate-alert' : ''}">
                <div class="balance-item__header">
                    <span class="balance-item__provider">${balance.provider}</span>
                    <span class="balance-item__amount ${isCritical ? 'text-danger' : isWarning ? 'text-warning' : ''}">
                        $${balance.remaining.toFixed(2)}
                    </span>
                </div>
                <div class="progress ${progressClass}">
                    <div class="progress__bar" style="width: ${percentage}%"></div>
                </div>
                <div class="balance-item__footer">
                    <span class="text-muted">剩餘: $${balance.total.toFixed(2)}</span>
                    <span class="${isCritical ? 'text-danger' : isWarning ? 'text-warning' : 'text-muted'}">
                        預估 ${balance.estimatedDaysLeft} 天
                    </span>
                </div>
            </div>
        `;
    }

    renderModelStatus(models) {
        const { current, fallback } = models;

        return `
            <div class="model-status">
                <!-- 當前模型 -->
                <div class="model-item model-item--current">
                    <div class="model-item__indicator">
                        <span class="status-dot status-dot--${current.status === 'active' ? 'active' : 'warning'}"></span>
                    </div>
                    <div class="model-item__info">
                        <span class="model-item__label">當前使用</span>
                        <span class="model-item__name">${current.name}</span>
                        <span class="model-item__provider text-muted">${current.provider}</span>
                    </div>
                    <span class="badge ${current.status === 'active' ? 'badge--success' : 'badge--warning'}">
                        ${this.getStatusText(current.status)}
                    </span>
                </div>

                ${fallback ? `
                <!-- 備用模型 -->
                <div class="model-item model-item--fallback">
                    <div class="model-item__indicator">
                        <span class="status-dot ${fallback.status === 'ready' ? '' : 'status-dot--warning'}"></span>
                    </div>
                    <div class="model-item__info">
                        <span class="model-item__label">備用模型</span>
                        <span class="model-item__name">${fallback.name}</span>
                        <span class="model-item__provider text-muted">${fallback.provider}</span>
                    </div>
                    <span class="badge ${fallback.status === 'ready' ? '' : 'badge--warning'}">
                        ${fallback.status === 'ready' ? '待命' : '不可用'}
                    </span>
                </div>
                ` : ''}
            </div>
        `;
    }

    getStatusText(status) {
        switch (status) {
            case 'active': return '運行中';
            case 'rate-limited': return '限速中';
            case 'error': return '錯誤';
            default: return status;
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    checkBalanceWarnings(balances) {
        const config = StateManager.get('config', {});
        const warningThreshold = config.balanceWarningThreshold || 20;
        const criticalThreshold = config.balanceCriticalThreshold || 10;

        balances.forEach(balance => {
            const percentage = (balance.remaining / balance.total) * 100;

            if (percentage <= criticalThreshold) {
                EventBus.emit(Events.API_BALANCE_WARNING, {
                    provider: balance.provider,
                    level: 'critical',
                    remaining: balance.remaining,
                    percentage
                });

                EventBus.emit(Events.NOTIFICATION_SHOW, {
                    type: 'error',
                    message: `警告：${balance.provider} 餘額不足 10%！`,
                    persistent: true
                });
            } else if (percentage <= warningThreshold) {
                EventBus.emit(Events.API_BALANCE_WARNING, {
                    provider: balance.provider,
                    level: 'warning',
                    remaining: balance.remaining,
                    percentage
                });
            }
        });
    }

    afterRender() {
        this.container = document.getElementById('info-panel');
        if (!this.container) return;

        this.bindEvents();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    bindEvents() {
        // 切換模型按鈕
        const switchBtn = document.getElementById('switch-model-btn');
        if (switchBtn) {
            switchBtn.addEventListener('click', () => {
                EventBus.emit('ui:show-model-switch');
            });
        }

        // 匯出數據按鈕
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
    }

    exportData() {
        const state = StateManager.getState();
        const exportData = {
            exportedAt: new Date().toISOString(),
            agent: state.agent,
            tasks: state.tasks,
            learning: state.learning,
            api: state.api,
            models: state.models
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `openclaw-dashboard-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        EventBus.emit(Events.NOTIFICATION_SHOW, {
            type: 'success',
            message: '數據已匯出'
        });
    }

    updateBalances() {
        const container = document.getElementById('api-balances');
        if (!container) return;

        const balances = StateManager.get('api.balances', []);
        container.innerHTML = balances.length > 0
            ? balances.map(b => this.renderBalanceItem(b)).join('')
            : '<p class="text-muted">載入中...</p>';
    }

    updateModels() {
        const container = document.getElementById('model-status');
        if (!container) return;

        const models = StateManager.get('models', {});
        container.innerHTML = models.current
            ? this.renderModelStatus(models)
            : '<p class="text-muted">載入中...</p>';
    }

    update() {
        this.updateBalances();
        this.updateModels();
    }

    destroy() {
        this.unsubscribers.forEach(unsub => unsub());
    }
}

export default InfoPanelModule;
