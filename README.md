# Perplexity search page

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/52gentoolman-gmailcoms-projects/v0-perplexity-search-page)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/Glpdo8v5UUf)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/52gentoolman-gmailcoms-projects/v0-perplexity-search-page](https://vercel.com/52gentoolman-gmailcoms-projects/v0-perplexity-search-page)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/Glpdo8v5UUf](https://v0.dev/chat/projects/Glpdo8v5UUf)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

# MISO Search Kyle

## 지원하는 세그먼트 타입

### 1. 인사규정 (Regulation)
```
문서명: 인사규정;장번호: 제3장;장제목: 복무;조번호: 제62조;조제목: 선택적 복리후생제도;내용: 복리후생제도에 관한 내용...
```

### 2. FAQ
```
row_id: FAQ_025;주제: 의료비;질문: 아토피 치료도 지원되나요?;답변: 아토피는 지원 의료비 지원 항목입니다.
```

### 3. 공지사항 (Notice) - 새로 추가됨 ✨
```
row_id: NOTICE_07;제목: 2025년 LNG 기술 교육(가스터빈 기초) 수강 안내;문서유형: 교육;작성일: 2025-03-19;전체텍스트: 공지사항 2025년 LNG 기술 교육(가스터빈 기초) 수강 안내

김지영 인사팀 GSE&R 2025. 3. 19. 10:45

안녕하십니까, 인사팀입니다.
LNG 발전운전/기술인력 양성교육 "가스터빈 기초" 과정 수강 안내드립니다...
```

## 기능

- **자동 파싱**: 세그먼트 내용을 자동으로 감지하고 구조화된 형태로 파싱
- **구조화된 표시**: 각 세그먼트 타입에 맞는 UI로 정보를 표시
- **편집 기능**: 세그먼트 추가/수정 모달에서 공지사항 타입 지원
- **중복 검사**: 공지사항 row_id 중복 검사 및 자동 제안 (NOTICE_01, NOTICE_02, ...)
- **카드 뷰**: 공지사항 전용 카드 컴포넌트로 제목, 문서유형, 작성일 등을 표시

## 사용 방법

1. 세그먼트 추가 시 "공지사항" 타입 선택
2. Row ID, 제목, 문서유형, 작성일, 전체텍스트 입력
3. 자동으로 구조화된 형태로 파싱되어 표시됨
