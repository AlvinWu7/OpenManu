from flask import Flask, render_template, request, jsonify
import asyncio
import sys
import os
from io import StringIO
import threading
import queue
import time
import uuid
import logging

# 导入OpenManus组件
from app.agent.manus import Manus
from app.logger import logger

# 创建Flask应用
app = Flask(__name__)

# 全局变量
manus_agent = None
active_tasks = {}
task_results = {}
saved_files = {}  # 保存文件记录
task_logs_queue = {}  # 存储每个任务的日志队列

# 初始化Manus
def initialize_agent():
    global manus_agent
    if manus_agent is None:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        logger.info("初始化Manus Agent...")
        manus_agent = loop.run_until_complete(async_initialize_agent())
        logger.info("Manus Agent初始化完成")
    return manus_agent

async def async_initialize_agent():
    return Manus()

# 处理用户输入的异步函数
async def process_prompt(task_id, message):
    global manus_agent, task_results, saved_files, task_logs_queue
    
    # 初始化任务日志队列
    task_logs_queue[task_id] = []
    browser_urls = []
    
    # 创建日志添加函数
    def add_log(message, level="INFO"):
        log_entry = {
            "timestamp": time.time(),
            "level": level,
            "message": message
        }
        task_logs_queue[task_id].append(log_entry)
        print(f"[{level}] {message}")
    
    # 更强的日志捕获 - 同时捕获stdout和stderr
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    captured_output = StringIO()
    captured_error = StringIO()
    sys.stdout = captured_output
    sys.stderr = captured_error
    
    try:
        # 记录任务开始
        add_log(f"开始处理任务 {task_id}...")
        
        # Hook到OpenManus的日志系统
        # 创建自定义日志处理器
        class QueueHandler(logging.Handler):
            def emit(self, record):
                log_message = self.format(record)
                log_level = record.levelname
                add_log(log_message, log_level)
        
        # 获取OpenManus的logger并添加我们的处理器
        manus_logger = logging.getLogger("app.agent")
        queue_handler = QueueHandler()
        queue_handler.setFormatter(logging.Formatter('%(message)s'))
        manus_logger.addHandler(queue_handler)
        
        # 处理请求
        add_log(f"处理任务 {task_id}...")
        
        # 监听文件保存事件
        original_file_saver = manus_agent.available_tools.get_tool("file_saver")
        original_browser_use = manus_agent.available_tools.get_tool("browser_use")
        
        # 记录工具信息
        add_log(f"可用工具: {list(manus_agent.available_tools.tool_map.keys())}")
        
        # 文件保存工具包装器
        async def file_saver_wrapper(*args, **kwargs):
            add_log(f"调用文件保存工具，参数: {kwargs}", "INFO")
            # 直接调用原始工具的 execute 方法
            result = await original_file_saver.execute(*args, **kwargs)
            
            # 记录保存的文件
            if "successfully saved" in result:
                file_path = kwargs.get("file_path")
                content = kwargs.get("content")
                if file_path and content:
                    if task_id not in saved_files:
                        saved_files[task_id] = []
                    saved_files[task_id].append({
                        "path": file_path,
                        "content": content
                    })
                    add_log(f"文件已保存: {file_path}", "INFO")
            
            return result
        
        # 浏览器工具包装器
        async def browser_use_wrapper(*args, **kwargs):
            # 记录URL
            url = kwargs.get("url")
            add_log(f"调用浏览器工具，URL: {url}", "INFO")
            
            if url:
                browser_urls.append(url)
                add_log(f"正在访问网页: {url}", "INFO")
                # 确保URL被记录到结果中
                if task_id not in task_results:
                    task_results[task_id] = {"browser_urls": []}
                elif "browser_urls" not in task_results[task_id]:
                    task_results[task_id]["browser_urls"] = []
                
                if "browser_urls" in task_results[task_id]:
                    task_results[task_id]["browser_urls"].append(url)
            
            # 调用原始工具
            result = await original_browser_use.execute(*args, **kwargs)
            add_log(f"浏览器工具返回结果: {result[:100] if len(result) > 100 else result}...", "INFO")
            return result
        
        # 替换原始工具的执行方法
        class ToolWrapper:
            def __init__(self, original_tool, wrapper_func):
                self.original_tool = original_tool
                self.wrapper_func = wrapper_func
                # 复制原始工具的所有属性
                self.name = original_tool.name
                self.description = original_tool.description
                self.parameters = original_tool.parameters
            
            async def execute(self, *args, **kwargs):
                add_log(f"执行工具 {self.name} 的 execute 方法", "INFO")
                return await self.wrapper_func(*args, **kwargs)
            
            async def __call__(self, *args, **kwargs):
                add_log(f"执行工具 {self.name} 的 __call__ 方法", "INFO")
                return await self.wrapper_func(*args, **kwargs)
            
            def to_param(self):
                return self.original_tool.to_param()
        
        # 创建包装器并替换原始工具
        file_saver_wrapper_obj = ToolWrapper(original_file_saver, file_saver_wrapper)
        browser_use_wrapper_obj = ToolWrapper(original_browser_use, browser_use_wrapper)
        
        manus_agent.available_tools.tool_map["file_saver"] = file_saver_wrapper_obj
        manus_agent.available_tools.tool_map["browser_use"] = browser_use_wrapper_obj
        
        add_log("工具包装器已安装", "INFO")
        
        # 运行处理
        add_log("开始运行 Manus 处理...", "INFO")
        await manus_agent.run(message)
        add_log("Manus 处理完成", "INFO")
        
        # 恢复标准输出和错误
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
        # 移除自定义日志处理器
        manus_logger.removeHandler(queue_handler)
        
        # 获取完整输出
        output = captured_output.getvalue()
        error_output = captured_error.getvalue()
        
        # 处理标准输出中的日志
        for line in output.split('\n'):
            if line.strip():
                # 根据行格式确定日志级别
                if "[INFO]" in line or "INFO" in line:
                    add_log(line, "INFO")
                elif "[WARNING]" in line or "WARNING" in line:
                    add_log(line, "WARNING")
                elif "[ERROR]" in line or "ERROR" in line:
                    add_log(line, "ERROR")
                else:
                    add_log(line, "INFO")
        
        # 处理标准错误中的日志
        for line in error_output.split('\n'):
            if line.strip():
                add_log(line, "ERROR")
        
        # 提取最终结果（非日志内容）
        result_lines = []
        for line in output.split("\n"):
            # 只提取非日志的实际输出内容作为结果
            if (not "[INFO]" in line and 
                not "[WARNING]" in line and 
                not "[ERROR]" in line and
                not "✨" in line and
                not line.startswith("LOG:") and
                line.strip()):
                result_lines.append(line)
        
        # 如果没有找到结果行，使用合适的默认消息
        if not result_lines:
            result = "处理完成，但没有明确的输出结果。请查看日志了解详情。"
        else:
            result = "\n".join(result_lines)
        
        # 保存结果
        task_results[task_id] = {
            "status": "completed",
            "result": result,
            "has_logs": True  # 标记有日志可查看
        }
        
        # 添加文件信息
        if task_id in saved_files:
            task_results[task_id]["files"] = saved_files[task_id]
            add_log(f"生成了 {len(saved_files[task_id])} 个文件", "INFO")
        
        # 添加浏览器URL
        if browser_urls:
            task_results[task_id]["browser_urls"] = browser_urls
        
        add_log(f"任务 {task_id} 完成", "INFO")
        
    except Exception as e:
        # 恢复标准输出和错误
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
        # 记录异常
        error_msg = f"处理请求时发生错误: {str(e)}"
        add_log(error_msg, "ERROR")
        
        # 记录堆栈跟踪
        import traceback
        traceback_str = traceback.format_exc()
        add_log(traceback_str, "ERROR")
        
        # 保存错误
        task_results[task_id] = {
            "status": "error",
            "result": error_msg,
            "has_logs": True
        }
    
    # 从活动任务中移除
    if task_id in active_tasks:
        del active_tasks[task_id]
    
    # 注意：保留日志队列以便前端获取

