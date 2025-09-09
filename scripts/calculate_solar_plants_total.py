import pandas as pd
from pathlib import Path

# 프로젝트 루트 설정
project_root = Path(r"D:\study\cltuto\re100_dashboard")
sample_data_dir = project_root / "public" / "sample_data"

print("태양광 발전소별 발전량 계산")
print("=" * 60)

# 태양광 발전소 파일들
solar_files = [
    ("solar_plant1.csv", "육상태양광"),
    ("solar_plant2.csv", "수상태양광1"),
    ("solar_plant3.csv", "수상태양광2")
]

total_all_solar = 0
plant_details = []

for filename, plant_name in solar_files:
    file_path = sample_data_dir / filename
    
    if file_path.exists():
        # CSV 파일 읽기
        df = pd.read_csv(file_path)
        
        # 데이터 확인
        rows = len(df)
        
        # 합계 계산
        total_kwh = df['value'].sum()
        total_gwh = total_kwh / 1_000_000
        
        # 10% 적용
        total_10pct = total_gwh * 0.10
        
        print(f"\n{plant_name} ({filename}):")
        print(f"  데이터 행 수: {rows:,}")
        print(f"  원본 발전량: {total_kwh:,.0f} kWh")
        print(f"  원본 발전량: {total_gwh:,.2f} GWh")
        print(f"  10% 적용: {total_10pct:,.2f} GWh")
        
        total_all_solar += total_gwh
        plant_details.append({
            'name': plant_name,
            'file': filename,
            'gwh': total_gwh,
            'gwh_10pct': total_10pct
        })
    else:
        print(f"\n{plant_name}: 파일 없음 ({file_path})")

print("\n" + "=" * 60)
print("태양광 발전소 합계:")
print(f"  solar_plant1 + solar_plant2 + solar_plant3")
print(f"  = {plant_details[0]['gwh']:.2f} + {plant_details[1]['gwh']:.2f} + {plant_details[2]['gwh']:.2f}")
print(f"  = {total_all_solar:,.2f} GWh")
print()
print(f"10% 적용 시:")
print(f"  = {plant_details[0]['gwh_10pct']:.2f} + {plant_details[1]['gwh_10pct']:.2f} + {plant_details[2]['gwh_10pct']:.2f}")
print(f"  = {total_all_solar * 0.10:,.2f} GWh")

# 개별 발전소 비중
print("\n각 발전소 비중:")
for plant in plant_details:
    percentage = (plant['gwh'] / total_all_solar) * 100
    print(f"  {plant['name']}: {percentage:.1f}%")