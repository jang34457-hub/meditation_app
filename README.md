# 🌿 마음쉼 (Mindfulness Meditation Service)

바쁜 현대인을 위한 시간대별 맞춤 힐링 명상 및 시네마 세션 서비스 **"마음쉼"**입니다.  
사용자의 로컬 시간대에 부합하는 자연 배경 테마와 명상 커스텀 타임 컨트롤, 출석 챌린지 달력 및 YouTube 힐링 플레이어를 제공합니다.

---

## 🌟 주요 기능 (Key Features)

1. **🌅 시간대별 자동 맞춤 배경 & 추천 명상**
   - 사용자 접속 시각(새벽, 아침, 낮, 저녁, 밤 5가지)을 자동 감지하여 힐링 자연 배경과 맞춤 힐링 명상을 추천합니다.

2. **🧘 2단 명상 세션 컨트롤러 & 🎬 전면 시네마 플레이어**
   - 새벽~밤 5개 명상 테마 정순 정렬
   - 5분, 10분, 20분 프리셋 및 5~100분 5분 단위 자유 드래그 슬라이더 커스텀 시간 지정
   - YouTube IFrame 연동 full-screen 시네마 플레이어 (일시정지/재생 및 명상 완료 시 음원/비디오 즉시 정지 제어)

3. **📅 출석 챌린지 달력 & 뱃지 시스템**
   - 명상 완료 데이터 `localStorage` 자동 보관
   - 3일/7일/14일/30일 연속 명상 스트릭(🔥) 및 단계별 힐링 뱃지 해금

4. **💻 현대적인 Glassmorphism PC & Mobile 반응형 UI**
   - PC 웹 1140px 그리드 레이아웃 및 모바일 전용 3개 메뉴(홈, 명상, 기록) 지원

---

## 🛠 기술 스택 (Tech Stack)

- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism design tokens), Modern JavaScript ES6+ Modules
- **Media Engine**: YouTube IFrame Player API (`postMessage` controller)
- **Data Persistence**: Browser `localStorage` Engine

---

## 🚀 실행 방법 (Getting Started)

`index.html` 파일을 웹 브라우저로 직접 실행하거나, Node.js HTTP 서버를 통해 실행할 수 있습니다:

```bash
# Node.js 호스팅 실행
node -e "const http=require('http'), fs=require('fs'), path=require('path'); const mime={'html':'text/html','css':'text/css','js':'text/javascript','png':'image/png'}; http.createServer((req,res)=>{ let f=path.join(__dirname, decodeURIComponent(req.url)==='/'?'index.html':decodeURIComponent(req.url)); fs.readFile(f,(err,data)=>{ if(err){ res.writeHead(404); res.end('Not Found'); } else { let ext=path.extname(f).slice(1); res.writeHead(200,{'Content-Type':mime[ext]||'text/plain'}); res.end(data); } }); }).listen(8080, ()=>console.log('Server running on http://localhost:8080'));"
```
