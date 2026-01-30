/**
 * InfoPanelModule - 右側資訊欄模塊
 * 
 * 顯示實時配額監控和 Agent 狀態
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
        // 監聽 agent 狀態變化（包含配額信息）
        this.unsubscribers.push(
            StateManager.subscribe('agent', () => this.update())
        );

        // 監聽日誌變化
        this.unsubscribers.push(
            StateManager.subscribe('logs', () => this.updateLogs())
        );
    }

    render() {
        const agent = StateManager.get('agent', {});
        const logs = StateManager.get('logs', []);
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
                    <!-- Agent 狀態卡片 -->
                    <div class="info-card">
                        <div class="info-card__header">
                            <i data-lucide="activity" width="18" height="18"></i>
                            <span>Agent 狀態</span>
                        </div>
                        <div class="info-card__body" id="agent-status-display">
                            ${this.renderAgentStatus(agent)}
                        </div>
                    </div>

                    <!-- 實時配額監控 -->
                    <div class="info-card">
                        <div class="info-card__header">
                            <i data-lucide="gauge" width="18" height="18"></i>
                            <span>配額監控</span>
                        </div>
                        <div class="info-card__body" id="quota-monitor">
                            ${this.renderQuotaMonitor(agent)}
                        </div>
                    </div>

                    <!-- 模型狀態 -->
                    <div class="info-card">
                        <div class="info-card__header">
                            <i data-lucide="cpu" width="18" height="18"></i>
                            <span>當前模型</span>
                        </div>
                        <div class="info-card__body" id="model-status">
                            ${this.renderModelStatus(agent)}
                        </div>
                    </div>

                    <!-- 最近日誌 -->
                    <div class="info-card">
                        <div class="info-card__header">
                            <i data-lucide="scroll-text" width="18" height="18"></i>
                            <span>最近日誌</span>
                        </div>
                        <div class="info-card__body" id="recent-logs">
                            ${this.renderRecentLogs(logs)}
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

    /**
     * 渲染 Agent 狀態
     */
    renderAgentStatus(agent) {
        const displayState = agent.displayState || '⚪ UNKNOWN';
        const isOnline = agent.isOnline !== false;
        const currentTask = agent.currentTask?.title || '無任務';

        return `
            <div class="agent-status">
                <div class="agent-status__indicator">
                    <span class="status-badge ${isOnline ? 'status-badge--online' : 'status-badge--offline'}">
                        ${displayState}
                    </span>
                </div>
                <div class="agent-status__task">
                    <span class="text-muted">當前任務:</span>
                    <span class="task-name">${currentTask}</span>
                </div>
                ${agent.lastHeartbeat ? `
                    <div class="agent-status__heartbeat text-muted" style="font-size: var(--text-xs)">
                        最後心跳: ${this.formatTimestamp(agent.lastHeartbeat)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * 渲染配額監控（替代原本的 Switch Model 按鈕區域）
     */
    renderQuotaMonitor(agent) {
        const tokenUsage = agent.tokenUsage || 0;
        const quotaRemaining = agent.quotaRemaining ?? 1; // 0~1 的比例
        const percentage = Math.round(quotaRemaining * 100);

        // 確定警告等級
        let badgeClass = '';
        let badgeText = '';
        let progressClass = '';

        if (percentage < 20) {
            badgeClass = 'badge--danger';
            badgeText = '⚠️ 危險';
            progressClass = 'progress--danger';
        } else if (percentage < 30) {
            badgeClass = 'badge--warning';
            badgeText = '⚠️ 警告';
            progressClass = 'progress--warning';
        } else {
            badgeClass = 'badge--success';
            badgeText = '✓ 正常';
            progressClass = '';
        }

        return `
            <div class="quota-monitor">
                <div class="quota-monitor__header">
                    <span class="quota-monitor__label">Token 使用量</span>
                    <span class="quota-monitor__value text-mono">${this.formatNumber(tokenUsage)}</span>
                </div>
                
                <div class="quota-monitor__bar">
                    <div class="quota-monitor__remaining">
                        <span>剩餘配額</span>
                        <span class="badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="progress ${progressClass}">
                        <div class="progress__bar" style="width: ${percentage}%"></div>
                    </div>
                    <div class="quota-monitor__percentage">
                        <span class="text-mono ${percentage < 20 ? 'text-danger' : percentage < 30 ? 'text-warning' : ''}">${percentage}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染模型狀態
     */
    renderModelStatus(agent) {
        const model = agent.model || 'Unknown';
        const isOnline = agent.isOnline !== false;

        return `
            <div class="model-status">
                <div class="model-item model-item--current">
                    <div class="model-item__indicator">
                        <span class="status-dot ${isOnline ? 'status-dot--active' : 'status-dot--warning'}"></span>
                    </div>
                    <div class="model-item__info">
                        <span class="model-item__label">當前使用</span>
                        <span class="model-item__name">${model}</span>
                        <span class="model-item__provider text-muted">Google</span>
                    </div>
                    <span class="badge ${isOnline ? 'badge--success' : 'badge--danger'}">
                        ${isOnline ? '運行中' : '離線'}
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * 渲染最近日誌
     */
    renderRecentLogs(logs) {
        if (!logs || logs.length === 0) {
            return '<p class="text-muted">暫無日誌</p>';
        }

        // 只顯示最近 5 條
        const recentLogs = logs.slice(0, 5);

        return `
            <div class="recent-logs">
                ${recentLogs.map(log => `
                    <div class="log-item">
                        <span class="log-item__time text-muted text-mono">
                            ${this.formatTimestamp(log.timestamp)}
                        </span>
                        <span class="log-item__message">${log.message || ''}</span>
                    </div>
                `).join('')}
                ${logs.length > 5 ? `
                    <div class="log-item__more text-muted">
                        還有 ${logs.length - 5} 條日誌...
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * 格式化時間字符串
     */
    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 格式化時間戳
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return '--:--';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * 格式化數字（加上千分位）
     */
    formatNumber(num) {
        if (num === undefined || num === null) return '0';
        return num.toLocaleString('zh-TW');
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
            logs: state.logs
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

    /**
     * 更新整個面板
     */
    update() {
        const agentStatusDisplay = document.getElementById('agent-status-display');
        const quotaMonitor = document.getElementById('quota-monitor');
        const modelStatus = document.getElementById('model-status');

        const agent = StateManager.get('agent', {});

        if (agentStatusDisplay) {
            agentStatusDisplay.innerHTML = this.renderAgentStatus(agent);
        }

        if (quotaMonitor) {
            quotaMonitor.innerHTML = this.renderQuotaMonitor(agent);
            // 檢查配額警告
            this.checkQuotaWarnings(agent);
        }

        if (modelStatus) {
            modelStatus.innerHTML = this.renderModelStatus(agent);
        }

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * 更新日誌
     */
    updateLogs() {
        const logsContainer = document.getElementById('recent-logs');
        if (!logsContainer) return;

        const logs = StateManager.get('logs', []);
        logsContainer.innerHTML = this.renderRecentLogs(logs);
    }

    /**
     * 檢查配額警告
     */
    checkQuotaWarnings(agent) {
        const quotaRemaining = agent.quotaRemaining ?? 1;
        const percentage = Math.round(quotaRemaining * 100);

        if (percentage < 10) {
            EventBus.emit(Events.NOTIFICATION_SHOW, {
                type: 'error',
                message: `⚠️ 配額嚴重不足！僅剩 ${percentage}%`,
                persistent: true
            });
        } else if (percentage < 20) {
            EventBus.emit(Events.NOTIFICATION_SHOW, {
                type: 'warning',
                message: `配額不足警告：剩餘 ${percentage}%`,
                duration: 5000
            });
        }
    }

    destroy() {
        this.unsubscribers.forEach(unsub => unsub());
    }
}

export default InfoPanelModule;
