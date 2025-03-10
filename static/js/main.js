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
                btn.classList.remove('bg-brand-50', 'text-brand-700');
                btn.classList.add('text-gray-600', 'hover:bg-gray-50');
            });
            button.classList.remove('text-gray-600', 'hover:bg-gray-50');
            button.classList.add('bg-brand-50', 'text-brand-700');
            
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
                            
                            // 更新思考状态
                            const loadingElement = document.querySelector('.loading-indicator');
                            if (loadingElement) {
                                if (log.message.includes('思考') || log.message.includes('thoughts')) {
                                    chatComponent.updateThinkingMessage(loadingElement, log.message);
                                } else if (log.message.includes('执行工具') || log.message.includes('Activating tool')) {
                                    chatComponent.updateThinkingMessage(loadingElement, `🔧 ${log.message}`);
                                } else if (log.message.includes('分析') || log.message.includes('analyzing')) {
                                    chatComponent.updateThinkingMessage(loadingElement, `🔍 ${log.message}`);
                                }
                            }
                            
                            // 检测浏览器URL
                            if (log.message.includes('正在访问网页:') || log.message.includes('浏览器访问:')) {
                                const urlMatch = log.message.match(/: (https?:\/\/[^\s]+)/);
                                if (urlMatch && urlMatch[1]) {
                                    browserComponent.loadUrl(urlMatch[1]);
                                }
                            }
                            
                            // 检测文件保存 - 修改匹配模式以适应实际日志格式
                            if (log.message.includes('文件已保存:') || log.message.includes('调用文件保存工具')) {
                                console.log("检测到文件保存日志:", log.message);
                                
                                // 首先尝试解析工具调用参数
                                if (log.message.includes('调用文件保存工具')) {
                                    try {
                                        const paramMatch = log.message.match(/参数: ({.*})/);
                                        if (paramMatch) {
                                            const params = JSON.parse(paramMatch[1].replace(/'/g, '"'));
                                            if (params.file_path && params.content) {
                                                console.log("从参数中提取文件信息:", params.file_path);
                                                fileManagerComponent.updateFiles({
                                                    path: params.file_path,
                                                    content: params.content
                                                });
                                            }
                                        }
                                    } catch (e) {
                                        console.error('解析文件参数时出错:', e);
                                    }
                                }
                                
                                // 然后尝试匹配简单的文件路径
                                const simpleMatch = log.message.match(/文件已保存: ([^\s]+)/);
                                if (simpleMatch && simpleMatch[1]) {
                                    const filePath = simpleMatch[1];
                                    console.log("检测到文件路径:", filePath);
                                    
                                    // 如果文件内容还没有通过参数获取到，尝试从文件系统读取
                                    if (!fileManagerComponent.files[filePath]) {
                                        fetch(`/api/files/${filePath}`)
                                            .then(response => response.text())
                                            .then(content => {
                                                console.log("获取到文件内容:", filePath);
                                                fileManagerComponent.updateFiles({
                                                    path: filePath,
                                                    content: content
                                                });
                                            })
                                            .catch(error => {
                                                console.error('获取文件内容时出错:', error);
                                            });
                                    }
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
                        
                        // 移除加载状态
                        const loadingElement = document.querySelector('.loading-indicator');
                        if (loadingElement) {
                            loadingElement.remove();
                        }
                        
                        // 添加机器人回复
                        if (data.response) {
                            chatComponent.addMessage(data.response, 'bot');
                            
                            // 添加到当前会话
                            historyComponent.addMessageToCurrentSession(data.response, 'bot');
                        }
                        
                        // 重置当前任务ID
                        currentTaskId = null;
                    }
                })
                .catch(error => {
                    console.error('获取状态时出错:', error);
                });
        }, 1000);
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
    
    // 监听会话加载事件
    document.addEventListener('sessionLoaded', function(e) {
        const session = e.detail.session;
        
        // 清空聊天消息
        chatComponent.clearMessages();
        
        // 添加欢迎消息
        chatComponent.addMessage('你好！我是OpenManus智能助手。请输入您的问题或指令，我会尽力帮助您。', 'bot');
        
        // 添加会话消息
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
    
    // 添加API端点获取文件内容
    // 注意：这需要在服务器端添加相应的API端点
    // 如果服务器端没有此API，我们需要修改服务器代码
}); 