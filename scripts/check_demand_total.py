import json
from pathlib import Path

# 프로젝트 루트 설정
project_root = Path(r"D:\study\cltuto\re100_dashboard")
agg_data_dir = project_root / "public" / "agg_data"

# 원본 company_monthly_aggregated.json 읽기
company_file = agg_data_dir / "company_monthly_aggregated.json"

with open(company_file, 'r', encoding='utf-8') as f:
    company_data = json.load(f)

# 각 기업별 연간 총합 계산
company_totals = {}
for company, monthly_values in company_data.items():
    total = sum(monthly_values.values())
    company_totals[company] = total
    print(f"{company}: {total:,.2f} GWh")

# 전체 합계
grand_total = sum(company_totals.values())
print("=" * 50)
print(f"전체 기업 연간 총 수요: {grand_total:,.2f} GWh")

# 10% 적용 시
print(f"10% 적용 시: {grand_total * 0.1:,.2f} GWh")

# monthly_aggregated.json의 demand 확인
monthly_file = agg_data_dir / "monthly_aggregated.json"
with open(monthly_file, 'r', encoding='utf-8') as f:
    monthly_data = json.load(f)

if 'demand' in monthly_data:
    demand_total = sum(monthly_data['demand'].values())
    print("=" * 50)
    print(f"monthly_aggregated.json의 수요 총합: {demand_total:,.2f} GWh")
    print(f"10% 적용 시: {demand_total * 0.1:,.2f} GWh")

# 실제 시간당 평균 계산
print("=" * 50)
print("월별 평균 시간당 사용량 (첫 3개 기업):")
months_days = {
    "2024-01": 31, "2024-02": 29, "2024-03": 31, "2024-04": 30,
    "2024-05": 31, "2024-06": 30, "2024-07": 31, "2024-08": 31,
    "2024-09": 30, "2024-10": 31, "2024-11": 30, "2024-12": 31
}

for i, (company, monthly_values) in enumerate(company_data.items()):
    if i >= 3:
        break
    print(f"\n{company}:")
    for month, value in list(monthly_values.items())[:2]:  # 처음 2개월만
        days = months_days[month]
        hourly_avg = value / (days * 24)
        print(f"  {month}: {value:.2f} GWh/월 → {hourly_avg:.4f} GWh/시간")