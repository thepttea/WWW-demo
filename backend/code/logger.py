# logger.py

import sys
import os
from datetime import datetime
from pathlib import Path

current_file = Path(__file__).resolve()
log_dir = current_file.parent / 'logs' 

class SimulationLogger:
    """模拟日志记录器，同时输出到控制台和文件"""
    
    def __init__(self, log_dir=log_dir, log_file_prefix="simulation"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # 创建带时间戳的日志文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = self.log_dir / f"{log_file_prefix}_{timestamp}.log"
        
        # 打开日志文件
        self.file_handle = open(self.log_file, 'w', encoding='utf-8')
        
        # 保存原始stdout
        self.original_stdout = sys.stdout
        self.original_stderr = sys.stderr
        
        print(f"日志文件已创建: {self.log_file}")
    
    def write(self, text):
        """同时写入控制台和文件"""
        if text.strip():  # 只记录非空文本
            # 写入文件
            self.file_handle.write(text)
            self.file_handle.flush()  # 立即刷新到文件
            
            # 写入控制台
            self.original_stdout.write(text)
            self.original_stdout.flush()
    
    def flush(self):
        """刷新缓冲区"""
        self.file_handle.flush()
        self.original_stdout.flush()
    
    def close(self):
        """关闭日志记录器"""
        if hasattr(self, 'file_handle') and self.file_handle:
            self.file_handle.close()
    
    def __enter__(self):
        """上下文管理器入口"""
        sys.stdout = self
        sys.stderr = self
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器退出"""
        sys.stdout = self.original_stdout
        sys.stderr = self.original_stderr
        self.close()

# 全局日志记录器实例
_logger_instance = None

def setup_logging(log_dir="logs", log_file_prefix="simulation"):
    """设置全局日志记录"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = SimulationLogger(log_dir, log_file_prefix)
    return _logger_instance

def get_logger():
    """获取日志记录器实例"""
    return _logger_instance

def log_message(message):
    """记录消息（兼容旧代码）"""
    if _logger_instance:
        _logger_instance.write(message + '\n')
    else:
        print(message)