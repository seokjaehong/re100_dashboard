import csv
from datetime import datetime, timedelta
import random

# 2024년 1월 데이터 생성
start_date = datetime(2024, 1, 1)
end_date = datetime(2024, 1, 31, 23, 0)

# 태양광 발전소 3 데이터
with open('public/sample_data/solar_plant3.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['datetime', 'type', 'plant_name', 'value'])
    
    current_date = start_date
    while current_date <= end_date:
        hour = current_date.hour
        # 태양광은 낮 시간대에만 발전
        if 6 <= hour <= 18:
            value = random.uniform(120, 450) * 1000000  # kWh
        else:
            value = 0
        writer.writerow([current_date.strftime('%Y-%m-%d %H:%M'), 'solar', 'solar_plant3', value])
        current_date += timedelta(hours=1)

# 풍력 발전소 3 데이터
with open('public/sample_data/wind_plant3.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['datetime', 'type', 'plant_name', 'value'])
    
    current_date = start_date
    while current_date <= end_date:
        # 풍력은 24시간 발전 가능
        value = random.uniform(140, 580) * 1000000
        writer.writerow([current_date.strftime('%Y-%m-%d %H:%M'), 'wind', 'wind_plant3', value])
        current_date += timedelta(hours=1)

print("추가 발전소 데이터 생성 완료!")
print("생성된 파일:")
print("- public/sample_data/solar_plant3.csv")
print("- public/sample_data/wind_plant3.csv")