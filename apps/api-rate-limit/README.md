# API Rate Limit (@nestjs/throttler)

![Node.js](https://img.shields.io/badge/Node.js-v18.16.0-green)
![Nest.js](https://img.shields.io/badge/Nest.js-v10.0.0-red)
![DBMS](https://img.shields.io/badge/DBMS-MySQL-blue)
![Redis](https://img.shields.io/badge/Redis-v7.4.0-red)
![@nestjs/throttler](https://img.shields.io/badge/@nestjs/throttler-v5.1.2-purple)

NestJS와 @nestjs/throttler 패키지를 사용하여 API Rate Limit 시스템을 구축하는 예제입니다.</br>
이 프로젝트는 사용자별로 API 호출 횟수를 제한하는 기능을 제공합니다.


## Description
`@nestjs/throttler`를 사용하여 API Rate Limit 시스템을 구축합니다.</br>
기존 패키지는 사용자별로 제한을 두는 기능이 없으므로, 이를 구현하기 위해 `ThrottlerGuard`를 확장하여 적용하도록 합니다.</br>
`Redis`를 사용하여 사용자별 API Hit Count와 Rate Limit 설정 값을 저장합니다</br>


## Getting Started
### Prerequisites
- `PNPM` v10.x 이상 필요
- `.env` 생성 (`.env.example` 참고)

### Installation
```bash
pnpm install
```
### Running the Application
```bash
pnpm run start
````


## Main Features
- 사용자별 API Rate Limit 설정 가능
- 초, 분, 시간 단위로 제한 가능
- Redis를 사용하여 분산 환경에서도 동작 & 캐싱 효과를 통해 조회 성능 향상
    - API 호출 횟수와 Rate Limit 설정 값 관리
    - ttl 설정을 통해 Redis에 저장된 데이터의 유효 기간을 관리
    - `ThrottlerStorageRedisService`를 사용하여 Redis에 API 호출 횟수 저장


## Project Structure
```text
api-rate-limit/
├── app/
│   ├── guards/
│   │   └── token.guard.ts
│   ├── throttler/
│       ├── throttler-behind-proxy.guard.ts
│       ├── throttler-storage-redis.service.ts
│       └── throttler.module.ts
└── src/
    ├── user/
    │   ├── user.constant.ts
    │   ├── user.controller.ts
    │   ├── user.module.ts
    │   ├── user.repository.ts
    │   └── user.service.ts
    ├── user-rate-limit-setting/
    │   ├── user-rate-limit-setting.module.ts
    │   ├── user-rate-limit-setting.repository.ts
    │   └── user-rate-limit-setting.service.ts
    ├── app.module.ts
    └── main.ts
```
### `throttler-behind-proxy.guard.ts`
- @nestjs/throttler 패키지의 `ThrottlerGuard`를 확장하여 사용자별 API Rate Limit을 적용하는 Guard입니다.
- 요청 사용자의 Rate Limit 설정을 가져오고, Redis에 저장된 Hit Count를 조회하여 제한을 적용합니다.

### `throttler-storage-redis.service.ts`
- 서버 메모리에 저장되는 Hit Count를 Redis에 저장하고, 조회하는 서비스입니다.
- Redis에 Hit Count를 저장하여 분산 환경에서도 동작할 수 있도록 합니다.


## Server Structure
![https://jiho5993.notion.site/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F9a09aef2-e4b8-4bf7-bd49-2e657830e261%2Fb0e62e64-29db-417f-8bf5-c09aca51bea2%2Frate_limit.jpg?table=block&id=16914d25-e71c-800a-a1da-e69ae9d61f19&spaceId=9a09aef2-e4b8-4bf7-bd49-2e657830e261&width=1420&userId=&cache=v2](https://jiho5993.notion.site/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F9a09aef2-e4b8-4bf7-bd49-2e657830e261%2Fb0e62e64-29db-417f-8bf5-c09aca51bea2%2Frate_limit.jpg?table=block&id=16914d25-e71c-800a-a1da-e69ae9d61f19&spaceId=9a09aef2-e4b8-4bf7-bd49-2e657830e261&width=1420&userId=&cache=v2)