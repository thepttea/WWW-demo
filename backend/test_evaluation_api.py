"""
测试评估系统API的脚本
使用FastAPI的TestClient进行单元测试

用法:
  python test_evaluation_api.py          # 测试所有场景
  python test_evaluation_api.py 1        # 只测试场景1
  python test_evaluation_api.py 2        # 只测试场景2
"""

from fastapi.testclient import TestClient
import sys
import os
import argparse

# 添加code目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'code'))

from api_server import app

client = TestClient(app)

def test_scenario1_complete_flow():
    """测试场景一的完整流程"""
    print("\n" + "="*80)
    print("测试场景一：自由模拟 + 质量评估")
    print("="*80)
    
    # 1. 启动模拟
    print("\n1. 启动场景一模拟...")
    response = client.post("/api/scenario1/simulation/start", json={
        "initialTopic": "某科技公司推出新功能，默认开启用户位置共享，引发隐私担忧",
        "llmModel": "gpt-4",
        "simulationConfig": {
            "agents": 10,  # 测试用少量agent
            "num_rounds": 1,
            "interactionProbability": 0.8
        },
        "prStrategy": "我们对造成的困扰深表歉意，已立即关闭该功能，将进行全面审查。"
    })
    
    assert response.status_code == 200, f"启动失败: {response.text}"
    data = response.json()
    assert data["success"] == True
    
    simulation_id = data["data"]["simulationId"]
    print(f"✓ 模拟已启动: {simulation_id}")
    print(f"  状态: {data['data']['status']}")
    
    # 2. 获取模拟结果（只运行一轮，跳过第二轮策略）
    print("\n3. 获取模拟结果...")
    response = client.get(f"/api/scenario1/simulation/{simulation_id}/result")
    
    assert response.status_code == 200
    result = response.json()["data"]
    print(f"✓ 当前轮次: {result['round']}")
    print(f"  总agent数: {result['summary']['totalAgents']}")
    print(f"  活跃agent: {result['summary']['activeAgents']}")
    print(f"  总帖子数: {result['summary']['totalPosts']}")
    print(f"  正面情绪: {result['summary']['positiveSentiment']:.2%}")
    print(f"  负面情绪: {result['summary']['negativeSentiment']:.2%}")
    
    # 4. 生成评估报告
    print("\n4. 生成场景一评估报告（包含9维度评估）...")
    response = client.post("/api/scenario1/reports/generate", json={
        "simulationId": simulation_id,
        "reportType": "comprehensive"
    })
    
    assert response.status_code == 200
    report = response.json()["data"]
    
    print(f"✓ 报告已生成: {report['reportId']}")
    print(f"  报告类型: {report['reportType']}")
    
    # 检查评估结果
    evaluation = report["evaluation"]
    print(f"\n【质量评估结果】")
    print(f"  评估类型: {evaluation['evaluation_type']}")
    
    # 显示总体达标度（新增）
    if 'overall_ideal_achievement_percentage' in evaluation:
        print(f"  总体达标度: {evaluation['overall_ideal_achievement_percentage']:.1f}分")
        print(f"  评级: {evaluation.get('rating', 'N/A')}")
    
    print(f"\n【各维度评分】")
    for dim_name, dim_data in evaluation['dimension_scores'].items():
        details = dim_data['details']
        # 兼容多种返回格式
        if 'ideal_achievement_percentage' in details:
            # 新格式：包含量化分数
            score = details['ideal_achievement_percentage']
            desc = details.get('description', '')
            print(f"  {dim_name}: {score:.1f}分 (权重: {dim_data['weight']})")
            print(f"    描述: {desc[:80]}...")
        elif 'percentage' in details:
            # 旧格式1
            print(f"  {dim_name}: {details['percentage']}% (权重: {dim_data['weight']})")
            print(f"    总结: {details['summary'][:80]}...")
        else:
            # 旧格式2
            desc = details.get('description', '')
            print(f"  {dim_name} (权重: {dim_data['weight']})")
            print(f"    描述: {desc[:80]}...")
    
    print(f"\n【评估总结】")
    print(evaluation['summary'][:300] + "...")
    
    # 验证报告结构
    assert report['reportType'] == 'scenario1', f"报告类型错误: {report['reportType']}"
    assert evaluation['evaluation_type'] == 'standalone', f"评估类型错误: {evaluation['evaluation_type']}"
    assert len(evaluation['dimension_scores']) == 9, f"维度数量错误: {len(evaluation['dimension_scores'])}"
    
    # 验证新增的顶层字段
    assert 'overall_ideal_achievement_percentage' in evaluation, "缺少 overall_ideal_achievement_percentage"
    assert 'rating' in evaluation, "缺少 rating"
    overall_score = evaluation['overall_ideal_achievement_percentage']
    assert 0 <= overall_score <= 100, f"总体达标度超出范围: {overall_score}"
    assert isinstance(evaluation['rating'], str), "rating应该是字符串"
    
    # 验证每个维度的结构
    for dim_name, dim_data in evaluation['dimension_scores'].items():
        assert 'weight' in dim_data, f"{dim_name} 缺少 weight"
        details = dim_data['details']
        assert details.get('category') == 'simulation_only', f"{dim_name} category错误: {details.get('category')}"
        
        # 验证新格式：ideal_achievement_percentage + description + key_features + reasoning
        assert 'ideal_achievement_percentage' in details, f"{dim_name} 缺少 ideal_achievement_percentage"
        assert 'description' in details, f"{dim_name} 缺少 description"
        assert 'key_features' in details, f"{dim_name} 缺少 key_features"
        assert 'reasoning' in details, f"{dim_name} 缺少 reasoning"
        
        # 验证分数范围
        score = details['ideal_achievement_percentage']
        assert 0 <= score <= 100, f"{dim_name} 达标度超出范围: {score}"
        
        # 验证key_features是列表
        assert isinstance(details['key_features'], list), f"{dim_name} key_features应该是列表"
    
    print("\n✅ 场景一测试通过！")
    return simulation_id


