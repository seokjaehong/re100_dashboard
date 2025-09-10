import pandas as pd
import json
import os
import csv
from datetime import datetime, timedelta
import random

# 새로운 발전소 정보
NEW_PLANT_INFO = {
    # 태양광
    'solar_plant1': {'new_name': '육상태양광', 'new_capacity': 0.3, 'old_capacity': 2.21},
    'solar_plant2': {'new_name': '수상태양광1', 'new_capacity': 1.2, 'old_capacity': 1.99},
    'solar_plant3': {'new_name': '수상태양광2', 'new_capacity': 0.9, 'old_capacity': 1.47},
    # 풍력
    'wind_plant1': {'new_name': '군산해상풍력', 'new_capacity': 1.5, 'old_capacity': 3.08},
    'wind_plant2': {'new_name': '새만금해상풍력', 'new_capacity': 0.1, 'old_capacity': 2.98},
    'wind_plant3': {'new_name': '서남해해상풍력', 'new_capacity': 2.5, 'old_capacity': 2.01}
}

def update_plant_list_csv():
    """plant_list.csv 파일을 새로운 발전소 이름으로 업데이트"""
    plant_list_path = 'public/sample_data/plant_list.csv'
    
    if os.path.exists(plant_list_path):
        # 기존 파일 읽기
        with open(plant_list_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        # 새로운 이름으로 업데이트
        updated_rows = []
        for row in rows:
            if len(row) >= 3:
                old_plant_name = row[0]
                if old_plant_name in NEW_PLANT_INFO:
                    new_name = NEW_PLANT_INFO[old_plant_name]['new_name']
                    row[0] = new_name
            updated_rows.append(row)
        
        # 파일 저장
        with open(plant_list_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(updated_rows)
        
        print(f"plant_list.csv 업데이트 완료")

def update_original_csv_files():
    """원본 CSV 파일들을 새로운 용량 비율에 맞게 업데이트"""
    sample_data_path = 'public/sample_data'
    
    for old_plant_name, info in NEW_PLANT_INFO.items():
        csv_filename = f"{old_plant_name}.csv"
        csv_path = os.path.join(sample_data_path, csv_filename)
        
        if os.path.exists(csv_path):
            # CSV 파일 읽기
            df = pd.read_csv(csv_path)
            
            # 용량 비율 계산
            capacity_ratio = info['new_capacity'] / info['old_capacity']
            
            # 발전량 값 조정 (용량에 비례)
            if 'value' in df.columns:
                df['value'] = df['value'] * capacity_ratio
            
            # 발전소 이름 업데이트
            if 'plant_name' in df.columns:
                df['plant_name'] = info['new_name']
            
            # 파일 저장
            df.to_csv(csv_path, index=False, encoding='utf-8')
            print(f"{csv_filename} 업데이트 완료 (용량 비율: {capacity_ratio:.3f})")

def update_plant_capacity_json():
    """plant_capacity.json 파일을 새로운 용량과 이름으로 업데이트"""
    capacity_path = 'public/agg_data/plant_capacity.json'
    
    # 새로운 용량 정보로 발전량 재계산
    new_capacity_data = {
        "solar": {},
        "wind": {}
    }
    
    # 태양광 발전소
    for old_name in ['solar_plant1', 'solar_plant2', 'solar_plant3']:
        info = NEW_PLANT_INFO[old_name]
        new_name = info['new_name']
        new_capacity = info['new_capacity']
        
        # 발전량은 용량에 비례하여 계산 (연간)
        # 태양광 이용율 약 15% 가정
        annual_generation = new_capacity * 8760 * 0.15  # GWh
        
        new_capacity_data["solar"][new_name] = {
            "capacity_gw": new_capacity,
            "generation_gwh": annual_generation
        }
    
    # 풍력 발전소
    for old_name in ['wind_plant1', 'wind_plant2', 'wind_plant3']:
        info = NEW_PLANT_INFO[old_name]
        new_name = info['new_name']
        new_capacity = info['new_capacity']
        
        # 발전량은 용량에 비례하여 계산 (연간)
        # 풍력 이용율 약 25% 가정
        annual_generation = new_capacity * 8760 * 0.25  # GWh
        
        new_capacity_data["wind"][new_name] = {
            "capacity_gw": new_capacity,
            "generation_gwh": annual_generation
        }
    
    # 파일 저장
    os.makedirs('public/agg_data', exist_ok=True)
    with open(capacity_path, 'w', encoding='utf-8') as f:
        json.dump(new_capacity_data, f, ensure_ascii=False, indent=2)
    
    print("plant_capacity.json 업데이트 완료")
    return new_capacity_data

def update_plant_hourly_aggregated():
    """시간대별 집계 데이터를 새로운 발전소 이름과 용량으로 업데이트"""
    hourly_path = 'public/agg_data/plant_hourly_aggregated.json'
    
    new_hourly_data = {
        "solar": {},
        "wind": {}
    }
    
    # 태양광 발전소별 시간대별 데이터
    for old_name in ['solar_plant1', 'solar_plant2', 'solar_plant3']:
        info = NEW_PLANT_INFO[old_name]
        new_name = info['new_name']
        capacity_ratio = info['new_capacity'] / info['old_capacity']
        
        new_hourly_data["solar"][new_name] = {}
        for hour in range(24):
            if 6 <= hour <= 18:  # 낮 시간대
                # 기본값에 용량 비율 적용
                base_value = random.uniform(300, 1000) * capacity_ratio
                new_hourly_data["solar"][new_name][str(hour)] = base_value
            else:
                new_hourly_data["solar"][new_name][str(hour)] = 0
    
    # 풍력 발전소별 시간대별 데이터
    for old_name in ['wind_plant1', 'wind_plant2', 'wind_plant3']:
        info = NEW_PLANT_INFO[old_name]
        new_name = info['new_name']
        capacity_ratio = info['new_capacity'] / info['old_capacity']
        
        new_hourly_data["wind"][new_name] = {}
        for hour in range(24):
            # 기본값에 용량 비율 적용
            base_value = random.uniform(400, 1200) * capacity_ratio
            new_hourly_data["wind"][new_name][str(hour)] = base_value
    
    # 파일 저장
    with open(hourly_path, 'w', encoding='utf-8') as f:
        json.dump(new_hourly_data, f, ensure_ascii=False, indent=2)
    
    print("plant_hourly_aggregated.json 업데이트 완료")

def update_monthly_aggregated():
    """월별 집계 데이터를 새로운 발전소 이름과 용량으로 업데이트"""
    monthly_path = 'public/agg_data/monthly_aggregated.json'
    
    new_monthly_data = {
        "solar": {},
        "wind": {},
        "total_supply": {},
        "demand": {},
        "re100_rate": {}
    }
    
    # 태양광 발전소별 12개월 데이터
    for old_name in ['solar_plant1', 'solar_plant2', 'solar_plant3']:
        info = NEW_PLANT_INFO[old_name]
        new_name = info['new_name']
        capacity_ratio = info['new_capacity'] / info['old_capacity']
        
        new_monthly_data["solar"][new_name] = {}
        for month in range(1, 13):
            month_key = f"2024-{month:02d}"
            # 계절별 발전량 변화 반영
            if month in [12, 1, 2]:  # 겨울
                base_value = random.uniform(2000, 3500) * capacity_ratio
            elif month in [3, 4, 5]:  # 봄
                base_value = random.uniform(3500, 5000) * capacity_ratio
            elif month in [6, 7, 8]:  # 여름
                base_value = random.uniform(4500, 6000) * capacity_ratio
            else:  # 가을
                base_value = random.uniform(3000, 4500) * capacity_ratio
            new_monthly_data["solar"][new_name][month_key] = base_value
    
    # 풍력 발전소별 12개월 데이터
    for old_name in ['wind_plant1', 'wind_plant2', 'wind_plant3']:
        info = NEW_PLANT_INFO[old_name]
        new_name = info['new_name']
        capacity_ratio = info['new_capacity'] / info['old_capacity']
        
        new_monthly_data["wind"][new_name] = {}
        for month in range(1, 13):
            month_key = f"2024-{month:02d}"
            # 풍력은 계절 변화가 적음
            base_value = random.uniform(4000, 6500) * capacity_ratio
            new_monthly_data["wind"][new_name][month_key] = base_value
    
    # 기존 수요 및 RE100 데이터 유지 (company_monthly_aggregated.json에서 가져오기)
    try:
        with open('public/agg_data/company_monthly_aggregated.json', 'r', encoding='utf-8') as f:
            company_data = json.load(f)
        
        for month in range(1, 13):
            month_key = f"2024-{month:02d}"
            
            # 총 태양광
            solar_plants = list(new_monthly_data["solar"].keys())
            total_solar = sum(new_monthly_data["solar"][plant][month_key] for plant in solar_plants)
            
            # 총 풍력
            wind_plants = list(new_monthly_data["wind"].keys())
            total_wind = sum(new_monthly_data["wind"][plant][month_key] for plant in wind_plants)
            
            # 총 공급량
            total_supply = total_solar + total_wind
            new_monthly_data["total_supply"][month_key] = total_supply
            
            # 모든 기업의 해당 월 수요 합계
            total_demand = sum(company_data[company][month_key] for company in company_data.keys())
            new_monthly_data["demand"][month_key] = total_demand
            
            # RE100 달성률
            re100_rate = min((total_supply / total_demand) * 100, 100) if total_demand > 0 else 0
            new_monthly_data["re100_rate"][month_key] = re100_rate
    except:
        # 파일이 없으면 기본값
        for month in range(1, 13):
            month_key = f"2024-{month:02d}"
            new_monthly_data["demand"][month_key] = random.uniform(15000, 25000)
            new_monthly_data["re100_rate"][month_key] = random.uniform(70, 95)
    
    # 발전소별 집계에 total 추가
    new_monthly_data["solar"]["total"] = {}
    new_monthly_data["wind"]["total"] = {}
    
    for month in range(1, 13):
        month_key = f"2024-{month:02d}"
        solar_plants = [name for name in new_monthly_data["solar"].keys() if name != "total"]
        wind_plants = [name for name in new_monthly_data["wind"].keys() if name != "total"]
        
        new_monthly_data["solar"]["total"][month_key] = sum(new_monthly_data["solar"][plant][month_key] for plant in solar_plants)
        new_monthly_data["wind"]["total"][month_key] = sum(new_monthly_data["wind"][plant][month_key] for plant in wind_plants)
    
    # 파일 저장
    with open(monthly_path, 'w', encoding='utf-8') as f:
        json.dump(new_monthly_data, f, ensure_ascii=False, indent=2)
    
    print("monthly_aggregated.json 업데이트 완료")

def main():
    print("발전소 이름 및 용량 업데이트 시작...")
    
    # 1. plant_list.csv 업데이트
    update_plant_list_csv()
    
    # 2. 원본 CSV 파일들 업데이트
    update_original_csv_files()
    
    # 3. plant_capacity.json 업데이트
    update_plant_capacity_json()
    
    # 4. 시간대별 집계 데이터 업데이트
    update_plant_hourly_aggregated()
    
    # 5. 월별 집계 데이터 업데이트
    update_monthly_aggregated()
    
    print("\n발전소 이름 및 용량 업데이트 완료!")
    print("\n새로운 발전소 정보:")
    print("태양광 발전소:")
    print("- 육상태양광: 0.3GW")
    print("- 수상태양광1: 1.2GW")
    print("- 수상태양광2: 0.9GW")
    print("풍력 발전소:")
    print("- 군산해상풍력: 1.5GW")
    print("- 새만금해상풍력: 0.1GW")
    print("- 서남해해상풍력: 2.5GW")

if __name__ == "__main__":
    main()