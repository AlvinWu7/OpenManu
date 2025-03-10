class HistoryComponent {
    constructor() {
        this.historyList = document.getElementById('history-list');
        this.newChatButton = document.getElementById('new-chat-button');
        this.clearHistoryButton = document.getElementById('clear-history-button');
        this.saveButton = document.getElementById('save-button');
        
        this.history = this.loadHistory();
        this.currentSessionId = null;
        
        // 绑定事件
        this.newChatButton.addEventListener('click', () => this.startNewChat());
        this.clearHistoryButton.addEventListener('click', () => this.clearHistory());
        this.saveButton.addEventListener('click', () => this.saveCurrentSession());
        
        // 渲染历史记录
        this.renderHistory();
        
        // 创建新会话
        if (!this.currentSessionId) {
            this.startNewChat();
        }
    }
    
    loadHistory() {
        const savedHistory = localStorage.getItem('manus_history');
        return savedHistory ? JSON.parse(savedHistory) : [];
    }
    
    saveHistory() {
        localStorage.setItem('manus_history', JSON.stringify(this.history));
    }
    
    renderHistory() {
        this.historyList.innerHTML = '';
        
        this.history.forEach((session, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = `px-3 py-2 rounded-md cursor-pointer transition-colors duration-200 ${
                session.id === this.currentSessionId ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`;
            
            // 截取标题，最多显示20个字符
            const title = session.title.length > 20 
                ? session.title.substring(0, 20) + '...' 
                : session.title;
            
            historyItem.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span class="text-sm truncate">${title}</span>
                    </div>
                    <button class="delete-history-item text-gray-400 hover:text-gray-200 p-1" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="text-xs text-gray-500 mt-1">${new Date(session.timestamp).toLocaleString()}</div>
            `;
            
            // 点击加载会话
            historyItem.addEventListener('click', (e) => {
                // 如果点击的是删除按钮，则不加载会话
                if (!e.target.closest('.delete-history-item')) {
                    this.loadSession(session.id);
                }
            });
            
            // 删除按钮事件
            const deleteButton = historyItem.querySelector('.delete-history-item');
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSession(index);
            });
            
            this.historyList.appendChild(historyItem);
        });
    }
    
    startNewChat() {
        // 生成新的会话ID
        this.currentSessionId = Date.now().toString();
        
        // 创建新会话对象
        const newSession = {
            id: this.currentSessionId,
            title: '新对话',
            timestamp: Date.now(),
            messages: [],
            logs: []
        };
        
        // 添加到历史记录
        this.history.unshift(newSession);
        this.saveHistory();
        
        // 重新渲染历史记录
        this.renderHistory();
        
        // 触发新会话事件
        const event = new CustomEvent('newSession', { 
            detail: { sessionId: this.currentSessionId } 
        });
        document.dispatchEvent(event);
    }
    
    loadSession(sessionId) {
        // 查找会话
        const session = this.history.find(s => s.id === sessionId);
        if (!session) return;
        
        // 更新当前会话ID
        this.currentSessionId = sessionId;
        
        // 重新渲染历史记录
        this.renderHistory();
        
        // 触发加载会话事件
        const event = new CustomEvent('loadSession', { 
            detail: { session } 
        });
        document.dispatchEvent(event);
    }
    
    deleteSession(index) {
        // 获取要删除的会话
        const sessionToDelete = this.history[index];
        
        // 从历史记录中删除
        this.history.splice(index, 1);
        this.saveHistory();
        
        // 如果删除的是当前会话，则创建新会话
        if (sessionToDelete.id === this.currentSessionId) {
            if (this.history.length > 0) {
                this.loadSession(this.history[0].id);
            } else {
                this.startNewChat();
            }
        } else {
            // 重新渲染历史记录
            this.renderHistory();
        }
    }
    
    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
            this.history = [];
            this.saveHistory();
            this.startNewChat();
        }
    }
    
    saveCurrentSession() {
        // 查找当前会话
        const sessionIndex = this.history.findIndex(s => s.id === this.currentSessionId);
        if (sessionIndex === -1) return;
        
        // 更新会话时间戳
        this.history[sessionIndex].timestamp = Date.now();
        this.saveHistory();
        
        // 重新渲染历史记录
        this.renderHistory();
        
        // 显示保存成功提示
        alert('会话已保存');
    }
    
    updateSessionTitle(title) {
        // 查找当前会话
        const sessionIndex = this.history.findIndex(s => s.id === this.currentSessionId);
        if (sessionIndex === -1) return;
        
        // 更新会话标题
        this.history[sessionIndex].title = title;
        this.saveHistory();
        
        // 重新渲染历史记录
        this.renderHistory();
    }
    
    addMessageToCurrentSession(message, sender) {
        // 查找当前会话
        const sessionIndex = this.history.findIndex(s => s.id === this.currentSessionId);
        if (sessionIndex === -1) return;
        
        // 添加消息
        this.history[sessionIndex].messages.push({
            content: message,
            sender,
            timestamp: Date.now()
        });
        
        // 如果是第一条用户消息，则更新会话标题
        if (sender === 'user' && this.history[sessionIndex].messages.filter(m => m.sender === 'user').length === 1) {
            this.updateSessionTitle(message);
        }
        
        this.saveHistory();
    }
    
    addLogToCurrentSession(log) {
        // 查找当前会话
        const sessionIndex = this.history.findIndex(s => s.id === this.currentSessionId);
        if (sessionIndex === -1) return;
        
        // 添加日志
        this.history[sessionIndex].logs.push(log);
        
        // 限制日志数量，最多保存1000条
        if (this.history[sessionIndex].logs.length > 1000) {
            this.history[sessionIndex].logs.shift();
        }
        
        this.saveHistory();
    }
    
    getCurrentSession() {
        return this.history.find(s => s.id === this.currentSessionId);
    }
} 