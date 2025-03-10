class ChatComponent {
    constructor() {
        this.chatMessages = document.getElementById('chat-messages');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-button');
        
        // 绑定事件
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // 初始欢迎消息
        this.addMessage('你好！我是OpenManus智能助手。请输入您的问题或指令，我会尽力帮助您。', 'bot');
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `p-3 max-w-3/4 ${sender === 'user' ? 'user-message ml-auto' : 'bot-message'}`;
        
        // 添加头像和文本
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="flex items-start">
                    <div class="flex-1 break-words">${text}</div>
                    <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center ml-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="flex items-start">
                    <div class="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center mr-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div class="flex-1 break-words">${text}</div>
                </div>
            `;
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    addThinkingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex mb-4 loading-indicator';
        
        messageDiv.innerHTML = `
            <div class="flex-shrink-0 mr-3">
                <div class="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
            </div>
            <div class="flex-1 bg-gray-50 rounded-lg p-4">
                <div class="flex items-center text-gray-600">
                    <span class="thinking-dot">•</span>
                    <span class="thinking-dot mx-1">•</span>
                    <span class="thinking-dot">•</span>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }
    
    updateThinkingMessage(loadingElement, text) {
        if (!loadingElement) return;
        
        const contentDiv = loadingElement.querySelector('.bg-gray-50');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="flex items-center text-gray-600">
                    <span class="italic">${text}</span>
                </div>
            `;
        }
    }
    
    sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;
        
        // 清空输入框
        this.userInput.value = '';
        
        // 添加用户消息
        this.addMessage(message, 'user');
        
        // 添加加载状态
        const loadingElement = this.addThinkingMessage();
        
        // 触发消息发送事件
        const event = new CustomEvent('messageSent', {
            detail: { message, loadingElement }
        });
        document.dispatchEvent(event);
    }
    
    formatMessage(message) {
        // 处理代码块
        message = message.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
            return `<pre class="bg-gray-800 text-gray-200 rounded p-3 my-2 overflow-x-auto code-block"><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // 处理行内代码
        message = message.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-1 rounded">$1</code>');
        
        // 处理换行
        message = message.replace(/\n/g, '<br>');
        
        return message;
    }
    
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    clearMessages() {
        this.chatMessages.innerHTML = '';
    }
} 