# 运行异步任务的函数
def run_async_task(task_id, coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(coro)
    loop.close()

# 路由定义
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/send', methods=['POST'])
def send_message():
    # 确保agent已初始化
    initialize_agent()
    
    # 获取用户消息
    data = request.json
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({
            "status": "error",
            "message": "消息不能为空"
        }), 400
    
    # 创建任务ID
    task_id = str(uuid.uuid4())
    
    # 创建任务
    active_tasks[task_id] = {
        "message": message,
        "created_at": time.time()
    }
    
    # 启动异步处理线程
    thread = threading.Thread(
        target=run_async_task,
        args=(task_id, process_prompt(task_id, message))
    )
    thread.start()
    
    return jsonify({
        "status": "processing",
        "task_id": task_id
    })

@app.route('/api/status/<task_id>', methods=['GET'])
def check_status(task_id):
    # 检查任务是否完成
    if task_id in task_results:
        result = task_results[task_id]
        # 任务完成后，可以选择性地删除结果
        # del task_results[task_id]
        return jsonify(result)
    
    # 检查任务是否正在处理
    if task_id in active_tasks:
        return jsonify({
            "status": "processing",
            "message": "任务正在处理中"
        })
    
    # 任务不存在
    return jsonify({
        "status": "not_found",
        "message": "任务未找到"
    }), 404

# 获取实时日志的API端点
@app.route('/api/logs/<task_id>', methods=['GET'])
def get_logs(task_id):
    # 获取上次请求的日志索引
    last_index = request.args.get('last_index', 0)
    try:
        last_index = int(last_index)
    except ValueError:
        last_index = 0
    
    # 获取新日志
    if task_id in task_logs_queue:
        logs = task_logs_queue[task_id][last_index:]
        return jsonify({
            "logs": logs,
            "next_index": last_index + len(logs)
        })
    
    return jsonify({
        "logs": [],
        "next_index": last_index
    })

# HTML模板 (创建templates目录并添加index.html)
@app.route('/templates/index.html')
def get_template():
    return render_template('index.html')

# 主程序
if __name__ == "__main__":
    # 确保templates目录存在
    os.makedirs("templates", exist_ok=True)
    
    # 初始化agent
    initialize_agent()
    
    # 启动Flask应用
    app.run(host="0.0.0.0", port=8009, debug=True)