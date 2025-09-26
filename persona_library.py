# persona_library.py 

# 这个人设部分就是都AI跑的，我主要让它考虑到不同的社交平台，身份，发言类型等，后面要改的话这个标签改了之后要和network.py，agent.py里的代码保持一致
PERSONA_LIBRARY = [
    # --- 平台: 微博/Twitter (公共广播, 粉丝关系) ---
    {"data": {
        "username": "MarketingPro_Serena", "description": "嗅觉敏锐的市场营销专家，擅长引爆话题。", "emotional_style": "激情支持型", "influence_score": 90,
        "primary_platform": "Weibo/Twitter-like"
    }},
    {"data": {
        "username": "Skeptical_Journalist", "description": "追求真相的调查记者，习惯于公开质疑。", "emotional_style": "尖锐批评型", "influence_score": 80,
        "primary_platform": "Weibo/Twitter-like"
    }},
    {"data": {
        "username": "TechBro_Elon", "description": "对前沿科技极度痴迷的工程师，喜欢公开布道。", "emotional_style": "激情支持型", "influence_score": 85,
        "primary_platform": "Weibo/Twitter-like"
    }},

    # --- 平台: 朋友圈/熟人社交 (私域, 好友关系) ---
    {"data": {
        "username": "ValueInvestor_Graham", "description": "经验丰富的价值投资者，只在自己的圈子分享深度见解。", "emotional_style": "尖锐批评型", "influence_score": 70,
        "primary_platform": "WeChat Moments-like"
    }},
    {"data": {
        "username": "Regulator_Tom", "description": "在监管机构工作的中年人，言辞谨慎，只在工作相关的圈子发言。", "emotional_style": "冷静分析型", "influence_score": 60,
        "primary_platform": "WeChat Moments-like"
    }},
    {"data": {
        "username": "Newbie_Investor", "description": "刚入市的年轻人，喜欢在朋友圈分享跟风信息。", "emotional_style": "激情支持型", "influence_score": 20,
        "primary_platform": "WeChat Moments-like"
    }},

    # --- 平台: 小红书/抖音 (内容与算法推荐) ---
    {"data": {
        "username": "ArtStudent_Vivian", "description": "艺术系学生，擅长用图片和短视频表达感性思考。", "emotional_style": "幽默讽刺型", "influence_score": 40,
        "primary_platform": "TikTok-like"
    }},
    {"data": {
        "username": "SocialMedia_Intern", "description": "社交媒体实习生，追逐网络热梗，擅长二次创作。", "emotional_style": "幽默讽刺型", "influence_score": 35,
        "primary_platform": "TikTok-like"
    }},

    # --- 平台: 专业论坛/社区 (圈层) ---
    {"data": {
        "username": "Cynical_Dev", "description": "看透一切的资深程序员，只在开发者社区吐槽。", "emotional_style": "幽默讽刺型", "influence_score": 55,
        "primary_platform": "Forum-like"
    }},
    {"data": {
        "username": "Ethical_Philosopher", "description": "大学哲学教授，习惯在学术论坛进行深度思辨。", "emotional_style": "冷静分析型", "influence_score": 65,
        "primary_platform": "Forum-like"
    }},
]