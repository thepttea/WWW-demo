#!/usr/bin/env python3
"""
测试多轮干预功能
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_multi_round_simulation():
    print("🧪 开始测试多轮干预功能\n")
    
    # 步骤 1: 启动模拟
    print("=" * 60)
    print("步骤 1: 启动新模拟")
    print("=" * 60)
    
    start_payload = {
        "initialTopic": "某知名科技公司被曝出数据泄露事件，涉及上百万用户隐私信息",
        "llmModel": "gpt-4o-mini",
        "simulationConfig": {
            "agents": 10,
            "interactionProbability": 0.8,
            "positiveResponseProbability": 0.3,
            "negativeResponseProbability": 0.3,
            "neutralResponseProbability": 0.4,
            "initialPositiveSentiment": 0.2,
            "initialNegativeSentiment": 0.6,
            "initialNeutralSentiment": 0.2
        }
    }
    
    response = requests.post(f"{BASE_URL}/scenario1/simulation/start", json=start_payload)
    print(f"状态码: {response.status_code}")
    
    if response.status_code != 200:
        print(f"❌ 启动失败: {response.text}")
        return
    
    data = response.json()
    if not data.get("success"):
        print(f"❌ 启动失败: {data}")
        return
    
    simulation_id = data["data"]["simulationId"]
    print(f"✅ 模拟启动成功!")
    print(f"Simulation ID: {simulation_id}\n")
    
    # 步骤 2-4: 执行三轮公关策略
    strategies = [
        "立即发布官方声明，承认数据泄露事件，向用户致歉。同时宣布已采取紧急措施修复漏洞。",
        "发布详细技术报告，说明漏洞原因和修复过程。邀请第三方安全公司进行审计。",
        "宣布为受影响用户提供免费信用监控服务一年，并设立专项赔偿基金。"
    ]
    
    for round_num, strategy in enumerate(strategies, 1):
        print("=" * 60)
        print(f"步骤 {round_num + 1}: 执行第 {round_num} 轮模拟")
        print("=" * 60)
        print(f"公关策略: {strategy[:50]}...")
        
        strategy_payload = {"prStrategy": strategy}
        
        response = requests.post(
            f"{BASE_URL}/scenario1/simulation/{simulation_id}/add-strategy",
            json=strategy_payload
        )
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ 第 {round_num} 轮失败: {response.text}")
            break
        
        data = response.json()
        if not data.get("success"):
            print(f"❌ 第 {round_num} 轮失败: {data}")
            break
        
        result = data["data"]
        print(f"✅ 第 {round_num} 轮完成!")
        print(f"   状态: {result['status']}")
        print(f"   轮次: {result['round']}")
        print(f"   活跃 Agents: {result['summary']['activeAgents']}/{result['summary']['totalAgents']}")
        print(f"   总帖子数: {result['summary']['totalPosts']}")
        print(f"   情感分布: 正{result['summary']['positiveSentiment']:.2f} | "
              f"负{result['summary']['negativeSentiment']:.2f} | "
              f"中{result['summary']['neutralSentiment']:.2f}")
        
        # 显示部分 agent 信息
        if result.get('agents'):
            print(f"\n   Agent 样例 (前3个):")
            for agent in result['agents'][:3]:
                print(f"   - {agent['username']}: "
                      f"立场={agent['stanceScore']} | "
                      f"帖子={agent['postsSent']} | "
                      f"状态={'活跃' if agent['isActive'] else '退出'}")
                if agent.get('latestPost'):
                    post_preview = agent['latestPost'][:60]
                    print(f"     最新发言: {post_preview}...")
        
        print()
        
        # 如果不是最后一轮，稍微等待一下
        if round_num < len(strategies):
            print("⏳ 等待 2 秒后继续下一轮...\n")
            time.sleep(2)
    
    # 步骤 5: 停止模拟
    print("=" * 60)
    print("步骤 5: 停止模拟")
    print("=" * 60)
    
    response = requests.post(f"{BASE_URL}/scenario1/simulation/{simulation_id}/stop")
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            print(f"✅ 模拟已停止: {data['data']['message']}")
        else:
            print(f"⚠️  停止响应: {data}")
    else:
        print(f"❌ 停止失败: {response.text}")
    
    print("\n" + "=" * 60)
    print("🎉 测试完成!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_multi_round_simulation()
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到后端服务器")
        print("请确保后端服务器正在运行: python backend/code/api_server.py")
    except Exception as e:
        print(f"❌ 测试出错: {e}")
        import traceback
        traceback.print_exc()