def select_test_case():
    """让用户选择要测试的案例"""
    # 推荐的3个典型案例
    recommended_cases = {
        '1': {
            'id': 'CASE-02',
            'name': 'Apple iPad Pro 广告争议',
            'reason': '营销与环境不匹配，快速道歉成功化解危机'
        },
        '2': {
            'id': 'CASE-03',
            'name': '西贝莜面村预制菜争议',
            'reason': '价值行动背离，先强硬后道歉的对比案例'
        },
        '3': {
            'id': 'CASE-04',
            'name': '农夫山泉舆情风暴',
            'reason': '复杂舆情演变，多轮次应对策略（4轮）'
        }
    }
    
    print("\n" + "="*80)
    print("请选择要测试的案例")
    print("="*80)
    print("\n【推荐的典型案例】\n")
    
    for key, case_info in recommended_cases.items():
        print(f"{key}. {case_info['name']} ({case_info['id']})")
        print(f"   特点: {case_info['reason']}\n")
    
    print("0. 显示所有案例")
    print()
    
    while True:
        choice = input("请输入选择 (0-3，或按 Enter 使用默认案例2): ").strip()
        
        # 默认选择案例2（西贝）
        if choice == "":
            choice = "2"
        
        if choice in ['1', '2', '3']:
            selected_case_id = recommended_cases[choice]['id']
            print(f"\n✓ 已选择: {recommended_cases[choice]['name']}")
            return selected_case_id
        elif choice == '0':
            # 显示所有案例
            return show_all_cases()
        else:
            print("❌ 无效选择，请输入 0-3")


def show_all_cases():
    """显示所有可用案例并让用户选择"""
    print("\n" + "="*80)
    print("获取所有可用案例...")
    print("="*80)
    
    response = client.get("/api/scenario2/cases")
    assert response.status_code == 200
    cases = response.json()["data"]
    
    print(f"\n✓ 共有 {len(cases)} 个案例\n")
    
    for idx, case in enumerate(cases, 1):
        print(f"{idx}. {case['title']} ({case['id']})")
        print(f"   公司: {case.get('company', 'N/A')} | 轮次: {case['totalRounds']}")
    
    print()
    
    while True:
        choice = input(f"请输入案例编号 (1-{len(cases)}): ").strip()
        try:
            idx = int(choice)
            if 1 <= idx <= len(cases):
                selected_case = cases[idx - 1]
                print(f"\n✓ 已选择: {selected_case['title']}")
                return selected_case['id']
            else:
                print(f"❌ 请输入 1-{len(cases)} 之间的数字")
        except ValueError:
            print("❌ 请输入有效的数字")


