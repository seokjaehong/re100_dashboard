# 새만금 산업단지 24/7 RE100 모니터링 시스템

React + MUI + Recharts 기반으로 동작하는 **프론트엔드 단독 웹 애플리케이션**을 작성해줘.  
백엔드는 사용하지 않고, 사용자가 업로드하는 CSV 데이터를 읽어와서 처리/시각화/표시해야 한다.

---

## 📂 CSV 업로드 & 데이터 구조

### 1. 업로드되는 CSV (옵션 B, long format)
- 컬럼 구조: datetime, type, plant_name, value
- `type` 은 `solar`, `wind`, `demand` 중 하나  
- `plant_name` 은 발전소명 또는 기업명  
- `value` 는 전력량 (kWh)

### CSV 예시
datetime,type,plant_name,value
2025-03-01 00:00,solar,solar_plant1,120
2025-03-01 00:00,solar,solar_plant2,80
2025-03-01 00:00,wind,wind_plant1,200
2025-03-01 00:00,demand,compA,250
2025-03-01 00:00,demand,compB,100
2025-03-01 01:00,solar,solar_plant1,100
2025-03-01 01:00,solar,solar_plant2,70
2025-03-01 01:00,wind,wind_plant1,180
2025-03-01 01:00,demand,compA,230
2025-03-01 01:00,demand,compB,90

---

### 2. 내부 변환 데이터 (옵션 A, wide format)
업로드 후 JS에서 pivot 변환 → wide format 으로 저장  

예시 변환 결과:
datetime,solar_plant1,solar_plant2,wind_plant1,compA,compB
2025-03-01 00:00,120,80,200,250,100
2025-03-01 01:00,100,70,180,230,90


---

## ⚡ 데이터 처리 로직

1. **태양광 공급량** = 모든 `solar_*` 컬럼 합  
2. **풍력 공급량** = 모든 `wind_*` 컬럼 합  
3. **총 공급량** = 태양광 + 풍력  
4. **수요** = 기업별 전력사용량 합 (필터 적용 가능)  
5. **외부전력사용량** = `max(0, 수요 - 공급)`  
6. **RE100 달성률(%)** = `(공급 / 수요) * 100`  
7. **ESS 필요 용량** = `(수요 - 공급)`이 음수일 때의 **최대 부족분**  

---

## 📊 시각화 (Recharts)

1. **시간대별 라인 차트**
   - 태양광, 풍력, 총 공급, 수요, 외부전력  

2. **월별 막대 + 라인 차트**
   - 월별 총 공급 (bar)
   - 월별 총 수요 (bar)
   - 월별 RE100 달성률 (line)


3. **Pivot Chart**
   - 발전소별/기업별 전력량 비교를 위한 차트
   - stacked bar 형태로 발전소 또는 기업별 전력량 표시
   - 집계 단위: 월별 또는 일별 선택 가능
   - 예: `solar_plant1`, `solar_plant2`, `wind_plant1` stacked bar, 기업별 stacked bar 등  


---

## 📋 표 (MUI DataGrid)

1. **월별 RE100 달성률 표**
   - (월, 총 공급, 총 수요, 외부전력, RE100 달성률)

2. **시간대별 RE100 달성률 표**
   - (시간대, 평균 공급, 평균 수요, RE100 달성률)

---

## 🎨 UI (MUI 컴포넌트)

- `AppBar` : 상단 제목 → **"새만금 산업단지 24/7 RE100 모니터링 시스템"**
- `Drawer` 또는 `Sidebar`
  - CSV 업로드 버튼 (MUI Button + File input)
  - 기업 선택 드롭다운 (MUI Select)
- 메인 영역
  - 그래프 (Recharts)
  - 표 (MUI DataGrid)
  - RE100 달성률 요약 카드 (MUI Card)
  - **ESS 강조 박스 (MUI Card, 색상 강조)**
    ```
    공급과 수요의 불균형을 ESS로 보완할 수 있습니다.
    부족한 부분의 최대값이 곧 ESS의 필요 용량이 됩니다.
    (ESS 용량 = 공급 < 수요 시의 최대 부족분)
    ```

---

## ⚙️ 동작 흐름

1. 사용자가 CSV 업로드  
2. JS에서 long → wide 변환 (pivot)  
3. 데이터 처리 및 통계 계산  
4. 시간대별/월별 그래프, Pivot Chart, 표, ESS 강조 박스 표시

---
기타 : 테스트에 필요한 데이터 샘플도 추가해서 만들어줘