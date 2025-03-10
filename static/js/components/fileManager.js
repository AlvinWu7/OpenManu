class FileManagerComponent {
    constructor() {
        this.savedFiles = document.getElementById('saved-files');
        this.filePreview = document.getElementById('file-preview');
        this.files = {};
        
        // 绑定事件委托
        this.savedFiles.addEventListener('click', (e) => {
            const fileLink = e.target.closest('.file-link');
            if (fileLink) {
                const filePath = fileLink.getAttribute('data-path');
                this.showFilePreview(filePath);
            }
        });
    }
    
    updateFiles(file) {
        console.log("更新文件:", file.path);
        // 保存文件
        this.files[file.path] = file.content;
        
        // 更新文件列表
        this.renderFileList();
        
        // 自动显示新添加的文件
        this.showFilePreview(file.path);
        
        // 切换到文件标签
        const filesTab = document.querySelector('[data-tab="files"]');
        if (filesTab) {
            console.log("切换到文件标签");
            filesTab.click();
        } else {
            console.error("未找到文件标签按钮");
        }
    }
    
    renderFileList() {
        console.log("渲染文件列表");
        // 清空文件列表
        this.savedFiles.innerHTML = '';
        
        // 获取文件路径列表
        const filePaths = Object.keys(this.files);
        console.log("当前文件列表:", filePaths);
        
        if (filePaths.length === 0) {
            this.savedFiles.innerHTML = '<p class="text-gray-500 italic">尚未保存任何文件</p>';
            return;
        }
        
        // 创建文件列表
        const fileList = document.createElement('div');
        fileList.className = 'space-y-1';
        
        filePaths.forEach(path => {
            const fileItem = document.createElement('div');
            fileItem.className = 'flex items-center';
            
            // 确定文件类型图标
            let fileIcon = '';
            if (path.endsWith('.js')) {
                fileIcon = '<svg class="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm16.525 13.707c-.131-.821-.666-1.511-2.252-2.155-.552-.259-1.165-.438-1.349-.854-.068-.248-.078-.382-.034-.529.113-.484.687-.629 1.137-.495.293.09.563.315.732.676.775-.507.775-.507 1.316-.844-.203-.314-.304-.451-.439-.586-.473-.528-1.103-.798-2.126-.775l-.528.067c-.507.124-.991.395-1.283.754-.855.968-.608 2.655.427 3.354 1.023.765 2.521.933 2.712 1.653.18.878-.652 1.159-1.475 1.058-.607-.136-.945-.439-1.316-1.002l-1.372.788c.157.359.337.517.607.832 1.305 1.316 4.568 1.249 5.153-.754.021-.067.18-.528.056-1.237l.034.049zm-6.737-5.434h-1.686c0 1.453-.007 2.898-.007 4.354 0 .924.047 1.772-.104 2.033-.247.517-.886.451-1.175.359-.297-.146-.448-.349-.623-.641-.047-.078-.082-.146-.095-.146l-1.368.844c.229.473.563.879.994 1.137.641.383 1.502.507 2.404.305.588-.17 1.095-.519 1.358-1.059.384-.697.302-1.553.299-2.509.008-1.541 0-3.083 0-4.635l.003-.042z"/></svg>';
            } else if (path.endsWith('.html') || path.endsWith('.htm')) {
                fileIcon = '<svg class="h-4 w-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm4.8 4.8v3.6H6v-6h1.2v2.4zm2.4-2.4h7.2v1.2H11.4v1.2h4.8v3.6h-7.2v-1.2h6v-1.2h-4.8V5.4zm8.4 0h1.2v6h-1.2v-2.4h-1.2v-1.2h1.2V5.4z"/></svg>';
            } else if (path.endsWith('.css')) {
                fileIcon = '<svg class="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm15.4 5.6c-.2-.8-1-1.4-1.8-1.4h-8.4c-.8 0-1.6.6-1.8 1.4l-.4 2.4c-.2.8.4 1.4 1.2 1.4h10.4c.8 0 1.4-.6 1.2-1.4l-.4-2.4zM9.8 9.4h-1.2v1.2h1.2V9.4zm2.4 0h-1.2v1.2h1.2V9.4zm2.4 0h-1.2v1.2h1.2V9.4z"/></svg>';
            } else if (path.endsWith('.json')) {
                fileIcon = '<svg class="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm14.4 12.6c-.6 0-1.2-.6-1.2-1.2s.6-1.2 1.2-1.2 1.2.6 1.2 1.2-.6 1.2-1.2 1.2zm0-4.8c-.6 0-1.2-.6-1.2-1.2s.6-1.2 1.2-1.2 1.2.6 1.2 1.2-.6 1.2-1.2 1.2zm-4.8 4.8c-.6 0-1.2-.6-1.2-1.2s.6-1.2 1.2-1.2 1.2.6 1.2 1.2-.6 1.2-1.2 1.2zm0-4.8c-.6 0-1.2-.6-1.2-1.2s.6-1.2 1.2-1.2 1.2.6 1.2 1.2-.6 1.2-1.2 1.2zm-4.8 4.8c-.6 0-1.2-.6-1.2-1.2s.6-1.2 1.2-1.2 1.2.6 1.2 1.2-.6 1.2-1.2 1.2zm0-4.8c-.6 0-1.2-.6-1.2-1.2s.6-1.2 1.2-1.2 1.2.6 1.2 1.2-.6 1.2-1.2 1.2z"/></svg>';
            } else if (path.endsWith('.py')) {
                fileIcon = '<svg class="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 13.25h2.25V11h-2.25v-.75h-1.5v.75H9.75v2.25h2.75v.75h1.5v-.75zm-4.5-9.75h5v1.5h-5v-1.5zm10.5 18v-7.5h-3v-3.75c0-.75-.6-1.5-1.5-1.5h-7.5c-.75 0-1.5.75-1.5 1.5v3.75h-3v7.5h3v-3.75h7.5v3.75h3zm-3-10.5v1.5h-1.5v-1.5h1.5zm-10.5 0v1.5h-1.5v-1.5h1.5z"/></svg>';
            } else if (path.endsWith('.md') || path.endsWith('.txt')) {
                fileIcon = '<svg class="h-4 w-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 4h7l5 5v11H6V4zm2 4h5v2H8V8zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"/></svg>';
            } else {
                fileIcon = '<svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/></svg>';
            }
            
            // 获取文件名（从路径中提取）
            const fileName = path.split('/').pop();
            
            fileItem.innerHTML = `
                <div class="mr-2">${fileIcon}</div>
                <a href="#" class="file-link text-sm text-brand-600 hover:text-brand-800 truncate" data-path="${path}">
                    ${fileName}
                </a>
            `;
            
            fileList.appendChild(fileItem);
        });
        
        this.savedFiles.appendChild(fileList);
    }
    
    showFilePreview(filePath) {
        // 获取文件内容
        const content = this.files[filePath];
        if (!content) return;
        
        // 清空预览区域
        this.filePreview.innerHTML = '';
        
        // 创建文件头部信息
        const fileHeader = document.createElement('div');
        fileHeader.className = 'mb-4 pb-2 border-b border-gray-200';
        fileHeader.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span class="text-gray-700 font-medium">${filePath}</span>
                </div>
                <button class="download-file-button px-2 py-1 text-xs bg-brand-100 text-brand-700 rounded hover:bg-brand-200" data-path="${filePath}">
                    下载文件
                </button>
            </div>
        `;
        this.filePreview.appendChild(fileHeader);
        
        // 创建文件内容预览
        const fileContent = document.createElement('pre');
        fileContent.className = 'text-sm text-gray-800 whitespace-pre-wrap';
        
        // 处理不同类型的文件
        if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css') || filePath.endsWith('.json') || filePath.endsWith('.py')) {
            // 代码文件，添加语法高亮
            fileContent.innerHTML = `<code class="language-${filePath.split('.').pop()}">${this.escapeHtml(content)}</code>`;
            fileContent.className += ' bg-gray-50 p-4 rounded';
        } else if (filePath.endsWith('.md')) {
            // Markdown文件，简单渲染
            fileContent.innerHTML = this.renderMarkdown(content);
            fileContent.className = 'markdown-content';
        } else if (filePath.endsWith('.txt')) {
            // 纯文本文件
            fileContent.textContent = content;
            fileContent.className += ' bg-gray-50 p-4 rounded';
        } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png') || filePath.endsWith('.gif')) {
            // 图片文件
            const img = document.createElement('img');
            img.src = content;
            img.className = 'max-w-full h-auto';
            img.alt = filePath.split('/').pop();
            fileContent.appendChild(img);
        } else {
            // 其他文件类型
            fileContent.textContent = content;
        }
        
        this.filePreview.appendChild(fileContent);
        
        // 添加下载按钮事件
        const downloadButton = this.filePreview.querySelector('.download-file-button');
        if (downloadButton) {
            downloadButton.addEventListener('click', () => this.downloadFile(filePath, content));
        }
    }
    
    downloadFile(filePath, content) {
        const fileName = filePath.split('/').pop();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    renderMarkdown(text) {
        // 简单的Markdown渲染
        return text
            .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
            .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-3">$1</h2>')
            .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mb-2">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
    
    clear() {
        this.files = {};
        this.savedFiles.innerHTML = '<p class="text-gray-500 italic">尚未保存任何文件</p>';
        this.filePreview.innerHTML = '';
    }
} 