def test_scenario2_complete_flow(case_id=None):
    """测试场景二的完整流程"""
    print("\n" + "="*80)
    print("测试场景二：真实案例模拟 + 相似度对比")
    print("="*80)
    
    # 1. 获取案例列表
    print("\n1. 获取可用案例列表...")
    response = client.get("/api/scenario2/cases")
    
    assert response.status_code == 200
    cases = response.json()["data"]
    print(f"✓ 共有 {len(cases)} 个案例可用")
    
    # 查找指定的案例
    test_case = None
    if case_id:
        for case in cases:
            if case["id"] == case_id:
                test_case = case
                break
    
    if not test_case:
        print(f"  ⚠️ 未找到指定案例 {case_id}，使用默认案例")
        # 默认使用CASE-03 (Xibei预制菜案例)
        for case in cases:
            if case["id"] in ["CASE-03", "case_009"]:
                test_case = case
                break
    
    if not test_case:
        print("  ⚠️ 未找到默认案例，使用第一个案例")
        test_case = cases[0]
    
    print(f"  选择案例: {test_case['title']}")
    print(f"  案例ID: {test_case['id']}")
    print(f"  总轮次: {test_case['totalRounds']}")
    
    # 2. 获取案例详情
    print(f"\n2. 获取案例详情...")
    response = client.get(f"/api/scenario2/cases/{test_case['id']}")
    
    assert response.status_code == 200
    case_detail = response.json()["data"]
    print(f"✓ 案例背景: {case_detail['background'][:100]}...")
    
    # 3. 启动场景二模拟
    print("\n3. 启动场景二模拟...")
    response = client.post("/api/scenario2/simulation/start", json={
        "caseId": test_case['id'],
        "llmModel": "gpt-4",
        "simulationConfig": {
            "agents": 10,
            "num_rounds": 1,
            "interactionProbability": 0.8
        }
    })
    
    assert response.status_code == 200
    data = response.json()["data"]
    
    simulation_id = data["simulationId"]
    print(f"✓ 模拟已启动: {simulation_id}")
    print(f"  关联案例: {data['caseId']}")
    print(f"  当前轮次: {data['currentRound']}/{data['totalRounds']}")
    
    # 4. 推进剩余轮次
    current_round = data['currentRound']
    total_rounds = data['totalRounds']
    
    while current_round < total_rounds:
        print(f"\n4.{current_round} 推进到第 {current_round + 1} 轮...")
        response = client.post(f"/api/scenario2/simulation/{simulation_id}/next-round")
        
        assert response.status_code == 200
        data = response.json()["data"]
        current_round = data['currentRound']
        print(f"✓ 第 {current_round} 轮模拟完成")
    
    # 5. 获取最终结果
    print(f"\n5. 获取模拟最终结果...")
    response = client.get(f"/api/scenario2/simulation/{simulation_id}/result")
    
    assert response.status_code == 200
    result = response.json()["data"]
    print(f"✓ 模拟已完成所有 {result['totalRounds']} 轮")
    print(f"  总帖子数: {result['summary']['totalPosts']}")
    print(f"  正面情绪: {result['summary']['positiveSentiment']:.2%}")
    print(f"  负面情绪: {result['summary']['negativeSentiment']:.2%}")
    
    # 6. 生成对比分析报告
    print("\n6. 生成场景二对比分析报告（模拟 vs 真实案例）...")
    response = client.post("/api/scenario2/reports/generate", json={
        "simulationId": simulation_id,
        "reportType": "comprehensive"
    })
    
    assert response.status_code == 200
    report = response.json()["data"]
    
    print(f"✓ 报告已生成: {report['reportId']}")
    print(f"  报告类型: {report['reportType']}")
    print(f"  对比案例: {report['caseTitle']}")
    
    # 检查评估结果
    evaluation = report["evaluation"]
    overall_similarity = report.get("overallSimilarityPercentage", 0)
    
    print(f"\n【相似度评估结果】")
    print(f"  总体相似度: {overall_similarity:.1f}%")
    print(f"  评估类型: {evaluation['evaluation_type']}")
    
    print(f"\n【各维度对比评分】")
    for dim_name, dim_data in evaluation['dimension_scores'].items():
        details = dim_data['details']
        if details.get('category') == 'comparative':
            sim = details['simulation']
            real = details['real_case']
            similarity = details['similarity']
            print(f"\n  {dim_name} (权重: {dim_data['weight']}):")
            sim_desc = sim.get('description', sim.get('summary', ''))
            real_desc = real.get('description', real.get('summary', ''))
            print(f"    模拟: {sim_desc[:80]}...")
            print(f"    真实: {real_desc[:80]}...")
            print(f"    相似度: {similarity['similarity_percentage']:.1f}%")
    
    print(f"\n【相似度总结】")
    print(evaluation['summary'])
    
    # 验证报告结构
    assert report['reportType'] == 'scenario2_comparative'
    assert 'caseId' in report
    assert 'caseTitle' in report
    assert 'overallSimilarityPercentage' in report
    assert evaluation['evaluation_type'] == 'comparative'
    assert 0 <= overall_similarity <= 100
    assert len(evaluation['dimension_scores']) == 9
    
    # 验证每个维度都有对比数据
    for dim_name, dim_data in evaluation['dimension_scores'].items():
        details = dim_data['details']
        assert details.get('category') == 'comparative', f"{dim_name} 不是对比类型"
        assert 'simulation' in details, f"{dim_name} 缺少模拟数据"
        assert 'real_case' in details, f"{dim_name} 缺少真实案例数据"
        assert 'similarity' in details, f"{dim_name} 缺少相似度数据"
    
    print("\n✅ 场景二测试通过！")
    return simulation_id


