document.addEventListener('DOMContentLoaded', function() {
    // 初始化组件
    const chatComponent = new ChatComponent();
    const browserComponent = new BrowserComponent();
    const loggerComponent = new LoggerComponent();
    const fileManagerComponent = new FileManagerComponent();
    const historyComponent = new HistoryComponent();
    
    // 标签切换功能
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // 更新按钮样式
            tabButtons.forEach(btn => {
                btn.classList.remove('bg-blue-100', 'text-blue-700');
                btn.classList.add('text-gray-600', 'hover:bg-gray-100');
            });
            button.classList.remove('text-gray-600', 'hover:bg-gray-100');
            button.classList.add('bg-blue-100', 'text-blue-700');
            
            // 更新内容显示
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`${tabName}-content`).classList.remove('hidden');
        });
    });
    
    // 当前活动任务
    let currentTaskId = null;
    let logPollingInterval = null;
    let statusPollingInterval = null;
    
    // 开始日志轮询
    function startLogPolling(taskId) {
        // 清除之前的轮询
        if (logPollingInterval) {
            clearInterval(logPollingInterval);
        }
        
        let lastIndex = 0;
        logPollingInterval = setInterval(() => {
            fetch(`/api/logs/${taskId}?last_index=${lastIndex}`)
                .then(response => response.json())
                .then(data => {
                    if (data.logs && data.logs.length > 0) {
                        data.logs.forEach(log => {
                            loggerComponent.addLog(log);
                            
                            // 添加到当前会话
                            historyComponent.addLogToCurrentSession(log);
                            
                            // 检测浏览器URL
                            if (log.message.includes('正在访问网页:') || log.message.includes('浏览器访问:')) {
                                const urlMatch = log.message.match(/: (https?:\/\/[^\s]+)/);
                                if (urlMatch && urlMatch[1]) {
                                    browserComponent.loadUrl(urlMatch[1]);
                                }
                            }
                            
                            // 检测文件保存
                            if (log.message.includes('已保存文件:') || log.message.includes('Saved file:')) {
                                const fileMatch = log.message.match(/: ([^\s]+) - (.+)/);
                                if (fileMatch && fileMatch[1] && fileMatch[2]) {
                                    const filePath = fileMatch[1];
                                    const fileContent = fileMatch[2];
                                    fileManagerComponent.updateFiles({
                                        path: filePath,
                                        content: fileContent
                                    });
                                }
                            }
                        });
                        
                        lastIndex = data.next_index;
                    }
                })
                .catch(error => {
                    console.error('获取日志时出错:', error);
                });
        }, 1000);
    }
    
    // 开始状态轮询
    function startStatusPolling(taskId) {
        // 清除之前的轮询
        if (statusPollingInterval) {
            clearInterval(statusPollingInterval);
        }
        
        statusPollingInterval = setInterval(() => {
            fetch(`/api/status/${taskId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'completed') {
                        // 任务完成，停止轮询
                        clearInterval(statusPollingInterval);
                        clearInterval(logPollingInterval);
                        
                        // 移除加载指示器
                        const loadingElement = document.querySelector('.bot-message:last-child .thinking-dot').closest('.bot-message');
                        if (loadingElement) {
                            loadingElement.remove();
                        }
                        
                        // 添加机器人回复
                        if (data.response) {
                            chatComponent.addMessage(data.response, 'bot');
                            
                            // 添加到当前会话
                            historyComponent.addMessageToCurrentSession(data.response, 'bot');
                        }
                    }
                })
                .catch(error => {
                    console.error('获取状态时出错:', error);
                });
        }, 2000);
    }
    
    // 监听消息发送事件
    document.addEventListener('messageSent', function(e) {
        const message = e.detail.message;
        const loadingElement = e.detail.loadingElement;
        
        // 添加到当前会话
        historyComponent.addMessageToCurrentSession(message, 'user');
        
        // 发送请求 - 修改为正确的API路径
        fetch('/api/send', {  // 从 '/api/chat' 改为 '/api/send'
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        })
        .then(response => response.json())
        .then(data => {
            currentTaskId = data.task_id;
            
            // 开始轮询日志和状态
            startLogPolling(currentTaskId);
            startStatusPolling(currentTaskId);
        })
        .catch(error => {
            loadingElement.remove();
            chatComponent.addMessage('发送请求时出错，请重试', 'bot');
            console.error('发送请求时出错:', error);
        });
    });
    
    // 监听新会话事件
    document.addEventListener('newSession', function(e) {
        // 清空聊天记录
        document.getElementById('chat-messages').innerHTML = '';
        
        // 添加欢迎消息
        chatComponent.addMessage('你好！我是OpenManus智能助手。请输入您的问题或指令，我会尽力帮助您。', 'bot');
        
        // 清空日志
        loggerComponent.clearLogs();
        
        // 清空浏览器
        browserComponent.clear();
        
        // 清空文件
        fileManagerComponent.clear();
    });
    
    // 监听加载会话事件
    document.addEventListener('loadSession', function(e) {
        const session = e.detail.session;
        
        // 清空聊天记录
        document.getElementById('chat-messages').innerHTML = '';
        
        // 加载消息
        session.messages.forEach(msg => {
            chatComponent.addMessage(msg.content, msg.sender);
        });
        
        // 加载日志
        loggerComponent.loadLogs(session.logs);
        
        // 清空浏览器和文件（暂不支持保存）
        browserComponent.clear();
        fileManagerComponent.clear();
    });
    
    // 监听日志添加事件
    document.addEventListener('logAdded', function(e) {
        const log = e.detail.log;
        
        // 检测是否需要切换到日志标签
        if (log.level === 'ERROR' || log.message.includes('ERROR')) {
            document.querySelector('[data-tab="logs"]').click();
        }
    });
    
    // 添加键盘快捷键
    document.addEventListener('keydown', function(e) {
        // Alt+1, Alt+2, Alt+3 切换标签
        if (e.altKey) {
            if (e.key === '1') {
                document.querySelector('[data-tab="browser"]').click();
            } else if (e.key === '2') {
                document.querySelector('[data-tab="logs"]').click();
            } else if (e.key === '3') {
                document.querySelector('[data-tab="files"]').click();
            }
        }
        
        // Ctrl+R 开始/停止记录
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            loggerComponent.toggleRecording();
        }
        
        // Ctrl+P 暂停/继续日志
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            loggerComponent.togglePause();
        }
        
        // Ctrl+S 保存会话
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            historyComponent.saveCurrentSession();
        }
        
        // Ctrl+N 新会话
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            historyComponent.startNewChat();
        }
    });
    
    // 添加新的窗口大小调整处理
    window.addEventListener('resize', function() {
        // 通知浏览器组件窗口大小已更改
        if (browserComponent) {
            // 如果iframe已加载内容，重新应用缩放
            if (browserComponent.browserIframe.src && 
                browserComponent.browserIframe.src !== 'about:blank') {
                browserComponent.applyZoom();
            }
        }
    });
    
    // 初始化完成后自动聚焦到输入框
    document.getElementById('user-input').focus();
}); 