class LoggerComponent {
    constructor() {
        this.outputLog = document.getElementById('output-log');
        this.recordButton = document.getElementById('record-button');
        this.pauseButton = document.getElementById('pause-button');
        this.clearLogsButton = document.getElementById('clear-logs-button');
        this.autoScrollButton = document.getElementById('auto-scroll-button');
        this.logFilter = document.getElementById('log-filter');
        
        // 确保日志区域有滚动条样式和正确的CSS属性
        this.outputLog.classList.add('scrollbar-thin');
        this.outputLog.style.overflowY = 'auto';
        this.outputLog.style.maxHeight = 'calc(100vh - 120px)'; // 设置最大高度
        
        this.isRecording = false;
        this.isPaused = false;
        this.autoScroll = true;
        this.currentFilter = 'all';
        this.logs = [];
        
        // 绑定事件
        this.recordButton.addEventListener('click', () => this.toggleRecording());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        this.clearLogsButton.addEventListener('click', () => this.clearLogs());
        this.autoScrollButton.addEventListener('click', () => this.toggleAutoScroll());
        this.logFilter.addEventListener('change', () => this.applyFilter());
        
        // 监听滚动事件，检测用户是否手动滚动
        this.outputLog.addEventListener('scroll', () => {
            // 如果用户向上滚动，则禁用自动滚动
            if (this.outputLog.scrollTop < this.outputLog.scrollHeight - this.outputLog.clientHeight - 50) {
                if (this.autoScroll) {
                    this.autoScroll = false;
                    this.updateAutoScrollButton();
                }
            }
            // 如果用户滚动到底部，则启用自动滚动
            else if (this.outputLog.scrollTop >= this.outputLog.scrollHeight - this.outputLog.clientHeight - 50) {
                if (!this.autoScroll) {
                    this.autoScroll = true;
                    this.updateAutoScrollButton();
                }
            }
        });
        
        // 添加测试日志以验证滚动功能
        this.addTestLogs();
    }
    
    // 添加测试日志
    addTestLogs() {
        for (let i = 1; i <= 20; i++) {
            this.addLog({
                level: i % 3 === 0 ? 'ERROR' : (i % 2 === 0 ? 'WARNING' : 'INFO'),
                message: `测试日志 #${i}: 这是一条测试日志消息，用于验证滚动功能是否正常工作。`
            });
        }
    }
    
    toggleRecording() {
        this.isRecording = !this.isRecording;
        if (this.isRecording) {
            this.recordButton.classList.add('recording');
        } else {
            this.recordButton.classList.remove('recording');
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.pauseButton.classList.add('paused');
        } else {
            this.pauseButton.classList.remove('paused');
            // 恢复时显示所有缓存的日志
            this.renderLogs();
        }
    }
    
    toggleAutoScroll() {
        this.autoScroll = !this.autoScroll;
        this.updateAutoScrollButton();
        
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }
    
    updateAutoScrollButton() {
        this.autoScrollButton.textContent = `自动滚动: ${this.autoScroll ? '开' : '关'}`;
        if (this.autoScroll) {
            this.autoScrollButton.classList.remove('bg-gray-700', 'hover:bg-gray-600');
            this.autoScrollButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
        } else {
            this.autoScrollButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            this.autoScrollButton.classList.add('bg-gray-700', 'hover:bg-gray-600');
        }
    }
    
    clearLogs() {
        this.logs = [];
        this.outputLog.innerHTML = '';
    }
    
    applyFilter() {
        this.currentFilter = this.logFilter.value;
        this.renderLogs();
    }
    
    addLog(log) {
        // 保存日志
        this.logs.push(log);
        
        // 如果暂停中，不显示新日志
        if (this.isPaused) return;
        
        // 根据过滤器决定是否显示
        if (this.shouldShowLog(log)) {
            this.renderLogEntry(log);
        }
        
        // 触发日志添加事件
        const event = new CustomEvent('logAdded', { 
            detail: { log } 
        });
        document.dispatchEvent(event);
    }
    
    shouldShowLog(log) {
        if (this.currentFilter === 'all') return true;
        
        const message = log.message;
        
        switch (this.currentFilter) {
            case 'info':
                return log.level === 'INFO' || (!message.includes('ERROR') && !message.includes('WARNING') && !message.includes('执行工具'));
            case 'warning':
                return log.level === 'WARNING' || message.includes('WARNING');
            case 'error':
                return log.level === 'ERROR' || message.includes('ERROR');
            case 'tool':
                return message.includes('执行工具') || message.includes('Activating tool');
            default:
                return true;
        }
    }
    
    renderLogEntry(log) {
        const logEntry = document.createElement('div');
        logEntry.className = 'mb-1 leading-relaxed';
        
        // 根据日志级别设置样式
        switch(log.level) {
            case 'ERROR':
                logEntry.className += ' text-red-500';
                break;
            case 'WARNING':
                logEntry.className += ' text-yellow-500';
                break;
            case 'INFO':
                logEntry.className += ' text-green-400';
                break;
            default:
                logEntry.className += ' text-gray-300';
        }
        
        // 处理特殊日志内容
        const message = log.message;
        
        // 检测思考过程
        if (message.includes('thoughts') || message.includes('思考')) {
            logEntry.className = 'mb-1 leading-relaxed text-blue-400 italic';
        }
        
        // 检测工具执行
        if (message.includes('执行工具') || message.includes('Activating tool')) {
            logEntry.className = 'mb-1 leading-relaxed text-purple-500 font-semibold';
        }
        
        logEntry.textContent = message;
        this.outputLog.appendChild(logEntry);
        
        // 如果启用了自动滚动，则滚动到底部
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }
    
    renderLogs() {
        // 清空日志显示
        this.outputLog.innerHTML = '';
        
        // 重新渲染所有符合过滤条件的日志
        this.logs.forEach(log => {
            if (this.shouldShowLog(log)) {
                this.renderLogEntry(log);
            }
        });
    }
    
    scrollToBottom() {
        // 使用setTimeout确保在DOM更新后滚动
        setTimeout(() => {
            this.outputLog.scrollTop = this.outputLog.scrollHeight;
            console.log('Scrolling to bottom:', this.outputLog.scrollHeight);
        }, 0);
    }
    
    loadLogs(logs) {
        this.clearLogs();
        logs.forEach(log => this.addLog(log));
    }
} 