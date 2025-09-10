import csv
from datetime import datetime, timedelta
import random

# 2024년 1월 데이터 생성
start_date = datetime(2024, 1, 1)
end_date = datetime(2024, 1, 31, 23, 0)

# 태양광 발전소 1 데이터
with open('public/sample_data/solar_plant1.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['datetime', 'type', 'plant_name', 'value'])
    
    current_date = start_date
    while current_date <= end_date:
        hour = current_date.hour
        # 태양광은 낮 시간대에만 발전
        if 6 <= hour <= 18:
            value = random.uniform(100, 500) * 1000000  # kWh
        else:
            value = 0
        writer.writerow([current_date.strftime('%Y-%m-%d %H:%M'), 'solar', 'solar_plant1', value])
        current_date += timedelta(hours=1)

# 태양광 발전소 2 데이터
with open('public/sample_data/solar_plant2.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['datetime', 'type', 'plant_name', 'value'])
    
    current_date = start_date
    while current_date <= end_date:
        hour = current_date.hour
        if 6 <= hour <= 18:
            value = random.uniform(80, 400) * 1000000
        else:
            value = 0
        writer.writerow([current_date.strftime('%Y-%m-%d %H:%M'), 'solar', 'solar_plant2', value])
        current_date += timedelta(hours=1)

# 풍력 발전소 1 데이터
with open('public/sample_data/wind_plant1.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['datetime', 'type', 'plant_name', 'value'])
    
    current_date = start_date
    while current_date <= end_date:
        # 풍력은 24시간 발전 가능
        value = random.uniform(150, 600) * 1000000
        writer.writerow([current_date.strftime('%Y-%m-%d %H:%M'), 'wind', 'wind_plant1', value])
        current_date += timedelta(hours=1)

# 풍력 발전소 2 데이터
with open('public/sample_data/wind_plant2.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['datetime', 'type', 'plant_name', 'value'])
    
    current_date = start_date
    while current_date <= end_date:
        value = random.uniform(120, 550) * 1000000
        writer.writerow([current_date.strftime('%Y-%m-%d %H:%M'), 'wind', 'wind_plant2', value])
        current_date += timedelta(hours=1)

# 수요 데이터 (통합)
with open('public/sample_data/sample_data_integrated_2024_integrated.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['datetime', 'type', 'plant_name', 'value'])
    
    companies = ['compA', 'compB', 'compC', 'compD']
    
    current_date = start_date
    while current_date <= end_date:
        hour = current_date.hour
        for company in companies:
            # 수요는 시간대별로 변동
            if 9 <= hour <= 18:  # 업무 시간
                base_demand = random.uniform(200, 500)
            elif 6 <= hour < 9 or 18 < hour <= 22:  # 출퇴근 시간
                base_demand = random.uniform(150, 300)
            else:  # 야간
                base_demand = random.uniform(50, 150)
            
            value = base_demand * 1000000
            writer.writerow([current_date.strftime('%Y-%m-%d %H:%M'), 'demand', company, value])
        
        current_date += timedelta(hours=1)

print("샘플 데이터 생성 완료!")
print("생성된 파일:")
print("- public/sample_data/solar_plant1.csv")
print("- public/sample_data/solar_plant2.csv")
print("- public/sample_data/wind_plant1.csv")
print("- public/sample_data/wind_plant2.csv")
print("- public/sample_data/sample_data_integrated_2024_integrated.csv")