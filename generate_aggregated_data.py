import csv
import json
from datetime import datetime, timedelta
import random
from collections import defaultdict
import os

def load_csv_data(filepath):
    """CSV 파일을 읽어서 데이터 반환"""
    data = []
    try:
        with open(filepath, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append(row)
    except:
        pass
    return data

def generate_weekly_data():
    """주차별 데이터 생성 (NaN 문제 해결용)"""
    weekly_data = {}
    
    # 2024년 1월의 주차 데이터
    january_weeks = {
        "1월": [
            {"week": 1, "label": "1월 1주차", "start": "2024-01-01", "end": "2024-01-07"},
            {"week": 2, "label": "1월 2주차", "start": "2024-01-08", "end": "2024-01-14"},
            {"week": 3, "label": "1월 3주차", "start": "2024-01-15", "end": "2024-01-21"},
            {"week": 4, "label": "1월 4주차", "start": "2024-01-22", "end": "2024-01-28"},
            {"week": 5, "label": "1월 5주차", "start": "2024-01-29", "end": "2024-01-31"}
        ]
    }
    
    weekly_data.update(january_weeks)
    return weekly_data

def generate_monthly_aggregated():
    """월별 집계 데이터 생성"""
    
    # 발전소별 데이터 로드
    solar_plants = ['solar_plant1', 'solar_plant2', 'solar_plant3']
    wind_plants = ['wind_plant1', 'wind_plant2', 'wind_plant3']
    
    monthly_data = {
        "solar": {},
        "wind": {},
        "total_supply": {},
        "demand": {},
        "re100_rate": {}
    }
    
    # 1월 데이터만 생성
    month = "2024-01"
    
    # 태양광 월별 집계
    total_solar = 0
    for plant in solar_plants:
        plant_data = random.uniform(2000, 5000)  # GWh
        monthly_data["solar"][plant] = plant_data
        total_solar += plant_data
    
    monthly_data["solar"]["total"] = total_solar
    
    # 풍력 월별 집계
    total_wind = 0
    for plant in wind_plants:
        plant_data = random.uniform(3000, 6000)  # GWh
        monthly_data["wind"][plant] = plant_data
        total_wind += plant_data
    
    monthly_data["wind"]["total"] = total_wind
    
    # 총 공급량
    total_supply = total_solar + total_wind
    monthly_data["total_supply"][month] = total_supply
    
    # 수요 데이터
    companies = ['compA', 'compB', 'compC', 'compD']
    total_demand = 0
    for company in companies:
        demand_data = random.uniform(1500, 4000)  # GWh
        monthly_data["demand"][company] = demand_data
        total_demand += demand_data
    
    monthly_data["demand"]["total"] = total_demand
    
    # RE100 달성률
    re100_rate = (total_supply / total_demand) * 100 if total_demand > 0 else 0
    monthly_data["re100_rate"][month] = min(re100_rate, 100)
    
    return monthly_data

def generate_hourly_plant_aggregated():
    """발전소별 시간대별 평균 발전 현황"""
    
    solar_plants = ['solar_plant1', 'solar_plant2', 'solar_plant3']
    wind_plants = ['wind_plant1', 'wind_plant2', 'wind_plant3']
    
    hourly_plant_data = {
        "solar": {},
        "wind": {}
    }
    
    # 태양광 시간대별 평균
    for plant in solar_plants:
        hourly_plant_data["solar"][plant] = {}
        for hour in range(24):
            if 6 <= hour <= 18:  # 낮 시간대
                value = random.uniform(200, 800)  # GWh
            else:
                value = 0
            hourly_plant_data["solar"][plant][str(hour)] = value
    
    # 풍력 시간대별 평균
    for plant in wind_plants:
        hourly_plant_data["wind"][plant] = {}
        for hour in range(24):
            value = random.uniform(300, 900)  # GWh
            hourly_plant_data["wind"][plant][str(hour)] = value
    
    return hourly_plant_data

def generate_monthly_plant_aggregated():
    """발전소별 월별 평균 발전 현황"""
    
    solar_plants = ['solar_plant1', 'solar_plant2', 'solar_plant3']
    wind_plants = ['wind_plant1', 'wind_plant2', 'wind_plant3']
    
    monthly_plant_data = {
        "solar": {},
        "wind": {}
    }
    
    # 태양광 월별 평균 (1월만)
    for plant in solar_plants:
        monthly_plant_data["solar"][plant] = {
            "2024-01": random.uniform(2000, 5000)  # GWh
        }
    
    # 풍력 월별 평균 (1월만)
    for plant in wind_plants:
        monthly_plant_data["wind"][plant] = {
            "2024-01": random.uniform(3000, 6000)  # GWh
        }
    
    return monthly_plant_data

def generate_company_hourly_aggregated():
    """기업별 시간대별 평균 전력사용량"""
    
    companies = ['compA', 'compB', 'compC', 'compD']
    
    hourly_company_data = {}
    
    for company in companies:
        hourly_company_data[company] = {}
        for hour in range(24):
            if 9 <= hour <= 18:  # 업무 시간
                value = random.uniform(200, 500)
            elif 6 <= hour < 9 or 18 < hour <= 22:  # 출퇴근 시간
                value = random.uniform(150, 300)
            else:  # 야간
                value = random.uniform(50, 150)
            hourly_company_data[company][str(hour)] = value
    
    return hourly_company_data

def generate_company_monthly_aggregated():
    """기업별 월별 평균 전력사용량"""
    
    companies = ['compA', 'compB', 'compC', 'compD']
    
    monthly_company_data = {}
    
    for company in companies:
        monthly_company_data[company] = {
            "2024-01": random.uniform(1500, 4000)  # GWh
        }
    
    return monthly_company_data

def generate_plant_capacity_data():
    """발전소별 용량 및 발전량 데이터 (상단 4개 박스용)"""
    
    solar_plants = ['solar_plant1', 'solar_plant2', 'solar_plant3']
    wind_plants = ['wind_plant1', 'wind_plant2', 'wind_plant3']
    
    capacity_data = {
        "solar": {},
        "wind": {}
    }
    
    # 태양광 발전소 용량 및 발전량
    for plant in solar_plants:
        capacity_data["solar"][plant] = {
            "capacity_gw": random.uniform(1.0, 3.0),  # GW
            "generation_gwh": random.uniform(2000, 5000)  # GWh
        }
    
    # 풍력 발전소 용량 및 발전량
    for plant in wind_plants:
        capacity_data["wind"][plant] = {
            "capacity_gw": random.uniform(2.0, 4.0),  # GW
            "generation_gwh": random.uniform(3000, 6000)  # GWh
        }
    
    return capacity_data

# agg_data 폴더 생성
os.makedirs('public/agg_data', exist_ok=True)

print("집계 데이터 생성 중...")

# 1. 주차별 데이터
weekly_data = generate_weekly_data()
with open('public/agg_data/weekly_data.json', 'w', encoding='utf-8') as f:
    json.dump(weekly_data, f, ensure_ascii=False, indent=2)
print("주차별 데이터 생성 완료")

# 2. 월별 집계 데이터
monthly_data = generate_monthly_aggregated()
with open('public/agg_data/monthly_aggregated.json', 'w', encoding='utf-8') as f:
    json.dump(monthly_data, f, ensure_ascii=False, indent=2)
print("월별 집계 데이터 생성 완료")

# 3. 발전소별 시간대별 집계
hourly_plant_data = generate_hourly_plant_aggregated()
with open('public/agg_data/plant_hourly_aggregated.json', 'w', encoding='utf-8') as f:
    json.dump(hourly_plant_data, f, ensure_ascii=False, indent=2)
print("발전소별 시간대별 집계 데이터 생성 완료")

# 4. 발전소별 월별 집계
monthly_plant_data = generate_monthly_plant_aggregated()
with open('public/agg_data/plant_monthly_aggregated.json', 'w', encoding='utf-8') as f:
    json.dump(monthly_plant_data, f, ensure_ascii=False, indent=2)
print("발전소별 월별 집계 데이터 생성 완료")

# 5. 기업별 시간대별 집계
hourly_company_data = generate_company_hourly_aggregated()
with open('public/agg_data/company_hourly_aggregated.json', 'w', encoding='utf-8') as f:
    json.dump(hourly_company_data, f, ensure_ascii=False, indent=2)
print("기업별 시간대별 집계 데이터 생성 완료")

# 6. 기업별 월별 집계
monthly_company_data = generate_company_monthly_aggregated()
with open('public/agg_data/company_monthly_aggregated.json', 'w', encoding='utf-8') as f:
    json.dump(monthly_company_data, f, ensure_ascii=False, indent=2)
print("기업별 월별 집계 데이터 생성 완료")

# 7. 발전소별 용량 데이터
capacity_data = generate_plant_capacity_data()
with open('public/agg_data/plant_capacity.json', 'w', encoding='utf-8') as f:
    json.dump(capacity_data, f, ensure_ascii=False, indent=2)
print("발전소별 용량 데이터 생성 완료")

print("\n모든 집계 데이터 생성 완료!")
print("생성된 파일 목록:")
print("- public/agg_data/weekly_data.json")
print("- public/agg_data/monthly_aggregated.json")
print("- public/agg_data/plant_hourly_aggregated.json")
print("- public/agg_data/plant_monthly_aggregated.json")
print("- public/agg_data/company_hourly_aggregated.json")
print("- public/agg_data/company_monthly_aggregated.json")
print("- public/agg_data/plant_capacity.json")