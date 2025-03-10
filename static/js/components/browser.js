class BrowserComponent {
    constructor() {
        this.browserIframe = document.getElementById('browser-iframe');
        this.browserUrl = document.getElementById('browser-url');
        this.openUrlButton = document.getElementById('open-url-button');
        this.zoomLevel = 0.8; // 默认缩放级别
        
        // 添加缩放控制按钮
        this.setupZoomControls();
        
        this.openUrlButton.addEventListener('click', () => {
            const url = this.browserUrl.value;
            if (url) {
                window.open(url, '_blank');
            }
        });
        
        // 监听iframe加载完成事件
        this.browserIframe.addEventListener('load', () => this.handleIframeLoad());
    }
    
    setupZoomControls() {
        // 创建缩放控制容器
        const zoomControls = document.createElement('div');
        zoomControls.className = 'flex items-center ml-2';
        zoomControls.innerHTML = `
            <button id="zoom-out" class="p-1 rounded text-gray-600 hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
            </button>
            <span id="zoom-level" class="text-xs text-gray-600 mx-1">100%</span>
            <button id="zoom-in" class="p-1 rounded text-gray-600 hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
            </button>
            <button id="zoom-reset" class="text-xs text-blue-600 hover:text-blue-800 ml-2">
                重置
            </button>
        `;
        
        // 添加到URL栏旁边
        const urlContainer = document.querySelector('.bg-gray-100.border-b.border-gray-200.p-2.flex.items-center');
        urlContainer.appendChild(zoomControls);
        
        // 添加事件监听器
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-reset').addEventListener('click', () => this.resetZoom());
    }
    
    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 0.1, 2.0);
        this.applyZoom();
    }
    
    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
        this.applyZoom();
    }
    
    resetZoom() {
        this.zoomLevel = 1.0;
        this.applyZoom();
    }
    
    applyZoom() {
        try {
            const iframeDoc = this.browserIframe.contentDocument || this.browserIframe.contentWindow.document;
            const body = iframeDoc.body;
            
            if (body) {
                body.style.zoom = this.zoomLevel;
                body.style.transformOrigin = 'top left';
                body.style.transform = `scale(${this.zoomLevel})`;
                body.style.width = `${100/this.zoomLevel}%`;
            }
            
            // 更新缩放级别显示
            document.getElementById('zoom-level').textContent = `${Math.round(this.zoomLevel * 100)}%`;
        } catch (e) {
            console.warn('无法应用缩放:', e);
        }
    }
    
    handleIframeLoad() {
        try {
            const iframe = this.browserIframe;
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // 添加自定义样式到iframe内容
            const style = iframeDoc.createElement('style');
            style.textContent = `
                body {
                    font-family: 'Inter', sans-serif;
                    line-height: 1.5;
                    margin: 0;
                    padding: 0;
                }
                
                /* 确保内容不会溢出 */
                img, video, iframe {
                    max-width: 100%;
                    height: auto;
                }
                
                /* 添加滚动条样式 */
                ::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                
                ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 10px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `;
            iframeDoc.head.appendChild(style);
            
            // 应用当前缩放级别
            this.applyZoom();
            
            // 添加适应视口的meta标签
            const meta = iframeDoc.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0';
            iframeDoc.head.appendChild(meta);
            
        } catch (e) {
            console.warn('无法修改iframe内容:', e);
        }
    }
    
    loadUrl(url) {
        if (!url) return;
        
        this.browserUrl.value = url;
        this.browserIframe.src = url;
        
        // 重置缩放级别
        this.resetZoom();
        
        // 切换到浏览器标签
        document.querySelector('[data-tab="browser"]').click();
    }
    
    clear() {
        this.browserIframe.src = 'about:blank';
        this.browserUrl.value = '';
        this.resetZoom();
    }
} 