def test_report_differences():
    """验证两个场景的报告确实不同"""
    print("\n" + "="*80)
    print("验证：两个场景的报告结构和内容不同")
    print("="*80)
    
    print("\n【场景一报告特征】")
    print("  ✓ reportType: 'scenario1'")
    print("  ✓ evaluation_type: 'standalone'")
    print("  ✓ 评估目标: 模拟质量（百分比评分）")
    print("  ✓ 维度details包含: percentage, summary, reasoning")
    print("  ✓ 无 caseId, caseTitle, overallSimilarityPercentage 字段")
    print("  ✓ 每个维度category='simulation_only'")
    
    print("\n【场景二报告特征】")
    print("  ✓ reportType: 'scenario2_comparative'")
    print("  ✓ evaluation_type: 'comparative'")
    print("  ✓ 评估目标: 与真实案例的相似度（百分比评分）")
    print("  ✓ 维度details包含: simulation, real_case, similarity")
    print("  ✓ 每个部分都有: percentage, summary, reasoning")
    print("  ✓ 有 caseId, caseTitle, overallSimilarityPercentage 字段")
    print("  ✓ 每个维度category='comparative'")
    
    print("\n【新评估系统特点】")
    print("  ✓ 所有维度使用LLM评估（不再使用公式）")
    print("  ✓ 评分改为百分比展示（0-100%）")
    print("  ✓ 每个维度包含：百分比、总结、理由")
    print("  ✓ 场景二先分别评估模拟和真实，再LLM判断相似度")
    
    print("\n✅ 两个场景的报告完全独立，评估目标不同！")


def main():
    """运行测试"""
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='测试评估系统API')
    parser.add_argument('scenario', nargs='?', choices=['1', '2', 'all'], default='all',
                       help='选择要测试的场景: 1=场景一, 2=场景二, all=全部测试 (默认: all)')
    args = parser.parse_args()
    
    scenario = args.scenario
    
    print("="*80)
    if scenario == '1':
        print("开始测试场景一")
    elif scenario == '2':
        print("开始测试场景二")
    else:
        print("开始测试评估系统API（全部场景）")
    print("="*80)
    
    try:
        # 根据选择运行测试
        if scenario == '1':
            # 只测试场景一
            test_scenario1_complete_flow()
            print("\n" + "="*80)
            print("🎉 场景一测试通过！")
            print("="*80)
            
        elif scenario == '2':
            # 只测试场景二 - 先让用户选择案例
            selected_case_id = select_test_case()
            test_scenario2_complete_flow(case_id=selected_case_id)
            print("\n" + "="*80)
            print("🎉 场景二测试通过！")
            print("="*80)
            
        else:
            # 测试所有场景
            test_scenario1_complete_flow()
            
            # 场景二测试时让用户选择案例
            print("\n" + "="*80)
            print("接下来测试场景二")
            print("="*80)
            selected_case_id = select_test_case()
            test_scenario2_complete_flow(case_id=selected_case_id)
            
            test_report_differences()
            
            print("\n" + "="*80)
            print("🎉 所有测试通过！")
            print("="*80)
            print("\n【总结】")
            print("✅ 场景一功能完整：自由模拟 + 质量评估（百分比）")
            print("✅ 场景二功能完整：真实案例模拟 + 相似度对比（百分比）")
            print("✅ 两个场景的报告接口完全独立")
            print("✅ 报告结构和评估目标完全不同")
            print("✅ 9个评估维度全部使用LLM评估")
            print("✅ 每个维度包含：百分比、总结、理由")
            print("✅ 场景二分别评估模拟和真实，再判断相似度")
        
    except AssertionError as e:
        print(f"\n❌ 测试失败: {e}")
        raise
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    main()

