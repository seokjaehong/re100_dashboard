import pandas as pd
import json
import os
from pathlib import Path

# 프로젝트 루트 설정
project_root = Path(r"D:\study\cltuto\re100_dashboard")
agg_data_dir = project_root / "public" / "agg_data"

# 10% 적용 비율
ADJUSTMENT_RATE = 0.10

def reaggregate_monthly_data():
    """월별 집계 데이터를 10% 적용하여 재집계"""
    monthly_file = agg_data_dir / "monthly_aggregated.json"
    
    if monthly_file.exists():
        with open(monthly_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 10% 적용
        adjusted_data = {}
        
        # 태양광 데이터 조정
        if 'solar' in data:
            adjusted_data['solar'] = {}
            for plant, values in data['solar'].items():
                if plant == 'total':
                    adjusted_data['solar'][plant] = {
                        month: value * ADJUSTMENT_RATE 
                        for month, value in values.items()
                    }
                else:
                    adjusted_data['solar'][plant] = {
                        month: value * ADJUSTMENT_RATE 
                        for month, value in values.items()
                    }
        
        # 풍력 데이터 조정
        if 'wind' in data:
            adjusted_data['wind'] = {}
            for plant, values in data['wind'].items():
                if plant == 'total':
                    adjusted_data['wind'][plant] = {
                        month: value * ADJUSTMENT_RATE 
                        for month, value in values.items()
                    }
                else:
                    adjusted_data['wind'][plant] = {
                        month: value * ADJUSTMENT_RATE 
                        for month, value in values.items()
                    }
        
        # 수요 데이터 조정
        if 'demand' in data:
            adjusted_data['demand'] = {
                month: value * ADJUSTMENT_RATE 
                for month, value in data['demand'].items()
            }
        
        # 조정된 데이터 저장
        output_file = agg_data_dir / "monthly_aggregated_10pct.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(adjusted_data, f, ensure_ascii=False, indent=2)
        
        print(f"월별 집계 데이터 재집계 완료: {output_file}")
        return adjusted_data
    else:
        print(f"월별 집계 파일 없음: {monthly_file}")
        return None

def reaggregate_company_monthly_data():
    """기업별 월별 데이터를 10% 적용하여 재집계"""
    company_file = agg_data_dir / "company_monthly_aggregated.json"
    
    if company_file.exists():
        with open(company_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 10% 적용
        adjusted_data = {}
        for company, monthly_values in data.items():
            adjusted_data[company] = {
                month: value * ADJUSTMENT_RATE 
                for month, value in monthly_values.items()
            }
        
        # 조정된 데이터 저장
        output_file = agg_data_dir / "company_monthly_aggregated_10pct.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(adjusted_data, f, ensure_ascii=False, indent=2)
        
        print(f"기업별 월별 데이터 재집계 완료: {output_file}")
        return adjusted_data
    else:
        print(f"기업별 월별 파일 없음: {company_file}")
        return None

def reaggregate_plant_hourly_data():
    """발전소별 시간대별 데이터를 10% 적용하여 재집계"""
    hourly_file = agg_data_dir / "plant_hourly_aggregated.json"
    
    if hourly_file.exists():
        with open(hourly_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 10% 적용
        adjusted_data = {}
        
        # 태양광 데이터 조정
        if 'solar' in data:
            adjusted_data['solar'] = {}
            for plant, hourly_values in data['solar'].items():
                adjusted_data['solar'][plant] = {
                    hour: value * ADJUSTMENT_RATE 
                    for hour, value in hourly_values.items()
                }
        
        # 풍력 데이터 조정  
        if 'wind' in data:
            adjusted_data['wind'] = {}
            for plant, hourly_values in data['wind'].items():
                adjusted_data['wind'][plant] = {
                    hour: value * ADJUSTMENT_RATE 
                    for hour, value in hourly_values.items()
                }
        
        # 조정된 데이터 저장
        output_file = agg_data_dir / "plant_hourly_aggregated_10pct.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(adjusted_data, f, ensure_ascii=False, indent=2)
        
        print(f"발전소별 시간대별 데이터 재집계 완료: {output_file}")
        return adjusted_data
    else:
        print(f"발전소별 시간대별 파일 없음: {hourly_file}")
        return None

def calculate_summary_stats():
    """전체 요약 통계 계산"""
    monthly_data = reaggregate_monthly_data()
    company_data = reaggregate_company_monthly_data()
    
    if monthly_data:
        # 연간 총계 계산
        total_solar = sum(monthly_data['solar']['total'].values()) if 'solar' in monthly_data else 0
        total_wind = sum(monthly_data['wind']['total'].values()) if 'wind' in monthly_data else 0
        total_demand = sum(monthly_data['demand'].values()) if 'demand' in monthly_data else 0
        
        # RE100 달성률 계산
        total_supply = total_solar + total_wind
        re100_rate = (total_supply / total_demand * 100) if total_demand > 0 else 0
        
        summary = {
            "annual_totals": {
                "solar": round(total_solar, 2),
                "wind": round(total_wind, 2),
                "supply": round(total_supply, 2),
                "demand": round(total_demand, 2),
                "re100_rate": round(re100_rate, 2)
            },
            "adjustment_rate": f"{ADJUSTMENT_RATE * 100}%",
            "note": "All values adjusted by 10% from original data"
        }
        
        # 요약 통계 저장
        summary_file = agg_data_dir / "summary_stats_10pct.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"요약 통계 생성 완료: {summary_file}")
        print(f"연간 총 태양광: {total_solar:.2f} GWh")
        print(f"연간 총 풍력: {total_wind:.2f} GWh")
        print(f"연간 총 공급: {total_supply:.2f} GWh")
        print(f"연간 총 수요: {total_demand:.2f} GWh")
        print(f"연간 RE100 달성률: {re100_rate:.2f}%")

if __name__ == "__main__":
    print("10% 적용 데이터 재집계 시작...")
    print("=" * 50)
    
    # 각 데이터 재집계
    reaggregate_monthly_data()
    reaggregate_company_monthly_data()
    reaggregate_plant_hourly_data()
    
    print("=" * 50)
    print("요약 통계 계산...")
    calculate_summary_stats()
    
    print("=" * 50)
    print("모든 재집계 완료!")