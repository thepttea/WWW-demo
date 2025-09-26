# Multi-Agent Public Opinion Simulation Framework 
这是一个基于大型语言模型（LLM）的动态多智能体（Multi-Agent）系统，旨在模拟复杂社交网络环境中的舆论形成与演变过程。

该框架通过为每个智能体（Agent）赋予独特的、从外部文件加载的“人格”（Persona），并模拟它们在不同社交平台（如微博、朋友圈、论坛）上的信息接收、思考决策和内容发布行为，来复现一个微缩的、动态的舆论场。

## 核心特性
* **动态人格系统:** 智能体的人格、行为模式和模型配置（如使用的LLM、温度参数）均由外部 `personas.csv` 文件定义，方便扩展和定制，无需修改代码。
* **模拟社交网络:** 程序启动时会创建一个包含“关注”（弱连接）和“好友”（强连接）关系的复杂社交网络图，智能体接收信息流的机制受此网络结构影响。
* **多平台信息流:** 内置了对不同社交平台信息分发逻辑的模拟：
    * **朋友圈 (WeChat Moments-like):** 仅互为好友可见。
    * **微博/Twitter (Weibo/Twitter-like):** 基于关注关系和影响力算法推荐。
    * **抖音/TikTok (TikTok-like):** 纯粹基于算法和影响力推荐。 
    * **论坛 (Forum-like):** 内容对所有参与者开放。

* **深度认知与记忆:** 每个智能体都拥有独立的记忆库（使用 chromadb），在做决策前会结合自身人设、长期记忆和当前看到的新信息进行一轮“内心思考”，使其行为更具连贯性和深度。
* **智能决策系统:** 智能体在每个回合中独立决策其行为：发表观点（`POST`）、保持沉默（`NO_ACTION`） 或 永久退出讨论（`DROPOUT`）。
* **自动化日志与报告:**
    * 所有模拟过程的细节（包括智能体的内心独白）都会被记录到带时间戳的日志文件中。
    * 模拟结束后，系统会自动调用LLM对整个舆论过程进行分析，生成一份包含核心议题、观点阵营、关键影响者（KOL）和舆论演变趋势的总结报告。

## 文件结构
```
├── aops/
│   ├── main.py             # 主程序入口，运行模拟
│   ├── agent.py            # 定义Agent的核心认知和行为逻辑
│   ├── network.py          # 创建和管理人际关系网络
│   ├── persona_manager.py  # 从CSV加载和管理Agent人设
│   ├── llm_provider.py     # LLM模型加载与配置
│   ├── config.py           # 存放API Key和模型端点等配置信息
│   └── logger.py           # 日志记录模块
│
├── data/
│   └── personas.csv        # Agent人设定义文件
│
└── logs/                   # 存放每次模拟运行的日志和结果
```

## 如何使用
### 1.环境配置
首先，确保您已安装所有必需的Python库。
```
pip install chromadb pydantic langchain langgraph networkx langchain-openai python-dotenv
```

### 2. 配置模型API
打开 `config.py` 文件，修改以下配置项：
* `CUSTOM_API_BASE`: 设置OpenAI格式的API端点。
* `API_KEY`: API密钥

### 3.定义智能体人设
项目的所有智能体“人设”都由 `/data/personas.csv` 文件定义。您可以仿照示例格式添加、修改或删除人设。

`personas.csv` 文件格式说明:
| 列名 | 说明 | 示例值 |
| :--- | :--- | :--- |
| `username` | 智能体的用户名 | `投资圈大佬` |
| `description` | 详细的角色背景、知识领域、性格和价值观描述 | `一位经验丰富的风险投资人，信奉价值投资...` |
| `emotional_style` | 智能体发言时的情绪和语言风格 | `激进型` |
| `influence_score` | 影响力分数（整数），会影响其帖子被推荐的概率 | `85` |
| `primary_platform` | 主要活跃的社交平台，决定信息收发模式。可选值：`Weibo/Twitter-like`, `WeChat Moments-like`, `TikTok-like`, `Forum-like` | `Weibo/Twitter-like` |
| `llm_model` | 该智能体思考时使用的具体LLM模型名称 | `gpt-4o-mini` |
| `llm_temperature` | LLM的温度参数（0.0-1.0），值越高，创造性和随机性越强 | `0.8` |

## 一些改进方向：
1. 模拟社交网络现在是使用随机数生成强弱关系，后续考虑使用llm根据两个人设来生成一个概率值或者关系权重；
2. 现在数据管理采用表格，后续会改为数据库；
3. 人设设定提示词仍然存在一定问题，后续尝试改进提示词达到更好的效果；
4. 现在舆论传播模拟路径方式比较简单，后续需要往更数据化的形式改进。

