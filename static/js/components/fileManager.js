class FileManagerComponent {
    constructor() {
        this.savedFiles = document.getElementById('saved-files');
        this.filePreview = document.getElementById('file-preview');
        this.files = {};
    }
    
    updateFiles(newFiles) {
        if (!Array.isArray(newFiles)) {
            newFiles = [newFiles];
        }
        
        newFiles.forEach(file => {
            if (!this.files[file.path]) {
                this.files[file.path] = file.content;
                
                // 添加到文件列表
                if (this.savedFiles.querySelector('p')) {
                    this.savedFiles.innerHTML = ''; // 清除"尚未保存任何文件"提示
                }
                
                const fileItem = document.createElement('div');
                fileItem.className = 'px-3 py-2 bg-white rounded border border-gray-200 shadow-sm mb-2 cursor-pointer hover:bg-gray-50 transition-colors duration-200';
                
                // 确定文件类型图标
                let fileIcon = '';
                const ext = file.path.split('.').pop().toLowerCase();
                
                if (['txt', 'md', 'log'].includes(ext)) {
                    fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>';
                } else if (['py', 'js', 'html', 'css', 'java', 'c', 'cpp'].includes(ext)) {
                    fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>';
                } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) {
                    fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                } else {
                    fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>';
                }
                
                fileItem.innerHTML = `
                    <div class="flex items-center">
                        ${fileIcon}
                        <span class="ml-2 text-sm font-medium">${file.path}</span>
                    </div>
                `;
                
                fileItem.addEventListener('click', () => {
                    // 显示文件内容
                    this.filePreview.innerHTML = '';
                    
                    // 创建代码预览
                    const codeElement = document.createElement('pre');
                    codeElement.className = 'code-block p-4 bg-gray-50 rounded border border-gray-200 text-gray-800 overflow-x-auto';
                    codeElement.textContent = file.content;
                    this.filePreview.appendChild(codeElement);
                    
                    // 高亮选中的文件
                    document.querySelectorAll('#saved-files > div').forEach(item => {
                        item.classList.remove('bg-blue-50', 'border-blue-200');
                        item.classList.add('bg-white', 'border-gray-200');
                    });
                    fileItem.classList.remove('bg-white', 'border-gray-200');
                    fileItem.classList.add('bg-blue-50', 'border-blue-200');
                });
                
                this.savedFiles.appendChild(fileItem);
                
                // 自动显示第一个文件
                if (Object.keys(this.files).length === 1) {
                    fileItem.click();
                }
            }
        });
    }
    
    clear() {
        this.savedFiles.innerHTML = '<p class="text-gray-500 italic">尚未保存任何文件</p>';
        this.filePreview.innerHTML = '';
        this.files = {};
    }
} 